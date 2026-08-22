import type { CSSProperties } from "react";

export const HERO_FRAME = { width: 1440, height: 900 } as const;

export interface PixelRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Produces background-size/position percentages so a small absolutely-
 * positioned div (sized/positioned as a fraction of the same 1440x900
 * design frame) shows exactly the `crop` slice of the full hero image —
 * a CSS-only "this region can move independently" illusion with zero
 * extra image requests and no JS-driven resize recalculation, since the
 * hero container keeps a fixed aspect ratio (everything scales together).
 */
export function cropToBackgroundStyle(crop: PixelRect, imageUrl: string): CSSProperties {
  const { width: fullW, height: fullH } = HERO_FRAME;
  const sizeXPct = (fullW / crop.w) * 100;
  const sizeYPct = (fullH / crop.h) * 100;
  const posXPct = fullW === crop.w ? 0 : (crop.x / (fullW - crop.w)) * 100;
  const posYPct = fullH === crop.h ? 0 : (crop.y / (fullH - crop.h)) * 100;

  return {
    backgroundImage: `url(${imageUrl})`,
    backgroundSize: `${sizeXPct}% ${sizeYPct}%`,
    backgroundPosition: `${posXPct}% ${posYPct}%`,
    backgroundRepeat: "no-repeat",
  };
}

/** Converts a pixel rect (against the 1440x900 frame) to left/top/width/height percentages. */
export function rectToPositionPercent(rect: PixelRect) {
  const { width: fullW, height: fullH } = HERO_FRAME;
  return {
    left: `${(rect.x / fullW) * 100}%`,
    top: `${(rect.y / fullH) * 100}%`,
    width: `${(rect.w / fullW) * 100}%`,
    height: `${(rect.h / fullH) * 100}%`,
  };
}
