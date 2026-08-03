/**
 * One topology definition per project, used for three things:
 *   1. the ~120×80 glyph on a project card
 *   2. the full scroll-scrubbed diagram on a case-study page
 *   3. cubic-Bézier control points, if a topology ever feeds a WebGL scene
 *
 * Everything derives from the same `nodes` + `edges`, so a diagram and its
 * glyph can never disagree about what the system looks like.
 *
 * Coordinates are in an abstract diagram space defined by `width`/`height`;
 * the SVG viewBox uses them directly and the glyph just scales them down.
 */

export type NodeKind =
  | "source" // external trigger: a webhook, a browser, an upload
  | "compute" // a service, function or agent
  | "queue" // a point-to-point queue
  | "topic" // a pub/sub fan-out point
  | "store" // database, warehouse, bucket
  | "model" // an LLM or ML model call
  | "sink" // terminal output
  | "observe"; // telemetry backend

export type EdgeKind =
  | "sync" // blocking request/response
  | "async" // message passing
  | "dlq" // dead-letter path
  | "data"; // bulk data movement

export interface TopoNode {
  id: string;
  label: string;
  x: number;
  y: number;
  kind: NodeKind;
  /** Second line: model name, table name, timeout. */
  meta?: string;
  /** Present on glyphs too. Others are diagram-only, to keep glyphs legible. */
  key?: boolean;
}

export interface TopoEdge {
  from: string;
  to: string;
  kind?: EdgeKind;
  /** Perpendicular offset of the curve's midpoint, in diagram units.
   *  Positive bends one way, negative the other. 0 is a flat S-curve. */
  bend?: number;
  label?: string;
}

/** A labelled boundary box. VPC, availability zone, dbt layer, subnet. */
export interface TopoGroup {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Dashed by default; solid reads as a harder boundary. */
  solid?: boolean;
}

export interface Topology {
  id: string;
  width: number;
  height: number;
  nodes: TopoNode[];
  edges: TopoEdge[];
  groups?: TopoGroup[];
  /** Ordered node ids a packet traverses for the animated flow. */
  flow?: string[];
}

export type Point = { x: number; y: number };

/** The four control points of an edge's cubic Bézier. */
export interface Bezier {
  p0: Point;
  c1: Point;
  c2: Point;
  p3: Point;
}

export function nodeMap(topo: Topology): Map<string, TopoNode> {
  return new Map(topo.nodes.map((n) => [n.id, n]));
}

/**
 * Cubic Bézier for an edge.
 *
 * Control points are pulled horizontally toward the midpoint, which gives a
 * flowchart S-curve when nodes are vertically offset, plus an optional
 * perpendicular bend for edges that need to route around something.
 *
 * Cubic Bézier specifically (and not Catmull-Rom), because Bézier is affine
 * in its control points, so `bezier(mix(A,B,m), t) === mix(bezier(A,t), bezier(B,t), m)`
 * exactly. That identity is what makes a morph a single lerp of 4 points
 * rather than a curve rebuild.
 */
export function bezierFor(
  edge: TopoEdge,
  nodes: Map<string, TopoNode>,
): Bezier | null {
  const a = nodes.get(edge.from);
  const b = nodes.get(edge.to);
  if (!a || !b) return null;

  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const bend = edge.bend ?? 0;

  // Perpendicular unit vector, for the bend offset.
  const len = Math.hypot(dx, dy) || 1;
  const px = -dy / len;
  const py = dx / len;

  // Mostly-horizontal flows read better with horizontal tangents; mostly
  // vertical ones with vertical tangents.
  const horizontal = Math.abs(dx) >= Math.abs(dy);
  const pull = horizontal ? Math.abs(dx) * 0.45 : Math.abs(dy) * 0.45;

  const c1: Point = horizontal
    ? { x: a.x + pull + px * bend, y: a.y + py * bend }
    : { x: a.x + px * bend, y: a.y + Math.sign(dy) * pull + py * bend };

  const c2: Point = horizontal
    ? { x: b.x - pull + px * bend, y: b.y + py * bend }
    : { x: b.x + px * bend, y: b.y - Math.sign(dy) * pull + py * bend };

  return { p0: { x: a.x, y: a.y }, c1, c2, p3: { x: b.x, y: b.y } };
}

/** SVG path `d` for one edge. */
export function edgePath(edge: TopoEdge, nodes: Map<string, TopoNode>): string {
  const b = bezierFor(edge, nodes);
  if (!b) return "";
  return `M ${r(b.p0.x)} ${r(b.p0.y)} C ${r(b.c1.x)} ${r(b.c1.y)}, ${r(b.c2.x)} ${r(b.c2.y)}, ${r(b.p3.x)} ${r(b.p3.y)}`;
}

/** All edge paths, in declaration order. */
export function edgePaths(topo: Topology): { edge: TopoEdge; d: string }[] {
  const nodes = nodeMap(topo);
  return topo.edges
    .map((edge) => ({ edge, d: edgePath(edge, nodes) }))
    .filter((e) => e.d.length > 0);
}

/** Evaluate a cubic Bézier at t. Used for packet positions along a path. */
export function bezierAt(b: Bezier, t: number): Point {
  const u = 1 - t;
  const w0 = u * u * u;
  const w1 = 3 * u * u * t;
  const w2 = 3 * u * t * t;
  const w3 = t * t * t;
  return {
    x: w0 * b.p0.x + w1 * b.c1.x + w2 * b.c2.x + w3 * b.p3.x,
    y: w0 * b.p0.y + w1 * b.c1.y + w2 * b.c2.y + w3 * b.p3.y,
  };
}

/**
 * The consecutive edges a packet traverses, resolved from `topo.flow`.
 * Returns the edges in order so a single path string can be concatenated for
 * MotionPath, or each leg animated in sequence.
 */
export function flowEdges(topo: Topology): TopoEdge[] {
  if (!topo.flow || topo.flow.length < 2) return [];
  const out: TopoEdge[] = [];
  for (let i = 0; i < topo.flow.length - 1; i++) {
    const from = topo.flow[i];
    const to = topo.flow[i + 1];
    const edge = topo.edges.find((e) => e.from === from && e.to === to);
    if (edge) out.push(edge);
  }
  return out;
}

/** Concatenated path for the whole flow, for a single MotionPath tween. */
export function flowPath(topo: Topology): string {
  const nodes = nodeMap(topo);
  const legs = flowEdges(topo);
  if (!legs.length) return "";
  return legs
    .map((edge, i) => {
      const d = edgePath(edge, nodes);
      // Drop the `M x y` on every leg after the first so the path is
      // continuous rather than a series of jumps.
      return i === 0 ? d : d.slice(d.indexOf("C"));
    })
    .join(" ");
}

function r(n: number): number {
  return Math.round(n * 100) / 100;
}
