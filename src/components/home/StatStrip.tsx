"use client";

import { useEffect, useRef } from "react";
import { verifiedStats } from "@/content/skills";

/**
 * Count-up on first view. Uses a single IntersectionObserver and writes
 * textContent directly, no React state per frame, so this costs nothing even
 * with several counters on screen.
 *
 * Respects reduced motion by rendering the final value immediately.
 */
function Counter({ value, suffix }: { value: string; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const target = parseFloat(value);
    // Non-numeric values ("Live", "L0→L5") have nothing to count.
    if (!Number.isFinite(target)) {
      el.textContent = value;
      return;
    }

    const decimals = value.includes(".") ? value.split(".")[1].length : 0;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = value;
      return;
    }

    el.textContent = target > 20 ? "0" : (0).toFixed(decimals);

    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const dur = 1100;
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / dur);
          // easeOutExpo, fast then settles, so the final digits are readable
          const e = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
          el.textContent = (target * e).toFixed(decimals);
          if (t < 1) raf = requestAnimationFrame(tick);
          else el.textContent = value;
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );

    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);

  return (
    <>
      <span ref={ref} className="tabular-nums">
        {value}
      </span>
      {suffix && (
        <span className="text-[0.55em]" style={{ color: "var(--muted)" }}>
          {suffix}
        </span>
      )}
    </>
  );
}

export function StatStrip() {
  return (
    <section className="shell py-14">
      <p className="label mb-8 border-b border-line pb-4">
        Every number on this site is one I can point at in a repository
      </p>
      <dl className="grid grid-cols-2 gap-x-8 gap-y-12 lg:grid-cols-4">
        {verifiedStats.map((s) => (
          <div key={s.label}>
            <dt
              className="font-display text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-none tracking-tight"
              style={{ color: "var(--accent)" }}
            >
              <Counter value={s.value} suffix={s.suffix} />
            </dt>
            <dd className="mt-4">
              <span className="block text-[0.9375rem] leading-snug text-text">
                {s.label}
              </span>
              <span className="label mt-2 block leading-snug">{s.detail}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
