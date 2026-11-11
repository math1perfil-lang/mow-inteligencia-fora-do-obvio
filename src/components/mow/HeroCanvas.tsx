import { useEffect, useRef } from "react";

/** Desktop-only interactive point sphere that follows the cursor. */
export function HeroCanvas({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (!window.matchMedia("(min-width: 768px)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const color = getComputedStyle(canvas).color;

    const N = 900;
    const pts: [number, number, number][] = [];
    const g = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      pts.push([Math.cos(g * i) * r, y, Math.sin(g * i) * r]);
    }

    let w = 0, h = 0, dpr = 1, raf = 0;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    let tx = 0, ty = 0, mx = 0, my = 0, rot = 0;
    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const draw = () => {
      mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;
      if (!reduce) rot += 0.0016;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = color;
      const R = Math.min(w, h) * 0.42;
      const cx = w * 0.5 + mx * 30, cy = h * 0.5 + my * 30;
      const ay = rot + mx * 0.6, ax = my * 0.4;
      const cy_ = Math.cos(ay), sy = Math.sin(ay), cx_ = Math.cos(ax), sx = Math.sin(ax);
      for (const [x, y, z] of pts) {
        const x1 = x * cy_ + z * sy;
        const z1 = -x * sy + z * cy_;
        const y1 = y * cx_ - z1 * sx;
        const z2 = y * sx + z1 * cx_;
        const p = 1.6 / (2.6 - z2);
        const a = (z2 + 1) / 2;
        ctx.globalAlpha = 0.08 + a * 0.6;
        const s = 0.6 + a * 1.2;
        ctx.fillRect(cx + x1 * R * p - s / 2, cy + y1 * R * p - s / 2, s, s);
      }
      // orbit ring
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.ellipse(cx, cy, R * 1.35, R * 0.32 + my * 20, -0.35 + mx * 0.15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className={className} />;
}
