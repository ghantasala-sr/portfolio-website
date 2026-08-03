"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas, advance, type RootState } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import {
  registerAdvance,
  installDevFrameDriver,
} from "@/lib/scroll/renderBridge";
import { scrollState, setSceneVisible } from "@/lib/scroll/scrollState";
import { readTokenLinear } from "@/lib/theme/readTokens";
import { HeroGraph, type HoverInfo } from "./HeroGraph";
import { MAX_PACKETS } from "./packets/scheduler";

/**
 * The lazy half of the hero. Only ever reached through a dynamic import from
 * HeroCanvasGate, so `three` stays out of the main bundle.
 *
 * Canvas config notes:
 *  - `flat` is required. R3F defaults toneMapping to ACESFilmicToneMapping,
 *    which desaturates and rolls off exactly the bright additive highlights
 * the packets are made of, the glow goes grey and muddy without it.
 *  - `frameloop="never"` because ScrollProvider drives rendering from GSAP's
 *    ticker, after Lenis and after ScrollTrigger. Two independent rAF loops
 *    would let the canvas render with last frame's scroll value, which shows
 *    up as shear against DOM elements on a pinned hero.
 *  - antialias off: additive glows have no hard edges to alias.
 *  - No powerPreference: 'high-performance'. On macOS that forces the discrete
 *    GPU and torches battery on what is, after all, a portfolio page.
 */
export default function HeroScene({
  onReady,
  onLost,
}: {
  onReady: () => void;
  onLost: () => void;
}) {
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const budgetRef = useRef<number>(MAX_PACKETS);
  const readyRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [tokens] = useState(() => ({
    accent: readTokenLinear("--accent", "#7df9c4"),
    dim: readTokenLinear("--muted", "#7c838f"),
  }));

  // Hand our advance function to ScrollProvider. It calls whatever is
  // registered, so it never has to import from @react-three/fiber itself.
  useEffect(() => {
    const off = registerAdvance((t) => advance(t));
    installDevFrameDriver(scrollState);
    return off;
  }, []);

  // Pause when offscreen. With frameloop="never" this is simply "stop calling
  // advance", so there is no invalidate() bookkeeping and, because sceneTime
  // only accumulates while active, resuming is seamless.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setSceneVisible("hero", true);
    const io = new IntersectionObserver(
      ([entry]) => setSceneVisible("hero", entry.isIntersecting),
      { rootMargin: "120px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      setSceneVisible("hero", false);
    };
  }, []);

  // Position the hover label by writing transform directly, not via state.
  useEffect(() => {
    const el = labelRef.current;
    if (!el) return;
    if (hover) {
      el.style.transform = `translate3d(${hover.x}px, ${hover.y}px, 0) translate(-50%, -140%)`;
      el.style.opacity = "1";
    } else {
      el.style.opacity = "0";
    }
  }, [hover]);

  const handleCreated = useCallback(
    (state: RootState) => {
      const gl = state.gl;
      const canvas = gl.domElement;

      // Dev-only live probe. The browser console buffer replays history and so
      // cannot be trusted to tell you whether the CURRENT load is healthy;
      // reading renderer state is the only reliable signal.
      if (process.env.NODE_ENV !== "production") {
        const w = window as unknown as Record<string, unknown>;
        const dbg = (w.__scene ?? {}) as Record<string, unknown>;
        dbg.three = () => ({
          frameloop: state.frameloop,
          priority: state.internal.priority,
          subscribers: state.internal.subscribers.length,
          sceneChildren: state.scene.children.length,
          camZ: Number(state.camera.position.z.toFixed(2)),
          calls: gl.info.render.calls,
          triangles: gl.info.render.triangles,
          programs: gl.info.programs?.length ?? 0,
        });
        w.__scene = dbg;
      }

      // Real on iOS Safari under memory pressure. Without handling it, a user
      // who backgrounds the tab returns to a black rectangle.
      canvas.addEventListener(
        "webglcontextlost",
        (e: Event) => {
          e.preventDefault();
          onLost();
        },
        { passive: false },
      );

      if (!readyRef.current) {
        readyRef.current = true;
        // One frame rendered before we cross-fade the SVG out.
        requestAnimationFrame(() => requestAnimationFrame(onReady));
      }
    },
    [onReady, onLost],
  );

  return (
    <div ref={containerRef} className="absolute inset-0">
      <Canvas
        flat
        frameloop="never"
        dpr={[1, 1.75]}
        gl={{ antialias: false, alpha: true }}
        camera={{ position: [0, 0, 6], fov: 42, near: 0.1, far: 100 }}
        className="!pointer-events-none"
        onCreated={handleCreated}
        aria-hidden="true"
      >
        <PerformanceMonitor
          onDecline={() => {
            budgetRef.current = Math.max(
              500,
              Math.floor(budgetRef.current * 0.55),
            );
          }}
          onIncline={() => {
            budgetRef.current = Math.min(
              MAX_PACKETS,
              Math.floor(budgetRef.current * 1.3),
            );
          }}
        />
        <HeroGraph
          accentLinear={tokens.accent}
          dimLinear={tokens.dim}
          onHover={setHover}
          budgetRef={budgetRef}
        />
      </Canvas>

      {/* Hover label. A plain DOM element, NOT drei's <Html>, that re-syncs
          transforms against a pinned section's own transforms every frame and
          is a well-known jank source. */}
      <div
        ref={labelRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 z-20 opacity-0 transition-opacity duration-200"
        style={{ willChange: "transform, opacity" }}
      >
        <div
          className="whitespace-nowrap border px-2.5 py-1.5"
          style={{
            borderColor: "var(--accent)",
            background: "color-mix(in oklab, var(--bg) 88%, transparent)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div className="font-mono text-[0.6875rem] font-medium tracking-wide text-text">
            {hover?.label}
          </div>
          {hover?.meta && (
            <div className="font-mono text-[0.625rem]" style={{ color: "var(--muted)" }}>
              {hover.meta}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
