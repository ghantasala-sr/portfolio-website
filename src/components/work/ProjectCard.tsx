import Link from "next/link";
import type { Project } from "@/content/types";
import { LANES } from "@/content/types";
import { getTopology } from "@/content/topology";
import { TopologyGlyph } from "@/components/diagram/TopologyGlyph";

const laneLabel = new Map(LANES.map((l) => [l.id, l.label]));

export function ProjectCard({
  project,
  index,
  featured = false,
}: {
  project: Project;
  index: number;
  featured?: boolean;
}) {
  const topo = getTopology(project.slug);
  const num = String(index + 1).padStart(2, "0");

  return (
    <Link
      href={`/work/${project.slug}`}
      data-cursor="view"
      className="group relative flex flex-col border-t border-line pt-6 transition-colors duration-500 hover:border-line-strong"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <span className="label transition-colors duration-500 group-hover:text-[var(--accent)]">
            {num}
          </span>
          <div>
            <h3
              className={`${featured ? "text-d3" : "text-[1.375rem]"} leading-tight`}
            >
              {project.name}
            </h3>
            <p className="label mt-2">{laneLabel.get(project.lane)}</p>
          </div>
        </div>

        {topo && (
          <div className="w-28 shrink-0 opacity-80 transition-opacity duration-500 group-hover:opacity-100 sm:w-36">
            <TopologyGlyph topo={topo} className="h-16 w-full" />
          </div>
        )}
      </div>

      <p className="mb-5 text-[0.9375rem] leading-relaxed text-text-dim">
        {project.tagline}
      </p>

      {featured && (
        <p className="mb-5 text-[0.9375rem] leading-relaxed text-muted">
          {project.summary}
        </p>
      )}

      {/* Verified facts only. An empty array renders nothing rather than
          padding the card with something unsupportable. */}
      {project.facts.length > 0 && (
        <dl className="mb-5 flex flex-wrap gap-x-6 gap-y-3">
          {project.facts.slice(0, featured ? 4 : 2).map((f) => (
            <div key={f.label} title={f.source}>
              <dt
                className="font-mono text-lg font-medium leading-none"
                style={{ color: "var(--accent)" }}
              >
                {f.value}
              </dt>
              <dd className="label mt-1.5 max-w-[18ch] leading-snug">
                {f.label}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pb-6">
        {project.stack.slice(0, featured ? 7 : 5).map((s) => (
          <span key={s} className="label" style={{ color: "var(--faint)" }}>
            {s}
          </span>
        ))}
        {project.stack.length > (featured ? 7 : 5) && (
          <span className="label" style={{ color: "var(--faint)" }}>
            +{project.stack.length - (featured ? 7 : 5)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 pb-6">
        <span className="label transition-colors duration-300 group-hover:text-text">
          Read the case study
        </span>
        <span
          aria-hidden="true"
          className="transition-transform duration-300 group-hover:translate-x-1"
          style={{ color: "var(--accent)" }}
        >
          →
        </span>
        {project.live && (
          <span className="label ml-auto" style={{ color: "var(--accent)" }}>
            ● Live
          </span>
        )}
      </div>
    </Link>
  );
}
