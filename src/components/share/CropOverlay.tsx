import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import type { Rect } from '../../lib/photoEdit';
import { useTheme } from '../../theme';

type Handle = 'tl' | 'tr' | 'bl' | 'br' | 'l' | 'r' | 't' | 'b' | 'move';

/** Smallest crop side on screen. */
const MIN = 64;
/** How far from a corner or an edge a touch still grabs it. */
const GRAB = 32;
const CORNER = 22;
const CORNER_W = 3;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * 8.1a crop frame over the whole picture: drag a corner or an edge to resize, inside to move. With a fixed aspect
 * only the corners resize (the frame keeps its shape). Outside the frame is dimmed; thirds lines show while dragging.
 * `frame` = where the picture sits (screen px), `crop` = 0–1 in that picture, `ratio` = width ÷ height or null.
 */
export function CropOverlay({ frame, crop, ratio, onChange }: { frame: Rect; crop: Rect; ratio: number | null; onChange: (crop: Rect) => void }) {
  const { color } = useTheme();
  const toScreen = (c: Rect): Rect => ({ x: frame.x + c.x * frame.w, y: frame.y + c.y * frame.h, w: c.w * frame.w, h: c.h * frame.h });
  const [r, setR] = useState<Rect>(() => toScreen(crop));
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ handle: Handle; from: Rect } | null>(null);

  // Follow the crop / picture when they change from outside (aspect, rotate, flip, reset).
  useEffect(() => {
    if (!drag.current) setR(toScreen(crop));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crop.x, crop.y, crop.w, crop.h, frame.x, frame.y, frame.w, frame.h]);

  const hit = (x: number, y: number, c: Rect): Handle | null => {
    const nearL = Math.abs(x - c.x) < GRAB;
    const nearR = Math.abs(x - (c.x + c.w)) < GRAB;
    const nearT = Math.abs(y - c.y) < GRAB;
    const nearB = Math.abs(y - (c.y + c.h)) < GRAB;
    const inX = x > c.x - GRAB && x < c.x + c.w + GRAB;
    const inY = y > c.y - GRAB && y < c.y + c.h + GRAB;
    if (nearT && nearL) return 'tl';
    if (nearT && nearR) return 'tr';
    if (nearB && nearL) return 'bl';
    if (nearB && nearR) return 'br';
    if (ratio == null) {
      if (nearL && inY) return 'l';
      if (nearR && inY) return 'r';
      if (nearT && inX) return 't';
      if (nearB && inX) return 'b';
    }
    if (x > c.x && x < c.x + c.w && y > c.y && y < c.y + c.h) return 'move';
    return null;
  };

  const resize = (h: Handle, s: Rect, dx: number, dy: number): Rect => {
    const L = frame.x;
    const T = frame.y;
    const R = frame.x + frame.w;
    const B = frame.y + frame.h;
    if (h === 'move') {
      return { ...s, x: clamp(s.x + dx, L, R - s.w), y: clamp(s.y + dy, T, B - s.h) };
    }
    let x1 = s.x;
    let y1 = s.y;
    let x2 = s.x + s.w;
    let y2 = s.y + s.h;
    if (h === 'l' || h === 'tl' || h === 'bl') x1 = clamp(s.x + dx, L, x2 - MIN);
    if (h === 'r' || h === 'tr' || h === 'br') x2 = clamp(s.x + s.w + dx, x1 + MIN, R);
    if (h === 't' || h === 'tl' || h === 'tr') y1 = clamp(s.y + dy, T, y2 - MIN);
    if (h === 'b' || h === 'bl' || h === 'br') y2 = clamp(s.y + s.h + dy, y1 + MIN, B);
    if (ratio == null || h.length !== 2) return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
    // Fixed aspect: grow from the opposite corner, keeping the shape and staying in the picture.
    const left = h[1] === 'l';
    const top = h[0] === 't';
    const ax = left ? s.x + s.w : s.x;
    const ay = top ? s.y + s.h : s.y;
    let w = Math.max(x2 - x1, (y2 - y1) * ratio);
    const maxW = left ? ax - L : R - ax;
    const maxH = top ? ay - T : B - ay;
    w = Math.min(w, maxW, maxH * ratio);
    w = Math.max(w, Math.min(MIN * Math.max(1, ratio), maxW, maxH * ratio));
    const hh = w / ratio;
    return { x: left ? ax - w : ax, y: top ? ay - hh : ay, w, h: hh };
  };

  const latest = useRef({ r, hit, resize, onChange, frame });
  latest.current = { r, hit, resize, onChange, frame };

  const pan = usePanGesture({
    runOnJS: true,
    minDistance: 0,
    onBegin: (e) => {
      const h = latest.current.hit(e.x, e.y, latest.current.r);
      drag.current = h ? { handle: h, from: latest.current.r } : null;
      if (h) setDragging(true);
    },
    onUpdate: (e) => {
      const d = drag.current;
      if (!d) return;
      setR(latest.current.resize(d.handle, d.from, e.translationX, e.translationY));
    },
    onFinalize: () => {
      if (!drag.current) return;
      drag.current = null;
      setDragging(false);
      const { r: cur, frame: f, onChange: change } = latest.current;
      change({ x: (cur.x - f.x) / f.w, y: (cur.y - f.y) / f.h, w: cur.w / f.w, h: cur.h / f.h });
    },
  });

  const dim = color('overlay/scrim');
  const line = color('static/white');
  return (
    <GestureDetector gesture={pan}>
      <View style={StyleSheet.absoluteFill}>
        {/* Dim outside the crop (picture area only). */}
        <View pointerEvents="none" style={[styles.abs, { left: frame.x, top: frame.y, width: frame.w, height: r.y - frame.y, backgroundColor: dim }]} />
        <View pointerEvents="none" style={[styles.abs, { left: frame.x, top: r.y + r.h, width: frame.w, height: frame.y + frame.h - r.y - r.h, backgroundColor: dim }]} />
        <View pointerEvents="none" style={[styles.abs, { left: frame.x, top: r.y, width: r.x - frame.x, height: r.h, backgroundColor: dim }]} />
        <View pointerEvents="none" style={[styles.abs, { left: r.x + r.w, top: r.y, width: frame.x + frame.w - r.x - r.w, height: r.h, backgroundColor: dim }]} />
        <View pointerEvents="none" style={[styles.abs, styles.frame, { left: r.x, top: r.y, width: r.w, height: r.h, borderColor: line }]}>
          {dragging ? (
            <>
              <View style={[styles.abs, styles.vLine, { left: '33.33%', backgroundColor: line }]} />
              <View style={[styles.abs, styles.vLine, { left: '66.66%', backgroundColor: line }]} />
              <View style={[styles.abs, styles.hLine, { top: '33.33%', backgroundColor: line }]} />
              <View style={[styles.abs, styles.hLine, { top: '66.66%', backgroundColor: line }]} />
            </>
          ) : null}
          <View style={[styles.corner, styles.tl, { borderColor: line }]} />
          <View style={[styles.corner, styles.tr, { borderColor: line }]} />
          <View style={[styles.corner, styles.bl, { borderColor: line }]} />
          <View style={[styles.corner, styles.br, { borderColor: line }]} />
        </View>
      </View>
    </GestureDetector>
  );
}

const OUT = -CORNER_W;
const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  frame: { borderWidth: 1 },
  vLine: { top: 0, bottom: 0, width: StyleSheet.hairlineWidth, opacity: 0.7 },
  hLine: { left: 0, right: 0, height: StyleSheet.hairlineWidth, opacity: 0.7 },
  corner: { position: 'absolute', width: CORNER, height: CORNER },
  tl: { left: OUT, top: OUT, borderLeftWidth: CORNER_W, borderTopWidth: CORNER_W },
  tr: { right: OUT, top: OUT, borderRightWidth: CORNER_W, borderTopWidth: CORNER_W },
  bl: { left: OUT, bottom: OUT, borderLeftWidth: CORNER_W, borderBottomWidth: CORNER_W },
  br: { right: OUT, bottom: OUT, borderRightWidth: CORNER_W, borderBottomWidth: CORNER_W },
});
