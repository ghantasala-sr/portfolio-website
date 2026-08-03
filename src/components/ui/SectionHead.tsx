import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

/**
 * Numbered section header. The mono index plus a hairline rule is the
 * structural device that carries hierarchy across the whole site, so it lives
 * in one place.
 */
export function SectionHead({
  index,
  label,
  title,
  intro,
  action,
}: {
  index: string;
  label: string;
  title?: ReactNode;
  intro?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-10">
      <Reveal className="mb-6 flex items-baseline gap-4 border-b border-line pb-3">
        <span className="label" style={{ color: "var(--accent)" }}>
          {index}
        </span>
        <span className="label">{label}</span>
        {action && <span className="ml-auto">{action}</span>}
      </Reveal>

      {title && (
        <Reveal as="h2" className="text-d2 max-w-[30ch]">
          {title}
        </Reveal>
      )}

      {intro && (
        <Reveal
          as="p"
          delay={0.08}
          className="prose-measure mt-6 text-[1.0625rem] leading-relaxed text-text-dim"
        >
          {intro}
        </Reveal>
      )}
    </div>
  );
}
