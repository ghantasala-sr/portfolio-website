"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { useGSAP } from "@gsap/react";
import { LANES, type Lane, type Project } from "@/content/types";
import { ProjectCard } from "./ProjectCard";

// Route-level client component, so Turbopack already keeps Flip out of the
// home page's initial payload. Verified against the built chunks.
gsap.registerPlugin(Flip);

/**
 * Filterable project index.
 *
 * Reflow uses GSAP's Flip rather than a layout-animation library: Flip captures
 * state explicitly before the DOM changes and animates from it, which suits a
 * filter (where items are added and removed) better than an implicit
 * layout-diffing approach, and it is already in the GSAP package, so it costs
 * no extra bytes.
 */
export function WorkIndex({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState<Lane | "all">("all");
  const gridRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<ReturnType<typeof Flip.getState> | null>(null);

  // Only offer lanes that actually have projects.
  const lanes = LANES.filter((l) =>
    projects.some((p) => p.lanes.includes(l.id)),
  );

  const visible =
    active === "all"
      ? projects
      : projects.filter((p) => p.lanes.includes(active));

  const beginFilter = (next: Lane | "all") => {
    if (next === active) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce && gridRef.current) {
      stateRef.current = Flip.getState(
        gridRef.current.querySelectorAll("[data-card]"),
      );
    }
    setActive(next);
  };

  // Runs after the filtered list commits; animates from the captured state.
  useGSAP(
    () => {
      const prev = stateRef.current;
      if (!prev) return;
      stateRef.current = null;
      Flip.from(prev, {
        duration: 0.6,
        ease: "expo.out",
        stagger: 0.02,
        absolute: true,
        onEnter: (els) =>
          gsap.fromTo(
            els,
            { opacity: 0, scale: 0.94 },
            { opacity: 1, scale: 1, duration: 0.45, ease: "expo.out" },
          ),
        onLeave: (els) =>
          gsap.to(els, { opacity: 0, scale: 0.94, duration: 0.25 }),
      });
    },
    { dependencies: [active], scope: gridRef },
  );

  return (
    <>
      <div
        role="group"
        aria-label="Filter projects by discipline"
        className="mb-12 flex flex-wrap gap-2 border-b border-line pb-6"
      >
        <FilterButton
          label="All"
          count={projects.length}
          selected={active === "all"}
          onSelect={() => beginFilter("all")}
        />
        {lanes.map((l) => (
          <FilterButton
            key={l.id}
            label={l.label}
            count={projects.filter((p) => p.lanes.includes(l.id)).length}
            selected={active === l.id}
            onSelect={() => beginFilter(l.id)}
          />
        ))}
      </div>

      <p className="label mb-8" aria-live="polite">
        Showing {visible.length} of {projects.length}
        {active !== "all" && (
          <>
            {" · "}
            <span style={{ color: "var(--text-dim)" }}>
              {LANES.find((l) => l.id === active)?.blurb}
            </span>
          </>
        )}
      </p>

      <div
        ref={gridRef}
        className="grid gap-x-16 gap-y-6 md:grid-cols-2 lg:grid-cols-3"
      >
        {visible.map((p) => (
          <div key={p.slug} data-card>
            <ProjectCard
              project={p}
              index={projects.findIndex((x) => x.slug === p.slug)}
            />
          </div>
        ))}
      </div>
    </>
  );
}

function FilterButton({
  label,
  count,
  selected,
  onSelect,
}: {
  label: string;
  count: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      data-cursor="link"
      className="label flex items-center gap-2 border px-3 py-2 transition-colors"
      style={{
        borderColor: selected ? "var(--accent)" : "var(--line)",
        color: selected ? "var(--accent)" : undefined,
      }}
    >
      {label}
      <span style={{ color: "var(--faint)" }}>{count}</span>
    </button>
  );
}
