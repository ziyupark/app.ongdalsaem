// 8.1a Edit photo — non-destructive edit params + rendering (crop · rotate · flip · light and colour).
// The source is the photo re-encoded upright (EXIF orientation baked in) at most SOURCE_MAX px; the edited
// photo is rendered from it with Skia, so re-opening the editor starts again from the untouched source.
import { ImageFormat, Skia, type SkImage } from '@shopify/react-native-skia';
import { File, Paths } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'react-native';

/** Upload resizes to 1440 px anyway — keep a little room for cropping. */
const SOURCE_MAX = 2160;
const JPEG_QUALITY = 92;

export type Rect = { x: number; y: number; w: number; h: number };
export type AspectKey = 'free' | 'original' | '1:1' | '4:5' | '16:9';
export const ASPECTS: AspectKey[] = ['free', 'original', '1:1', '4:5', '16:9'];
export type AdjustKey = 'brightness' | 'exposure' | 'contrast' | 'saturation' | 'warmth';
export const ADJUSTS: AdjustKey[] = ['brightness', 'exposure', 'contrast', 'saturation', 'warmth'];
/** Each adjustment is −100 … 100, 0 = unchanged. */
export type Adjust = Record<AdjustKey, number>;

export type PhotoEdit = {
  /** Clockwise quarter turns. */
  rot: 0 | 90 | 180 | 270;
  /** Mirror left ↔ right (after rotating). */
  flip: boolean;
  aspect: AspectKey;
  /** Crop, 0–1, in the rotated + flipped picture. */
  crop: Rect;
  adjust: Adjust;
};

export type EditSource = { uri: string; width: number; height: number };

export const FULL: Rect = { x: 0, y: 0, w: 1, h: 1 };
export const NO_ADJUST: Adjust = { brightness: 0, exposure: 0, contrast: 0, saturation: 0, warmth: 0 };
export const NO_EDIT: PhotoEdit = { rot: 0, flip: false, aspect: 'free', crop: FULL, adjust: NO_ADJUST };

export function isNoEdit(e: PhotoEdit) {
  const c = e.crop;
  return e.rot === 0 && !e.flip && c.x === 0 && c.y === 0 && c.w === 1 && c.h === 1 && ADJUSTS.every((k) => e.adjust[k] === 0);
}

/** Size of the picture after rotating. */
export function orientedSize(src: { width: number; height: number }, rot: PhotoEdit['rot']) {
  return rot % 180 ? { w: src.height, h: src.width } : { w: src.width, h: src.height };
}

/** Width ÷ height an aspect asks for (null = any). */
export function aspectRatio(a: AspectKey, oriented: { w: number; h: number }): number | null {
  switch (a) {
    case 'free': return null;
    case 'original': return oriented.w / oriented.h;
    case '1:1': return 1;
    case '4:5': return 4 / 5;
    case '16:9': return 16 / 9;
  }
}

/** The largest centred crop of `ratio` (in pixels w ÷ h) inside the picture, as 0–1. */
export function fitCrop(ratio: number | null, oriented: { w: number; h: number }): Rect {
  if (ratio == null) return FULL;
  const pic = oriented.w / oriented.h;
  if (ratio > pic) {
    const h = pic / ratio;
    return { x: 0, y: (1 - h) / 2, w: 1, h };
  }
  const w = ratio / pic;
  return { x: (1 - w) / 2, y: 0, w, h: 1 };
}

/** Rotate what is on screen a quarter turn anticlockwise (as iOS Photos does): the crop turns with the picture. */
export function rotateCCW(e: PhotoEdit, src: EditSource): PhotoEdit {
  // Mirrored, an anticlockwise turn on screen is a clockwise turn of the source.
  const rot = ((e.rot + (e.flip ? 90 : 270)) % 360) as PhotoEdit['rot'];
  const c = e.crop;
  // (u, v) → (v, 1 − u) on a 0–1 picture.
  let crop: Rect = { x: c.y, y: 1 - c.x - c.w, w: c.h, h: c.w };
  if (e.aspect !== 'free') crop = fitCrop(aspectRatio(e.aspect, orientedSize(src, rot)), orientedSize(src, rot));
  return { ...e, rot, crop };
}

export function flipH(e: PhotoEdit): PhotoEdit {
  return { ...e, flip: !e.flip, crop: { ...e.crop, x: 1 - e.crop.x - e.crop.w } };
}

/**
 * Affine matrix (row-major 3×3) that maps a source pixel to the screen: rotate → flip → crop → scale into `dest`
 * (dest must have the crop's aspect).
 */
export function editMatrix(src: { width: number; height: number }, e: PhotoEdit, dest: Rect): number[] {
  const sw = src.width;
  const sh = src.height;
  const o = orientedSize(src, e.rot);
  // oriented x = a·px + b·py + c, oriented y = d·px + f·py + g
  let [a, b, c, d, f, g] =
    e.rot === 90 ? [0, -1, sh, 1, 0, 0]
    : e.rot === 180 ? [-1, 0, sw, 0, -1, sh]
    : e.rot === 270 ? [0, 1, 0, -1, 0, sw]
    : [1, 0, 0, 0, 1, 0];
  if (e.flip) [a, b, c] = [-a, -b, o.w - c];
  const rx = e.crop.x * o.w;
  const ry = e.crop.y * o.h;
  const s = dest.w / (e.crop.w * o.w);
  return [s * a, s * b, s * (c - rx) + dest.x, s * d, s * f, s * (g - ry) + dest.y, 0, 0, 1];
}

