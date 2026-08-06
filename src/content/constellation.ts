import { projects } from "./projects";
import { LANES, type Lane } from "./types";

/**
 * The repo constellation on /about, derived entirely from the project data.
 * No new source, nothing to keep in sync.
 *
 * Nodes are repositories, clustered by lane and sized by stack breadth. Edges
 * are shared tooling, but weighted by how RARE the shared technology is.
 *
 * Rarity weighting is the whole trick. Twelve of seventeen projects use Python and
 * seven use FastAPI, so an unweighted overlap connects almost everything and
 * says nothing: "Argus relates to SecSignal because both use Python" is noise.
 * Weighting each shared technology by log(N / count) means ClickHouse and SigNoz
 * (two projects each) dominate while Python contributes almost nothing, and what
 * surfaces are the real affinities: the two observability stacks, the two
 * Snowflake-native agent systems, the two GCP-with-Terraform services.
 *
 * Everything here is deterministic. No Math.random, so the server and client
 * markup match exactly.
 */

/** Strip parenthetical detail so "AWS (Lambda, SNS)" matches "AWS". */
function normalise(tech: string): string {
  return tech.replace(/\s*\(.*?\)/g, "").trim().toLowerCase();
}

export interface ConstellationNode {
  slug: string;
  name: string;
  lane: Lane;
  laneLabel: string;
  /** Position in a 0..1000 square. */
  x: number;
  y: number;
  /** Node radius, from stack breadth. */
  r: number;
  stackCount: number;
  degree: number;
}

export interface ConstellationLane {
  id: Lane;
  label: string;
  count: number;
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
}

export interface ConstellationEdge {
  from: string;
  to: string;
  /** Rarity-weighted overlap. */
  weight: number;
  /** The shared technologies, rarest first. Used in the hover readout. */
  shared: string[];
}

const VIEW = 1000;
/** Lane label size, in viewBox units. Shared with the renderer. */
const LANE_FONT = 24;
/** Kept edges. Enough to show structure without becoming a hairball. */
const MAX_EDGES = 20;

