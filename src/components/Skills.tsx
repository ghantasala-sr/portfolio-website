"use client";

import ScrollReveal, { StaggerContainer, StaggerItem } from "./ScrollReveal";
import { skillCategories } from "@/data/profile";
import GlowCard from "@/components/GlowCard";
import { motion } from "framer-motion";

export default function Skills() {
  return (
    <section id="skills" className="py-24 px-6 relative">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <ScrollReveal className="text-center mb-16">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
            <span className="gradient-text">Technical Skills</span>
          </h2>
          <p className="text-muted text-lg max-w-xl mx-auto">
            Technologies and tools I work with
          </p>
        </ScrollReveal>

        <StaggerContainer className="space-y-8" staggerDelay={0.12}>
          {skillCategories.map((category) => (
            <StaggerItem key={category.name}>
              <GlowCard className="p-6">
                {/* Category header */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <h3
                    className="font-heading text-lg font-semibold"
                    style={{ color: category.color }}
                  >
                    {category.name}
                  </h3>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Skill tags */}
                <div className="flex flex-wrap gap-2">
                  {category.skills.map((skill, i) => (
                    <motion.span
                      key={skill}
                      animate={{ y: [0, -4, 0] }}
                      transition={{
                        duration: 3 + (i % 3),
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.1,
                      }}
                      className="skill-tag px-3 py-1.5 text-sm rounded-lg border text-muted-light bg-glass"
                      style={{
                        backgroundColor: `${category.color}08`,
                        borderColor: `${category.color}20`,
                      }}
                    >
                      {skill}
                    </motion.span>
                  ))}
                </div>
              </GlowCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
