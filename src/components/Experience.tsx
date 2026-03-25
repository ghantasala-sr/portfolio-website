"use client";

import { Briefcase, MapPin } from "lucide-react";
import ScrollReveal, { StaggerContainer, StaggerItem } from "./ScrollReveal";
import { experience } from "@/data/profile";
import GlowCard from "@/components/GlowCard";

export default function Experience() {
  return (
    <section id="experience" className="py-24 px-6 relative">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <ScrollReveal className="text-center mb-16">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
            <span className="gradient-text">Experience</span>
          </h2>
          <p className="text-muted text-lg max-w-xl mx-auto">
            Building AI systems and backend architectures at scale
          </p>
        </ScrollReveal>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="timeline-line" />

          <StaggerContainer className="space-y-12" staggerDelay={0.15}>
            {experience.map((exp, idx) => (
              <StaggerItem key={idx}>
                <div
                  className={`relative flex flex-col md:flex-row items-start gap-6 ${
                    idx % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  {/* Timeline dot */}
                  <div className="absolute left-[18px] md:left-1/2 md:-translate-x-1/2 w-3 h-3 rounded-full bg-primary border-2 border-background z-10 mt-8 shadow-lg shadow-primary/30" />

                  {/* Spacer for the other side */}
                  <div className="hidden md:block md:w-1/2" />

                  {/* Card */}
                  <div className="ml-12 md:ml-0 md:w-1/2">
                    <GlowCard className="p-6">
                      {/* Period badge */}
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary-glow text-xs font-medium mb-3">
                        <Briefcase size={12} />
                        {exp.period}
                      </div>

                      {/* Company & Role */}
                      <h3 className="font-heading text-xl font-bold text-text mb-1">
                        {exp.company}
                      </h3>
                      <p className="text-primary-glow font-medium text-sm mb-1">
                        {exp.role}
                      </p>
                      {exp.subtitle && (
                        <p className="text-muted text-xs italic mb-2">
                          {exp.subtitle}
                        </p>
                      )}
                      <div className="flex items-center gap-1 text-xs text-muted mb-4">
                        <MapPin size={11} />
                        {exp.location}
                      </div>

                      {/* Bullets */}
                      <ul className="space-y-2">
                        {exp.bullets.map((bullet, bIdx) => (
                          <li
                            key={bIdx}
                            className="flex items-start gap-2 text-sm text-muted-light leading-relaxed"
                          >
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </GlowCard>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </div>
    </section>
  );
}
