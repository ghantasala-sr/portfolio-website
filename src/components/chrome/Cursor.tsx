"use client";

import { useEffect, useRef } from "react";
import { scrollState } from "@/lib/scroll/scrollState";

/**
 * Magnetic cursor. One fixed element, spring-lerped toward the pointer, using
 * mix-blend-mode: difference so it inverts whatever it sits over and needs no
 * per-theme colour.
 *
 * Elements opt in with:
 *   data-cursor="link" | "view" | "drag"   → label + scale state
 *   data-magnetic                          → ring pulls toward element centre
 *
 * Gated behind (hover: hover) and (pointer: fine) so it never appears on
 * touch, and off entirely under reduced motion.
 */
export function Cursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || reduce.matches) return;

    const ring = ringRef.current;
    const label = labelRef.current;
    if (!ring || !label) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let x = targetX;
    let y = targetY;
    let scale = 1;
    let targetScale = 1;
    let raf = 0;
    let visible = false;

    const onMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;

      // Feed the shared scroll state so WebGL scenes get pointer parallax
      // from the same source, normalised to -1..1.
      scrollState.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      scrollState.pointerY = -((e.clientY / window.innerHeight) * 2 - 1);

      if (!visible) {
        visible = true;
        ring.style.opacity = "1";
      }

      const el = (e.target as Element | null)?.closest?.(
        "[data-cursor], [data-magnetic]",
      ) as HTMLElement | null;

      const mode = el?.dataset.cursor;
      if (mode === "view") {
        targetScale = 3.4;
        label.textContent = "VIEW";
      } else if (mode === "drag") {
        targetScale = 3.4;
        label.textContent = "DRAG";
      } else if (mode === "link") {
        targetScale = 1.9;
        label.textContent = "";
      } else {
        targetScale = 1;
        label.textContent = "";
      }

      // Magnetic pull: bias the ring toward the element's centre so it
      // visibly snaps rather than merely growing.
      if (el?.hasAttribute("data-magnetic")) {
        const r = el.getBoundingClientRect();
        targetX += (r.left + r.width / 2 - e.clientX) * 0.32;
        targetY += (r.top + r.height / 2 - e.clientY) * 0.32;
      }
    };

    const onLeave = () => {
      visible = false;
      ring.style.opacity = "0";
    };

    const tick = () => {
      x += (targetX - x) * 0.18;
      y += (targetY - y) * 0.18;
      scale += (targetScale - scale) * 0.14;
      ring.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ringRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[100] hidden opacity-0 transition-opacity duration-300 md:block"
      style={{ mixBlendMode: "difference", willChange: "transform" }}
    >
      <div
        className="flex items-center justify-center rounded-full border"
        style={{
          width: 28,
          height: 28,
          borderColor: "#ffffff",
        }}
      >
        <span
          ref={labelRef}
          className="font-mono font-medium text-white"
          style={{ fontSize: 3.4, letterSpacing: "0.08em" }}
        />
      </div>
    </div>
  );
}
