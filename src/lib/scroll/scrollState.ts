/**
 * Module singleton bridging GSAP/ScrollTrigger → the R3F render loop.
 *
 * Deliberately NOT React state and NOT context: scroll must never trigger
 * reconciliation. ScrollTrigger tweens the fields on this plain object;
 * `useFrame` reads them and writes uniforms. Strictly one-way.
 *
 * If GSAP never loads, these defaults are what the scene renders. So the
 * initial values must be a valid, good-looking first frame on their own.
 */
export interface ScrollState {
  /** 0 → topology state A, 1 → state B. Drives node positions, edge
   *  presence, packet curves and camera in a single uniform. */
  morph: number;
  /** Target camera Z; the scene damps toward this rather than snapping. */
  camZ: number;
  /** 0-1 progress through the pinned hero, for text/UI cross-fades. */
  heroProgress: number;
  /** 0 → dispersed, 1 → assembled. Unused while /about has no scene. */
  assemble: number;
  /** Accumulated scene time in SECONDS. Advanced only while `active`, so
   *  returning from 30s offscreen does not jump the clock and flush a
   *  backlog of scheduler cascades. */
  sceneTime: number;
  /** False when every canvas is offscreen or the tab is hidden. */
  active: boolean;
  /** Set by the pointer handler in viewport-normalised -1..1 coords. */
  pointerX: number;
  pointerY: number;
}

export const scrollState: ScrollState = {
  morph: 0,
  camZ: 6,
  heroProgress: 0,
  assemble: 0,
  sceneTime: 0,
  active: true,
  pointerX: 0,
  pointerY: 0,
};

/**
 * Reference-counted visibility. Each scene registers itself; `active` stays
 * true while at least one scene is on screen and the tab is visible.
 */
const visibleScenes = new Set<string>();
let documentVisible = true;

function recompute() {
  scrollState.active = documentVisible && visibleScenes.size > 0;
}

export function setSceneVisible(id: string, visible: boolean) {
  if (visible) visibleScenes.add(id);
  else visibleScenes.delete(id);
  recompute();
}

export function setDocumentVisible(visible: boolean) {
  documentVisible = visible;
  recompute();
}

export function resetScrollState() {
  scrollState.morph = 0;
  scrollState.camZ = 6;
  scrollState.heroProgress = 0;
  scrollState.assemble = 0;
}
