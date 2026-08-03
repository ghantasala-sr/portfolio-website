import { now } from "@/content/skills";
import { SectionHead } from "@/components/ui/SectionHead";
import { Reveal } from "@/components/ui/Reveal";

export function NowSection() {
  return (
    <section className="shell py-20">
      <SectionHead
        index="07"
        label="Now"
        title="What I'm building this month"
        action={
          <span className="label" style={{ color: "var(--accent)" }}>
            Updated {now.updated}
          </span>
        }
      />

      <dl className="grid gap-x-16 gap-y-10 md:grid-cols-2">
        {now.items.map((item, i) => (
          <Reveal key={item.label} delay={i * 0.05}>
            <dt className="label mb-3" style={{ color: "var(--accent)" }}>
              {item.label}
            </dt>
            <dd className="text-[0.9375rem] leading-relaxed text-text-dim">
              {item.body}
              {item.href && (
                <>
                  {" "}
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    data-cursor="link"
                    className="whitespace-nowrap border-b transition-colors hover:text-text"
                    style={{ borderColor: "var(--accent)" }}
                  >
                    Source ↗
                  </a>
                </>
              )}
            </dd>
          </Reveal>
        ))}
      </dl>
    </section>
  );
}
