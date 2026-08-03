import { SectionHead } from "@/components/ui/SectionHead";
import { Reveal } from "@/components/ui/Reveal";
import { skills } from "@/content/skills";

/**
 * The full stack, on the home page, dense.
 *
 * Two columns of label + inline comma-free list. Deliberately not pills or
 * badges: 120-odd chips is visual noise, and the point here is scannable
 * coverage, not decoration.
 */
export function SkillsGrid() {
  return (
    <section className="shell py-20">
      <SectionHead
        index="05"
        label="Stack"
        title="What I actually use"
        intro="Everything here appears in at least one linked repository. Ordered by how central it is to the work on this site, not alphabetically."
      />

      <dl className="grid gap-x-14 gap-y-0 md:grid-cols-2">
        {skills.map((group, i) => (
          <Reveal
            key={group.label}
            delay={(i % 2) * 0.05}
            className="border-t border-line py-5"
          >
            <dt className="label mb-2.5" style={{ color: "var(--accent)" }}>
              {group.label}
            </dt>
            <dd className="flex flex-wrap gap-x-2.5 gap-y-1">
              {group.items.map((item, j) => (
                <span key={item} className="text-[0.9375rem] leading-relaxed">
                  <span style={{ color: "var(--text-dim)" }}>{item}</span>
                  {j < group.items.length - 1 && (
                    // Non-breaking space, so the separator cannot wrap onto a
                    // line of its own after a long entry like the AWS/GCP lists.
                    <span aria-hidden="true" style={{ color: "var(--faint)" }}>
                      {"\u00a0\u00b7"}
                    </span>
                  )}
                </span>
              ))}
            </dd>
          </Reveal>
        ))}
      </dl>
    </section>
  );
}
