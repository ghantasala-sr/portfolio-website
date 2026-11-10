import type { Topology } from "./types";

/**
 * The request lifecycle, drawn so the one claim the project makes is visible:
 * the model is never the thing deciding what comes back.
 *
 * Identity enters from whichever IdP signed the login, becomes a short-lived
 * token, and is re-checked against the database on every request. The agent
 * holds one tool and never receives the identity at all, because the tool runs
 * inside the caller's own row-level-security context. Whatever Postgres refuses
 * is simply not in the model's input.
 */
export const gatekeeperTopology: Topology = {
  id: "gatekeeper",
  width: 1220,
  height: 600,
  groups: [
    {
      id: "decides",
      label: "Postgres decides, not the model",
      x: 820,
      y: 280,
      width: 290,
      height: 150,
    },
  ],
  nodes: [
    { id: "okta", label: "Okta · Acme", meta: "OIDC + PKCE", x: 100, y: 95, kind: "source", key: true },
    { id: "saml", label: "Keycloak / Entra", meta: "SAML 2.0", x: 100, y: 265, kind: "source", key: true },
    { id: "bridge", label: "Auth bridge", meta: "tenant from issuer only", x: 300, y: 180, kind: "compute", key: true },
    { id: "token", label: "Access token", meta: "RS256 · 15 min · scopes", x: 520, y: 180, kind: "compute", key: true },
    { id: "api", label: "FastAPI /chat", meta: "live user re-check", x: 730, y: 180, kind: "compute", key: true },
    { id: "audit", label: "audit_log", meta: "INSERT only", x: 1080, y: 95, kind: "store" },
    { id: "agent", label: "LangGraph agent", meta: "one tool: {query}", x: 730, y: 350, kind: "compute", key: true },
    { id: "claude", label: "Claude", meta: "never sees identity", x: 440, y: 430, kind: "model", key: true },
    { id: "rls", label: "Postgres · FORCE RLS", meta: "tenant AND role policy", x: 960, y: 350, kind: "store", key: true },
    { id: "recheck", label: "Independent re-check", meta: "forbidden chunks = 0", x: 1080, y: 500, kind: "observe", key: true },
  ],
  edges: [
    { from: "okta", to: "bridge", kind: "sync" },
    { from: "saml", to: "bridge", kind: "sync" },
    { from: "bridge", to: "token", kind: "sync" },
    { from: "token", to: "api", kind: "sync" },
    { from: "api", to: "audit", kind: "async", bend: -40 },
    { from: "api", to: "agent", kind: "sync" },
    { from: "agent", to: "claude", kind: "sync" },
    { from: "agent", to: "rls", kind: "sync" },
    { from: "rls", to: "recheck", kind: "async" },
  ],
  flow: ["okta", "bridge", "token", "api", "agent", "rls"],
};

/**
 * The seven layers from the README's defense-in-depth table, each with the file
 * that implements it. Any one of them would stop a leak on its own.
 */
export const gatekeeperLayers = [
  { n: "1", layer: "Company IdP", guarantee: "Identity is proven by the customer's own Okta or SAML provider. Gatekeeper never handles a password.", where: "app/auth/oidc.py · saml.py" },
  { n: "2", layer: "Auth bridge", guarantee: "The tenant comes only from which IdP signed the login, never from user input. The lowest role wins.", where: "app/auth/bridge.py" },
  { n: "3", layer: "Token plus live check", guarantee: "A 15-minute RS256 token, and the user is re-read as active and same-role on every single request.", where: "app/auth/tokens.py" },
  { n: "4", layer: "Least-privilege DB role", guarantee: "The API connects as a role that is not owner, not superuser, and holds no BYPASSRLS and no DDL.", where: "migrations/003_app_role.sql" },
  { n: "5", layer: "Row-level security", guarantee: "A permissive tenant policy and a restrictive role policy, set per transaction. No context means no rows at all.", where: "migrations/004 and 005" },
  { n: "6", layer: "Tool sandbox", guarantee: "The agent's only tool accepts a query string and nothing else. Extra arguments are rejected, not ignored.", where: "app/rag/agent.py" },
  { n: "7", layer: "Audit and re-check", guarantee: "An insert-only log of exactly which chunks the model saw, plus an independent re-check of every one.", where: "app/audit.py · trace.py" },
] as const;
