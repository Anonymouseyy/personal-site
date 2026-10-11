import { BALL_R, Blob, CUP_R, H, Hole, RAIL, Vec, W } from "../lib/holes";

export const MAX_PULL = 170; // px of drag for full power
export const MAX_SPEED = 620; // px/s at full power
export const GREEN_DECEL = 135; // px/s² rolling resistance
export const SAND_DECEL = 430;
export const SUBSTEP = 1 / 240;
const CAPTURE_SPEED = 250; // faster than this and the ball lips over the cup

export type Ball = { x: number; y: number; vx: number; vy: number };
export type StepResult = "rolling" | "stopped" | "sunk" | "water";

export const inBlob = (b: Blob, x: number, y: number) =>
  ((x - b.x) / b.rx) ** 2 + ((y - b.y) / b.ry) ** 2 < 1;

/** Downhill acceleration at a point, summed over every hill and hollow. */
export function slopeAt(hole: Hole, x: number, y: number): Vec {
  let ax = 0;
  let ay = 0;
  for (const h of hole.hills) {
    const dx = x - h.x;
    const dy = y - h.y;
    const e = Math.exp(-(dx * dx + dy * dy) / (2 * h.r * h.r));
    ax += h.s * (dx / h.r) * e;
    ay += h.s * (dy / h.r) * e;
  }
  return { x: ax, y: ay };
}

export function step(hole: Hole, b: Ball, dt: number): StepResult {
  const a = slopeAt(hole, b.x, b.y);
  b.vx += a.x * dt;
  b.vy += a.y * dt;

  const inSand = hole.sand.some((s) => inBlob(s, b.x, b.y));
  const decel = inSand ? SAND_DECEL : GREEN_DECEL;
  const sp0 = Math.hypot(b.vx, b.vy);
  const sp = Math.max(0, sp0 - decel * dt);
  if (sp0 > 0) {
    b.vx *= sp / sp0;
    b.vy *= sp / sp0;
  }

  b.x += b.vx * dt;
  b.y += b.vy * dt;

  // rails
  const minX = RAIL + BALL_R;
  const maxX = W - RAIL - BALL_R;
  const minY = RAIL + BALL_R;
  const maxY = H - RAIL - BALL_R;
  if (b.x < minX) { b.x = minX; b.vx = Math.abs(b.vx) * 0.7; }
  if (b.x > maxX) { b.x = maxX; b.vx = -Math.abs(b.vx) * 0.7; }
  if (b.y < minY) { b.y = minY; b.vy = Math.abs(b.vy) * 0.7; }
  if (b.y > maxY) { b.y = maxY; b.vy = -Math.abs(b.vy) * 0.7; }

  if (hole.water.some((w) => inBlob(w, b.x, b.y))) return "water";

  const dx = hole.cup.x - b.x;
  const dy = hole.cup.y - b.y;
  const d = Math.hypot(dx, dy);
  const speed = Math.hypot(b.vx, b.vy);
  if (d < CUP_R - 2 && speed < CAPTURE_SPEED) return "sunk";
  // slow balls near the rim get tugged toward the cup
  if (d > 0 && d < CUP_R + 4 && speed < CAPTURE_SPEED * 1.4) {
    b.vx += (dx / d) * 300 * dt;
    b.vy += (dy / d) * 300 * dt;
  }

  const slopeMag = Math.hypot(a.x, a.y);
  console.log(slopeMag)
  if (speed < 12) {
    b.vx = 0;
    b.vy = 0;
    return "stopped";
  }
  return "rolling";
}
