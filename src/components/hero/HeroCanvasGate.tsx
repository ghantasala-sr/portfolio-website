"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

/**
 * `ssr: false` throws inside a Server Component in App Router, so this wrapper
 * is a Client Component and the import lives here.
 */
const HeroScene = dynamic(() => import("./HeroScene.client"), {
  ssr: false,
  loading: () => null,
});

/**
 * Decides whether the WebGL scene loads at all, and when.
 *
 * Capability detection deliberately does NOT use:
 * - `failIfMajorPerformanceCaveat: true`: this is precisely the flag that
 *    false-negatives on perfectly good hardware; it is inconsistently
 *    implemented across drivers and virtualised setups.
 * - UA sniffing or WEBGL_debug_renderer_info: the latter is privacy-masked
 *    in current Chrome and returns useless ANGLE strings.
 *
 * We detect only the hard failure (no webgl2 context at all), then let
 * PerformanceMonitor measure the real device and tier down. Measurement
 * cannot false-negative on hardware that is actually fine.
 */
function canUseWebGL2(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) return false;
    // Release the probe context immediately; browsers cap concurrent contexts.
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function HeroCanvasGate({
  onSceneReady,
}: {
  onSceneReady: (ready: boolean) => void;
}) {
  const [mount, setMount] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches || !canUseWebGL2()) return;

    let cancelled = false;
    let idleHandle: number | undefined;

    // Wait for idle so the scene never competes with the hero text for the
    // first paint. Fonts first, then idle, then import.
    const schedule = () => {
      if (cancelled) return;
      const ric = window.requestIdleCallback;
      if (typeof ric === "function") {
        idleHandle = ric(() => !cancelled && setMount(true), { timeout: 1800 });
      } else {
        idleHandle = window.setTimeout(() => !cancelled && setMount(true), 400);
      }
    };

    const fonts = document.fonts?.ready ?? Promise.resolve();
    fonts.then(schedule).catch(schedule);

    return () => {
      cancelled = true;
      if (idleHandle !== undefined) {
        window.cancelIdleCallback?.(idleHandle);
        clearTimeout(idleHandle);
      }
    };
  }, []);

  if (!mount) return null;

  return (
    <HeroScene
      onReady={() => onSceneReady(true)}
      onLost={() => {
        // Bring the SVG back rather than leaving a dead canvas.
        onSceneReady(false);
        setMount(false);
      }}
    />
  );
}
