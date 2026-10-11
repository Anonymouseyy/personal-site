import { BALL_R, CUP_R, H, Hole, RAIL, W } from "./holes";
import { Ball, GREEN_DECEL, MAX_PULL, MAX_SPEED, slopeAt } from "./physics";

export type Aim = { dx: number; dy: number; power: number } | null;

function greenPath(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.roundRect(RAIL, RAIL, W - 2 * RAIL, H - 2 * RAIL, 26);
}

export function draw(
  ctx: CanvasRenderingContext2D,
  hole: Hole,
  ball: Ball,
  aim: Aim,
  showBall: boolean,
  flag = "#f2b705",
) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#244a31";
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  greenPath(ctx);
  ctx.clip();

  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#68ae67");
  g.addColorStop(1, "#4f9a58");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // mowing stripes
  ctx.fillStyle = "rgba(255,255,255,0.035)";
  for (let x = RAIL; x < W; x += 100) ctx.fillRect(x, 0, 50, H);

  // hills and hollows
  for (const h of hole.hills) {
    const rg = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, h.r * 2);
    if (h.s > 0) {
      rg.addColorStop(0, "rgba(255,255,255,0.16)");
      rg.addColorStop(1, "rgba(255,255,255,0)");
    } else {
      rg.addColorStop(0, "rgba(0,30,10,0.22)");
      rg.addColorStop(1, "rgba(0,30,10,0)");
    }
    ctx.fillStyle = rg;
    ctx.fillRect(h.x - h.r * 2, h.y - h.r * 2, h.r * 4, h.r * 4);
  }

  // break arrows show which way the ball will drift
  ctx.strokeStyle = "rgba(255,255,255,0.32)";
  ctx.fillStyle = "rgba(255,255,255,0.32)";
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";
  for (let gx = 56; gx < W; gx += 56) {
    for (let gy = 56; gy < H; gy += 56) {
      const a = slopeAt(hole, gx, gy);
      const m = Math.hypot(a.x, a.y);
      if (m < 14) continue;
      const ux = a.x / m;
      const uy = a.y / m;
      const len = Math.min(24, 8 + m / 6);
      const x1 = gx - (ux * len) / 2;
      const y1 = gy - (uy * len) / 2;
      const x2 = gx + (ux * len) / 2;
      const y2 = gy + (uy * len) / 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - ux * 6 - uy * 4, y2 - uy * 6 + ux * 4);
      ctx.lineTo(x2 - ux * 6 + uy * 4, y2 - uy * 6 - ux * 4);
      ctx.closePath();
      ctx.fill();
    }
  }

  for (const s of hole.sand) {
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, s.rx, s.ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#e6d3a1";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#c9b47b";
    ctx.stroke();
  }
  for (const w of hole.water) {
    ctx.beginPath();
    ctx.ellipse(w.x, w.y, w.rx, w.ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#3f7fb3";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#2f6390";
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(w.x, w.y, w.rx * 0.6, w.ry * 0.6, 0, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();

  greenPath(ctx);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#1a3524";
  ctx.stroke();

  // cup and flag
  const { x: cx, y: cy } = hole.cup;
  ctx.beginPath();
  ctx.arc(cx, cy, CUP_R, 0, Math.PI * 2);
  ctx.fillStyle = "#14261b";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.stroke();
  ctx.strokeStyle = "#f4f1e8";
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx, cy - 48);
  ctx.stroke();
  ctx.fillStyle = flag;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 48);
  ctx.lineTo(cx + 24, cy - 40);
  ctx.lineTo(cx, cy - 31);
  ctx.closePath();
  ctx.fill();

  // aim guide: dotted line shows where a flat green would carry the ball
  if (aim) {
    const col = `hsl(${120 - aim.power * 105} 85% 58%)`;
    const roll = (aim.power * MAX_SPEED) ** 2 / (2 * GREEN_DECEL);
    ctx.save();
    greenPath(ctx);
    ctx.clip();
    ctx.setLineDash([1, 9]);
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath();
    ctx.moveTo(ball.x, ball.y);
    ctx.lineTo(ball.x + aim.dx * roll, ball.y + aim.dy * roll);
    ctx.stroke();
    ctx.restore();
    ctx.setLineDash([]);
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.strokeStyle = col;
    ctx.beginPath();
    ctx.moveTo(ball.x, ball.y);
    ctx.lineTo(
      ball.x - aim.dx * aim.power * MAX_PULL * 0.6,
      ball.y - aim.dy * aim.power * MAX_PULL * 0.6,
    );
    ctx.stroke();
  }

  if (showBall) {
    ctx.beginPath();
    ctx.ellipse(ball.x + 2, ball.y + 3, BALL_R, BALL_R * 0.8, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
    ctx.fillStyle = "#fffdf5";
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.stroke();
  }
}
