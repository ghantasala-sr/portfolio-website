import Link from "next/link";
import { profile } from "@/content/profile";

const contactLinks = [
  { label: "Email", href: `mailto:${profile.email}`, value: profile.email },
  { label: "GitHub", href: profile.links.github, value: "ghantasala-sr" },
  { label: "LinkedIn", href: profile.links.linkedin, value: "in/srithik" },
  // Not a download. The href is a prefilled email, so asking is one click.
  {
    label: "Résumé",
    href: profile.resumeOnRequest.href,
    value: profile.resumeOnRequest.label,
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="relative z-10 mt-32 rule-t">
      <div className="shell py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="label mb-6">Contact</p>
            <h2 className="mb-6 max-w-[24ch] text-d3">
              Currently looking for my next role.
            </h2>
            <p className="prose-measure mb-8 text-[0.9375rem] text-text-dim">
              {profile.location} · {profile.relocation}. The fastest way to
              reach me is email. I read everything, and I will send my résumé
              straight back if you ask for it.
            </p>
            <a
              href={`mailto:${profile.email}`}
              data-cursor="link"
              data-magnetic
              className="group inline-flex items-center gap-3 border-b pb-1 text-lg transition-colors"
              style={{ borderColor: "var(--accent)" }}
            >
              <span>{profile.email}</span>
              <span
                aria-hidden="true"
                className="transition-transform duration-300 group-hover:translate-x-1"
                style={{ color: "var(--accent)" }}
              >
                →
              </span>
            </a>
          </div>

          <div>
            <p className="label mb-6">Elsewhere</p>
            <ul className="space-y-0">
              {contactLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel={
                      link.href.startsWith("http")
                        ? "noreferrer noopener"
                        : undefined
                    }
                    data-cursor="link"
                    className="group flex items-baseline justify-between gap-4 border-b border-line py-3 transition-colors hover:border-line-strong"
                  >
                    <span className="label transition-colors group-hover:text-text">
                      {link.label}
                    </span>
                    <span className="font-mono text-[0.8125rem] text-text-dim transition-colors group-hover:text-text">
                      {link.value}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="label">
            © {new Date().getFullYear()} {profile.name}
          </p>
          <p className="label">
            Built with Next.js, three.js and GSAP ·{" "}
            <Link href="/work" className="transition-colors hover:text-text">
              See the work
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
