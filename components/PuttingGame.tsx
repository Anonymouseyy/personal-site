"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BALL_R, H, W } from "@/lib/holes";
import { HOLES, site } from "@/lib/content";
import { Ball, MAX_PULL, MAX_SPEED, SUBSTEP, step } from "@/lib/physics";
import { Aim, draw } from "@/lib/render";
import SectionModal from "./SectionModal";

type Phase = "aim" | "rolling" | "holed";
type ModalState = { idx: number; result: string | null } | null;

const MAX_STROKES = site.game.maxStrokes;
const FLAG = site.theme?.accent ?? "#f2b705";

function resultLabel(strokes: number, par: number) {
  if (strokes === 1) return "Hole in one";
  const d = strokes - par;
  if (d <= -2) return "Eagle";
  if (d === -1) return "Birdie";
  if (d === 0) return "Par";
  if (d === 1) return "Bogey";
  if (d === 2) return "Double bogey";
  return `+${d}`;
}

export default function PuttingGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const game = useRef({
    holeIdx: 0,
    ball: { x: 0, y: 0, vx: 0, vy: 0 } as Ball,
    last: { x: 0, y: 0 },
    phase: "aim" as Phase,
    strokes: 0,
    aim: null as Aim,
    drag: false,
  });

  const [holeIdx, setHoleIdx] = useState(0);
  const [strokes, setStrokes] = useState(0);
  const [phase, setPhase] = useState<Phase>("aim");
  const [power, setPower] = useState(0);
  const [notice, setNotice] = useState(site.game.intro);
  const [visited, setVisited] = useState<number[]>([]);
  const [modal, setModal] = useState<ModalState>(null);

  const startHole = useCallback((i: number) => {
    const g = game.current;
    const hole = HOLES[i];
    g.holeIdx = i;
    g.ball = { x: hole.ball.x, y: hole.ball.y, vx: 0, vy: 0 };
    g.last = { x: hole.ball.x, y: hole.ball.y };
    g.phase = "aim";
    g.strokes = 0;
    g.aim = null;
    g.drag = false;
    setHoleIdx(i);
    setStrokes(0);
    setPhase("aim");
    setPower(0);
    setNotice(i === 0 ? site.game.intro : `Par ${hole.par}. Sink the putt to open “${hole.name}”.`);
  }, []);

  const finishHole = useCallback((holed: boolean) => {
    const g = game.current;
    const idx = g.holeIdx;
    const n = g.strokes;
    const label = holed
      ? `${resultLabel(n, HOLES[idx].par)} · ${n} ${n === 1 ? "stroke" : "strokes"}`
      : `Picked up after ${n} strokes`;
    g.phase = "holed";
    setPhase("holed");
    setNotice(label);
    setVisited((v) => (v.includes(idx) ? v : [...v, idx]));
    setModal({ idx, result: label });
  }, []);

  // game loop
  useEffect(() => {
    const canvas = canvasRef.current!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    startHole(0);
    let raf = 0;
    let prev = performance.now();
    let acc = 0;

    const frame = (now: number) => {
      const g = game.current;
      const hole = HOLES[g.holeIdx];
      acc += Math.min(0.05, (now - prev) / 1000);
      prev = now;

      if (g.phase === "rolling") {
        while (acc >= SUBSTEP && g.phase === "rolling") {
          acc -= SUBSTEP;
          const res = step(hole, g.ball, SUBSTEP);
          if (res === "sunk") {
            g.ball.vx = g.ball.vy = 0;
            finishHole(true);
          } else if (res === "water") {
            g.strokes += 1;
            setStrokes(g.strokes);
            g.ball = { x: g.last.x, y: g.last.y, vx: 0, vy: 0 };
            g.phase = "aim";
            setPhase("aim");
            setNotice("Water. One stroke added; replay from your last spot.");
          } else if (res === "stopped") {
            if (g.strokes >= MAX_STROKES) {
              finishHole(false);
            } else {
              g.phase = "aim";
              setPhase("aim");
              setNotice("Pull back and release to putt.");
            }
          }
        }
      } else {
        acc = 0;
      }

      draw(ctx, hole, g.ball, g.phase === "aim" ? g.aim : null, g.phase !== "holed", FLAG);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [startHole, finishHole]);

  // pointer input
  const toLocal = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height };
  };

  const updateAim = (e: React.PointerEvent) => {
    const g = game.current;
    const p = toLocal(e);
    const vx = g.ball.x - p.x;
    const vy = g.ball.y - p.y;
    const len = Math.hypot(vx, vy);
    if (len < 4) {
      g.aim = null;
      setPower(0);
      return;
    }
    const pw = Math.min(len, MAX_PULL) / MAX_PULL;
    g.aim = { dx: vx / len, dy: vy / len, power: pw };
    setPower(pw);
  };

  const onDown = (e: React.PointerEvent) => {
    const g = game.current;
    if (g.phase !== "aim") return;
    const p = toLocal(e);
    if (Math.hypot(p.x - g.ball.x, p.y - g.ball.y) > BALL_R + 34) return;
    g.drag = true;
    canvasRef.current!.setPointerCapture(e.pointerId);
    updateAim(e);
  };

  const onMove = (e: React.PointerEvent) => {
    if (game.current.drag) updateAim(e);
  };

  const onUp = () => {
    const g = game.current;
    if (!g.drag) return;
    g.drag = false;
    const aim = g.aim;
    g.aim = null;
    setPower(0);
    if (!aim || aim.power < 0.04) return; // too small, cancel
    g.last = { x: g.ball.x, y: g.ball.y };
    g.ball.vx = aim.dx * aim.power * MAX_SPEED;
    g.ball.vy = aim.dy * aim.power * MAX_SPEED;
    g.strokes += 1;
    g.phase = "rolling";
    setStrokes(g.strokes);
    setPhase("rolling");
    setNotice("");
  };

  const hole = HOLES[holeIdx];
  const next = (holeIdx + 1) % HOLES.length;
  const nextLabel = next === 0 ? "Back to hole 1" : "Next hole";
  const goNext = () => {
    setModal(null);
    startHole(next);
  };

  return (
    <section className="game" aria-label="Putting course">
      <header className="top">
        <div>
          <h2>Hole {holeIdx + 1}: {hole.name}</h2>
          <p className="sub">Sink the putt to open this section.</p>
        </div>
        <dl className="stats">
          <div><dt>Par</dt><dd>{hole.par}</dd></div>
          <div><dt>Strokes</dt><dd>{strokes}</dd></div>
        </dl>
      </header>

      <nav className="chips" aria-label="Holes">
        {HOLES.map((h, i) => (
          <button
            key={h.name}
            className={`chip${i === holeIdx ? " on" : ""}${visited.includes(i) ? " seen" : ""}`}
            onClick={() => startHole(i)}
            aria-current={i === holeIdx ? "true" : undefined}
          >
            <span className="chip-n">{visited.includes(i) ? "✓" : i + 1}</span>
            {h.name}
          </button>
        ))}
      </nav>

      <div className="stage">
        <canvas
          ref={canvasRef}
          className={phase === "aim" ? "aimable" : ""}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          aria-label="Putting green. Drag back from the ball and release to putt."
        />
        {phase === "holed" && !modal && (
          <div className="overlay" role="status">
            <p className="big">{notice}</p>
            <div className="row">
              <button className="ghost light" onClick={() => setModal({ idx: holeIdx, result: notice })}>
                Read again
              </button>
              <button onClick={goNext} autoFocus>{nextLabel}</button>
            </div>
          </div>
        )}
      </div>

      <div className="bar">
        <p className="notice" aria-live="polite">{notice}</p>
        <div className="meter" aria-label={`Power ${Math.round(power * 100)} percent`}>
          <span style={{ width: `${power * 100}%`, background: `hsl(${120 - power * 105} 80% 50%)` }} />
        </div>
        <button className="ghost" onClick={() => startHole(holeIdx)}>Replay hole</button>
      </div>

      <p className="readrow">
        Prefer to just read?{" "}
        {HOLES.map((h, i) => (
          <button key={h.name} className="link" onClick={() => setModal({ idx: i, result: null })}>
            {h.name}
          </button>
        ))}
      </p>

      {modal && (
        <SectionModal
          content={HOLES[modal.idx].modal}
          result={modal.result}
          nextLabel={nextLabel}
          onClose={() => setModal(null)}
          onNext={goNext}
        />
      )}
    </section>
  );
}
