export type Lane =
  | "agentic-ai"
  | "data-eng"
  | "infra"
  | "ml-eval"
  | "full-stack"
  | "teaching";

export const LANES: { id: Lane; label: string; blurb: string }[] = [
  {
    id: "agentic-ai",
    label: "Agentic AI",
    blurb: "Multi-agent orchestration, routing, tool use, approval gates",
  },
  {
    id: "data-eng",
    label: "Data Engineering",
    blurb: "ELT into warehouses, layered transforms, lineage, quality",
  },
  {
    id: "infra",
    label: "Infrastructure",
    blurb: "IaC, distributed systems, observability, failure isolation",
  },
  {
    id: "ml-eval",
    label: "ML & Evaluation",
    blurb: "Model training, LLM-as-judge harnesses, judge validation",
  },
  {
    id: "full-stack",
    label: "Full-Stack",
    blurb: "Product surfaces, APIs, payments, client apps",
  },
  {
    id: "teaching",
    label: "Teaching",
    blurb: "Course material authored for graduate engineers",
  },
];

/** A number I can point at in a repo. */
export interface VerifiedFact {
  value: string;
  label: string;
  /** Where in the repo this is verifiable. Rendered as a tooltip/detail so
   *  the claim carries its own citation. */
  source: string;
}

export interface DesignDecision {
  title: string;
  body: string;
}

export interface CaseStudy {
  /** The problem, in plain terms. */
  problem: string;
  /** What the system does, one paragraph. */
  approach: string;
  decisions: DesignDecision[];
  learned: string;
}

export interface Project {
  slug: string;
  name: string;
  /** One line, sentence case, no period. */
  tagline: string;
  /** 2-4 sentences for the card and the case-study intro. */
  summary: string;
  lanes: Lane[];
  /** Primary lane, used for the index default sort and the glyph accent. */
  lane: Lane;
  stack: string[];
  /** Verified metrics only. Empty array is fine and honest. */
  facts: VerifiedFact[];
  repo?: string;
  live?: string;
  /** Year or range, for the index. */
  period: string;
  /** Team context, when not solo. Rendered verbatim. */
  team?: string;
  /** Featured on the home page. */
  featured?: boolean;
  /** Has a hand-authored topology module + animated diagram. */
  hasDiagram?: boolean;
  caseStudy?: CaseStudy;
}

export interface ExperienceRole {
  org: string;
  title: string;
  location: string;
  period: string;
  /** Optional repo backing the role's claims. */
  artifact?: { label: string; href: string };
  bullets: string[];
  /** Extra structured detail, e.g. the DAMG lab list. */
  detail?: { heading: string; items: { name: string; body: string }[] };
}

export interface Education {
  org: string;
  degree: string;
  focus?: string;
  location: string;
  period: string;
  gpa: string;
}

export interface Publication {
  title: string;
  authors: string;
  /** Emphasised author index within `authors`, matched literally. */
  me: string;
  venue: string;
  year: string;
  doi: string;
  href: string;
  note?: string;
}

export interface SkillGroup {
  label: string;
  items: string[];
}