function build(): {
  nodes: ConstellationNode[];
  edges: ConstellationEdge[];
  lanes: ConstellationLane[];
  view: number;
  viewBox: string;
  laneFont: number;
} {
  const n = projects.length;

  // Document frequency per technology.
  const df = new Map<string, number>();
  for (const p of projects) {
    for (const tech of new Set(p.stack.map(normalise))) {
      df.set(tech, (df.get(tech) ?? 0) + 1);
    }
  }
  const idf = (tech: string) => Math.log(n / (df.get(tech) ?? n));

  // Candidate edges, strongest first.
  const candidates: ConstellationEdge[] = [];
  for (let i = 0; i < projects.length; i++) {
    for (let j = i + 1; j < projects.length; j++) {
      const a = projects[i];
      const b = projects[j];
      const bStack = new Set(b.stack.map(normalise));
      const shared = [...new Set(a.stack.map(normalise))].filter((t) =>
        bStack.has(t),
      );
      if (shared.length === 0) continue;
      const weight = shared.reduce((sum, t) => sum + idf(t), 0);
      candidates.push({
        from: a.slug,
        to: b.slug,
        weight,
        shared: shared.sort((x, y) => idf(y) - idf(x)),
      });
    }
  }
  candidates.sort((x, y) => y.weight - x.weight);
  const edges = candidates.slice(0, MAX_EDGES);

  const present = LANES.filter((l) => projects.some((p) => p.lane === l.id));
  const laneOf = new Map(projects.map((p) => [p.slug, p.lane]));

  /**
   * Order the lane clusters around the ring so that strongly-linked lanes end up
   * adjacent. Laid out in declaration order the ring puts teaching opposite data
   * engineering, and since those two share Snowflake and dbt the edge cut
   * straight across the middle; enough of those and the graph is a hairball.
   *
   * Six lanes means only 60 distinct circular orderings (fixing the first and
   * ignoring reflection), so brute force is both exact and instant. Cost is the
   * cross-lane edge weight multiplied by the ring distance it has to span.
   */
  const laneAffinity = new Map<string, number>();
  for (const e of edges) {
    const a = laneOf.get(e.from)!;
    const b = laneOf.get(e.to)!;
    if (a === b) continue;
    const key = [a, b].sort().join("|");
    laneAffinity.set(key, (laneAffinity.get(key) ?? 0) + e.weight);
  }

  const ringCost = (order: Lane[]) => {
    let cost = 0;
    for (const [key, w] of laneAffinity) {
      const [a, b] = key.split("|") as [Lane, Lane];
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      if (ia < 0 || ib < 0) continue;
      const raw = Math.abs(ia - ib);
      cost += w * Math.min(raw, order.length - raw);
    }
    return cost;
  };

  const permute = <T,>(items: T[]): T[][] =>
    items.length <= 1
      ? [items]
      : items.flatMap((item, i) =>
          permute([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [
            item,
            ...rest,
          ]),
        );

  const [head, ...tail] = present.map((l) => l.id);
  let bestOrder = present.map((l) => l.id);
  let bestCost = Infinity;
  for (const rest of permute(tail)) {
    const order = [head, ...rest];
    const cost = ringCost(order);
    if (cost < bestCost) {
      bestCost = cost;
      bestOrder = order;
    }
  }

  const laneCentre = new Map<Lane, { x: number; y: number; angle: number }>();
  bestOrder.forEach((laneId, i) => {
    const angle = (i / bestOrder.length) * Math.PI * 2 - Math.PI / 2;
    laneCentre.set(laneId, {
      x: VIEW / 2 + Math.cos(angle) * VIEW * 0.27,
      y: VIEW / 2 + Math.sin(angle) * VIEW * 0.27,
      angle,
    });
  });

  const degree = new Map<string, number>();
  for (const e of edges) {
    degree.set(e.from, (degree.get(e.from) ?? 0) + 1);
    degree.set(e.to, (degree.get(e.to) ?? 0) + 1);
  }

  const nodes: ConstellationNode[] = [];
  for (const lane of present) {
    const members = projects.filter((p) => p.lane === lane.id);
    const c = laneCentre.get(lane.id)!;
    members.forEach((p, k) => {
      // Members sit on a small ring around their lane centre. A single member
      // sits exactly on it; the ring grows with the group so nothing overlaps.
      const spread = members.length === 1 ? 0 : VIEW * (0.045 + members.length * 0.014);
      const angle = (k / Math.max(1, members.length)) * Math.PI * 2 + lane.id.length;
      nodes.push({
        slug: p.slug,
        name: p.name,
        lane: lane.id,
        laneLabel: lane.label,
        x: c.x + Math.cos(angle) * spread,
        y: c.y + Math.sin(angle) * spread,
        r: 9 + (p.stack.length - 4) * 1.15,
        stackCount: p.stack.length,
        degree: degree.get(p.slug) ?? 0,
      });
    });
  }

  /**
   * Lane labels sit radially OUTSIDE their cluster, not on its centroid. On the
   * centroid they were printed underneath the nodes, which made both unreadable.
   */
  const lanes: ConstellationLane[] = bestOrder.map((laneId) => {
    const lane = present.find((l) => l.id === laneId)!;
    const members = nodes.filter((nd) => nd.lane === laneId);
    const c = laneCentre.get(laneId)!;
    const spread =
      members.length === 1 ? 0 : VIEW * (0.045 + members.length * 0.014);
    const push = spread + 62;
    return {
      id: laneId,
      label: lane.label,
      count: members.length,
      x: c.x + Math.cos(c.angle) * push,
      y: c.y + Math.sin(c.angle) * push,
      /** Grow the text away from the graph rather than back across it. */
      anchor:
        Math.cos(c.angle) > 0.35
          ? ("start" as const)
          : Math.cos(c.angle) < -0.35
            ? ("end" as const)
            : ("middle" as const),
    };
  });

  /**
   * The viewBox is derived from the content rather than fixed at 0..1000.
   *
   * Lane labels are pushed radially outside their clusters, so on the left and
   * right they extended past a 0..1000 box and were simply clipped: "DATA ENGI",
   * "INFRASTR". Measuring their extent and padding the box keeps the node ring
   * where it is while guaranteeing every label fits.
   *
   * Label width is estimated the same way the architecture diagrams do it:
   * JetBrains Mono advances about 0.6em, plus the 0.08em letter-spacing applied
   * when rendering.
   */
  const labelW = (text: string) => text.length * LANE_FONT * 0.68;
  let minX = 0;
  let minY = 0;
  let maxX = VIEW;
  let maxY = VIEW;

  for (const nd of nodes) {
    minX = Math.min(minX, nd.x - nd.r);
    maxX = Math.max(maxX, nd.x + nd.r);
    minY = Math.min(minY, nd.y - nd.r);
    maxY = Math.max(maxY, nd.y + nd.r);
  }
  for (const l of lanes) {
    const w = labelW(l.label);
    const left =
      l.anchor === "start" ? l.x : l.anchor === "end" ? l.x - w : l.x - w / 2;
    minX = Math.min(minX, left);
    maxX = Math.max(maxX, left + w);
    minY = Math.min(minY, l.y - LANE_FONT);
    maxY = Math.max(maxY, l.y + LANE_FONT * 0.4);
  }

  const pad = 16;
  const viewBox = [
    minX - pad,
    minY - pad,
    maxX - minX + pad * 2,
    maxY - minY + pad * 2,
  ]
    .map((v) => Math.round(v))
    .join(" ");

  return { nodes, edges, lanes, view: VIEW, viewBox, laneFont: LANE_FONT };
}

export const constellation = build();
export const constellationLanes = constellation.lanes;
