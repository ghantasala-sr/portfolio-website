/**
 * The hero scene's topology, in two states that morph into each other.
 *
 * State A is an abstract distributed system, a loose constellation of
 * services. State B is Argus's real fan-out: webhook → parser → 4 specialists
 * → aggregator → one comment. Scrolling resolves the abstraction into the
 * actual architecture.
 *
 * Edges are cubic Béziers because Bézier is affine in its control points:
 *   bezier(mix(A, B, m), t) === mix(bezier(A, t), bezier(B, t), m)
 * exactly. So morphing is a 4-point lerp in the vertex shader, no curve
 * rebuild, no second texture, no drift between the two states.
 *
 * Catmull-Rom would NOT work here: with three's default centripetal
 * parameterization, knot spacing derives from inter-point distances, which is
 * nonlinear in position, so lerped intermediate frames would pinch and bulge.
 */

export interface HeroNode {
  id: string;
  label: string;
  meta: string;
  /** State A position in world units. */
  a: [number, number, number];
  /** State B position in world units. */
  b: [number, number, number];
  /** Radius scale; hubs read larger. */
  size?: number;
}

export interface HeroEdge {
  from: string;
  to: string;
  /** Perpendicular bow, world units. Signed. */
  bowA?: number;
  bowB?: number;
  /** 0 = absent in that state (edge fades out), 1 = present. */
  inA?: 0 | 1;
  inB?: 0 | 1;
  /** Relative packet travel time; specialists deliberately differ. */
  duration?: number;
}

// Layout constants. World units; the camera sits at z≈6 looking at origin.
const L = 4.6; // half-width of the graph
const H = 2.5; // half-height

export const heroNodes: HeroNode[] = [
  // ── The spine, present in both states ──────────────────────────────────
  { id: "src", label: "GitHub", meta: "pull request opened", a: [-L, 0.9, -0.6], b: [-L, 0, 0], size: 1.15 },
  { id: "hook", label: "webhook λ", meta: "HMAC verify", a: [-2.9, -1.4, 0.5], b: [-3.05, 0, 0] },
  { id: "parse", label: "parser λ", meta: "chunk the diff", a: [-1.4, 1.7, -0.9], b: [-1.5, 0, 0], size: 1.1 },
  { id: "fan", label: "SNS", meta: "fan-out ×4", a: [0.4, -1.9, 0.7], b: [-0.35, 0, 0], size: 1.2 },

  // ── The four specialists ───────────────────────────────────────────────
  { id: "sec", label: "security", meta: "Nova Pro", a: [2.4, 2.0, -1.1], b: [1.5, H * 0.86, 0] },
  { id: "perf", label: "performance", meta: "Nova Pro", a: [3.6, 0.4, 0.9], b: [1.5, H * 0.29, 0] },
  { id: "style", label: "style", meta: "Nova Micro", a: [1.9, -2.1, -0.5], b: [1.5, -H * 0.29, 0] },
  { id: "test", label: "test coverage", meta: "Nova Micro", a: [3.9, -1.8, 0.4], b: [1.5, -H * 0.86, 0] },

  // ── Aggregation and output ─────────────────────────────────────────────
  { id: "sum", label: "summary λ", meta: "dedupe · rank", a: [-3.7, 1.9, 0.8], b: [3.15, 0, 0], size: 1.1 },
  { id: "out", label: "one comment", meta: "severity-ranked", a: [4.4, 1.4, -0.7], b: [L, 0, 0], size: 1.15 },

  // ── State-A-only satellites ────────────────────────────────────────────
  // In B these resolve ONTO the spine as intermediate hops (the queues that
  // sit between each Lambda). They must not share exact coordinates, or they
  // stack into a single blob. So each takes a distinct slot near its host.
  { id: "s1", label: "queue", meta: "", a: [-4.2, -2.2, 0.9], b: [-3.85, 0, 0], size: 0.62 },
  { id: "s4", label: "worker", meta: "", a: [-2.2, 0.3, 1.3], b: [-2.3, 0, 0], size: 0.62 },
  { id: "s2", label: "store", meta: "", a: [-0.6, 2.4, 1.1], b: [-2.05, 0.62, 0], size: 0.58 },
  { id: "s6", label: "queue", meta: "", a: [-1.9, -2.3, -1.0], b: [-0.95, 0, 0], size: 0.62 },
  { id: "s3", label: "queue", meta: "", a: [1.2, 0.7, -1.4], b: [0.55, H * 0.86, 0], size: 0.58 },
  { id: "s7", label: "worker", meta: "", a: [0.9, 2.1, 1.0], b: [0.55, H * 0.29, 0], size: 0.58 },
  { id: "s5", label: "cache", meta: "", a: [2.8, -0.9, 1.2], b: [0.55, -H * 0.29, 0], size: 0.58 },
  { id: "s12", label: "store", meta: "", a: [1.6, -1.3, 1.5], b: [0.55, -H * 0.86, 0], size: 0.58 },
  { id: "s8", label: "store", meta: "", a: [4.6, -0.3, -1.2], b: [2.45, 0, 0], size: 0.62 },
  { id: "s10", label: "worker", meta: "", a: [3.1, 2.3, 0.3], b: [3.9, 0, 0], size: 0.62 },
  { id: "s11", label: "queue", meta: "", a: [-4.5, 0.2, -0.8], b: [-4.3, 0, 0], size: 0.56 },

  // ── The findings store and the learning loop, real in B ────────────────
  { id: "ddb", label: "DynamoDB", meta: "findings · GSI on status", a: [-3.2, -0.5, -1.3], b: [0.1, -H * 1.42, 0], size: 0.95 },
  { id: "s9", label: "learn-queue", meta: "", a: [-0.2, -0.6, -1.5], b: [2.0, -H * 1.42, 0], size: 0.6 },
  { id: "ltm", label: "ltm-writer λ", meta: "patterns per repo", a: [2.1, 1.1, 1.4], b: [3.15, -H * 1.42, 0], size: 0.88 },
];

