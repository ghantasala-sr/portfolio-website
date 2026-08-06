import { projects } from "./projects";

/**
 * Counts that appear in prose, derived rather than typed.
 *
 * Adding one project used to mean editing four unrelated sentences, and the
 * evidence that this does not work is that two of them were already wrong: the
 * stat strip said 16 repositories and the index said six animated diagrams
 * while the data held 8. On a site whose entire claim is that its numbers are
 * checkable, a hand-maintained count is the one thing that cannot be allowed to
 * drift.
 */

/** Small numbers read better spelled out in a headline than as digits. */
const NUMBER_WORDS = [
  "Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight",
  "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen",
  "Sixteen", "Seventeen", "Eighteen", "Nineteen", "Twenty",
];

/** Capitalised, for the start of a heading. */
export function spellOut(n: number): string {
  return NUMBER_WORDS[n] ?? String(n);
}

/** Lowercase, for mid-sentence prose. */
export function spellOutLower(n: number): string {
  return spellOut(n).toLowerCase();
}

export const projectCount = projects.length;
export const featuredCount = projects.filter((p) => p.featured).length;
export const diagramCount = projects.filter((p) => p.hasDiagram).length;
