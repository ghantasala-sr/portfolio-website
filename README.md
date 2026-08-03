# Portfolio. Srinivasa Rithik Ghantasala

Dark-first, WebGL-led portfolio. Next 16 · React 19 · Tailwind v4 · three.js · GSAP.

```bash
npm run dev        # dev server on :3000
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run lint
npm run analyze    # bundle analyzer
```

Every public page is prerendered. The only server-rendered routes are the private
`/admin` dashboard and the three endpoints behind it.

## Before you deploy

No asset files are required. The résumé is deliberately not published as a PDF:
the header carries a Contact link and the footer's Résumé row is a prefilled
`mailto`, so a request arrives as an email rather than a download. That avoids a
stale copy of the CV sitting on a public, indexable URL.

One content field is unfilled: the containing **book title** for the Taylor &
Francis chapter in `src/content/experience.ts` (their CDN blocks automated fetches,
so authors/DOI/publisher are there but the book title is not).

## Deploying

Live at **portfolio-gsr.vercel.app**, served by the Vercel project `portfolio-gsr`
(id `prj_XafDPcMEGShoCwpeHNNigPkzH1Vl`). Source of truth is
`ghantasala-sr/portfolio-website` on `master`.

**That project has no Git connection, so pushing to GitHub does not deploy.**
Worth stating plainly because it is easy to lose an afternoon to: a push
succeeds, nothing changes, and the old deployment keeps serving from cache as
though the build simply had not finished.

```bash
npx vercel --prod   # what actually updates the live site
```

To make pushes deploy on their own, authorize Vercel's GitHub App for the
`ghantasala-sr` account, then run `npx vercel git connect`. Until that
authorization exists, `git connect` fails with a generic "make sure you have
access" error that does not name the real cause.

There is also a second, unrelated project `portfolio-website-gsr` whose newest
deployment predates this rebuild. It does not serve this URL.

## The private dashboard at `/admin`

Visitor counts, visible only to you. It is not linked from anywhere on the site,
excluded in `robots.ts`, and marked `noindex`. None of that is protection, so the
real gate is a password.

Copy `.env.example` to `.env.local` for local use, and set the same four
variables in the Vercel project settings for production:

| Variable | Purpose |
|---|---|
| `ADMIN_PASSWORD` | what you type at `/admin` |
| `ADMIN_SESSION_SECRET` | signs the session cookie. `openssl rand -hex 32` |
| `UPSTASH_REDIS_REST_URL` | Upstash console → your Redis database → REST API |
| `UPSTASH_REDIS_REST_TOKEN` | same screen |

Upstash's free tier is far past what a portfolio generates. With the two Redis
variables missing the page still works, but counts fall back to an in-memory
counter that resets on restart, and the dashboard says so.

How it works: `TrackView` in the root layout posts the pathname to `/api/track`
after paint, including on client-side navigations, which a server hook could not
see because the pages are prerendered. The route hashes IP + user agent + date +
secret, adds the digest to a HyperLogLog sketch, and increments four counters.

What it deliberately does not do:

- **Store anything identifying.** The IP and user agent are hashed and dropped.
  HyperLogLog keeps a cardinality estimate, not members, so there is no stored
  value that can be turned back into a visitor.
- **Follow anyone across days.** The date is inside the hash, so the same person
  is a different id tomorrow. The cost of that choice is that "uniques" is a
  strictly per-day figure and summing it across the month is meaningless.
- **Record referrer URLs.** Only the bare hostname; a full referrer can carry a
  search query or a session token.
- **Count you reading the dashboard,** or anything self-identifying as a bot.

## How this is organised

```
src/content/ all copy and data, typed, no CMS
  projects.ts           16 projects; every fact carries a `source` string
  topology/             one module per project → feeds BOTH the card glyph
                        and the case-study diagram, so they cannot drift
src/components/
  hero/                 the WebGL event graph + its SVG fallback
  diagram/              glyph + scroll-scrubbed architecture diagram
  webgl/billboard.ts    shared instanced-quad + GLSL helpers
src/lib/scroll/         Lenis ↔ GSAP ↔ R3F bridge (one rAF, explicit order)
```

## Things that will bite you if you change them

- **`matrixUniformsGLSL` must stay at the top of every RawShaderMaterial vertex
  shader.** RawShaderMaterial injects no built-in declarations; omit it and every
  program fails to link, which presents as a silently black canvas.
- **The curve `DataTexture` must be `NearestFilter`.** `FloatType` + `LinearFilter`
  is an incomplete texture wherever `OES_texture_float_linear` is missing; three
  only warns and sampling returns `(0,0,0,1)`, collapsing all packets to the origin.
- **Never hide an `<h1>` to animate it.** Headings use `.enter-rise`, which animates
  transform only. Opacity or clip-path would leave the LCP element unpainted until
  JS runs, and CSS animations are *paused* in a background tab, so a `both` fill
  hides it indefinitely. `.enter-fade` (opacity) is for non-LCP elements only.
- **`react`/`react-dom` are pinned to 19.2.x exactly** because
  `@react-three/fiber@9.7` peers `react ">=19 <19.3"`. `three` and `@types/three`
  are pinned to the same exact version because three ships no types.
- **`lenis.raf()` takes milliseconds; `advance()` takes seconds.** Both are called
  from the same GSAP ticker callback in `ScrollProvider`.
- Don't add `scroll-behavior: smooth` to `html`. It fights Lenis.
- **Never put a counter in a module-level variable.** Next compiles server code
  into several layers, so a route handler and a Server Component hold *different
  instances* of the same module: writes land in one and reads return zero from
  the other. The in-memory analytics fallback keeps its state on `globalThis` for
  exactly this reason.
- **Never prefix an admin variable with `NEXT_PUBLIC_`.** That inlines it into the
  client bundle. `/admin` reads its cookie in a Server Component and only fetches
  the numbers after the check passes, so an unauthenticated request receives them
  in no form at all: not HTML, not the flight payload, not a props blob.

## Verification

- `/dev/shader-check` (dev only) compiles the real shader sources in a
  self-created GL context and reports the driver's logs. Use it when the canvas
  goes black; the live scene can't be inspected if R3F never gets a measured
  container size.
- Contrast: all eight informational colour tokens clear WCAG AA 4.5:1 in both
  themes. Re-check after any token change.
- `three` must stay out of the initial payload. `npm run analyze` to confirm.
- The `/admin` gate is worth re-testing after any change to it. Against a running
  dev server, each of these must hold: `/admin` with no cookie contains no
  numbers; a forged `pf_admin` cookie is rejected; a wrong password and a
  malformed body return the *same* 401 body; and `document.cookie` in the browser
  never shows `pf_admin`, because it is httpOnly.
