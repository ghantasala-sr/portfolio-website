import type { Metadata } from "next";
import { profile } from "@/content/profile";
import { education, experience, publications } from "@/content/experience";
import { skills } from "@/content/skills";
import { SectionHead } from "@/components/ui/SectionHead";
import { Reveal } from "@/components/ui/Reveal";
import { RepoConstellation } from "@/components/about/RepoConstellation";

export const metadata: Metadata = {
  title: "About",
  description:
    "Software engineer working across applied AI, data engineering and backend systems. MS Information Systems, Northeastern University.",
};

export default function AboutPage() {
  return (
    <div className="pb-24 pt-36">
      {/* Header. The right column holds the repo constellation, which is sticky
          so it stays in view while the bio is read. */}
      <header className="shell mb-24 grid gap-14 lg:grid-cols-[1.15fr_1fr] lg:items-start">
        <div>
          <p className="enter-fade label mb-6">About</p>
          <h1 className="text-d2 max-w-[22ch]">
            <span className="enter-rise enter-self">
              I build the unglamorous parts, because those are what survive
              production
            </span>
          </h1>
          <div className="prose-measure mt-10 space-y-6">
            {profile.aboutLong.map((para, i) => (
              <p
                key={i}
                className={
                  i === 0
                    ? "enter-fade text-[1.125rem] leading-relaxed"
                    : "text-[1.0625rem] leading-relaxed text-text-dim"
                }
                data-delay={i === 0 ? "1" : undefined}
              >
                {para}
              </p>
            ))}
          </div>
        </div>

        <div className="lg:sticky lg:top-28">
          <RepoConstellation />
        </div>
      </header>

      {/* Experience */}
      <section className="shell py-16">
        <SectionHead index="01" label="Experience" />
        <ol className="space-y-16">
          {experience.map((role) => (
            <Reveal as="li" key={`${role.org}-${role.title}`}>
              <div className="grid gap-x-12 gap-y-6 md:grid-cols-[1fr_2fr]">
                <div>
                  <h3 className="text-[1.25rem] leading-snug">{role.title}</h3>
                  <p className="mt-2 text-[0.9375rem] text-text-dim">
                    {role.org}
                  </p>
                  <p className="label mt-3">{role.period}</p>
                  <p className="label mt-1" style={{ color: "var(--faint)" }}>
                    {role.location}
                  </p>
                  {role.artifact && (
                    <a
                      href={role.artifact.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      data-cursor="link"
                      className="label mt-4 inline-block border-b pb-0.5 transition-colors hover:text-text"
                      style={{
                        borderColor: "var(--accent)",
                        color: "var(--accent)",
                      }}
                    >
                      {role.artifact.label} ↗
                    </a>
                  )}
                </div>

                <div>
                  <ul className="space-y-4">
                    {role.bullets.map((b, i) => (
                      <li key={i} className="flex gap-4">
                        <span
                          aria-hidden="true"
                          className="mt-2 h-1 w-1 shrink-0"
                          style={{ background: "var(--accent)" }}
                        />
                        <span className="text-[0.9375rem] leading-relaxed text-text-dim">
                          {b}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {role.detail && (
                    <div className="mt-8 border-t border-line pt-6">
                      <p className="label mb-4">{role.detail.heading}</p>
                      <ol className="space-y-3">
                        {role.detail.items.map((item) => (
                          <li key={item.name}>
                            <span className="text-[0.9375rem]">{item.name}</span>
                            <span
                              className="block text-[0.875rem] leading-relaxed"
                              style={{ color: "var(--muted)" }}
                            >
                              {item.body}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Education */}
      <section className="shell py-16">
        <SectionHead index="02" label="Education" />
        <ol className="space-y-0">
          {education.map((e) => (
            <Reveal
              as="li"
              key={e.org}
              className="grid gap-x-12 gap-y-2 border-t border-line py-6 md:grid-cols-[1fr_2fr_auto]"
            >
              <div>
                <h3 className="text-[1.125rem]">{e.org}</h3>
                <p className="label mt-2">{e.location}</p>
              </div>
              <div>
                <p className="text-[0.9375rem]">{e.degree}</p>
                {e.focus && (
                  <p className="mt-1 text-[0.875rem]" style={{ color: "var(--muted)" }}>
                    {e.focus}
                  </p>
                )}
                <p className="label mt-2">{e.period}</p>
              </div>
              <p
                className="font-mono text-[1.125rem] font-medium md:text-right"
                style={{ color: "var(--accent)" }}
              >
                {e.gpa}
              </p>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Publications */}
      <section className="shell py-16">
        <SectionHead
          index="03"
          label="Publications"
          title="Two peer-reviewed papers on network threat detection"
          intro="This work is where I learned that a number is only meaningful if you can explain what it does and does not tell you, the habit that later made me validate an LLM judge against human labels rather than trusting its scores."
        />
        <ol className="space-y-0">
          {publications.map((p) => (
            <Reveal
              as="li"
              key={p.doi}
              className="border-t border-line py-8"
            >
              <a
                href={p.href}
                target="_blank"
                rel="noreferrer noopener"
                data-cursor="link"
                className="group block"
              >
                <div className="mb-3 flex items-baseline gap-4">
                  <span className="label" style={{ color: "var(--accent)" }}>
                    {p.year}
                  </span>
                  <h3 className="prose-measure text-[1.125rem] leading-snug transition-colors group-hover:text-[var(--accent)]">
                    {p.title}
                  </h3>
                </div>
                <p className="prose-measure mb-2 text-[0.9375rem] leading-relaxed text-text-dim">
                  {p.authors.split(p.me).map((part, i, arr) => (
                    <span key={i}>
                      {part}
                      {i < arr.length - 1 && (
                        <strong style={{ color: "var(--text)", fontWeight: 600 }}>
                          {p.me}
                        </strong>
                      )}
                    </span>
                  ))}
                </p>
                <p className="label mb-3">{p.venue}</p>
                {p.note && (
                  <p className="prose-measure mb-3 text-[0.875rem] leading-relaxed" style={{ color: "var(--muted)" }}>
                    {p.note}
                  </p>
                )}
                <p className="label" style={{ color: "var(--faint)" }}>
                  DOI {p.doi} ↗
                </p>
              </a>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Skills */}
      <section className="shell py-16">
        <SectionHead
          index="04"
          label="Tools"
          title="What I actually use"
          intro="Everything listed here appears in at least one linked repository. Ordered by how central it is to the work on this site, not alphabetically."
        />
        <dl className="space-y-8">
          {skills.map((group) => (
            <Reveal
              key={group.label}
              className="grid gap-x-12 gap-y-3 border-t border-line pt-5 md:grid-cols-[1fr_3fr]"
            >
              <dt className="label pt-1">{group.label}</dt>
              <dd className="flex flex-wrap gap-x-3 gap-y-2">
                {group.items.map((item) => (
                  <span
                    key={item}
                    className="text-[0.9375rem]"
                    style={{ color: "var(--text-dim)" }}
                  >
                    {item}
                  </span>
                ))}
              </dd>
            </Reveal>
          ))}
        </dl>
      </section>
    </div>
  );
}