export const heroEdges: HeroEdge[] = [
  // Spine, present in both states
  { from: "src", to: "hook", bowA: 0.5, bowB: 0, duration: 0.55 },
  { from: "hook", to: "parse", bowA: -0.6, bowB: 0, duration: 0.5 },
  { from: "parse", to: "fan", bowA: 0.7, bowB: 0, duration: 0.45 },

  // The fan-out. In A these wander; in B they form the four clean arcs.
  { from: "fan", to: "sec", bowA: 0.8, bowB: -0.55, duration: 1.0 },
  { from: "fan", to: "perf", bowA: -0.5, bowB: -0.22, duration: 0.86 },
  { from: "fan", to: "style", bowA: 0.4, bowB: 0.22, duration: 0.52 },
  { from: "fan", to: "test", bowA: -0.7, bowB: 0.55, duration: 0.6 },

  // Converge on the aggregator
  { from: "sec", to: "sum", bowA: -0.9, bowB: 0.55, duration: 0.5 },
  { from: "perf", to: "sum", bowA: 0.6, bowB: 0.22, duration: 0.5 },
  { from: "style", to: "sum", bowA: -0.4, bowB: -0.22, duration: 0.5 },
  { from: "test", to: "sum", bowA: 0.8, bowB: -0.55, duration: 0.5 },

  { from: "sum", to: "out", bowA: -0.7, bowB: 0, duration: 0.5 },

  // Findings store + the learning loop, only meaningful in B
  { from: "parse", to: "ddb", bowA: 0.4, bowB: 0.35, duration: 0.6 },
  { from: "ddb", to: "sum", bowA: -0.5, bowB: -0.45, duration: 0.55 },
  { from: "sum", to: "s9", inA: 0, inB: 1, bowB: 0.3, duration: 0.5 },
  { from: "s9", to: "ltm", inA: 0, inB: 1, bowB: 0, duration: 0.45 },
  { from: "ltm", to: "ddb", inA: 0, inB: 1, bowB: 0.95, duration: 0.7 },

  // State-A-only clutter: these fade out as the topology resolves
  { from: "s11", to: "s1", inA: 1, inB: 0, bowA: -0.4, duration: 0.6 },
  { from: "s1", to: "s4", inA: 1, inB: 0, bowA: 0.5, duration: 0.6 },
  { from: "s4", to: "s2", inA: 1, inB: 0, bowA: -0.6, duration: 0.7 },
  { from: "s2", to: "s7", inA: 1, inB: 0, bowA: 0.4, duration: 0.6 },
  { from: "s6", to: "s3", inA: 1, inB: 0, bowA: -0.5, duration: 0.65 },
  { from: "s3", to: "s5", inA: 1, inB: 0, bowA: 0.6, duration: 0.55 },
  { from: "s5", to: "s8", inA: 1, inB: 0, bowA: -0.4, duration: 0.6 },
  { from: "s12", to: "s10", inA: 1, inB: 0, bowA: 0.7, duration: 0.75 },
  { from: "s7", to: "s10", inA: 1, inB: 0, bowA: -0.3, duration: 0.5 },
  { from: "s8", to: "out", inA: 1, inB: 0, bowA: 0.5, duration: 0.55 },
];

