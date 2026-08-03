"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { useGSAP } from "@gsap/react";
import {
  edgePaths,
  flowPath,
  nodeMap,
  type Topology,
} from "@/content/topology/types";
import { isFilled, shapePath, strokeForEdge } from "./nodeShape";

// Static imports are correct here. This is a route-level client component, so
// Turbopack already splits DrawSVG (3KB) and MotionPath (20KB) into lazy chunks
//, measured, not assumed. Deferring them by hand added a load-order gate that
// would briefly show a fully-drawn diagram before snapping it back to undrawn.
gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin, MotionPathPlugin);

/**
 * Node labels are centred SVG text. They neither wrap nor clip. Two problems
 * follow, and both were live on six of the nine diagrams before this existed:
 * a label near an edge runs outside the viewBox and gets cut off, and two nodes
 * on the same row with wide labels silently overlap each other.
 *
 * Rather than hand-tune coordinates per topology, resolve both at render time:
 *
 *  - anchor: nodes close enough to an edge that a centred label would spill
 *    switch to start/end anchoring, so the text grows inward instead.
 *  - dy: nodes sharing a row (within 44px vertically) are sorted by x, and
 *    every other one drops its label to a second tier, so neighbours cannot
 *    collide however wide they are.
 *
 * Verified by scripts/check-diagrams.mjs against the rendered HTML.
 */
const LABEL_TIER_A = 26;
const LABEL_TIER_B = 62;
const ROW_TOLERANCE = 44;
const CHAR_W = 0.6;

function anchorX(anchor: "start" | "middle" | "end"): number {
  // Offset off the glyph so an inward-growing label clears the node shape.
  if (anchor === "start") return -12;
  if (anchor === "end") return 12;
  return 0;
}

interface NodeLayout {
  anchor: "start" | "middle" | "end";
  dy: number;
}

function computeLayout(
  topo: Topology,
  labelSize: number,
  metaSize: number,
): Map<string, NodeLayout> {
  const widthOf = (n: Topology["nodes"][number]) =>
    Math.max(
      n.label.length * labelSize * CHAR_W,
      (n.meta?.length ?? 0) * metaSize * CHAR_W,
    );

  const out = new Map<string, NodeLayout>();

  // Anchor first, so overlap is judged against where text actually lands.
  const spans = new Map<string, { left: number; right: number }>();
  for (const n of topo.nodes) {
    const w = widthOf(n);
    let anchor: NodeLayout["anchor"] = "middle";
    if (n.x - w / 2 < 4) anchor = "start";
    else if (n.x + w / 2 > topo.width - 4) anchor = "end";

    const ax = n.x + anchorX(anchor);
    const left = anchor === "start" ? ax : anchor === "end" ? ax - w : ax - w / 2;
    spans.set(n.id, { left, right: left + w });
    out.set(n.id, { anchor, dy: LABEL_TIER_A });
  }

  // Then tier within each row.
  const rows: Topology["nodes"][] = [];
  for (const n of [...topo.nodes].sort((a, b) => a.y - b.y)) {
    const row = rows.find((r) => Math.abs(r[0].y - n.y) < ROW_TOLERANCE);
    if (row) row.push(n);
    else rows.push([n]);
  }

  for (const row of rows) {
    row.sort((a, b) => a.x - b.x);
    // Rightmost occupied x per tier, so a label is only pushed down when it
    // would touch something already on its own tier.
    let rightA = -Infinity;
    let rightB = -Infinity;
    for (const n of row) {
      const span = spans.get(n.id)!;
      const tier =
        span.left >= rightA + 6
          ? LABEL_TIER_A
          : span.left >= rightB + 6
            ? LABEL_TIER_B
            : LABEL_TIER_A; // both crowded: accept, nothing better to do
      if (tier === LABEL_TIER_A) rightA = Math.max(rightA, span.right);
      else rightB = Math.max(rightB, span.right);
      out.set(n.id, { anchor: out.get(n.id)!.anchor, dy: tier });
    }
  }

  return out;
}

/**
 * Group labels have the same no-wrap/no-clip problem. Clamped by character
 * budget rather than by measurement, so server and browser agree.
 */
function clampLabel(text: string, maxWidth: number, fontSize: number): string {
  const perChar = fontSize * 0.66;
  const budget = Math.floor(maxWidth / perChar);
  if (text.length <= budget) return text;
  return budget > 1 ? `${text.slice(0, budget - 1).trimEnd()}…` : "";
}

/**
 * Full-width architecture diagram, scrubbed by scroll.
 *
 * Three layered animations:
 *   1. edges draw on (DrawSVG), scrubbed
 *   2. nodes reveal in reading order, scrubbed
 *   3. a packet traverses the real flow path (MotionPath), looping
 *
 * Reduced motion: `gsap.matchMedia` skips straight to the end state, so the
 * diagram is fully drawn and static. Nothing is left mid-clip.
 */
