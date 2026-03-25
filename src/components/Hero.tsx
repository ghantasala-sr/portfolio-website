"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Mail, MapPin, ChevronDown, Terminal, Bot } from "lucide-react";
import { profile } from "@/data/profile";
import MagneticButton from "@/components/MagneticButton";

function GithubIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function LinkedinIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export default function Hero() {
  const [roleIndex, setRoleIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [agentMessages, setAgentMessages] = useState<
    { type: "agent" | "system"; text: string; visible: boolean }[]
  >([]);

  // Agent conversation messages
  useEffect(() => {
    const messages = [
      {
        type: "system" as const,
        text: "$ kubectl get pods -n rithik-portfolio",
        delay: 500,
      },
      {
        type: "agent" as const,
        text: "🟢 All systems operational. Initializing agent...",
        delay: 1800,
      },
      {
        type: "agent" as const,
        text: `Deploying ${profile.shortName}'s portfolio across nodes...`,
        delay: 3000,
      },
    ];

    messages.forEach(({ type, text, delay }) => {
      setTimeout(() => {
        setAgentMessages((prev) => [...prev, { type, text, visible: true }]);
      }, delay);
    });
  }, []);

  const typeRole = useCallback(() => {
    const currentRole = profile.roles[roleIndex];

    if (!isDeleting) {
      if (displayText.length < currentRole.length) {
        setTimeout(() => {
          setDisplayText(currentRole.slice(0, displayText.length + 1));
        }, 80);
      } else {
        setTimeout(() => setIsDeleting(true), 2000);
      }
    } else {
      if (displayText.length > 0) {
        setTimeout(() => {
          setDisplayText(currentRole.slice(0, displayText.length - 1));
        }, 40);
      } else {
        setIsDeleting(false);
        setRoleIndex((prev) => (prev + 1) % profile.roles.length);
      }
    }
  }, [displayText, isDeleting, roleIndex]);

  useEffect(() => {
    const timer = setTimeout(typeRole, 10);
    return () => clearTimeout(timer);
  }, [typeRole]);

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Subtle grid pattern (K8s dashboard style) */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-28 text-center">
        {/* Agent terminal bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mx-auto max-w-xl mb-8"
        >
          <div className="glass-card overflow-hidden text-left">
            {/* Terminal title bar */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-surface/50">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              </div>
              <div className="flex items-center gap-1.5 ml-2 text-[11px] text-muted font-mono">
                <Terminal size={11} />
                <span>agent-orchestrator</span>
              </div>
              <div className="ml-auto flex items-center gap-1 text-[10px] text-green-400/80">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                </span>
                LIVE
              </div>
            </div>
            {/* Terminal messages */}
            <div className="px-4 py-3 space-y-1.5 font-mono text-xs min-h-[72px]">
              {agentMessages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-start gap-2 ${
                    msg.type === "system"
                      ? "text-accent"
                      : "text-muted-light"
                  }`}
                >
                  {msg.type === "agent" && (
                    <Bot size={12} className="text-primary-glow mt-0.5 shrink-0" />
                  )}
                  <span>{msg.text}</span>
                </motion.div>
              ))}
              <span className="typing-cursor" />
            </div>
          </div>
        </motion.div>

        {/* Profile Photo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: 0.25,
            duration: 0.7,
            ease: [0.25, 0.4, 0.25, 1],
          }}
          className="mb-8 flex justify-center"
        >
          <div className="relative group">
            {/* Animated gradient ring */}
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary via-accent to-primary opacity-60 blur-sm group-hover:opacity-80 transition-opacity duration-500 animate-[spin_8s_linear_infinite]" />
            {/* Inner glow */}
            <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-primary via-accent to-primary opacity-40 group-hover:opacity-60 transition-opacity duration-500 animate-[spin_8s_linear_infinite_reverse]" />
            {/* Photo container */}
            <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden border-2 border-background">
              <img
                src="/avatar.jpg"
                alt="Srinivasa Rithik Ghantasala"
                className="w-full h-full object-cover grayscale-[30%] contrast-[1.1] brightness-[0.9] group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent" />
            </div>
            {/* Status indicator */}
            <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-background flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            </div>
          </div>
        </motion.div>

        {/* Name */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-4"
        >
          <span className="text-text">Hi, I&apos;m </span>
          <span className="gradient-text">{profile.shortName}</span>
        </motion.h1>

        {/* Typing role */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="font-heading text-xl sm:text-2xl lg:text-3xl text-muted-light mb-6 h-10"
        >
          <span>{displayText}</span>
          <span className="typing-cursor" />
        </motion.div>

        {/* Bio */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="text-muted text-base sm:text-lg max-w-2xl mx-auto mb-4 leading-relaxed"
        >
          {profile.bio}
        </motion.p>

        {/* Location */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex items-center justify-center gap-1 text-sm text-muted mb-8"
        >
          <MapPin size={14} />
          <span>{profile.location}</span>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-4 mb-10"
        >
          <MagneticButton>
            <a
              href="#projects"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById("projects")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-6 py-3 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary-glow transition-all duration-200 shadow-lg shadow-primary/20 block"
            >
              View My Work
            </a>
          </MagneticButton>
          <MagneticButton>
            <a
              href={`mailto:${profile.email}`}
              className="px-6 py-3 rounded-xl bg-glass border border-glass-border text-text font-medium text-sm hover:bg-surface-hover transition-all duration-200 block"
            >
              Contact Me
            </a>
          </MagneticButton>
        </motion.div>

        {/* Social Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="flex items-center justify-center gap-4"
        >
          <a
            href={profile.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="p-3 rounded-xl bg-glass border border-glass-border text-muted hover:text-text hover:border-primary/30 transition-all duration-200 cursor-pointer"
          >
            <GithubIcon size={20} />
          </a>
          <a
            href={profile.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="p-3 rounded-xl bg-glass border border-glass-border text-muted hover:text-text hover:border-primary/30 transition-all duration-200 cursor-pointer"
          >
            <LinkedinIcon size={20} />
          </a>
          <a
            href={`mailto:${profile.email}`}
            aria-label="Email"
            className="p-3 rounded-xl bg-glass border border-glass-border text-muted hover:text-text hover:border-primary/30 transition-all duration-200 cursor-pointer"
          >
            <Mail size={20} />
          </a>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown size={24} className="text-muted" />
        </motion.div>
      </motion.div>
    </section>
  );
}
