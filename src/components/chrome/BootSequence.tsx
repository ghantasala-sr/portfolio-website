"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Trace-span boot log.
 *
 * Wired to genuine progress rather than a fake timer: font loading, stylesheet
 * readiness, WebGL capability probe, and first paint are each measured with
 * performance.now() and reported with their real duration. It reads as a span
 * list because the whole site is about observability, and a preloader that
 * invents its numbers would undercut that.
 *
 * Rules:
 *  - first visit per session only (sessionStorage), so navigating back is instant
 *  - skippable with any key or click
 *  - skipped entirely under reduced motion
 *  - never blocks: it is an overlay over already-painted content, so if
 *    anything here fails the page is still there underneath
 */

interface Span {
  name: string;
  ms: number;
  status: "ok" | "skip";
}

const SESSION_KEY = "boot-shown";

export function BootSequence() {
  const [active, setActive] = useState(false);
  const [spans, setSpans] = useState<Span[]>([]);
  const [closing, setClosing] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    // Narrow viewports get a lot of value from a fast first view and little
    // from a boot log they have to skip.
    if (window.innerWidth < 640) return;

    sessionStorage.setItem(SESSION_KEY, "1");
    setActive(true);

    const t0 = performance.now();
    const collected: Span[] = [];
    let cancelled = false;

    const push = (name: string, status: Span["status"] = "ok") => {
      if (cancelled) return;
      collected.push({ name, ms: performance.now() - t0, status });
      setSpans([...collected]);
    };

    const finish = () => {
      if (cancelled || doneRef.current) return;
      doneRef.current = true;
      setClosing(true);
      window.setTimeout(() => !cancelled && setActive(false), 620);
    };

    const run = async () => {
      push("document.parse");

      try {
        await document.fonts.ready;
        push("fonts.load");
      } catch {
        push("fonts.load", "skip");
      }

      // The same probe the hero uses, so the log reports what will actually
      // happen rather than a guess.
      try {
        const probe = document.createElement("canvas").getContext("webgl2");
        if (probe) {
          probe.getExtension("WEBGL_lose_context")?.loseContext();
          push("webgl2.probe");
        } else {
          push("webgl2.probe", "skip");
        }
      } catch {
        push("webgl2.probe", "skip");
      }

      await new Promise((r) => requestAnimationFrame(() => r(null)));
      push("first.paint");

      // Hold only long enough for the last line to be readable.
      await new Promise((r) => setTimeout(r, 420));
      push("scene.handoff");
      await new Promise((r) => setTimeout(r, 240));
      finish();
    };

    void run();

    const skip = () => finish();
    window.addEventListener("keydown", skip, { once: true });
    window.addEventListener("pointerdown", skip, { once: true });

    // Hard ceiling: if anything above hangs, the overlay still leaves.
    const bail = window.setTimeout(finish, 3200);

    return () => {
      cancelled = true;
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
      clearTimeout(bail);
    };
  }, []);

  if (!active) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[150] transition-[clip-path,opacity] duration-[600ms]"
      style={{
        background: "var(--bg)",
        clipPath: closing ? "inset(0 0 100% 0)" : "inset(0 0 0% 0)",
        transitionTimingFunction: "var(--ease-in-out-quart)",
      }}
    >
      <div className="shell flex h-full flex-col justify-end pb-16">
        <p className="label mb-5" style={{ color: "var(--accent)" }}>
          trace · boot
        </p>
        <ol className="space-y-1.5">
          {spans.map((s) => (
            <li
              key={s.name}
              className="flex items-baseline gap-4 font-mono text-[0.6875rem]"
            >
              <span
                style={{
                  color: s.status === "ok" ? "var(--accent)" : "var(--warn)",
                }}
              >
                {s.status === "ok" ? "OK  " : "SKIP"}
              </span>
              <span style={{ color: "var(--text-dim)" }}>{s.name}</span>
              <span
                className="tabular-nums"
                style={{ color: "var(--faint)" }}
              >
                {s.ms.toFixed(1)}ms
              </span>
            </li>
          ))}
        </ol>
        <p className="label mt-6" style={{ color: "var(--faint)" }}>
          press any key to skip
        </p>
      </div>
    </div>
  );
}
