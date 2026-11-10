import type { Topology } from "./types";

/**
 * The sealed deployment. The shape worth seeing is what is absent: there is no
 * NAT, no internet route and no external IP anywhere on this diagram, so the
 * only way out of the network is Google's restricted API range, and the only
 * way in is an IAP tunnel to a bastion.
 *
 * That constraint is what forces the two unusual edges. Releases cannot be
 * downloaded, so they arrive as one checksummed offline bundle. And the model
 * cannot be a public API, which is why this deployment runs Gemini on Vertex
 * while the application repo runs Claude over the open internet.
 */
export const gatekeeperEnclaveTopology: Topology = {
  id: "gatekeeper-enclave",
  width: 1080,
  height: 580,
  groups: [
    {
      id: "sealed",
      label: "No internet route · no NAT · no external IP",
      x: 250,
      y: 70,
      width: 420,
      height: 440,
    },
  ],
  nodes: [
    { id: "operator", label: "Operator", meta: "IAP tunnel only", x: 110, y: 90, kind: "source", key: true },
    { id: "bundle", label: "Offline bundle", meta: "checksums · signatures", x: 110, y: 230, kind: "source", key: true },
    { id: "bastion", label: "Bastion", meta: "no external IP", x: 330, y: 160, kind: "compute", key: true },
    { id: "gw", label: "Internal HTTPS", meta: "private CA", x: 560, y: 160, kind: "compute" },
    { id: "gke", label: "Private GKE", meta: "signed images only", x: 560, y: 320, kind: "compute", key: true },
    { id: "sql", label: "Cloud SQL 17", meta: "private IP only", x: 560, y: 470, kind: "store", key: true },
    { id: "sm", label: "Secret Manager", meta: "mounted as files", x: 880, y: 160, kind: "store" },
    { id: "vertex", label: "Vertex AI Gemini", meta: "restricted range", x: 880, y: 320, kind: "model", key: true },
    { id: "egress", label: "Deny-all egress", meta: "alert in ~3.5 min", x: 880, y: 470, kind: "observe", key: true },
  ],
  edges: [
    { from: "operator", to: "bastion", kind: "sync" },
    { from: "bundle", to: "bastion", kind: "data" },
    { from: "bastion", to: "gw", kind: "sync" },
    { from: "gw", to: "gke", kind: "sync" },
    { from: "gke", to: "sql", kind: "sync" },
    { from: "sm", to: "gke", kind: "data" },
    { from: "gke", to: "vertex", kind: "sync" },
    { from: "gke", to: "egress", kind: "dlq" },
  ],
  flow: ["bundle", "bastion", "gw", "gke", "sql"],
};

/**
 * The drill table, from docs/drills/. Dates and figures are the repo's own.
 *
 * Two of these passed on a second attempt and say so in their write-up, which
 * is the part worth keeping: a drill that never failed has not told you much.
 */
export const enclaveDrills = [
  { claim: "Nothing reaches the internet", test: "Google, Anthropic, Hugging Face and PyPI, from the bastion and from pods", result: "All blocked and logged. Google APIs still reachable." },
  { claim: "An escape attempt is noticed", test: "One egress attempt from a pod", result: "Alert raised about 3 and a half minutes later." },
  { claim: "The infrastructure cannot drift open", test: "A guard over every Terraform plan", result: "Fails on any NAT, internet route, external IP or public endpoint." },
  { claim: "Tenant isolation holds inside", test: "The full suite in the Enclave, plus live checks with the real model", result: "258 passed, and 21 of 21 live checks stayed inside tenant and clearance." },
  { claim: "Upgrades do not drop requests", test: "Upgrade and rollback under load", result: "Zero failed requests, on the second attempt. The first failed and was fixed." },
  { claim: "Losing a node or the primary is survivable", test: "Node drain under load, then a Cloud SQL failover", result: "Zero failed requests, no restarts. Also a second attempt." },
  { claim: "Data can be recovered", test: "Point-in-time restore after a deletion", result: "Back in 24 minutes against a 60-minute target, losing about 5 seconds." },
  { claim: "Only signed images run", test: "A tampered image pushed under the release's own tag", result: "Refused by Binary Authorization, and the refusal is in the log." },
  { claim: "Keys rotate without logging anyone out", test: "A signing-key rotation with live sessions", result: "Sessions kept working. The operator retired the old key early; the script now refuses." },
  { claim: "An operator can recover fast", test: "Three failures at once, runbook only", result: "All fixed in 11 minutes 54 seconds, 9 of which exposed a runbook gap." },
] as const;
