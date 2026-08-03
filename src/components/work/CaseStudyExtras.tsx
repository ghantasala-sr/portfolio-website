import {
  observeaiScenarios,
  cloudtaskSecurityChain,
  lincolnKappa,
  docintelLevels,
  mealmindAgentTopology,
} from "@/content/topology";
import { SectionHead } from "@/components/ui/SectionHead";
import { Reveal } from "@/components/ui/Reveal";
import { ArchitectureDiagram } from "@/components/diagram/ArchitectureDiagram";
import { experience } from "@/content/experience";

/**
 * Per-project detail that only makes sense for one project, the twelve
 * scenarios, the security-group chain, the kappa report, the level log.
 * Keeping these here means the case-study template stays generic.
 */
export function CaseStudyExtras({ slug }: { slug: string }) {
  switch (slug) {
    // MealMind has two architectures that share almost nothing, a warehouse
    // pipeline and an agent graph. The main diagram covers the pipeline; the
    // routing graph gets its own, rather than being forced into one picture.
    case "mealmind":
      return (
        <section className="shell py-16">
          <SectionHead
            index="03"
            label="The agent half"
            title="One router, four specialists, one tool boundary"
            intro="Preferences load from the warehouse before anything is planned, every specialist reaches Snowflake through the same MCP server rather than querying it directly, and a feedback agent writes corrections back so the next run starts from them."
          />
          <ArchitectureDiagram
            topo={mealmindAgentTopology}
            caption="MealMind. LangGraph routing. The edge back from the feedback agent to the router is what makes this an assistant rather than a one-shot generator."
          />
        </section>
      );

    case "observeai":
      return (
        <section className="shell py-16">
          <SectionHead
            index="03"
            label="Failure scenarios"
            title="Twelve ways to break it on purpose"
            intro="Each is a named, triggerable code path rather than something you cause by hand. The point of the system is that the telemetry explains what happened."
          />
          <Reveal className="overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-line">
                  <th className="label pb-3 pr-4 font-medium">Scenario</th>
                  <th className="label pb-3 pr-4 font-medium">Injects</th>
                  <th className="label pb-3 font-medium">Expects</th>
                </tr>
              </thead>
              <tbody>
                {observeaiScenarios.map((s) => (
                  <tr key={s.id} className="border-b border-line">
                    <td className="py-3 pr-4 text-[0.9375rem]">{s.label}</td>
                    <td
                      className="py-3 pr-4 font-mono text-[0.8125rem]"
                      style={{ color: "var(--text-dim)" }}
                    >
                      {s.injects}
                    </td>
                    <td
                      className="py-3 font-mono text-[0.8125rem]"
                      style={{
                        color:
                          s.expect === "200"
                            ? "var(--accent)"
                            : "var(--warn)",
                      }}
                    >
                      {s.expect}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
        </section>
      );

    case "cloudtask":
      return (
        <section className="shell py-16">
          <SectionHead
            index="03"
            label="Security chain"
            title="Five groups, each admitting only the tier before it"
            intro="Every rule names the previous tier's security group as its source rather than a CIDR block, so the chain holds as subnets change. Note that this is ingress only, all five groups allow unrestricted egress."
          />
          <Reveal>
            <ol className="space-y-0">
              {cloudtaskSecurityChain.map((s, i) => (
                <li
                  key={s.sg}
                  className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-line py-4"
                  style={{ paddingLeft: `${i * 1.5}rem` }}
                >
                  <span
                    className="font-mono text-[0.8125rem]"
                    style={{ color: "var(--accent)" }}
                  >
                    {s.sg}
                  </span>
                  <span className="label">allows {s.allows}</span>
                  <span className="label" style={{ color: "var(--faint)" }}>
                    from {s.from}
                  </span>
                </li>
              ))}
            </ol>
          </Reveal>
        </section>
      );

    case "lincoln-judge-evals":
      return (
        <section className="shell py-16">
          <SectionHead
            index="03"
            label="Judge validation"
            title="The number I am most willing to defend, because it is mediocre"
            intro="Ten pairs were labelled by hand and compared against the judge's verdicts. Reporting the kappa rather than the raw agreement is the whole point, raw agreement flatters a judge that mostly says yes."
          />
          <Reveal className="grid gap-x-8 gap-y-10 sm:grid-cols-3">
            <div>
              <p
                className="font-display text-[clamp(2.5rem,5vw,4rem)] font-semibold leading-none tracking-tight"
                style={{ color: "var(--accent)" }}
              >
                {lincolnKappa.kappa.toFixed(2)}
              </p>
              <p className="label mt-3">Cohen&apos;s kappa</p>
              <p className="label mt-1" style={{ color: "var(--faint)" }}>
                {lincolnKappa.interpretation}
              </p>
            </div>
            <div>
              <p
                className="font-display text-[clamp(2.5rem,5vw,4rem)] font-semibold leading-none tracking-tight"
                style={{ color: "var(--muted)" }}
              >
                {lincolnKappa.rawAgreement.toFixed(2)}
              </p>
              <p className="label mt-3">Raw agreement</p>
              <p className="label mt-1" style={{ color: "var(--faint)" }}>
                the misleading one
              </p>
            </div>
            <div>
              <p
                className="font-display text-[clamp(2.5rem,5vw,4rem)] font-semibold leading-none tracking-tight"
                style={{ color: "var(--muted)" }}
              >
                {lincolnKappa.n}
              </p>
              <p className="label mt-3">Human-labelled pairs</p>
              <p className="label mt-1" style={{ color: "var(--faint)" }}>
                small, wide confidence intervals
              </p>
            </div>
          </Reveal>
          <Reveal
            delay={0.08}
            className="mt-10 flex gap-4 border-l-2 border-l-[var(--warn)] pl-6"
          >
            <p className="prose-measure text-[0.9375rem] leading-relaxed text-text-dim">
              <span className="label" style={{ color: "var(--warn)" }}>
                The failure mode ·{" "}
              </span>
              {lincolnKappa.caveat}
            </p>
          </Reveal>
        </section>
      );

    case "docintel":
      return (
        <section className="shell py-16">
          <SectionHead
            index="03"
            label="Built in levels"
            title="Six levels, each with what broke recorded as it happened"
            intro="Building in stages rather than all at once meant each level failed in a specific way, and writing those down produced a more useful document than any diagram drawn up front."
          />
          <Reveal>
            <ol className="space-y-0">
              {docintelLevels.map((l) => (
                <li
                  key={l.level}
                  className="grid grid-cols-[3rem_1fr] gap-x-4 border-b border-line py-4 sm:grid-cols-[4rem_1fr_1.2fr] sm:gap-x-8"
                >
                  <span
                    className="font-mono text-[0.8125rem]"
                    style={{ color: "var(--accent)" }}
                  >
                    {l.level}
                  </span>
                  <span className="text-[0.9375rem]">{l.title}</span>
                  <span
                    className="col-start-2 mt-1 text-[0.875rem] sm:col-start-3 sm:mt-0"
                    style={{ color: "var(--muted)" }}
                  >
                    {l.note}
                  </span>
                </li>
              ))}
            </ol>
          </Reveal>
        </section>
      );

    case "damg-7374-labs": {
      const role = experience[0];
      if (!role.detail) return null;
      return (
        <section className="shell py-16">
          <SectionHead
            index="03"
            label={role.detail.heading}
            title="Warehouse fundamentals before any agent code"
            intro="Students who cannot trace a record through transformation layers cannot debug a retrieval pipeline either. Agentic failures look like magic until you can inspect the data underneath."
          />
          <Reveal>
            <ol className="space-y-0">
              {role.detail.items.map((item, i) => (
                <li
                  key={item.name}
                  className="grid gap-x-8 border-b border-line py-5 md:grid-cols-[1fr_1.4fr]"
                >
                  <h3 className="mb-2 text-[1rem] md:mb-0">
                    <span
                      className="mr-3 font-mono text-[0.6875rem]"
                      style={{ color: "var(--accent)" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {item.name}
                  </h3>
                  <p className="text-[0.9375rem] leading-relaxed text-text-dim">
                    {item.body}
                  </p>
                </li>
              ))}
            </ol>
          </Reveal>
        </section>
      );
    }

    default:
      return null;
  }
}
