import Link from "next/link";
import { Hero } from "@/components/hero/Hero";
import { StatStrip } from "@/components/home/StatStrip";
import { ExperienceStrip } from "@/components/home/ExperienceStrip";
import { SkillsGrid } from "@/components/home/SkillsGrid";
import { Credentials } from "@/components/home/Credentials";
import { Principles } from "@/components/home/Principles";
import { NowSection } from "@/components/home/NowSection";
import { SectionHead } from "@/components/ui/SectionHead";
import { Reveal } from "@/components/ui/Reveal";
import { ProjectCard } from "@/components/work/ProjectCard";
import { featuredProjects, projects } from "@/content/projects";
import { profile } from "@/content/profile";

/** Small numbers read better spelled out in a headline than as digits. */
const NUMBER_WORDS = [
  "Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight",
  "Nine", "Ten", "Eleven", "Twelve",
];

function spellOut(n: number): string {
  return NUMBER_WORDS[n] ?? String(n);
}

/** The lead four get the large treatment; the rest are compact. */
const LEAD_COUNT = 4;
const leadProjects = featuredProjects.slice(0, LEAD_COUNT);
const restProjects = featuredProjects.slice(LEAD_COUNT);

export default function Home() {
  return (
    <>
      <Hero />

      {/* About. Two columns so the paragraph does not float alone in a wide
          empty band, the right column carries the facts a reader wants next. */}
      <section className="shell py-20">
        <SectionHead index="01" label="About" />
        <div className="grid gap-x-14 gap-y-10 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <Reveal as="p" className="text-d3 leading-[1.3]">
              {profile.aboutShort}
            </Reveal>
            <Reveal
              as="p"
              delay={0.06}
              className="prose-measure mt-6 text-[1.0625rem] leading-relaxed text-text-dim"
            >
              I care about the unglamorous parts, evaluation, observability,
              failure isolation, because those are what separate a system that
              demos well from one that survives contact with production. I use
              AI coding tools daily and have opinions about where they help and
              where they get in the way.
            </Reveal>
            <Reveal delay={0.1} className="mt-8">
              <Link
                href="/about"
                data-cursor="link"
                data-magnetic
                className="group inline-flex items-center gap-3 border-b pb-1 transition-colors"
                style={{ borderColor: "var(--accent)" }}
              >
                <span>Read the longer version</span>
                <span
                  aria-hidden="true"
                  className="transition-transform duration-300 group-hover:translate-x-1"
                  style={{ color: "var(--accent)" }}
                >
                  →
                </span>
              </Link>
            </Reveal>
          </div>

          <Reveal delay={0.08}>
            <dl className="space-y-0">
              {[
                ["Currently", "MS Information Systems, Northeastern. May 2026"],
                ["Based in", `${profile.location} · ${profile.relocation}`],
                ["Focus", "Agentic AI · data engineering · backend infrastructure"],
                ["Daily tools", "Claude Code · Codex · Cursor"],
                ["Looking for", "New grad & mid-level software engineering roles"],
              ].map(([k, v]) => (
                <div key={k} className="border-t border-line py-3.5">
                  <dt className="label mb-1.5">{k}</dt>
                  <dd className="text-[0.9375rem] leading-relaxed text-text-dim">
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      <StatStrip />

      {/* Selected work.
          Two tiers rather than ten equal cards: a featured card carries the
          full summary and four facts, so ten of them would run to twice the
          height of the rest of the page combined. The lead four get that
          treatment; the remaining six are compact and three-up. */}
      <section id="work" className="shell py-20">
        <SectionHead
          index="02"
          label="Selected work"
          title={`${spellOut(featuredProjects.length)} systems, each with its architecture and the decisions behind it`}
          intro="Every case study walks the real topology (drawn from the code, not the README), and every number links back to something checkable in the repository. The full index has all sixteen."
          action={
            <Link
              href="/work"
              data-cursor="link"
              className="label transition-colors hover:text-text"
            >
              All {projects.length} →
            </Link>
          }
        />

        <div className="grid gap-x-14 gap-y-4 md:grid-cols-2">
          {leadProjects.map((p, i) => (
            <Reveal key={p.slug} delay={(i % 2) * 0.06}>
              <ProjectCard project={p} index={i} featured />
            </Reveal>
          ))}
        </div>

        {restProjects.length > 0 && (
          <div className="mt-6 grid gap-x-12 gap-y-2 border-t border-line pt-6 md:grid-cols-2 lg:grid-cols-3">
            {restProjects.map((p, i) => (
              <Reveal key={p.slug} delay={(i % 3) * 0.05}>
                <ProjectCard
                  project={p}
                  index={leadProjects.length + i}
                />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <ExperienceStrip />
      <Principles />
      <SkillsGrid />
      <Credentials />
      <NowSection />
    </>
  );
}
