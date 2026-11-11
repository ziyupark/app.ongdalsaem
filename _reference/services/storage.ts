import { File } from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";

import { supabase } from "@/lib/supabase";

const FOOD_IMAGES_BUCKET = "food-illustrations";

const CONTENT_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  heic: "image/heic",
  heif: "image/heif",
};

export function contentTypeForUri(uri: string, mimeType?: string | null): string {
  if (mimeType) return mimeType;
  const extension = uri.split(".").pop()?.toLowerCase() ?? "";
  return CONTENT_TYPES[extension] ?? "application/octet-stream";
}

export function extensionForContentType(contentType: string): string {
  const found = Object.entries(CONTENT_TYPES).find(([, value]) => value === contentType);
  return found?.[0] ?? "png";
}

// Long-edge cap for anything uploaded to the food-illustrations bucket — a
// full-resolution phone photo (often 4000x3000+, 10MB+) was previously
// uploaded exactly as picked, up to MAX_DRAFT_IMAGES per Food.
const MAX_UPLOAD_DIMENSION = 1600;
// Avatars render small (a circle, never full-bleed) — no reason to keep a
// food-photo-sized original around for one.
export const AVATAR_MAX_DIMENSION = 512;
const JPEG_COMPRESS_QUALITY = 0.85;

/**
 * Downscales a picked/captured image before it's uploaded. PNGs (hand-drawn
 * illustrations, which can be transparent — docs/05-behavior.md) keep their
 * format so transparency survives; everything else (photos) re-encodes as
 * JPEG with light compression. No-ops when the source is already a small
 * PNG — there's no compression knob for PNG, so re-encoding one that's
 * already within bounds wouldn't shrink it, only cost time.
 */
export async function resizeImageForUpload(
  uri: string,
  width: number | undefined,
  height: number | undefined,
  contentType: string,
  maxDimension: number = MAX_UPLOAD_DIMENSION
): Promise<{ uri: string; contentType: string }> {
  const isPng = contentType === "image/png";
  const needsResize = width != null && height != null && (width > maxDimension || height > maxDimension);

  if (!needsResize && isPng) return { uri, contentType };

  const actions: ImageManipulator.Action[] =
    needsResize && width != null && height != null
      ? [{ resize: width >= height ? { width: maxDimension } : { height: maxDimension } }]
      : [];

  const format = isPng ? ImageManipulator.SaveFormat.PNG : ImageManipulator.SaveFormat.JPEG;
  const result = await ImageManipulator.manipulateAsync(uri, actions, {
    format,
    ...(isPng ? {} : { compress: JPEG_COMPRESS_QUALITY }),
  });

  return { uri: result.uri, contentType: isPng ? "image/png" : "image/jpeg" };
}

/**
 * Uploads a local file (drawn PNG or a picked photo) to the food-illustrations
 * bucket and returns its public URL. Called only at Publish time (Phase 29
 * §7) — never when the user merely selects/draws an image.
 */
export async function uploadFoodImage(localUri: string, path: string, contentType: string, upsert = false): Promise<string> {
  const file = new File(localUri);
  const arrayBuffer = await file.arrayBuffer();

  const { error } = await supabase.storage.from(FOOD_IMAGES_BUCKET).upload(path, arrayBuffer, {
    contentType,
    upsert,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(FOOD_IMAGES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Best-effort cleanup if the `foods` insert fails after a successful upload. */
export async function deleteFoodImage(path: string): Promise<void> {
  await supabase.storage.from(FOOD_IMAGES_BUCKET).remove([path]);
}
