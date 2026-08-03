import type { NodeKind } from "@/content/topology/types";

/**
 * Each node kind gets a distinct silhouette so the topology is readable
 * without labels, which is the whole requirement for a 120×80 glyph.
 *
 *   source   ▷ triangle-ish  entry point
 *   compute  ▭ rectangle     a service or function
 *   queue    ▯ tall bars     a queue (visually "stacked messages")
 *   topic    ◇ diamond       a fan-out point
 *   store    ⬭ cylinder      persistence
 *   model    ⬡ hexagon       an inference call
 *   sink     ● filled dot    terminal output
 *   observe  ⊞ crosshair     telemetry
 */
export interface ShapeSpec {
  /** Half-extent for hit/label layout at full diagram scale. */
  rx: number;
  ry: number;
}

export const shapeSize: Record<NodeKind, ShapeSpec> = {
  source: { rx: 9, ry: 9 },
  compute: { rx: 11, ry: 8 },
  queue: { rx: 9, ry: 9 },
  topic: { rx: 9, ry: 9 },
  store: { rx: 10, ry: 8 },
  model: { rx: 10, ry: 9 },
  sink: { rx: 8, ry: 8 },
  observe: { rx: 9, ry: 9 },
};

/** SVG `d`/geometry for a node kind centred on (0,0), scaled by `s`. */
export function shapePath(kind: NodeKind, s = 1): string {
  const k = (n: number) => n * s;
  switch (kind) {
    case "source":
      // Right-pointing triangle: unmistakably an entry point.
      return `M ${k(-8)} ${k(-9)} L ${k(9)} 0 L ${k(-8)} ${k(9)} Z`;
    case "compute":
      return `M ${k(-11)} ${k(-8)} H ${k(11)} V ${k(8)} H ${k(-11)} Z`;
    case "queue":
      // Three vertical bars, stacked messages.
      return [
        `M ${k(-9)} ${k(-9)} H ${k(-5)} V ${k(9)} H ${k(-9)} Z`,
        `M ${k(-2)} ${k(-9)} H ${k(2)} V ${k(9)} H ${k(-2)} Z`,
        `M ${k(5)} ${k(-9)} H ${k(9)} V ${k(9)} H ${k(5)} Z`,
      ].join(" ");
    case "topic":
      return `M 0 ${k(-10)} L ${k(10)} 0 L 0 ${k(10)} L ${k(-10)} 0 Z`;
    case "store":
      // Cylinder: rect with an elliptical cap.
      return `M ${k(-10)} ${k(-5)} A ${k(10)} ${k(3.5)} 0 0 1 ${k(10)} ${k(-5)} V ${k(5)} A ${k(10)} ${k(3.5)} 0 0 1 ${k(-10)} ${k(5)} Z`;
    case "model":
      return `M ${k(-5)} ${k(-9)} H ${k(5)} L ${k(10)} 0 L ${k(5)} ${k(9)} H ${k(-5)} L ${k(-10)} 0 Z`;
    case "sink":
      return `M 0 ${k(-8)} A ${k(8)} ${k(8)} 0 1 1 0 ${k(8)} A ${k(8)} ${k(8)} 0 1 1 0 ${k(-8)} Z`;
    case "observe":
      return `M ${k(-9)} ${k(-9)} H ${k(9)} V ${k(9)} H ${k(-9)} Z M ${k(-9)} 0 H ${k(9)} M 0 ${k(-9)} V ${k(9)}`;
  }
}

/** Filled kinds read as "endpoints"; outlined ones as "things in between". */
export function isFilled(kind: NodeKind): boolean {
  return kind === "sink" || kind === "source";
}

export function strokeForEdge(kind: string | undefined): {
  dash?: string;
  opacity: number;
} {
  switch (kind) {
    case "async":
      return { dash: "5 4", opacity: 0.85 };
    case "dlq":
      return { dash: "2 4", opacity: 0.7 };
    case "data":
      return { dash: undefined, opacity: 0.45 };
    default:
      return { dash: undefined, opacity: 0.75 };
  }
}
