"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

/**
 * Scroll reveal via IntersectionObserver, not GSAP.
 *
 * Deliberately cheap: no ScrollTrigger instance per element (which would mean
 * dozens of triggers to refresh and dozens of pin-spacer lifecycles to worry
 * about), and no React state, the observer flips a data attribute and CSS
 * does the rest. `.reveal` uses opacity + translate; see globals.css for why a
 * clip-path hide state is specifically wrong here.
 *
 * Under reduced motion the CSS rule drops the transform entirely, so content
 * simply appears.
 */
/**
 * Set the first time any observer callback fires. If nothing has fired by the
 * time the failsafe runs, the observer is broken rather than merely waiting
 * and every reveal on the page should give up hiding.
 *
 * Shared across instances so a single healthy callback vouches for all of them,
 * which keeps the failsafe from firing on elements that are simply still below
 * the fold.
 */
let observerProvenHealthy = false;

export function Reveal({
  as: Tag = "div",
  children,
  delay = 0,
  className = "",
  once = true,
}: {
  as?: ElementType;
  children: ReactNode;
  /** Seconds. Staggers siblings without needing a timeline. */
  delay?: number;
  className?: string;
  once?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const show = () => {
      el.dataset.shown = "true";
    };

    // No observer support: show immediately rather than never.
    if (typeof IntersectionObserver === "undefined") {
      show();
      return;
    }

    // threshold 0: fire as soon as any part of the box enters. A non-zero
    // threshold is what made the previous clip-path hide state unrecoverable,
    // and it buys nothing here, the rootMargin already delays the trigger.
    const io = new IntersectionObserver(
      (entries) => {
        observerProvenHealthy = true;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            show();
            if (once) io.unobserve(el);
          } else if (!once) {
            el.dataset.shown = "false";
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0 },
    );

    io.observe(el);

    // Failsafe: if no observer anywhere on the page has reported in, the
    // mechanism is broken rather than merely waiting. So stop hiding. There
    // are ~50 of these on the home page, and a silent observer failure is a
    // blank site, not a missing flourish. Content visibility must never depend
    // on an effect succeeding.
    const failsafe = window.setTimeout(() => {
      if (!observerProvenHealthy) show();
    }, 2500);

    return () => {
      io.disconnect();
      clearTimeout(failsafe);
    };
  }, [once]);

  // `as` is intentionally loose so callers can render semantic tags (li, p,
  // h2). Narrowing to a concrete component type keeps the props checkable
  // without a full polymorphic generic, which buys nothing here.
  const Component = Tag as "div";

  return (
    <Component
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`reveal ${className}`}
      data-shown="false"
      style={delay ? { transitionDelay: `${delay}s` } : undefined}
    >
      {children}
    </Component>
  );
}
