/**
 * Diagram layout checker.
 *
 * Node labels are centred SVG text that neither wraps nor clips, so two nodes
 * placed too close horizontally silently overlap their labels, and a long label
 * near an edge runs outside the viewBox. Both look like sloppy hand-drawing and
 * neither shows up in a typecheck.
 *
 * Run against the server-rendered HTML so it measures what actually ships:
 *   node scripts/check-diagrams.mjs [baseUrl]
 */

const BASE = process.argv[2] ?? "http://localhost:3000";

// JetBrains Mono advances ~0.6em. Labels carry no extra letter-spacing;
// the mono group labels add 0.06em, which clampLabel already accounts for.
const CHAR_W = 0.6;

/** Mirrors ArchitectureDiagram: labelSize = max(11, width / 78). */
const labelSize = (w) => Math.max(11, w / 78);

async function slugs() {
  const res = await fetch(`${BASE}/work`);
  const html = await res.text();
  return [...new Set([...html.matchAll(/href="\/work\/([a-z0-9-]+)"/g)].map((m) => m[1]))];
}

function parseDiagrams(html) {
  return [...html.matchAll(/<figure[^>]*>[\s\S]*?<\/figure>/g)].map((m) => m[0]);
}

function checkDiagram(fig) {
  const vb = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(fig);
  if (!vb) return null;
  const W = +vb[1];
  const H = +vb[2];
  const size = labelSize(W);
  const metaSize = size * 0.82;

  // Nodes render as <g data-node transform="translate(x y)"> with a centred
  // <text> label and an optional <text> meta line beneath it.
  // Read the anchor and dy the renderer actually emitted, so the check
  // verifies the shipped geometry rather than re-deriving it.
  const nodes = [...fig.matchAll(
    /data-node[^>]*transform="translate\((-?[\d.]+) (-?[\d.]+)\)"[\s\S]*?<text x="(-?[\d.]+)" y="([\d.]+)" text-anchor="(start|middle|end)"[^>]*>([^<]*)<\/text>(?:\s*<text x="-?[\d.]+" y="[\d.]+" text-anchor="(?:start|middle|end)"[^>]*>([^<]*)<\/text>)?/g,
  )].map((m) => {
    const x = +m[1];
    const y = +m[2];
    const tx = +m[3];
    const dy = +m[4];
    const anchor = m[5];
    const label = m[6] ?? "";
    const meta = m[7] ?? "";
    const w = Math.max(label.length * size * CHAR_W, meta.length * metaSize * CHAR_W);
    const ax = x + tx;
    const left = anchor === "start" ? ax : anchor === "end" ? ax - w : ax - w / 2;
    return { x, y: y + dy, label, meta, w, left, right: left + w };
  });

  const issues = [];

  for (const n of nodes) {
    if (n.left < -6) issues.push(`"${n.label}" runs ${Math.round(-n.left)}px off the LEFT edge`);
    if (n.right > W + 6) issues.push(`"${n.label}" runs ${Math.round(n.right - W)}px off the RIGHT edge`);
    if (n.y + 20 > H + 2) issues.push(`"${n.label}" label falls ${Math.round(n.y + 20 - H)}px below the viewBox`);
  }

  // Labels sit ~26px below the node and are one or two lines, so treat rows
  // within 44px as sharing horizontal space.
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      if (Math.abs(a.y - b.y) >= 22) continue;
      const overlap = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      if (overlap > 6) {
        issues.push(
          `"${a.label}" and "${b.label}" overlap by ${Math.round(overlap)}px (dy=${Math.round(Math.abs(a.y - b.y))})`,
        );
      }
    }
  }

  return { W, H, count: nodes.length, issues };
}

let total = 0;
let failed = 0;

for (const slug of await slugs()) {
  const html = await (await fetch(`${BASE}/work/${slug}`)).text();
  const figs = parseDiagrams(html);
  figs.forEach((fig, i) => {
    const r = checkDiagram(fig);
    if (!r) return;
    total++;
    const tag = `${slug}${figs.length > 1 ? ` [${i + 1}/${figs.length}]` : ""}`;
    if (r.issues.length) {
      failed++;
      console.log(`FAIL ${tag}  ${r.W}x${r.H}, ${r.count} nodes`);
      for (const s of r.issues) console.log(`       ${s}`);
    } else {
      console.log(`ok   ${tag}  ${r.W}x${r.H}, ${r.count} nodes`);
    }
  });
}

console.log(`\n${total - failed}/${total} diagrams clean`);
process.exit(failed ? 1 : 0);
