import type { MetadataRoute } from "next";

/**
 * robots.txt is a request, not a control: it keeps the admin area out of search
 * results but does nothing to stop anyone reading it. The password gate in
 * src/app/admin/page.tsx is the actual protection.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/dev/"],
    },
  };
}
