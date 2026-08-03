const EMAIL = "srinivasarithik23@gmail.com";

export const profile = {
  name: "Srinivasa Rithik Ghantasala",
  shortName: "Rithik",
  initials: "SRG",

  /** Three lines; the third renders muted + italic. */
  headline: ["Software Engineer.", "AI systems, data pipelines,"] as const,
  headlineTail: "and the harnesses that keep them honest.",

  subhead:
    "MS Information Systems, Northeastern University. Based in Boston. I build event-driven multi-agent systems, warehouse pipelines, and the evaluation harnesses that make non-deterministic systems measurable.",

  status: {
    label: "Open to new grad & mid-level roles",
    available: true,
  },

  location: "Boston, MA",
  relocation: "Open to relocation",

  email: EMAIL,
  phone: "+1 (617) 609-9554",

  links: {
    github: "https://github.com/ghantasala-sr",
    linkedin: "https://linkedin.com/in/srithik",
  },

  /**
   * No PDF is published. The résumé goes out on request, so every prompt for it
   * is a prefilled email rather than a download: it starts a conversation, and
   * it means there is no stale copy of my CV sitting on a public URL being
   * indexed after I have moved on.
   */
  resumeOnRequest: {
    label: "On request",
    href:
      `mailto:${EMAIL}` +
      "?subject=" + encodeURIComponent("Résumé request") +
      "&body=" + encodeURIComponent(
        "Hi Rithik,\n\nCould you send over your résumé?\n\n",
      ),
  },

  /** ~50 words. */
  aboutShort:
    "I work across AI systems, data engineering, and backend infrastructure. Most of what I build sits at the intersection: event-driven multi-agent architectures, retrieval over messy real-world documents, and warehouse pipelines with the quality checks that keep downstream numbers trustworthy.",

  /** ~120 words. */
  aboutMedium:
    "I am a software engineer focused on applied AI, data engineering, and backend systems. I completed my MS in Information Systems at Northeastern University, after a BTech in Computer Science (Data Science) with a Cybersecurity minor.\n\nMost of what I build sits at the intersection of AI and infrastructure: event-driven multi-agent systems, retrieval pipelines over messy real-world documents, and warehouse pipelines with the quality checks that keep downstream numbers trustworthy. I care about the unglamorous parts (evaluation, observability, failure isolation), because those are what separate a system that demos well from one that survives contact with production.\n\nI use AI coding tools as a daily practice rather than a novelty, and I have opinions about where they help and where they get in the way.",

  /** ~250 words, /about. */
  aboutLong: [
    "I am a software engineer working across applied AI, data engineering, and backend systems.",
    "I completed my Master of Science in Information Systems at Northeastern University in May 2026, after earning a BTech in Computer Science with a Data Science specialization and a minor in Cybersecurity from CVR College of Engineering.",
    "My work tends to land in one of three places. The first is agentic AI systems: event-driven architectures where specialist agents handle different parts of a problem in parallel, with routing, tool integration, and human approval gates where autonomy is not appropriate. The second is data engineering: ELT pipelines that land messy source data into warehouses through layered transformations with schema constraints and lineage you can actually trace. The third is the connective tissue between them, the evaluation harnesses, observability, and guardrails that make non-deterministic systems measurable and safe enough to trust.",
    "Earlier, as a machine learning research assistant, I published two peer-reviewed papers on network threat detection. That work shaped how I think about evaluation: a number is only meaningful if you can explain what it does and does not tell you. It is also why, when I built an LLM-as-judge pipeline, I spent as much effort validating the judge against human labels as I did on the judge itself, and reported the disagreement rather than hiding it.",
    "I work with AI coding tools daily, primarily Claude Code and Codex. I treat them as force multipliers on well-understood patterns and slow down deliberately where correctness depends on judgment.",
    "I am based in Boston and open to relocation.",
  ],
} as const;

/** Engineering principles, the "How I work" section. */
export const principles = [
  {
    n: "01",
    title: "Fix the process before automating it",
    body: "An automated bad process is a faster bad process. On MyClaw I redesigned the manual workflow for correctness first, then built the agentic layer on top of something that already worked.",
  },
  {
    n: "02",
    title: "Evaluation is infrastructure, not an afterthought",
    body: "Non-deterministic systems need harnesses the way deterministic ones need tests. That means curated cases, a scoring rubric, and a scheduled job that catches regressions, plus validating the judge itself against human labels before trusting its numbers.",
  },
  {
    n: "03",
    title: "Failure isolation over monolithic design",
    body: "Argus gives every specialist agent its own queue and its own dead-letter queue, so one slow reviewer cannot stall a review. Independent failure domains beat a single prompt that does everything.",
  },
  {
    n: "04",
    title: "If you cannot see it, you cannot operate it",
    body: "Trace context that survives a Kafka boundary, structured logs carrying trace IDs, and alerts on the signal that matters: one user failing five times is not the same incident as five users failing once.",
  },
  {
    n: "05",
    title: "Claim only what you can show",
    body: "Every number on this site is one I can point at in a repo. Where I have not measured something yet, I say so instead of estimating.",
  },
] as const;
