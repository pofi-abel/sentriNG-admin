// The SentriNG Admin lockup (brand §2: the SVG is the source of truth; never redraw or recolour it)
export const Logo = ({ height = 28 }: { height?: number }) => (
  <img src="/lockup-admin-on-dark.svg" alt="SentriNG Admin" height={height} style={{ height }} className="w-auto" />
);
