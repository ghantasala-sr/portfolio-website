import type { Topology } from "./types";

/**
 * Drawn from the 9 .tf files.
 *
 * Two details the README's own diagram gets wrong and that matter:
 *   - The internal ALB lives in the APP subnets (10.0.21/22.0/24), not the
 *     web subnets. It sits inside the tier it fronts.
 *   - There is ONE NAT gateway, in public[0]. That is a single-AZ dependency
 *     for every private subnet in both AZs, which is why this is honestly a
 *     two-AZ deployment rather than a highly available one.
 */
export const cloudtaskTopology: Topology = {
  id: "cloudtask",
  width: 1160,
  height: 620,
  groups: [
    { id: "vpc", label: "VPC 10.0.0.0/16", x: 130, y: 20, width: 900, height: 580, solid: true },
    { id: "pub", label: "public · 10.0.1.0/24 + 10.0.2.0/24 · the only subnets with public IPs", x: 160, y: 55, width: 840, height: 90 },
    { id: "web", label: "web (private) · 10.0.11.0/24 + 10.0.12.0/24", x: 160, y: 170, width: 840, height: 110 },
    { id: "app", label: "app (private) · 10.0.21.0/24 + 10.0.22.0/24 · internal ALB lives here", x: 160, y: 305, width: 840, height: 130 },
    { id: "db", label: "db (private) · 10.0.31.0/24 + 10.0.32.0/24 · single-AZ RDS", x: 160, y: 460, width: 840, height: 110 },
  ],
  nodes: [
    { id: "internet", label: "Internet", meta: ":80 / :443", x: 60, y: 100, kind: "source", key: true },
    { id: "extalb", label: "External ALB", meta: "internet-facing · sg: ext-alb", x: 330, y: 100, kind: "compute", key: true },
    { id: "nat", label: "NAT Gateway", meta: "public[0] only · single-AZ SPOF", x: 800, y: 100, kind: "compute", key: true },

    { id: "nginxa", label: "Nginx · AZ-a", meta: "t3.micro", x: 300, y: 225, kind: "compute", key: true },
    { id: "nginxb", label: "Nginx · AZ-b", meta: "t3.micro", x: 470, y: 225, kind: "compute" },
    { id: "info", label: "info-server", meta: "127.0.0.1:8080 · IMDSv2 → instance + AZ", x: 720, y: 225, kind: "compute" },

    { id: "intalb", label: "Internal ALB", meta: "listener :80 → target :5000", x: 330, y: 350, kind: "compute", key: true },
    { id: "flaska", label: "Flask · AZ-a", meta: "gunicorn -w 2", x: 570, y: 350, kind: "compute", key: true },
    { id: "flaskb", label: "Flask · AZ-b", meta: "gunicorn -w 2", x: 750, y: 350, kind: "compute" },
    { id: "asg", label: "Auto Scaling", meta: "2 → 4 per tier · target 70% CPU", x: 900, y: 405, kind: "observe" },

    { id: "rds", label: "RDS MySQL 8.0", meta: "db.t3.micro · publicly_accessible = false", x: 480, y: 510, kind: "store", key: true },
  ],
  edges: [
    { from: "internet", to: "extalb", kind: "sync" },
    { from: "extalb", to: "nginxa", kind: "sync" },
    { from: "extalb", to: "nginxb", kind: "sync" },
    { from: "nginxa", to: "info", kind: "sync", bend: -25 },
    { from: "nginxa", to: "intalb", kind: "sync" },
    { from: "nginxb", to: "intalb", kind: "sync" },
    { from: "intalb", to: "flaska", kind: "sync" },
    { from: "intalb", to: "flaskb", kind: "sync", bend: -20 },
    { from: "flaska", to: "rds", kind: "data" },
    { from: "flaskb", to: "rds", kind: "data" },
    { from: "flaska", to: "nat", kind: "data", bend: 90 },
  ],
  flow: ["internet", "extalb", "nginxa", "intalb", "flaska", "rds"],
};

/** The 5-SG ingress chain, by security-group reference rather than CIDR. */
export const cloudtaskSecurityChain = [
  { sg: "ext-alb-sg", allows: "80, 443", from: "0.0.0.0/0 (the only CIDR rule)" },
  { sg: "web-sg", allows: "80", from: "ext-alb-sg" },
  { sg: "int-alb-sg", allows: "80", from: "web-sg" },
  { sg: "app-sg", allows: "5000", from: "int-alb-sg" },
  { sg: "db-sg", allows: "3306", from: "app-sg" },
] as const;
