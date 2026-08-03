"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { profile } from "@/content/profile";

const nav = [
  { href: "/work", label: "Work" },
  { href: "/about", label: "About" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 transition-colors duration-500"
      style={{
        background: scrolled ? "color-mix(in oklab, var(--bg) 82%, transparent)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: `1px solid ${scrolled ? "var(--line)" : "transparent"}`,
      }}
    >
      <div className="shell flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          data-cursor="link"
          className="group flex items-baseline gap-2"
          aria-label={`${profile.name}, home`}
        >
          <span className="font-mono text-[0.8125rem] font-medium tracking-tight text-text">
            {profile.shortName.toLowerCase()}
            <span style={{ color: "var(--accent)" }}>.</span>
            ghantasala
          </span>
        </Link>

        <div className="flex items-center gap-1.5">
          <nav aria-label="Main" className="flex items-center">
            {nav.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-cursor="link"
                  data-magnetic
                  aria-current={active ? "page" : undefined}
                  className="label px-3 py-2 transition-colors hover:text-text"
                  style={active ? { color: "var(--text)" } : undefined}
                >
                  {item.label}
                  {active && (
                    <span
                      aria-hidden="true"
                      className="mt-1 block h-px w-full"
                      style={{ background: "var(--accent)" }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Was a résumé download. Contact is the more useful thing to have
              permanently in reach, and the résumé now goes out by reply. */}
          <a
            href={`mailto:${profile.email}`}
            data-cursor="link"
            data-magnetic
            className="label ml-1 hidden h-8 items-center border px-3 transition-colors sm:flex"
            style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
          >
            Contact
          </a>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