// ── Light and colour: 4×5 colour matrices (RGBA rows, last column = offset in 0–1). ──────────────────────────────

type M = number[];
const ID: M = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];

/** `outer` applied after `inner`. */
function mul(outer: M, inner: M): M {
  const r: M = new Array(20).fill(0);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 5; j++) {
      let v = j === 4 ? outer[i * 5 + 4] : 0;
      for (let k = 0; k < 4; k++) v += outer[i * 5 + k] * inner[k * 5 + j];
      r[i * 5 + j] = v;
    }
  }
  return r;
}

const gain = (r: number, g: number, b: number, off = 0): M => [r, 0, 0, 0, off, 0, g, 0, 0, off, 0, 0, b, 0, off, 0, 0, 0, 1, 0];

export function colorMatrix(adj: Adjust): M {
  const x = (k: AdjustKey) => adj[k] / 100;
  let m = ID;
  // Exposure: ±1 stop (multiplies the light).
  if (adj.exposure) { const e = Math.pow(2, x('exposure')); m = mul(gain(e, e, e), m); }
  // Brightness: lifts or lowers everything evenly.
  if (adj.brightness) m = mul(gain(1, 1, 1, x('brightness') * 0.25), m);
  // Contrast: stretches around mid-grey.
  if (adj.contrast) { const c = 1 + x('contrast') * (adj.contrast > 0 ? 0.8 : 0.6); m = mul(gain(c, c, c, 0.5 * (1 - c)), m); }
  // Saturation: towards / away from the grey of the same luminance.
  if (adj.saturation) {
    const s = 1 + x('saturation');
    const [lr, lg, lb] = [0.2126 * (1 - s), 0.7152 * (1 - s), 0.0722 * (1 - s)];
    m = mul([lr + s, lg, lb, 0, 0, lr, lg + s, lb, 0, 0, lr, lg, lb + s, 0, 0, 0, 0, 0, 1, 0], m);
  }
  // Warmth: more red / less blue, or the other way round.
  if (adj.warmth) { const w = x('warmth') * 0.15; m = mul(gain(1 + w, 1, 1 - w), m); }
  return m;
}

// ── Files ───────────────────────────────────────────────────────────────────────────────────────────────────────

const sizeOf = (uri: string) =>
  new Promise<{ width: number; height: number }>((ok, fail) => Image.getSize(uri, (width, height) => ok({ width, height }), fail));

/** The photo upright, as JPEG, at most SOURCE_MAX px — what the editor draws and renders from. */
export async function prepareSource(uri: string): Promise<EditSource> {
  let local = uri;
  if (/^https?:/.test(uri)) {
    const f = await File.downloadFileAsync(uri, new File(Paths.cache, `edit-dl-${Date.now()}.jpg`), { idempotent: true });
    local = f.uri;
  }
  const size = await sizeOf(local).catch(() => ({ width: 0, height: 0 }));
  const big = Math.max(size.width, size.height) > SOURCE_MAX;
  const resize = big ? [{ resize: size.width >= size.height ? { width: SOURCE_MAX } : { height: SOURCE_MAX } }] : [];
  const out = await ImageManipulator.manipulateAsync(local, resize, { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG });
  return { uri: out.uri, width: out.width, height: out.height };
}

export async function loadSkImage(uri: string): Promise<SkImage> {
  const data = await Skia.Data.fromURI(uri);
  const img = Skia.Image.MakeImageFromEncoded(data);
  if (!img) throw new Error('Could not decode the photo');
  return img;
}

/** Render the edit at full source resolution into a new JPEG in the cache. */
export async function renderEdit(src: EditSource, e: PhotoEdit, image?: SkImage): Promise<EditSource> {
  const img = image ?? (await loadSkImage(src.uri));
  const o = orientedSize(src, e.rot);
  const w = Math.max(1, Math.round(e.crop.w * o.w));
  const h = Math.max(1, Math.round(e.crop.h * o.h));
  const surface = Skia.Surface.Make(w, h);
  if (!surface) throw new Error('Could not make a surface');
  const canvas = surface.getCanvas();
  const paint = Skia.Paint();
  paint.setColorFilter(Skia.ColorFilter.MakeMatrix(colorMatrix(e.adjust)));
  canvas.concat(Skia.Matrix(editMatrix(src, e, { x: 0, y: 0, w, h })));
  canvas.drawImageRect(img, { x: 0, y: 0, width: src.width, height: src.height }, { x: 0, y: 0, width: src.width, height: src.height }, paint);
  surface.flush();
  const snap = surface.makeImageSnapshot();
  const bytes = snap.encodeToBytes(ImageFormat.JPEG, JPEG_QUALITY);
  const file = new File(Paths.cache, `edit-${Date.now()}.jpg`);
  await file.write(bytes);
  return { uri: file.uri, width: w, height: h };
}
