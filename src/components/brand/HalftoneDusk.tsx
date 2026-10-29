// The brand's image direction (brand §7): a polling-unit canopy at dusk with a queue in silhouette, as a halftone in
// Ink and cyan. No faces, no real people. Ported from sentriNG-api/docs/brand/SentriNG Brand System.html (#dusk):
// paint a greyscale scene offscreen, then resample it as a dot screen. Silhouettes stay Ink, the lit sky becomes cyan
// dots, the brightest band paper. Drawn at the device pixel ratio so the dots stay crisp.
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const W = 800;
const H = 600;
const QUEUE = [380, 420, 458, 496, 534, 572, 612, 652, 694, 736];
const HEIGHTS = [150, 138, 156, 132, 148, 140, 154, 136, 146, 150];

function paintScene(g: CanvasRenderingContext2D) {
  const sky = g.createLinearGradient(0, 0, 0, H * 0.72);
  sky.addColorStop(0, "#262626");
  sky.addColorStop(0.55, "#8c8c8c");
  sky.addColorStop(1, "#e6e6e6");
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);
  const sun = g.createRadialGradient(W * 0.74, H * 0.7, 0, W * 0.74, H * 0.7, 150);
  sun.addColorStop(0, "#fff");
  sun.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = sun;
  g.fillRect(0, 0, W, H);

  g.fillStyle = "#000";
  g.beginPath(); // tree line
  g.moveTo(0, H * 0.71);
  for (let t = 0; t <= W; t += 20) g.lineTo(t, H * 0.71 - 10 - 14 * Math.abs(Math.sin(t * 0.021) * Math.cos(t * 0.007)));
  g.lineTo(W, H);
  g.lineTo(0, H);
  g.closePath();
  g.fill();
  g.beginPath(); // canopy
  g.moveTo(40, 300);
  g.lineTo(300, 278);
  g.lineTo(328, 318);
  g.lineTo(24, 342);
  g.closePath();
  g.fill();
  g.fillRect(40, 330, 7, 130);
  g.fillRect(300, 310, 7, 150);
  g.fillRect(110, 392, 140, 10); // table
  g.fillRect(118, 400, 6, 60);
  g.fillRect(238, 400, 6, 60);
  QUEUE.forEach((px, i) => {
    const top = 470 - HEIGHTS[i];
    g.beginPath(); // head
    g.arc(px, top + 14, 14, 0, Math.PI * 2);
    g.fill();
    g.beginPath(); // body with shoulders
    g.moveTo(px - 18, 470);
    g.lineTo(px - 17, top + 42);
    g.quadraticCurveTo(px - 16, top + 30, px, top + 30);
    g.quadraticCurveTo(px + 16, top + 30, px + 17, top + 42);
    g.lineTo(px + 18, 470);
    g.closePath();
    g.fill();
  });
}

export function HalftoneDusk({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const off = document.createElement("canvas");
    off.width = W;
    off.height = H;
    const g = off.getContext("2d", { willReadFrequently: true });
    const x = canvas?.getContext("2d");
    if (!canvas || !g || !x) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    x.scale(dpr, dpr);

    paintScene(g);
    const d = g.getImageData(0, 0, W, H).data;
    const step = 7;
    x.fillStyle = "#0D1117";
    x.fillRect(0, 0, W, H);
    for (let y = step / 2, row = 0; y < H; y += step, row++) {
      for (let xx = (row % 2) * (step / 2); xx < W; xx += step) {
        const l = d[((y | 0) * W + (xx | 0)) * 4] / 255;
        if (l < 0.06) continue;
        x.fillStyle = l > 0.82 ? "#F5F2EA" : "#2EC4D6";
        x.globalAlpha = 0.3 + 0.7 * l;
        x.beginPath();
        x.arc(xx, y, Math.sqrt(l) * step * 0.5, 0, Math.PI * 2);
        x.fill();
      }
    }
    x.globalAlpha = 1;
    canvas.dataset.drawn = "true";
  }, []);

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      role="img"
      aria-label="Halftone illustration: a polling unit canopy at dusk with a queue of voters in silhouette"
      // The scene is ink below the ground line: crop to 5:3 from the top so the frame ends at the ground
      className={cn("sn-reveal block aspect-[5/3] w-full object-cover object-top", className)}
    />
  );
}
