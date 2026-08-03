"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Click anywhere in the hero and it emits service badges that drift outward and
 * fade. Thematically it is the same idea as the graph behind it: a click is an
 * event, and events fan out.
 *
 * Every badge names something that actually appears in a linked repository, so
 * it doubles as a stack tour rather than decoration.
 *
 * Nothing lives longer than 2.4s, comfortably inside the 3s budget. The layer is
 * pointer-events: none, and the listener ignores real controls, so the CTAs
 * underneath keep working.
 */

type Provider = "aws" | "gcp" | "other";

const SERVICES: { name: string; provider: Provider }[] = [
  { name: "Lambda", provider: "aws" },
  { name: "SNS", provider: "aws" },
  { name: "SQS", provider: "aws" },
  { name: "DynamoDB", provider: "aws" },
  { name: "S3", provider: "aws" },
  { name: "Bedrock", provider: "aws" },
  { name: "ECS", provider: "aws" },
  { name: "RDS", provider: "aws" },
  { name: "API Gateway", provider: "aws" },
  { name: "Cloud Run", provider: "gcp" },
  { name: "Pub/Sub", provider: "gcp" },
  { name: "Firestore", provider: "gcp" },
  { name: "BigQuery", provider: "gcp" },
  { name: "Vertex AI", provider: "gcp" },
  { name: "Cloud Functions", provider: "gcp" },
  { name: "Cloud Build", provider: "gcp" },
  { name: "Snowflake", provider: "other" },
  { name: "dbt", provider: "other" },
  { name: "Airflow", provider: "other" },
  { name: "Kafka", provider: "other" },
  { name: "Redpanda", provider: "other" },
  { name: "Postgres", provider: "other" },
  { name: "OpenTelemetry", provider: "other" },
  { name: "LangGraph", provider: "other" },
  { name: "Terraform", provider: "other" },
];

const PROVIDER_LABEL: Record<Provider, string> = {
  aws: "AWS",
  gcp: "GCP",
  other: "",
};

const PROVIDER_COLOR: Record<Provider, string> = {
  aws: "var(--warn)",
  gcp: "var(--accent)",
  other: "var(--muted)",
};

const PER_BURST = 6;
const MAX_LIVE = 42;
const LIFETIME = 2.4;

export function ServiceBurst() {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    const section = document.querySelector<HTMLElement>("[data-hero-root]");
    if (!layer || !section) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let cursor = 0;

    const burst = (clientX: number, clientY: number) => {
      if (reduce.matches) return;
      if (layer.childElementCount > MAX_LIVE) return;

      const box = layer.getBoundingClientRect();
      const x = clientX - box.left;
      const y = clientY - box.top;

      for (let i = 0; i < PER_BURST; i++) {
        // Walk the list rather than sampling randomly, so a few clicks show a
        // spread of services instead of repeating the same two.
        const svc = SERVICES[cursor % SERVICES.length];
        cursor += 1 + Math.floor(Math.random() * 3);

        const el = document.createElement("div");
        el.className =
          "absolute left-0 top-0 flex items-center gap-1.5 whitespace-nowrap border px-2 py-1 font-mono text-[0.625rem] uppercase tracking-wider";
        el.style.borderColor = PROVIDER_COLOR[svc.provider];
        el.style.color = "var(--text)";
        el.style.background = "color-mix(in oklab, var(--bg) 82%, transparent)";
        el.style.backdropFilter = "blur(4px)";
        el.style.willChange = "transform, opacity";

        const tag = PROVIDER_LABEL[svc.provider];
        if (tag) {
          const t = document.createElement("span");
          t.textContent = tag;
          t.style.color = PROVIDER_COLOR[svc.provider];
          el.appendChild(t);
        }
        const n = document.createElement("span");
        n.textContent = svc.name;
        el.appendChild(n);

        layer.appendChild(el);

        // Fan out over a full circle, biased upward so badges clear the cursor.
        const angle = (i / PER_BURST) * Math.PI * 2 + Math.random() * 0.5;
        const distance = 90 + Math.random() * 110;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance - 40;

        gsap
          .timeline({ onComplete: () => el.remove() })
          .fromTo(
            el,
            { x, y, xPercent: -50, yPercent: -50, opacity: 0, scale: 0.6 },
            {
              opacity: 1,
              scale: 1,
              duration: 0.22,
              ease: "back.out(2.5)",
              delay: i * 0.035,
            },
          )
          .to(
            el,
            {
              x: x + dx,
              y: y + dy,
              rotation: (Math.random() - 0.5) * 12,
              duration: LIFETIME - 0.4,
              ease: "power2.out",
            },
            "<",
          )
          .to(el, { opacity: 0, duration: 0.5, ease: "power1.in" }, ">-0.55");
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      // Let real controls behave normally.
      if ((e.target as Element | null)?.closest("a, button, input, textarea")) {
        return;
      }
      burst(e.clientX, e.clientY);
    };

    section.addEventListener("pointerdown", onPointerDown);

    // Expose for verification; a hidden pane cannot dispatch trusted clicks.
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as Record<string, unknown>).__burst = burst;
    }

    return () => {
      section.removeEventListener("pointerdown", onPointerDown);
      gsap.killTweensOf(layer.children);
      layer.replaceChildren();
    };
  }, []);

  return (
    <div
      ref={layerRef}
      data-service-burst
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
    />
  );
}
