"use client";

import { useState, useEffect } from "react";
import {
  ExternalLink,
  Star,
  GitFork,
  Calendar,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import ScrollReveal, { StaggerContainer, StaggerItem } from "./ScrollReveal";
import { projects, type Project } from "@/data/projects";
import { fetchGitHubRepos, type GitHubRepo } from "@/lib/github";
import GlowCard from "@/components/GlowCard";

function GithubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

export default function Projects() {
  const [repoData, setRepoData] = useState<Record<string, GitHubRepo>>({});
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    async function loadRepos() {
      const repos = await fetchGitHubRepos();
      const repoMap: Record<string, GitHubRepo> = {};
      repos.forEach((repo) => {
        repoMap[repo.full_name] = repo;
      });
      setRepoData(repoMap);
    }
    loadRepos();
  }, []);

  const featuredProjects = projects.filter((p) => p.featured);
  const otherProjects = projects.filter((p) => !p.featured);
  const displayedOther = showAll ? otherProjects : otherProjects.slice(0, 3);

  return (
    <section id="projects" className="py-24 px-6 relative">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <ScrollReveal className="text-center mb-16">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
            <span className="gradient-text">Featured Projects</span>
          </h2>
          <p className="text-muted text-lg max-w-xl mx-auto">
            Production-grade systems I&apos;ve built end-to-end
          </p>
        </ScrollReveal>

        {/* Featured projects - large cards */}
        <StaggerContainer className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16" staggerDelay={0.1}>
          {featuredProjects.map((project, idx) => (
            <StaggerItem key={idx}>
              <ProjectCard project={project} repoData={repoData} featured />
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Other projects heading */}
        {otherProjects.length > 0 && (
          <>
            <ScrollReveal className="text-center mb-10">
              <h3 className="font-heading text-2xl font-bold text-text mb-2">
                More Projects
              </h3>
              <div className="section-divider max-w-[200px] mx-auto" />
            </ScrollReveal>

            <StaggerContainer
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
              staggerDelay={0.08}
            >
              {displayedOther.map((project, idx) => (
                <StaggerItem key={idx}>
                  <ProjectCard project={project} repoData={repoData} />
                </StaggerItem>
              ))}
            </StaggerContainer>

            {otherProjects.length > 3 && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-glass border border-glass-border text-muted hover:text-text hover:border-primary/30 transition-all duration-200 text-sm font-medium cursor-pointer"
                >
                  {showAll ? "Show Less" : "View All Projects"}
                  <ChevronRight
                    size={14}
                    className={`transition-transform ${
                      showAll ? "rotate-90" : ""
                    }`}
                  />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function ProjectCard({
  project,
  repoData,
  featured = false,
}: {
  project: Project;
  repoData: Record<string, GitHubRepo>;
  featured?: boolean;
}) {
  const repo = project.github ? repoData[project.github] : null;

  return (
    <GlowCard
      className={`p-6 h-full flex flex-col ${
        project.specialBadge
          ? "border-accent/40 bg-accent/5 ring-1 ring-accent/20"
          : featured
          ? "border-primary/30 shadow-primary/10 shadow-lg"
          : ""
      }`}
    >
      {/* Special Badge */}
      {project.specialBadge && (
        <div className="mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/20 text-accent font-semibold text-xs border border-accent/30 shadow-sm shadow-accent/20">
            {project.specialBadge}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {featured && (
              <Sparkles size={14} className="text-primary-glow" />
            )}
            <h3 className="font-heading text-lg font-bold text-text">
              {project.title}
            </h3>
          </div>
          <p className="text-primary-glow text-sm font-medium">
            {project.subtitle}
          </p>
        </div>
        {project.github && (
          <a
            href={`https://github.com/${project.github}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-glass border border-glass-border text-muted hover:text-text hover:border-primary/30 transition-all duration-200 cursor-pointer"
            aria-label={`View ${project.title} on GitHub`}
          >
            <GithubIcon size={16} />
          </a>
        )}
      </div>

      {/* Description */}
      <p className="text-muted text-sm leading-relaxed mb-4 flex-1">
        {project.description}
      </p>

      {/* Highlights */}
      {featured && project.highlights && (
        <ul className="space-y-1.5 mb-4">
          {project.highlights.map((h, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-xs text-muted-light"
            >
              <ChevronRight
                size={10}
                className="text-primary mt-0.5 shrink-0"
              />
              {h}
            </li>
          ))}
        </ul>
      )}

      {/* Tech tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {project.tech.map((t) => (
          <span
            key={t}
            className="px-2 py-0.5 text-[11px] rounded-md bg-primary/8 text-primary-glow border border-primary/10"
          >
            {t}
          </span>
        ))}
      </div>

      {/* Footer with GitHub stats & date */}
      <div className="flex items-center justify-between pt-3 border-t border-border text-xs text-muted">
        <div className="flex items-center gap-3">
          {repo && (
            <>
              {repo.stargazers_count > 0 && (
                <span className="flex items-center gap-1">
                  <Star size={11} />
                  {repo.stargazers_count}
                </span>
              )}
              {repo.forks_count > 0 && (
                <span className="flex items-center gap-1">
                  <GitFork size={11} />
                  {repo.forks_count}
                </span>
              )}
              {repo.language && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-accent" />
                  {repo.language}
                </span>
              )}
            </>
          )}
        </div>
        <span className="flex items-center gap-1">
          <Calendar size={11} />
          {project.date}
        </span>
      </div>
    </GlowCard>
  );
}
