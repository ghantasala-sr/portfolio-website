import {
  SVG_VIEW,
  buildEdgeCurves,
  heroNodes,
  worldToSvg,
  type EdgeCurve,
} from "./topology";

/**
 * Server-rendered, unconditionally, always.
 *
 * The server cannot know client WebGL capability, so any conditional render is
 * a hydration mismatch that flashes. This ships in the HTML, reserves the box
 * (so CLS stays at zero), is what crawlers and Lighthouse see, works with JS
 * off, and is what we fall back to on `webglcontextlost`.
 *
 * It renders state B (the resolved Argus topology), because that is the more
 * legible of the two states for someone who will never see the animation.
 */

function pathFor(c: EdgeCurve): string {
  const [x0, y0] = worldToSvg(c.p0);
  const [x1, y1] = worldToSvg(c.c1);
  const [x2, y2] = worldToSvg(c.c2);
  const [x3, y3] = worldToSvg(c.p3);
  const r = (n: number) => Math.round(n * 10) / 10;
  return `M ${r(x0)} ${r(y0)} C ${r(x1)} ${r(y1)}, ${r(x2)} ${r(y2)}, ${r(x3)} ${r(y3)}`;
}

export function HeroFallback({ visible = true }: { visible?: boolean }) {
  const curves = buildEdgeCurves();

  return (
    <div
      data-hero-fallback
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 transition-opacity duration-[1200ms] ease-out"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <svg
        viewBox={`0 0 ${SVG_VIEW.w} ${SVG_VIEW.h}`}
        className="h-full w-full"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="hero-node-glow">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Edges present in state B */}
        <g>
          {curves.map((c, i) =>
            c.b.present > 0 ? (
              <path
                key={`e${i}`}
                d={pathFor(c.b)}
                stroke="var(--line-strong)"
                strokeWidth={1.4}
                opacity={0.75}
              />
            ) : null,
          )}
        </g>

        {/* A few static packets, so the still frame reads as a live system */}
        <g>
          {curves.slice(0, 14).map((c, i) => {
            if (c.b.present === 0) return null;
            // Deterministic positions, no Math.random, so server and client
            // markup are identical.
            const t = ((i * 37) % 100) / 100;
            const u = 1 - t;
            const p: [number, number, number] = [0, 0, 0];
            for (let k = 0; k < 3; k++) {
              p[k] =
                u * u * u * c.b.p0[k] +
                3 * u * u * t * c.b.c1[k] +
                3 * u * t * t * c.b.c2[k] +
                t * t * t * c.b.p3[k];
            }
            const [x, y] = worldToSvg(p);
            return (
              <circle
                key={`p${i}`}
                cx={x}
                cy={y}
                r={2.6}
                fill="var(--accent)"
                opacity={0.85}
              />
            );
          })}
        </g>

        {/* Nodes in state B */}
        <g>
          {heroNodes.map((n) => {
            const [x, y] = worldToSvg(n.b);
            const size = (n.size ?? 1) * 5.2;
            const isHub = (n.size ?? 1) >= 1.1;
            return (
              <g key={n.id}>
                {isHub && (
                  <circle cx={x} cy={y} r={size * 4} fill="url(#hero-node-glow)" />
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={size}
                  fill="var(--bg)"
                  stroke={isHub ? "var(--accent)" : "var(--muted)"}
                  strokeWidth={1.6}
                />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
