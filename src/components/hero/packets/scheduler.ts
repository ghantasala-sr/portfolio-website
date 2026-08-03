import type { HeroEdgeCurves } from "../topology";

/**
 * Emits causal cascades rather than a uniform stream.
 *
 * A global `fract(uTime * speed + offset)` (the obvious approach), gives every
 * edge a permanent, evenly-spaced, identical-velocity procession. That reads as
 * a decorative circuit board.
 *
 * What reads as an *event-driven system* is causality and burstiness: a webhook
 * fires, one packet crosses to the parser, the parser holds briefly, SNS fans
 * out into four simultaneous packets, the four specialists finish at different
 * times, the aggregator waits for all four, one packet leaves. The idle wire
 * between bursts is the point. That needs per-packet start time and duration,
 * which fract(uTime) structurally cannot express.
 *
 * The CPU owns the discrete routing decisions, which are rare. The GPU owns
 * continuous interpolation, which happens every frame. Deliberately not GPGPU:
 * packet position is a closed-form function of (edge, startTime, duration,
 * time), so ping-pong FBOs would add passes and capability checks to compute
 * something available in six ALU ops.
 */

export const MAX_PACKETS = 2400;

/** Per-instance data, mirrored into the two instanced attributes. */
export interface PacketSlot {
  edge: number;
  start: number;
  duration: number;
  size: number;
  bright: number;
  stretch: number;
  /** Wall-clock time this slot frees up. */
  expires: number;
}

interface EdgeMeta {
  index: number;
  from: string;
  to: string;
  duration: number;
}

/** A pending emission: fire `edge` at `at` seconds. */
interface Scheduled {
  edge: number;
  at: number;
  /** Extra weight: the aggregated output packet is brighter and larger. */
  emphasis: number;
}

export class PacketScheduler {
  readonly routeArray: Float32Array;
  readonly styleArray: Float32Array;

  private slots: (PacketSlot | null)[] = [];
  private free: number[] = [];
  private queue: Scheduled[] = [];
  private edges: EdgeMeta[] = [];
  private byFrom = new Map<string, EdgeMeta[]>();
  private nextCascade = 0;
  private time = 0;
  /** Set true whenever an attribute needs re-uploading. */
  dirty = true;

  constructor(curves: HeroEdgeCurves[]) {
    this.routeArray = new Float32Array(MAX_PACKETS * 4);
    this.styleArray = new Float32Array(MAX_PACKETS * 4);

    // Park every slot outside its life window so nothing renders until used.
    for (let i = 0; i < MAX_PACKETS; i++) {
      this.slots.push(null);
      this.free.push(i);
      this.routeArray[i * 4 + 1] = -1e6;
      this.routeArray[i * 4 + 2] = 1;
    }

    curves.forEach((c, index) => {
      const meta: EdgeMeta = {
        index,
        from: c.from,
        to: c.to,
        duration: c.duration,
      };
      this.edges.push(meta);
      const list = this.byFrom.get(c.from) ?? [];
      list.push(meta);
      this.byFrom.set(c.from, list);
    });
  }

  /** Advance to absolute scene time (seconds). */
  update(time: number) {
    this.time = time;

    // Reclaim expired slots in one pass.
    for (let i = 0; i < MAX_PACKETS; i++) {
      const s = this.slots[i];
      if (s && time > s.expires) {
        this.slots[i] = null;
        this.free.push(i);
        this.routeArray[i * 4 + 1] = -1e6;
        this.dirty = true;
      }
    }

    // Drain anything due.
    let drained = 0;
    while (this.queue.length && this.queue[0].at <= time && drained < 64) {
      const item = this.queue.shift()!;
      this.emit(item.edge, item.at, item.emphasis);
      drained++;
    }
    // The queue is kept sorted on insert, but emissions can enqueue earlier
    // items; a cheap re-sort keeps the shift() above correct.
    if (this.queue.length > 1) this.queue.sort((a, b) => a.at - b.at);

    if (time >= this.nextCascade) {
      this.scheduleCascade(time);
      // Bursts every 1.6-2.6s, so wires are visibly idle in between.
      this.nextCascade = time + 1.6 + Math.random() * 1.0;
    }
  }

