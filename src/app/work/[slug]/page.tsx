import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, projects } from "@/content/projects";
import { LANES } from "@/content/types";
import { getTopology } from "@/content/topology";
import { ArchitectureDiagram } from "@/components/diagram/ArchitectureDiagram";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/ui/SectionHead";
import {
  CaseStudyExtras,
  EXTRAS_START_INDEX,
  extraSectionCount,
  pad,
} from "@/components/work/CaseStudyExtras";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return { title: "Not found" };
  return {
    title: project.name,
    description: project.tagline,
  };
}

const laneLabel = new Map(LANES.map((l) => [l.id, l.label]));

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const topo = getTopology(project.slug);
  const cs = project.caseStudy;
  const index = projects.findIndex((p) => p.slug === project.slug);
  const next = projects[(index + 1) % projects.length];

  // The first section number after the project-specific extras. Derived, so a
  // project with no extras does not skip a number and one with two does not
  // collide with the heading that follows.
  const afterExtras = EXTRAS_START_INDEX + extraSectionCount(project.slug);

  return (
    <article className="pb-24 pt-36">
      {/* Header. Above the fold, so it uses the CSS entrance rather than
          Reveal, the <h1> here is the LCP element and must never be hidden
          behind a transition that has not run yet. */}
      <header className="shell mb-16">
        <div className="enter-fade mb-8 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link
            href="/work"
            data-cursor="link"
            className="label transition-colors hover:text-text"
          >
            ← Work
          </Link>
          <span className="label" style={{ color: "var(--faint)" }}>
            /
          </span>
          <span className="label">{laneLabel.get(project.lane)}</span>
          <span className="label" style={{ color: "var(--faint)" }}>
            {project.period}
          </span>
          {project.team && (
            <span className="label" style={{ color: "var(--warn)" }}>
              {project.team}
            </span>
          )}
        </div>

        <h1 className="text-d2 max-w-[24ch]">
          <span className="enter-rise enter-self">{project.name}</span>
        </h1>

        {/* The tagline is the thesis; it reads as a subtitle, not body copy. */}
        <p
          className="enter-fade mt-5 max-w-[34ch] text-d3 leading-snug"
          data-delay="1"
        >
          {project.tagline}
        </p>

        <p
          className="enter-fade prose-measure mt-8 text-[1.0625rem] leading-relaxed text-text-dim"
          data-delay="2"
        >
          {project.summary}
        </p>

        <div className="enter-fade mt-10 flex flex-wrap gap-3" data-delay="3">
          {project.repo && (
            <a
              href={project.repo}
              target="_blank"
              rel="noreferrer noopener"
              data-cursor="link"
              data-magnetic
              className="flex h-11 items-center gap-2 border border-line px-5 text-[0.9375rem] transition-colors hover:border-line-strong"
            >
              Source ↗
            </a>
          )}
          {project.live && (
            <a
              href={project.live}
              target="_blank"
              rel="noreferrer noopener"
              data-cursor="link"
              data-magnetic
              className="flex h-11 items-center gap-2 px-5 text-[0.9375rem] font-medium"
              style={{ background: "var(--accent)", color: "var(--bg)" }}
            >
              Live demo ↗
            </a>
          )}
        </div>
      </header>

      {/* Verified facts */}
      {project.facts.length > 0 && (
        <section className="shell mb-20">
          <p className="label mb-6 border-b border-line pb-4">
            Verified: each of these is checkable in the repository
          </p>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-4">
            {project.facts.map((f) => (
              <Reveal key={f.label}>
                <dt
                  className="font-display text-[clamp(1.75rem,3vw,2.5rem)] font-semibold leading-none tracking-tight"
                  style={{ color: "var(--accent)" }}
                >
                  {f.value}
                </dt>
                <dd className="mt-3">
                  <span className="block text-[0.9375rem] leading-snug">
                    {f.label}
                  </span>
                  <span
                    className="mt-2 block font-mono text-[0.6875rem] leading-snug"
                    style={{ color: "var(--faint)" }}
                  >
                    {f.source}
                  </span>
                </dd>
              </Reveal>
            ))}
          </dl>
        </section>
      )}

      {cs ? (
        <>
          {/* Problem */}
          <section className="shell py-16">
            <SectionHead index="01" label="The problem" />
            <Reveal as="p" className="prose-measure text-[1.125rem] leading-relaxed">
              {cs.problem}
            </Reveal>
          </section>

          {/* Architecture */}
          <section className="shell py-16">
            <SectionHead
              index="02"
              label="How it works"
              intro={cs.approach}
            />
            {project.hasDiagram && topo && (
              <ArchitectureDiagram
                topo={topo}
                caption={`${project.name}, drawn from the source, not the README. Scroll to trace the flow.`}
              />
            )}
          </section>

          {/* Project-specific detail blocks. They occupy the numbers from
              EXTRAS_START_INDEX onward, so everything after continues from
              there rather than assuming a fixed count. */}
          <CaseStudyExtras slug={project.slug} />

          {/* Decisions */}
          <section className="shell py-16">
            <SectionHead
              index={pad(afterExtras)}
              label="Decisions worth defending"
              title="Why it is built this way"
            />
            <ol className="grid gap-x-16 gap-y-10 md:grid-cols-2">
              {cs.decisions.map((d, i) => (
                <Reveal
                  as="li"
                  key={d.title}
                  delay={(i % 2) * 0.05}
                  className="border-t border-line pt-5"
                >
                  <h3 className="mb-3 text-[1.125rem] leading-snug">
                    <span
                      className="mr-2 font-mono text-[0.6875rem]"
                      style={{ color: "var(--accent)" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {d.title}
                  </h3>
                  <p className="text-[0.9375rem] leading-relaxed text-text-dim">
                    {d.body}
                  </p>
                </Reveal>
              ))}
            </ol>
          </section>

          {/* Learned */}
          <section className="shell py-16">
            <SectionHead index={pad(afterExtras + 1)} label="What I took from it" />
            {/* Accent rule, because this is the paragraph worth reading if
                you only read one. */}
            <Reveal className="border-l-2 border-l-[var(--accent)] pl-6">
              <blockquote
                className="prose-measure text-[1.125rem] leading-relaxed"
              >
                {cs.learned}
              </blockquote>
            </Reveal>
          </section>
        </>
      ) : (
        <section className="shell py-16">
          <p className="prose-measure text-text-dim">
            A full write-up for this one is still to come. The source is the best
            documentation for now.
          </p>
        </section>
      )}

      {/* Stack */}
      <section className="shell py-16">
        <SectionHead index={pad(afterExtras + 2)} label="Stack" />
        <Reveal className="flex flex-wrap gap-x-3 gap-y-2">
          {project.stack.map((s) => (
            <span
              key={s}
              className="label border border-line px-2.5 py-1.5"
              style={{ color: "var(--text-dim)" }}
            >
              {s}
            </span>
          ))}
        </Reveal>
      </section>

      {/* Next */}
      <section className="shell pt-16">
        <Link
          href={`/work/${next.slug}`}
          data-cursor="view"
          className="group block border-t border-line pt-8"
        >
          <p className="label mb-3">Next project</p>
          <div className="flex items-baseline justify-between gap-6">
            <h2 className="text-d3">{next.name}</h2>
            <span
              aria-hidden="true"
              className="text-2xl transition-transform duration-300 group-hover:translate-x-2"
              style={{ color: "var(--accent)" }}
            >
              →
            </span>
          </div>
          <p className="mt-3 max-w-[52ch] text-[0.9375rem] text-text-dim">
            {next.tagline}
          </p>
        </Link>
      </section>
    </article>
  );
}
