"use client";

import { GraduationCap, MapPin, Award } from "lucide-react";
import ScrollReveal, { StaggerContainer, StaggerItem } from "./ScrollReveal";
import { education } from "@/data/profile";
import GlowCard from "@/components/GlowCard";

export default function Education() {
  return (
    <section id="education" className="py-24 px-6 relative">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <ScrollReveal className="text-center mb-16">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
            <span className="gradient-text">Education</span>
          </h2>
          <p className="text-muted text-lg max-w-xl mx-auto">
            Strong academic foundation in Computer Science and Information Systems
          </p>
        </ScrollReveal>

        <StaggerContainer
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          staggerDelay={0.2}
        >
          {education.map((edu, idx) => (
            <StaggerItem key={idx} className="h-full">
              <GlowCard className="p-6 h-full flex flex-col">
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                    <GraduationCap size={24} className="text-primary-glow" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading text-lg font-bold text-text">
                      {edu.institution}
                    </h3>
                    <p className="text-muted text-sm mt-0.5">{edu.degree}</p>
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 space-y-3">
                  {/* GPA */}
                  <div className="flex items-center gap-2">
                    <Award size={14} className="text-accent" />
                    <span className="text-sm font-medium text-accent-glow">
                      GPA: {edu.gpa}
                    </span>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <MapPin size={14} />
                    {edu.location}
                  </div>
                </div>

                {/* Period */}
                <div className="mt-4 pt-4 border-t border-border">
                  <span className="text-xs text-muted">{edu.period}</span>
                </div>
              </GlowCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