  /**
   * One review's worth of traffic, walking the graph from `src` and honouring
   * each hop's duration so arrivals are genuinely caused by departures.
   */
  private scheduleCascade(now: number) {
    const walk = (nodeId: string, at: number, depth: number) => {
      if (depth > 7) return;
      const outgoing = this.byFrom.get(nodeId);
      if (!outgoing) return;

      for (const edge of outgoing) {
        // A brief hold at each hop: the node is "working".
        const hold = 0.08 + Math.random() * 0.14;
        const start = at + hold;

        // Slight per-packet jitter so simultaneous fan-out is not lockstep.
        const jitter = Math.random() * 0.06;
        this.push(edge.index, start + jitter, depth === 0 ? 1.25 : 1);

        // A couple of trailing packets on the same edge reads as volume
        // rather than a single lonely dot.
        const extras = depth <= 1 ? 2 : 1;
        for (let k = 1; k <= extras; k++) {
          this.push(edge.index, start + jitter + k * 0.085, 0.72);
        }

        walk(edge.to, start + edge.duration, depth + 1);
      }
    };

    walk("src", now, 0);

    // The state-A-only clutter has no path from `src`, so seed it separately.
    // Without this, state A looks dead until the morph brings the spine in.
    for (const edge of this.edges) {
      if (!this.reachableFromSrc.has(edge.from)) {
        this.push(edge.index, now + Math.random() * 1.8, 0.8);
      }
    }
  }

  /** Nodes reachable from `src`, computed once. */
  private get reachableFromSrc(): Set<string> {
    if (this.#reachable) return this.#reachable;
    const seen = new Set<string>(["src"]);
    const stack = ["src"];
    while (stack.length) {
      const id = stack.pop()!;
      for (const e of this.byFrom.get(id) ?? []) {
        if (!seen.has(e.to)) {
          seen.add(e.to);
          stack.push(e.to);
        }
      }
    }
    this.#reachable = seen;
    return seen;
  }
  #reachable: Set<string> | null = null;

  private push(edge: number, at: number, emphasis: number) {
    if (this.queue.length > 600) return;
    this.queue.push({ edge, at, emphasis });
  }

  private emit(edgeIndex: number, start: number, emphasis: number) {
    const slot = this.free.pop();
    if (slot === undefined) return;

    const edge = this.edges[edgeIndex];
    // Travel time varies per packet so a queue looks like a queue.
    const duration = edge.duration * (0.85 + Math.random() * 0.35);

    const s: PacketSlot = {
      edge: edgeIndex,
      start,
      duration,
      size: (0.052 + Math.random() * 0.022) * emphasis,
      bright: (0.85 + Math.random() * 0.5) * emphasis,
      stretch: 1.7 + Math.random() * 1.3,
      expires: start + duration + 0.1,
    };
    this.slots[slot] = s;

    const r = slot * 4;
    this.routeArray[r] = edgeIndex;
    this.routeArray[r + 1] = start;
    this.routeArray[r + 2] = duration;
    this.routeArray[r + 3] = s.size;

    const st = slot * 4;
    this.styleArray[st] = s.bright;
    this.styleArray[st + 1] = s.stretch;
    this.styleArray[st + 2] = 0;
    this.styleArray[st + 3] = 0;

    this.dirty = true;
  }

  /** Live packet count, for the performance tier to read. */
  get activeCount(): number {
    let n = 0;
    for (const s of this.slots) if (s) n++;
    return n;
  }

  /** Drop everything, used when the scene remounts after a context loss. */
  reset() {
    for (let i = 0; i < MAX_PACKETS; i++) {
      this.slots[i] = null;
      this.routeArray[i * 4 + 1] = -1e6;
    }
    this.free = Array.from({ length: MAX_PACKETS }, (_, i) => i);
    this.queue = [];
    this.nextCascade = this.time;
    this.dirty = true;
  }
}
