import { SectionHead } from "@/components/ui/SectionHead";
import { Reveal } from "@/components/ui/Reveal";
import { education, publications } from "@/content/experience";

/**
 * Education and publications side by side. Both are short, and pairing them
 * fills a row that either alone would leave half empty.
 */
export function Credentials() {
  return (
    <section className="shell py-20">
      <SectionHead index="06" label="Education & research" />

      <div className="grid gap-x-14 gap-y-12 lg:grid-cols-2">
        <div>
          <p className="label mb-5">Degrees</p>
          <ol>
            {education.map((e, i) => (
              <Reveal
                as="li"
                key={e.org}
                delay={i * 0.05}
                className="border-t border-line py-5"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-[1.0625rem] leading-snug">{e.org}</h3>
                  <span
                    className="shrink-0 font-mono text-[0.9375rem] font-medium"
                    style={{ color: "var(--accent)" }}
                  >
                    {e.gpa}
                  </span>
                </div>
                <p className="mt-1.5 text-[0.9375rem] text-text-dim">
                  {e.degree}
                </p>
                {e.focus && (
                  <p
                    className="mt-1 text-[0.875rem]"
                    style={{ color: "var(--muted)" }}
                  >
                    {e.focus}
                  </p>
                )}
                <p className="label mt-2.5">
                  {e.period} · {e.location}
                </p>
              </Reveal>
            ))}
          </ol>
        </div>

        <div>
          <p className="label mb-5">Peer-reviewed publications</p>
          <ol>
            {publications.map((p, i) => (
              <Reveal
                as="li"
                key={p.doi}
                delay={i * 0.05}
                className="border-t border-line py-5"
              >
                <a
                  href={p.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  data-cursor="link"
                  className="group block"
                >
                  <div className="flex items-baseline gap-3">
                    <span className="label" style={{ color: "var(--accent)" }}>
                      {p.year}
                    </span>
                    <h3 className="text-[1rem] leading-snug transition-colors group-hover:text-[var(--accent)]">
                      {p.title}
                    </h3>
                  </div>
                  <p
                    className="mt-2 text-[0.875rem] leading-relaxed"
                    style={{ color: "var(--muted)" }}
                  >
                    {p.venue}
                  </p>
                  <p className="label mt-2" style={{ color: "var(--faint)" }}>
                    DOI {p.doi} ↗
                  </p>
                </a>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
