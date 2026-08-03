import type { Topology } from "./types";
import { argusTopology } from "./argus";
import { observeaiTopology } from "./observeai";
import { secsignalTopology } from "./secsignal";
import { cloudtaskTopology } from "./cloudtask";
import { lincolnTopology } from "./lincoln";
import { docintelTopology } from "./docintel";
import { supportIntelTopology } from "./supportIntel";
// The agent topology is re-exported below rather than imported here; only the
// ELT one is keyed into the slug map.
import { mealmindEltTopology } from "./mealmind";
import {
  aideTopology,
  campusTopology,
  careiqTopology,
  damgTopology,
  datapilotTopology,
  glassboxTopology,
  myclawTopology,
  subscriptionTopology,
} from "./minor";

/** Keyed by project slug, so a card or page resolves its own topology. */
export const topologies: Record<string, Topology> = {
  argus: argusTopology,
  observeai: observeaiTopology,
  secsignal: secsignalTopology,
  cloudtask: cloudtaskTopology,
  "lincoln-judge-evals": lincolnTopology,
  docintel: docintelTopology,
  "support-intel": supportIntelTopology,
  glassbox: glassboxTopology,
  mealmind: mealmindEltTopology,
  careiq: careiqTopology,
  datapilot: datapilotTopology,
  myclaw: myclawTopology,
  aide: aideTopology,
  "campus-vitality": campusTopology,
  "subscription-manager": subscriptionTopology,
  "damg-7374-labs": damgTopology,
};

export function getTopology(slug: string): Topology | undefined {
  return topologies[slug];
}

export * from "./types";
export { observeaiScenarios } from "./observeai";
export { cloudtaskSecurityChain } from "./cloudtask";
export { lincolnKappa } from "./lincoln";
export { docintelLevels } from "./docintel";
export { mealmindEltTopology, mealmindAgentTopology } from "./mealmind";
