"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Experience", href: "#experience" },
  { label: "Education", href: "#education" },
  { label: "Projects", href: "#projects" },
  { label: "Skills", href: "#skills" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);

      const sections = navLinks.map((l) => l.href.slice(1));
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 150) {
            setActiveSection(sections[i]);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (href: string) => {
    setMobileOpen(false);
    const el = document.getElementById(href.slice(1));
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
        className={`fixed top-4 left-4 right-4 z-50 mx-auto max-w-5xl rounded-2xl transition-all duration-300 ${
          scrolled
            ? "bg-surface/80 backdrop-blur-xl border border-glass-border shadow-lg shadow-black/20"
            : "bg-transparent"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-3">
          {/* Logo */}
          <button
            onClick={() => scrollTo("#home")}
            className="font-heading text-lg font-bold tracking-tight cursor-pointer"
          >
            <span className="gradient-text">SR</span>
            <span className="text-muted">G</span>
          </button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 cursor-pointer ${
                  activeSection === link.href.slice(1)
                    ? "text-text"
                    : "text-muted hover:text-text"
                }`}
              >
                {activeSection === link.href.slice(1) && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-glass rounded-lg border border-glass-border"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </button>
            ))}
          </div>

          {/* Resume CTA */}
          <a
            href="mailto:srinivasarithik23@gmail.com"
            className="hidden md:inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary/10 text-primary-glow border border-primary/20 hover:bg-primary/20 transition-all duration-200 cursor-pointer"
          >
            Get in Touch
          </a>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-muted hover:text-text transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl pt-24 px-6"
          >
            <div className="flex flex-col gap-2">
              {navLinks.map((link, i) => (
                <motion.button
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => scrollTo(link.href)}
                  className={`text-left px-4 py-3 text-lg font-medium rounded-xl transition-colors cursor-pointer ${
                    activeSection === link.href.slice(1)
                      ? "text-text bg-glass"
                      : "text-muted hover:text-text"
                  }`}
                >
                  {link.label}
                </motion.button>
              ))}
              <a
                href="mailto:srinivasarithik23@gmail.com"
                className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-3 text-lg font-medium rounded-xl bg-primary text-white cursor-pointer"
                onClick={() => setMobileOpen(false)}
              >
                Get in Touch
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