/** Node ids whose labels are worth showing on hover. */
export const labelledNodes = new Set([
  "src", "hook", "parse", "fan", "sec", "perf", "style", "test",
  "sum", "out", "ddb", "ltm",
]);

export type Vec3 = [number, number, number];

/** The 4 control points of an edge in one state. */
export interface EdgeCurve {
  p0: Vec3;
  c1: Vec3;
  c2: Vec3;
  p3: Vec3;
  present: number;
}

const nodeById = new Map(heroNodes.map((n) => [n.id, n]));

function curve(
  from: Vec3,
  to: Vec3,
  bow: number,
  present: number,
): EdgeCurve {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dz = to[2] - from[2];

  // Perpendicular in the XY plane, which is where the bow reads best given
  // the camera looks down -Z.
  const len = Math.hypot(dx, dy) || 1;
  const px = -dy / len;
  const py = dx / len;

  const k = 0.42;
  return {
    p0: from,
    c1: [from[0] + dx * k + px * bow, from[1] + dy * k + py * bow, from[2] + dz * k],
    c2: [to[0] - dx * k + px * bow, to[1] - dy * k + py * bow, to[2] - dz * k],
    p3: to,
    present,
  };
}

export interface HeroEdgeCurves {
  a: EdgeCurve;
  b: EdgeCurve;
  duration: number;
  from: string;
  to: string;
}

/** Both states' control points for every edge, in declaration order. */
export function buildEdgeCurves(): HeroEdgeCurves[] {
  return heroEdges.map((e) => {
    const from = nodeById.get(e.from)!;
    const to = nodeById.get(e.to)!;
    const inA = e.inA ?? 1;
    const inB = e.inB ?? 1;
    return {
      from: e.from,
      to: e.to,
      duration: e.duration ?? 0.6,
      a: curve(from.a, to.a, e.bowA ?? 0, inA),
      b: curve(from.b, to.b, e.bowB ?? 0, inB),
    };
  });
}

/**
 * Packs both states' control points into a Float32Array laid out as an
 * 8 × edgeCount RGBA texture:
 *
 *   texel 0..3 → state A p0, c1, c2, p3   (.w of texel 0 = presence in A)
 *   texel 4..7 → state B p0, c1, c2, p3   (.w of texel 4 = presence in B)
 *
 * 8 texels wide, NEAREST filtered, read with texelFetch, so there is no
 * filtering, no wrap mode and no half-texel arithmetic to get wrong.
 */
export function packCurveTexture(curves: HeroEdgeCurves[]): {
  data: Float32Array;
  width: number;
  height: number;
} {
  const width = 8;
  const height = curves.length;
  const data = new Float32Array(width * height * 4);

  curves.forEach((c, row) => {
    const base = row * width * 4;
    const write = (texel: number, v: Vec3, w: number) => {
      const o = base + texel * 4;
      data[o] = v[0];
      data[o + 1] = v[1];
      data[o + 2] = v[2];
      data[o + 3] = w;
    };
    write(0, c.a.p0, c.a.present);
    write(1, c.a.c1, 0);
    write(2, c.a.c2, 0);
    write(3, c.a.p3, 0);
    write(4, c.b.p0, c.b.present);
    write(5, c.b.c1, 0);
    write(6, c.b.c2, 0);
    write(7, c.b.p3, 0);
  });

  return { data, width, height };
}

/** Evaluate a cubic Bézier on the CPU, used by the SVG fallback. */
export function evalBezier(c: EdgeCurve, t: number): Vec3 {
  const u = 1 - t;
  const w0 = u * u * u;
  const w1 = 3 * u * u * t;
  const w2 = 3 * u * t * t;
  const w3 = t * t * t;
  return [
    w0 * c.p0[0] + w1 * c.c1[0] + w2 * c.c2[0] + w3 * c.p3[0],
    w0 * c.p0[1] + w1 * c.c1[1] + w2 * c.c2[1] + w3 * c.p3[1],
    w0 * c.p0[2] + w1 * c.c1[2] + w2 * c.c2[2] + w3 * c.p3[2],
  ];
}

/** World → SVG viewBox coords, so the fallback matches the WebGL framing. */
export const SVG_VIEW = { w: 1000, h: 560 };

export function worldToSvg(v: Vec3): [number, number] {
  const scale = SVG_VIEW.w / (L * 2 + 1.4);
  return [
    SVG_VIEW.w / 2 + v[0] * scale,
    SVG_VIEW.h / 2 - v[1] * scale * 0.92,
  ];
}
