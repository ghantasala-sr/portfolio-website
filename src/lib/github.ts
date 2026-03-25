export interface GitHubRepo {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  topics: string[];
}

const GITHUB_USERNAME = "ghantasala-sr";
const GITHUB_API = "https://api.github.com";

export async function fetchGitHubRepos(): Promise<GitHubRepo[]> {
  try {
    const res = await fetch(
      `${GITHUB_API}/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated&type=public`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!res.ok) {
      console.warn(`GitHub API returned ${res.status}`);
      return [];
    }

    return await res.json();
  } catch (error) {
    console.warn("Failed to fetch GitHub repos:", error);
    return [];
  }
}

export async function fetchRepoDetails(
  repoSlug: string
): Promise<GitHubRepo | null> {
  try {
    const res = await fetch(`${GITHUB_API}/repos/${repoSlug}`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function getRepoUrl(repoSlug: string): string {
  return `https://github.com/${repoSlug}`;
}
