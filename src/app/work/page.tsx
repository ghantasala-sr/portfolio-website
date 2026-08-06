import type { Metadata } from "next";
import { projects } from "@/content/projects";
import {
  diagramCount,
  projectCount,
  spellOut,
} from "@/content/counts";
import { WorkIndex } from "@/components/work/WorkIndex";

export const metadata: Metadata = {
  title: "Work",
  description: `${spellOut(projectCount)} shipped projects across agentic AI, data engineering, infrastructure, evaluation and full-stack, each linking to its source.`,
};

export default function WorkPage() {
  return (
    <div className="shell pb-24 pt-36">
      <header className="mb-14">
        <p className="label mb-6">Index</p>
        <h1 className="text-d2 max-w-[26ch]">
          {spellOut(projectCount)} projects, all with public source
        </h1>
        <p className="prose-measure mt-6 text-[1.0625rem] leading-relaxed text-text-dim">
          Ordered newest first. {spellOut(diagramCount)} have full case studies
          with animated architecture diagrams drawn from the code rather than
          the README because on more than one of these, the README and the code
          disagree, and the code wins.
        </p>
      </header>

      <WorkIndex projects={projects} />
    </div>
  );
}
