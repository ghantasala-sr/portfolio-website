"use client";

import { useRef, useState } from "react";
import { useTheme } from "next-themes";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { scrollState } from "@/lib/scroll/scrollState";
import { profile } from "@/content/profile";
import { HeroFallback } from "./HeroFallback";
import { HeroCanvasGate } from "./HeroCanvasGate";
import { ServiceBurst } from "./ServiceBurst";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * The LCP contract:
 *  - the <h1> is real DOM text, server-rendered, and never hidden. Not by
 *    opacity and not by clip-path: an unpainted element is either not counted
 *    as the LCP candidate or counted whenever JS finally runs. It animates
 * transform only, via `.enter-rise`, see globals.css.
 *  - the SVG fallback ships in the HTML and reserves the box, so CLS is 0.
 *  - the canvas mounts later, on idle, and only then does the SVG fade.
 */
export function Hero() {
  const scope = useRef<HTMLElement>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const { resolvedTheme } = useTheme();

  // The scene is built on additive blending, which is a no-op against a
  // near-white ground. You cannot add light to white. In blueprint (light)
  // mode the canvas rendered nothing and the hero was an empty grid.
  //
  // Rather than maintain a second set of materials with normal blending and
  // inverted colours, light mode keeps the server-rendered SVG topology. That
  // reads as a deliberate split rather than a compromise: blueprint mode shows
  // the flat drawn diagram, instrument mode shows the glowing live scene.
  const isDark = resolvedTheme !== "light";

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // NOTE: the headline and meta entrances are CSS keyframes, not GSAP
        // see .enter-rise / .enter-fade in globals.css. GSAP owns only the
        // scroll-driven work below.

        // The pinned morph.
        //
        // Kept deliberately short. A longer pin gives the scene more room to
        // resolve, but every extra percent is dead scroll: the pin-spacer's
        // padding is empty page. At +170% this was 1224px of nothing on a 720px
        // viewport (measured at 24% content fill), and the copy had already
        // faded by the halfway point. +60% resolves the topology and hands over.
        gsap.to(scrollState, {
          morph: 1,
          camZ: 3.9,
          heroProgress: 1,
          ease: "none",
          scrollTrigger: {
            trigger: scope.current,
            start: "top top",
            end: "+=60%",
            pin: true,
            pinSpacing: true,
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });

        // Copy recedes so the graph gets the stage, but only partly, and only
        // near the end, so there is never a stretch of pure emptiness.
        gsap.to("[data-hero-copy]", {
          opacity: 0,
          y: -30,
          ease: "none",
          scrollTrigger: {
            trigger: scope.current,
            start: "top -25%",
            end: "+=35%",
            scrub: 1,
          },
        });

        // The caption crossfades in as the copy leaves.
        gsap.fromTo(
          "[data-hero-resolved]",
          { opacity: 0, y: 16 },
          {
            opacity: 1,
            y: 0,
            ease: "none",
            scrollTrigger: {
              trigger: scope.current,
              start: "top -30%",
              end: "top -50%",
              scrub: 1,
            },
          },
        );
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        // Show the resolved topology directly rather than the abstract state.
        scrollState.morph = 1;
      });

      return () => mm.revert();
    },
    { scope },
  );

  return (
    <section
      ref={scope}
      data-hero-root
      className="relative isolate flex min-h-svh flex-col justify-center overflow-hidden"
    >
      {/* Visual layer, behind the text */}
      <div className="absolute inset-0 z-0">
        <HeroFallback visible={!isDark || !sceneReady} />
        {isDark && <HeroCanvasGate onSceneReady={setSceneReady} />}
        {/* Legibility scrim: the graph is dense behind the headline */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 85% at 22% 46%, color-mix(in oklab, var(--bg) 90%, transparent) 0%, color-mix(in oklab, var(--bg) 55%, transparent) 42%, transparent 78%)",
          }}
        />
      </div>

      <ServiceBurst />

      <div className="shell relative z-30 pt-24">
        <div data-hero-copy>
          <div className="enter-fade mb-8 flex flex-wrap items-center gap-3">
            <span
              className="label-accent inline-flex items-center gap-2 border px-2.5 py-1.5"
              style={{ borderColor: "var(--accent)" }}
            >
              <span
                className="pulse-dot block h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--accent)" }}
              />
              {profile.status.label}
            </span>
            <span className="label">{profile.location}</span>
          </div>

          <h1 className="text-d1">
            {profile.headline.map((line) => (
              <span key={line} className="enter-rise block pb-[0.04em]">
                <span>{line}</span>
              </span>
            ))}
            <span className="enter-rise block pb-[0.04em]">
              <span
                className="italic"
                style={{ color: "var(--muted)", fontWeight: 500 }}
              >
                {profile.headlineTail}
              </span>
            </span>
          </h1>

          <p
            className="enter-fade prose-measure mt-10 text-[1.0625rem] leading-relaxed text-text-dim"
            data-delay="1"
          >
            {profile.subhead}
          </p>

          <div
            className="enter-fade mt-10 flex flex-wrap items-center gap-3"
            data-delay="2"
          >
            <a
              href="#work"
              data-cursor="link"
              data-magnetic
              className="group flex h-11 items-center gap-2 px-5 font-medium transition-colors"
              style={{ background: "var(--accent)", color: "var(--bg)" }}
            >
              View the work
              <span
                aria-hidden="true"
                className="transition-transform duration-300 group-hover:translate-y-0.5"
              >
                ↓
              </span>
            </a>
            <a
              href={profile.links.github}
              target="_blank"
              rel="noreferrer noopener"
              data-cursor="link"
              data-magnetic
              className="flex h-11 items-center border border-line px-5 font-medium transition-colors hover:border-line-strong"
            >
              GitHub ↗
            </a>
            <a
              href={`mailto:${profile.email}`}
              data-cursor="link"
              data-magnetic
              className="flex h-11 items-center border border-line px-5 font-medium transition-colors hover:border-line-strong"
            >
              Email
            </a>
          </div>
        </div>
      </div>

      {/* Caption revealed once the graph has morphed into the real topology */}
      <div
        data-hero-resolved
        className="shell pointer-events-none absolute inset-x-0 bottom-10 z-10 opacity-0"
      >
        <p className="label max-w-[46ch] leading-relaxed">
          <span style={{ color: "var(--accent)" }}>▸ </span>
          What you are looking at is Argus, one of my systems. A pull request
          fans out to four specialist agents on independent queues, then
          aggregates into a single review. Hover a node, or click anywhere.
        </p>
      </div>
    </section>
  );
}
