import type { Topology } from "./types";
import { adsightTopology } from "./adsight";
import { gatekeeperTopology } from "./gatekeeper";
import { gatekeeperEnclaveTopology } from "./gatekeeperEnclave";
import { voicedeskTopology } from "./voicedesk";
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
  gatekeeper: gatekeeperTopology,
  "gatekeeper-enclave": gatekeeperEnclaveTopology,
  voicedesk: voicedeskTopology,
  adsight: adsightTopology,
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
export { adsightRender } from "./adsight";
export { gatekeeperLayers } from "./gatekeeper";
export { enclaveDrills } from "./gatekeeperEnclave";
export { voicedeskResults } from "./voicedesk";
export { observeaiScenarios } from "./observeai";
export { cloudtaskSecurityChain } from "./cloudtask";
export { lincolnKappa } from "./lincoln";
export { docintelLevels, docintelAgentTopology } from "./docintel";
export { mealmindEltTopology, mealmindAgentTopology } from "./mealmind";
