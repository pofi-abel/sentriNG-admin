// A QR code as plain SVG paths: drawn synchronously from the module matrix, crisp in print, no injected markup and no
// CSP exception. Ink on Paper, with the 4-module quiet zone scanners need
import QRCode from "qrcode";

const QUIET = 4;

export function QrCode({ value, size, label }: { value: string; size: string; label: string }) {
  const { modules } = QRCode.create(value, { errorCorrectionLevel: "M" });
  let d = "";
  for (let row = 0; row < modules.size; row++) {
    for (let col = 0; col < modules.size; col++) {
      if (modules.get(row, col)) d += `M${col + QUIET} ${row + QUIET}h1v1h-1z`;
    }
  }
  const box = modules.size + QUIET * 2;
  return (
    <svg viewBox={`0 0 ${box} ${box}`} width={size} height={size} className="shrink-0" role="img" aria-label={label} shapeRendering="crispEdges">
      <rect width={box} height={box} fill="var(--sn-paper)" />
      <path d={d} fill="var(--sn-ink)" />
    </svg>
  );
}
