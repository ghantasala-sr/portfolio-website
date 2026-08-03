import Link from "next/link";
import { SectionHead } from "@/components/ui/SectionHead";
import { Reveal } from "@/components/ui/Reveal";
import { experience } from "@/content/experience";

/**
 * Compact experience on the home page.
 *
 * A recruiter should not have to click through to /about to find out where
 * he has worked. Two bullets per role here, the full list on /about.
 */
export function ExperienceStrip() {
  return (
    <section className="shell py-20">
      <SectionHead
        index="03"
        label="Experience"
        action={
          <Link
            href="/about"
            data-cursor="link"
            className="label transition-colors hover:text-text"
          >
            Full history →
          </Link>
        }
      />

      <ol>
        {experience.map((role, i) => (
          <Reveal
            as="li"
            key={`${role.org}-${role.title}`}
            delay={i * 0.05}
            className="grid gap-x-10 gap-y-3 border-t border-line py-7 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]"
          >
            <div>
              <h3 className="text-[1.0625rem] leading-snug">{role.title}</h3>
              <p className="mt-1.5 text-[0.9375rem] text-text-dim">{role.org}</p>
              <p className="label mt-2.5">
                {role.period} · {role.location}
              </p>
            </div>

            <div>
              <ul className="space-y-2.5">
                {role.bullets.slice(0, 2).map((b, j) => (
                  <li key={j} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-[0.55rem] h-1 w-1 shrink-0"
                      style={{ background: "var(--accent)" }}
                    />
                    <span className="text-[0.9375rem] leading-relaxed text-text-dim">
                      {b}
                    </span>
                  </li>
                ))}
              </ul>
              {role.artifact && (
                <a
                  href={role.artifact.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  data-cursor="link"
                  className="label mt-4 inline-block border-b pb-0.5 transition-opacity hover:opacity-70"
                  style={{
                    borderColor: "var(--accent)",
                    color: "var(--accent)",
                  }}
                >
                  {role.artifact.label} ↗
                </a>
              )}
            </div>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}
