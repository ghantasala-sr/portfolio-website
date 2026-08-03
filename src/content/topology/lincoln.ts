import type { Topology } from "./types";

/**
 * The 5-stage pipeline plus the two validators that branch off stage 3.
 * The validators are the point of the project, so they get equal visual
 * weight to the main path rather than being drawn as a footnote.
 */
export const lincolnTopology: Topology = {
  id: "lincoln",
  width: 1180,
  height: 520,
  groups: [
    {
      id: "validate",
      label: "Validating the judge · the half most pipelines skip",
      x: 700,
      y: 300,
      width: 440,
      height: 190,
    },
  ],
  nodes: [
    { id: "loc", label: "Library of Congress", meta: "primary, what Lincoln wrote", x: 70, y: 90, kind: "source", key: true },
    { id: "gut", label: "Project Gutenberg", meta: "secondary, what biographers said", x: 70, y: 230, kind: "source", key: true },
    { id: "norm", label: "Normalise", meta: "scrape → data/normalized", x: 250, y: 160, kind: "compute" },

    { id: "retrieve", label: "Hybrid retrieval", meta: "alpha 0.7 · BM25 + embeddings", x: 400, y: 160, kind: "compute", key: true },
    { id: "extract", label: "Extract claims", meta: "Gemini 2.5 Flash · 5 events", x: 550, y: 160, kind: "model", key: true },

    { id: "judge", label: "DSPy judge", meta: "factual / interpretive / omission", x: 720, y: 160, kind: "model", key: true },
    { id: "scores", label: "Consistency scores", meta: "score · contradictions · confidence", x: 890, y: 160, kind: "store" },
    { id: "dash", label: "Streamlit dashboard", x: 1060, y: 90, kind: "sink" },

    { id: "kappa", label: "Kappa vs humans", meta: "0.41 moderate · 0.80 raw · n=10", x: 810, y: 370, kind: "observe", key: true },
    { id: "selfcon", label: "Self-consistency", meta: "same pair ×5 at temp 0.7", x: 810, y: 450, kind: "observe", key: true },
    { id: "prompts", label: "Prompt bake-off", meta: "by score variance", x: 1040, y: 410, kind: "observe", key: true },
  ],
  edges: [
    { from: "loc", to: "norm", kind: "data" },
    { from: "gut", to: "norm", kind: "data" },
    { from: "norm", to: "retrieve", kind: "data" },
    { from: "retrieve", to: "extract", kind: "sync" },
    { from: "extract", to: "judge", kind: "sync" },
    { from: "judge", to: "scores", kind: "data" },
    { from: "scores", to: "dash", kind: "data" },

    { from: "judge", to: "kappa", kind: "async", bend: -60 },
    { from: "judge", to: "selfcon", kind: "async", bend: -110 },
    { from: "kappa", to: "prompts", kind: "async" },
  ],
  flow: ["loc", "norm", "retrieve", "extract", "judge", "kappa"],
};

/** Committed in data/evaluated/kappa_report.json. */
export const lincolnKappa = {
  kappa: 0.4117647058823530,
  rawAgreement: 0.8,
  threshold: 50,
  interpretation: "Moderate agreement",
  n: 10,
  caveat:
    "The judge called 2 of 3 human-negative pairs consistent. It under-detects exactly the contradictions the system exists to find.",
} as const;
