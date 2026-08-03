"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Fires one beacon per page view, including client-side route changes, which a
 * server-side hook could not see because every page here is prerendered.
 *
 * Deliberately cheap and unobtrusive:
 *  - runs in an effect after paint, so it never delays rendering
 *  - `keepalive` so the request survives the navigation that triggered it
 *  - a ref guard keyed on pathname, because React StrictMode double-invokes
 *    effects in development and would otherwise count every view twice
 *  - failures are ignored; nothing on the page depends on this
 *  - skipped entirely on /admin, so reading the dashboard does not inflate it
 */
export function TrackView() {
  const pathname = usePathname();
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    if (lastSent.current === pathname) return;
    lastSent.current = pathname;

    // document.referrer is only meaningful on the first load of a session; on a
    // client-side navigation it still points at the original entry page, which
    // is what we want to attribute the visit to.
    const payload = JSON.stringify({
      path: pathname,
      ref: document.referrer || null,
    });

    void fetch("/api/track", {
      method: "POST",
      body: payload,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
