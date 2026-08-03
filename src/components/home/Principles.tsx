import { principles } from "@/content/profile";
import { SectionHead } from "@/components/ui/SectionHead";
import { Reveal } from "@/components/ui/Reveal";

export function Principles() {
  return (
    <section className="shell py-20">
      <SectionHead
        index="04"
        label="How I work"
        title="Five things I believe about building systems that hold up"
      />

      <ol className="grid gap-x-16 gap-y-12 md:grid-cols-2">
        {principles.map((p, i) => (
          <Reveal
            as="li"
            key={p.n}
            delay={i * 0.05}
            className="border-t border-line pt-6"
          >
            <div className="mb-4 flex items-baseline gap-3">
              <span className="label" style={{ color: "var(--accent)" }}>
                {p.n}
              </span>
              <h3 className="text-[1.25rem] leading-snug">{p.title}</h3>
            </div>
            <p className="text-[0.9375rem] leading-relaxed text-text-dim">
              {p.body}
            </p>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}