export function ArchitectureDiagram({
  topo,
  caption,
}: {
  topo: Topology;
  caption?: string;
}) {
  const scope = useRef<HTMLDivElement>(null);
  const nodes = nodeMap(topo);
  const paths = edgePaths(topo);
  const packetPath = flowPath(topo);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set("[data-edge]", { drawSVG: "100%", opacity: 1 });
        gsap.set("[data-node]", { opacity: 1, scale: 1 });
        gsap.set("[data-packet]", { opacity: 0 });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set("[data-edge]", { drawSVG: "0%" });
        gsap.set("[data-node]", { opacity: 0, scale: 0.72 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: scope.current,
            start: "top 78%",
            end: "bottom 62%",
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        });

        tl.to("[data-node]", {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          stagger: 0.055,
          ease: "back.out(2)",
        }).to(
          "[data-edge]",
          {
            drawSVG: "100%",
            duration: 0.7,
            stagger: 0.035,
            ease: "none",
          },
          0.15,
        );

        // The packet loops independently of scroll. It represents live
        // traffic, so tying it to scroll position would misrepresent it.
        if (packetPath) {
          gsap.fromTo(
            "[data-packet]",
            { opacity: 0 },
            {
              opacity: 1,
              duration: 0.4,
              scrollTrigger: { trigger: scope.current, start: "top 60%" },
            },
          );
          gsap.to("[data-packet]", {
            motionPath: { path: "#flow-path", align: "#flow-path", alignOrigin: [0.5, 0.5] },
            duration: 4.2,
            repeat: -1,
            ease: "none",
            repeatDelay: 0.5,
            scrollTrigger: {
              trigger: scope.current,
              start: "top 90%",
              end: "bottom top",
              toggleActions: "play pause resume pause",
            },
          });
        }
      });

      return () => mm.revert();
    },
    { scope },
  );

  const labelSize = Math.max(11, topo.width / 78);
  const metaSize = labelSize * 0.82;
  const layout = computeLayout(topo, labelSize, metaSize);
  // The second label tier sits lower than the node, so the viewBox needs room
  // for it or bottom-row labels get cut off.
  const viewH = topo.height + LABEL_TIER_B + metaSize + 10;

  return (
    <figure ref={scope} className="my-14">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${topo.width} ${viewH}`}
          className="h-auto w-full min-w-[46rem]"
          fill="none"
          role="img"
          aria-label={caption ?? `Architecture diagram for ${topo.id}`}
        >
          {/* Boundary boxes: VPC, subnets, dbt layers, agent pools */}
          {topo.groups?.map((g) => (
            <g key={g.id}>
              <rect
                x={g.x}
                y={g.y}
                width={g.width}
                height={g.height}
                rx={2}
                stroke="var(--line-strong)"
                strokeWidth={1}
                strokeDasharray={g.solid ? undefined : "3 5"}
                fill="var(--surface)"
                fillOpacity={0.35}
              />
              <text
                x={g.x + 8}
                y={g.y + 15}
                fill="var(--faint)"
                fontSize={metaSize}
                fontFamily="var(--font-mono)"
                letterSpacing="0.06em"
              >
                {clampLabel(g.label.toUpperCase(), g.width - 16, metaSize)}
              </text>
            </g>
          ))}

          {/* The traversal path, hidden. MotionPath reads it by id */}
          {packetPath && (
            <path id="flow-path" d={packetPath} stroke="none" fill="none" />
          )}

          {/* Edges */}
          {paths.map(({ edge, d }, i) => {
            const { dash, opacity } = strokeForEdge(edge.kind);
            return (
              <path
                key={`e${i}`}
                data-edge
                d={d}
                stroke={
                  edge.kind === "dlq" ? "var(--warn)" : "var(--line-strong)"
                }
                strokeWidth={1.8}
                strokeDasharray={dash}
                opacity={opacity}
              />
            );
          })}

          {/* Nodes */}
          {topo.nodes.map((n) => {
            const node = nodes.get(n.id)!;
            const filled = isFilled(n.kind);
            const { anchor, dy } = layout.get(n.id)!;
            return (
              <g
                key={n.id}
                data-node
                transform={`translate(${node.x} ${node.y})`}
                style={{ transformOrigin: "center" }}
              >
                <path
                  d={shapePath(n.kind, 1)}
                  stroke={filled ? "none" : "var(--muted)"}
                  strokeWidth={1.8}
                  fill={filled ? "var(--accent)" : "var(--bg)"}
                />
                <text
                  x={anchorX(anchor)}
                  y={dy}
                  textAnchor={anchor}
                  fill="var(--text-dim)"
                  fontSize={labelSize}
                  fontFamily="var(--font-mono)"
                  fontWeight={500}
                >
                  {n.label}
                </text>
                {n.meta && (
                  <text
                    x={anchorX(anchor)}
                    y={dy + metaSize + 4}
                    textAnchor={anchor}
                    fill="var(--faint)"
                    fontSize={metaSize}
                    fontFamily="var(--font-mono)"
                  >
                    {n.meta}
                  </text>
                )}
              </g>
            );
          })}

          {/* The travelling packet */}
          {packetPath && (
            <g data-packet opacity={0}>
              <circle r={7} fill="var(--accent)" opacity={0.2} />
              <circle r={3.2} fill="var(--accent)" />
            </g>
          )}
        </svg>
      </div>

      {caption && (
        <figcaption className="label mt-4 leading-relaxed">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
