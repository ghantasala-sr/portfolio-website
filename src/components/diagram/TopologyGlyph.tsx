import { edgePaths, nodeMap, type Topology } from "@/content/topology/types";
import { isFilled, shapePath, strokeForEdge } from "./nodeShape";

/**
 * The small unlabelled topology mark on a project card. Same data as the full
 * diagram, rendered at glyph scale: only `key` nodes get shapes, everything
 * else is a faint dot, and nothing is labelled.
 *
 * Server-rendered, no client JS. The hover animation is pure CSS via the
 * parent card's group-hover.
 */
export function TopologyGlyph({
  topo,
  className = "",
}: {
  topo: Topology;
  className?: string;
}) {
  const nodes = nodeMap(topo);
  const paths = edgePaths(topo);

  // Scale node shapes relative to diagram size so a 1200-wide topology and a
  // 560-wide one produce marks of comparable visual weight. Generous, because
  // at ~130px wide the shapes are otherwise sub-pixel dust.
  const s = Math.max(1.6, topo.width / 420);

  return (
    <svg
      viewBox={`0 0 ${topo.width} ${topo.height}`}
      className={className}
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      <g>
        {paths.map(({ edge, d }, i) => {
          const { dash, opacity } = strokeForEdge(edge.kind);
          return (
            <path
              key={`e${i}`}
              d={d}
              stroke="var(--faint)"
              strokeWidth={s * 1.5}
              strokeDasharray={dash ? dash.split(" ").map((n) => Number(n) * s).join(" ") : undefined}
              opacity={opacity * 0.9}
              className="transition-opacity duration-500 group-hover:opacity-100"
            />
          );
        })}
      </g>

      <g>
        {topo.nodes.map((n) => {
          const node = nodes.get(n.id)!;
          if (!n.key) {
            return (
              <circle
                key={n.id}
                cx={node.x}
                cy={node.y}
                r={s * 2}
                fill="var(--faint)"
                opacity={0.7}
              />
            );
          }
          const filled = isFilled(n.kind);
          return (
            <g key={n.id} transform={`translate(${node.x} ${node.y})`}>
              <path
                d={shapePath(n.kind, s)}
                stroke={filled ? "none" : "var(--text-dim)"}
                strokeWidth={s * 1.5}
                fill={filled ? "var(--accent)" : "var(--bg)"}
                className="transition-[stroke,fill] duration-500 group-hover:stroke-[var(--accent)]"
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
}
