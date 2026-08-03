/**
 * Inversion so that `three` never reaches the main bundle.
 *
 * ScrollProvider lives in the root layout, so anything it imports at module
 * scope lands in the shared chunk. Importing `advance` from
 * `@react-three/fiber` there would drag all of three into the initial
 * payload and defeat the whole LCP strategy.
 *
 * Instead the lazy scene chunk registers its own advance function here once
 * it has loaded, and ScrollProvider calls whatever is registered. This module
 * imports nothing.
 */
type AdvanceFn = (sceneTimeSeconds: number) => void;

let advanceFn: AdvanceFn | null = null;

export function registerAdvance(fn: AdvanceFn): () => void {
  advanceFn = fn;
  return () => {
    if (advanceFn === fn) advanceFn = null;
  };
}

export function runAdvance(sceneTimeSeconds: number) {
  advanceFn?.(sceneTimeSeconds);
}

export function hasAdvance() {
  return advanceFn !== null;
}

/**
 * Dev-only manual frame driver.
 *
 * A hidden or backgrounded tab throttles requestAnimationFrame to zero, so
 * gsap.ticker never fires and the scene never advances, correct production
 * behaviour, but it makes the scene impossible to inspect in a headless or
 * background browser. This lets a test harness set scene state and render an
 * exact frame on demand.
 *
 * Stripped from production builds by the NODE_ENV check.
 */
export function installDevFrameDriver(state: {
  morph: number;
  camZ: number;
  assemble: number;
  sceneTime: number;
  active: boolean;
  pointerX: number;
  pointerY: number;
}) {
  if (process.env.NODE_ENV === "production") return;
  if (typeof window === "undefined") return;

  const w = window as unknown as Record<string, unknown>;
  // Merge, don't replace: child effects (which attach renderer probes) run
  // before this parent effect, so overwriting would drop them.
  const existing = (w.__scene ?? {}) as Record<string, unknown>;

  w.__scene = {
    ...existing,
    /** Render one frame at an explicit scene time, ignoring visibility. */
    frame(sceneTime?: number) {
      if (typeof sceneTime === "number") state.sceneTime = sceneTime;
      runAdvance(state.sceneTime);
      return state.sceneTime;
    },
    /** Step forward n frames at dt seconds each, so motion accumulates. */
    run(frames = 30, dt = 1 / 60) {
      for (let i = 0; i < frames; i++) {
        state.sceneTime += dt;
        runAdvance(state.sceneTime);
      }
      return state.sceneTime;
    },
    set(patch: Partial<typeof state>) {
      Object.assign(state, patch);
      runAdvance(state.sceneTime);
      return { ...state };
    },
    get() {
      return { ...state, hasAdvance: hasAdvance() };
    },
  };
}
