"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  scrollState,
  setDocumentVisible,
  resetScrollState,
} from "./scrollState";
import { runAdvance } from "./renderBridge";

gsap.registerPlugin(ScrollTrigger);

/**
 * Unifies Lenis, GSAP/ScrollTrigger and the R3F render loop under ONE rAF,
 * with explicit ordering: Lenis writes scroll → ScrollTrigger/tweens read it
 * → R3F renders last. Two independent rAF loops would let R3F render with
 * last frame's scroll value, which shows up as visible shear between the
 * canvas and DOM elements on a pinned hero.
 *
 * Three traps this file exists to get right:
 *
 *  1. `lenis.raf()` takes MILLISECONDS. `advance()` under frameloop="never"
 * takes SECONDS: the value passed becomes THREE.Clock.elapsedTime.
 *     Same callback, different units.
 *  2. We advance our own accumulated `sceneTime`, not the ticker's raw `t`,
 *     so pausing offscreen doesn't jump the clock on resume.
 *  3. `prefers-reduced-motion` disables Lenis entirely. Smooth scroll is
 *     itself a motion effect; hijacking scroll for someone who asked for
 *     less motion is the most common a11y violation in this genre.
 */
export function ScrollProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");

    let lenis: Lenis | null = null;
    let lenisTick: ((time: number) => void) | null = null;
    let renderTick: ((time: number) => void) | null = null;
    let lastTime = 0;

    const onScrollTriggerUpdate = () => ScrollTrigger.update();

    const start = (reduce: boolean) => {
      if (!reduce) {
        lenis = new Lenis({ autoRaf: false, lerp: 0.1, anchors: true });
        lenis.on("scroll", onScrollTriggerUpdate);
        // 3rd arg is `prioritize`, unshifts onto the listener array so this
        // runs FIRST, before any tween or ScrollTrigger reads scroll position.
        lenisTick = (time: number) => lenis?.raf(time * 1000);
        gsap.ticker.add(lenisTick, false, true);
      }

      renderTick = (time: number) => {
        const dt = lastTime ? Math.min(time - lastTime, 0.1) : 0;
        lastTime = time;
        if (!scrollState.active) return;
        if (!reduce) scrollState.sceneTime += dt;
        // SECONDS, see trap 1 above. No-op until a lazy scene registers.
        runAdvance(scrollState.sceneTime);
      };
      gsap.ticker.add(renderTick);

      // GSAP clamps deltas after a stall by default, which desyncs Lenis
      // from the real scroll position. We want raw time.
      gsap.ticker.lagSmoothing(0);
      // The iOS URL bar collapsing fires a resize that would otherwise
      // refresh every trigger mid-scroll.
      ScrollTrigger.config({ ignoreMobileResize: true });
    };

    const stop = () => {
      if (lenisTick) gsap.ticker.remove(lenisTick);
      if (renderTick) gsap.ticker.remove(renderTick);
      lenis?.off("scroll", onScrollTriggerUpdate);
      lenis?.destroy();
      lenis = null;
      lenisTick = null;
      renderTick = null;
      lastTime = 0;
    };

    start(mq.matches);

    if (process.env.NODE_ENV !== "production") {
      // ScrollTrigger measures on refresh. If a refresh lands while the
      // viewport is degenerate (a headless pane reporting 0×0, say), pin-spacer
      // padding is computed from garbage and nothing corrects it later. Expose
      // refresh so a harness can force a re-measure and tell a stale layout
      // apart from a real one.
      (window as unknown as Record<string, unknown>).__st = ScrollTrigger;
    }

    // Users toggle reduced-motion at runtime; don't read it once and assume.
    const onPrefChange = (e: MediaQueryListEvent) => {
      stop();
      start(e.matches);
      ScrollTrigger.refresh();
    };
    mq.addEventListener("change", onPrefChange);

    const onVisibility = () =>
      setDocumentVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);

    // Start/end values baked before webfonts land are wrong. Refresh once
    // fonts settle, and again if the load event reflows anything.
    let refreshRaf = 0;
    const refresh = () => {
      cancelAnimationFrame(refreshRaf);
      refreshRaf = requestAnimationFrame(() => ScrollTrigger.refresh());
    };
    document.fonts?.ready.then(refresh).catch(() => {});
    window.addEventListener("load", refresh);

    return () => {
      mq.removeEventListener("change", onPrefChange);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("load", refresh);
      cancelAnimationFrame(refreshRaf);
      stop();
    };
  }, []);

  // App Router navigation: reset scroll to top, clear stale scene targets,
  // THEN refresh, in that order, or triggers bake positions from the old page.
  useEffect(() => {
    resetScrollState();
    window.scrollTo(0, 0);
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return children;
}
