import type { Metadata } from "next";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  adminConfigured,
  verifySessionToken,
} from "@/lib/admin/session";
import { getViewStore } from "@/lib/analytics/store";
import { LoginForm } from "./LoginForm";
import { Dashboard } from "./Dashboard";

export const metadata: Metadata = {
  title: "Traffic",
  // Belt and braces with robots.ts and the noindex header: this page holds
  // nothing sensitive to a search engine, but it should not be discoverable.
  robots: { index: false, follow: false, nocache: true },
};

// The gate reads a cookie, so this can never be prerendered or cached.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPage() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const authorised = await verifySessionToken(token);

  // The auth check happens on the server and the snapshot is only fetched once
  // it passes, so an unauthenticated request never receives the numbers in any
  // form: not in HTML, not in the flight payload, not in a props blob.
  if (!authorised) {
    return <LoginForm configured={adminConfigured()} />;
  }

  const data = await getViewStore().snapshot(30);
  return <Dashboard data={data} />;
}
