"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { useGSAP } from "@gsap/react";
import {
  constellation,
  constellationLanes,
  type ConstellationNode,
} from "@/content/constellation";

// Registered here, not inherited. drawSVG was previously only registered by
// ArchitectureDiagram, which /about never imports, so the entrance silently
// logged "Invalid property drawSVG" on every edge.
gsap.registerPlugin(DrawSVGPlugin);

/**
 * Every repository, clustered by discipline, linked where two share specialised
 * tooling. Derived from the project data, so it cannot drift from the work.
 *
 * SVG rather than WebGL, deliberately. The hero's scene is built on additive
 * blending, which is a no-op against a light ground, so it is dark-only. A
 * second dark-only square would leave a hole in blueprint mode. SVG also makes
 * each node a real focusable link, so the whole graph is keyboard-navigable and
 * crawlable, which a canvas cannot be.
 */
export function RepoConstellation() {
  const scope = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [active, setActive] = useState<ConstellationNode | null>(null);
  const { nodes, edges, viewBox, laneFont } = constellation;

  const byId = new Map(nodes.map((nd) => [nd.slug, nd]));
  const connected = new Set<string>();
  if (active) {
    for (const e of edges) {
      if (e.from === active.slug) connected.add(e.to);
      if (e.to === active.slug) connected.add(e.from);
    }
  }

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-edge]", {
          drawSVG: "0%",
          duration: 0.9,
          stagger: 0.03,
          ease: "power2.out",
        });
        gsap.from("[data-star]", {
          scale: 0,
          opacity: 0,
          duration: 0.6,
          stagger: 0.04,
          ease: "back.out(2)",
          transformOrigin: "center",
        });

        // A slow independent drift per node, so the graph breathes without
        // ever moving far enough to break the read.
        gsap.utils.toArray<SVGGElement>("[data-star]").forEach((el, i) => {
          gsap.to(el, {
            x: `random(-6, 6)`,
            y: `random(-6, 6)`,
            duration: 5 + (i % 5),
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: i * 0.12,
          });
        });
      });

      return () => mm.revert();
    },
    { scope },
  );

  return (
    <div ref={scope} className="relative">
      <svg
        viewBox={viewBox}
        className="w-full"
        role="group"
        aria-label="Repositories clustered by discipline and linked by shared tooling"
      >
        {/* Lane labels sit under everything, as faint ground truth */}
        {constellationLanes.map((l) => (
          <text
            key={l.id}
            x={l.x}
            y={l.y}
            textAnchor={l.anchor}
            fontSize={laneFont}
            fontFamily="var(--font-mono)"
            letterSpacing="0.08em"
            fill="var(--faint)"
            opacity={active ? 0.25 : 0.55}
            className="transition-opacity duration-300"
          >
            {l.label.toUpperCase()}
          </text>
        ))}

        {/* Edges */}
        <g fill="none">
          {edges.map((e, i) => {
            const a = byId.get(e.from)!;
            const b = byId.get(e.to)!;
            const lit =
              active !== null &&
              (e.from === active.slug || e.to === active.slug);
            // A small alternating bow, scaled by span. Straight lines between
            // clusters stack on top of each other and read as one thick smudge;
            // bowing them apart makes the count legible.
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const span = Math.hypot(dx, dy);
            const bow = (i % 2 === 0 ? 1 : -1) * span * 0.09;
            const mx = (a.x + b.x) / 2 + (-dy / span) * bow;
            const my = (a.y + b.y) / 2 + (dx / span) * bow;
            return (
              <path
                key={i}
                data-edge
                d={`M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`}
                stroke={lit ? "var(--accent)" : "var(--line-strong)"}
                strokeWidth={lit ? 2.4 : 1.3}
                opacity={active === null ? 0.55 : lit ? 1 : 0.1}
                className="transition-[stroke,opacity] duration-300"
              />
            );
          })}
        </g>

        {/* Nodes. Each is a link, so tab order walks the whole constellation. */}
        <g>
          {nodes.map((nd) => {
            const isActive = active?.slug === nd.slug;
            const isNeighbour = connected.has(nd.slug);
            const dim = active !== null && !isActive && !isNeighbour;
            return (
              <a
                key={nd.slug}
                data-star
                href={`/work/${nd.slug}`}
                aria-label={`${nd.name}, ${nd.laneLabel}`}
                data-cursor="view"
                onClick={(ev) => {
                  // Keep it a real link so crawling, focus and modified clicks
                  // all behave; only intercept a plain left click to route
                  // client-side.
                  if (
                    ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey ||
                    ev.button !== 0
                  ) {
                    return;
                  }
                  ev.preventDefault();
                  router.push(`/work/${nd.slug}`);
                }}
                onMouseEnter={() => setActive(nd)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(nd)}
                onBlur={() => setActive(null)}
                style={{ transformOrigin: "center" }}
              >
                {/* Generous invisible hit area: the visible dot is small. */}
                <circle cx={nd.x} cy={nd.y} r={nd.r + 16} fill="transparent" />
                {isActive && (
                  <circle
                    cx={nd.x}
                    cy={nd.y}
                    r={nd.r + 11}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth={1.4}
                    opacity={0.5}
                  />
                )}
                <circle
                  cx={nd.x}
                  cy={nd.y}
                  r={nd.r}
                  fill={isActive ? "var(--accent)" : "var(--bg)"}
                  stroke={
                    isActive
                      ? "var(--accent)"
                      : isNeighbour
                        ? "var(--accent)"
                        : "var(--muted)"
                  }
                  strokeWidth={2}
                  opacity={dim ? 0.25 : 1}
                  className="transition-[fill,stroke,opacity] duration-300"
                />
              </a>
            );
          })}
        </g>
      </svg>

      {/* Readout. Fixed height so hovering never reflows the page. */}
      <div className="mt-4 h-[4.5rem] border-t border-line pt-3">
        {active ? (
          <>
            <p className="flex items-baseline gap-3">
              <span className="text-[1.0625rem]">{active.name}</span>
              <span className="label">{active.laneLabel}</span>
            </p>
            <p className="label mt-1.5 leading-relaxed" style={{ color: "var(--faint)" }}>
              {active.stackCount} technologies
              {active.degree > 0
                ? ` · shares specialised tooling with ${active.degree} other ${
                    active.degree === 1 ? "project" : "projects"
                  }`
                : " · no rare-stack overlap, it stands alone"}
            </p>
          </>
        ) : (
          <p className="label leading-relaxed">
            {nodes.length} repositories, clustered by discipline. A line means two
            share specialised tooling, weighted so Python counts for little and
            ClickHouse counts for a lot. Hover or tab through them.
          </p>
        )}
      </div>
    </div>
  );
}
