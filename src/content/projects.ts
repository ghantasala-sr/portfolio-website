import type { Project } from "./types";

const GH = "https://github.com/ghantasala-sr";

/**
 * Every fact in this file is checkable against the linked repo.
 *
 * Deliberately absent, because no measurement artifact exists for them:
 *   - Argus "under 15 seconds" / "85%+ security detection" / "~$2 per month"
 *   - Argus "real-time dashboard" (it polls REST every 30s; no WebSocket)
 *   - SecSignal "1,189 filing chunks" (a point-in-time row count)
 *   - MealMind "±20% tolerance" and the SPCS deployment claim
 *   - CampusVitality "85% test coverage" and CI
 *   - CloudTask "$3-5/hour" (real cost is ~$0.15-0.25/hour)
 *
 * Where a repo's README and its code disagree, the code wins.
 */
export const projects: Project[] = [
  {
    slug: "gatekeeper",
    name: "Gatekeeper",
    tagline: "A multi-tenant AI assistant where Postgres, not the model, decides what you see",
    summary:
      "Two fictional companies share one deployment, each signing in through its own identity provider, and each employee's clearance is enforced by the database rather than by asking the model to behave. A LangGraph agent holds exactly one tool, which searches inside the signed-in user's row-level-security context, so forbidden passages are not refused by the model, they are never retrieved. Every answer carries the backend's own trace of each check, and the whole access matrix is covered by tests against a real Postgres.",
    lane: "full-stack",
    lanes: ["full-stack", "agentic-ai", "infra"],
    stack: [
      "Python",
      "FastAPI",
      "PostgreSQL 16",
      "pgvector",
      "Row-level security",
      "OIDC",
      "SAML 2.0",
      "SCIM 2.0",
      "LangGraph",
      "Claude",
      "Next.js",
      "Keycloak",
    ],
    facts: [
      {
        value: "15 → 0",
        label: "forbidden passages reaching the model",
        source: "docs/SECURITY.md: three ordinary questions sent 15 of 15 with prompt-only rules, 0 with RLS",
      },
      {
        value: "225",
        label: "tests against a real Postgres, plus 3 live",
        source: "Counted per file: 24 matrix, 73 identity, 28 RLS, 23 SCIM and the rest. CI runs them on a fresh pgvector",
      },
      {
        value: "7",
        label: "independent layers, any one of which stops a leak",
        source: "IdP, bridge, token re-check, least-privilege role, RLS, tool sandbox, audit",
      },
      {
        value: "0",
        label: "rows visible without a role, not even public",
        source: "migrations/005_rls_role.sql: the restrictive policy's ELSE branch is false",
      },
    ],
    repo: `${GH}/GateKeeper`,
    period: "2026",
    featured: true,
    hasDiagram: true,
    caseStudy: {
      problem:
        "A user can type anything into an AI chat, including an instruction to ignore its rules and show another company's financial plan. If the only thing standing between that user and the data is the model choosing to refuse, then a good enough prompt eventually gets through, and the refusal is not even the interesting failure: by the time the model declines, the data has already left the database and been placed in its context. The question is not how to make a model refuse reliably. It is how to make sure it never holds anything it should not.",
      approach:
        "Authorization lives in Postgres. Each tenant maps to the identity provider that signed its logins, so the tenant is derived from a verified issuer rather than anything the user sends. A login becomes a 15-minute RS256 token, and the user is re-read as active and same-role on every request, which is how a deactivation takes effect on the next call instead of when a token expires. Each request opens a transaction, sets the tenant and role as transaction-local settings, and runs as a database role that is not the owner and holds no BYPASSRLS. A permissive tenant policy and a restrictive role policy then filter every read. The agent runs inside that context with one tool that accepts a query string and nothing else, so the model chooses the words it searches for and has no other influence on what comes back.",
      decisions: [
        {
          title: "The model is never the security guard",
          body: "With the rules written only into the system prompt, three ordinary questions from an employee pulled 15 of 15 forbidden passages into the model's context, including another tenant's salary bands. The model happened to refuse all three. Moving the rule into a restrictive row-level-security policy takes the same three questions to 0 retrieved. What the model never receives, it cannot repeat, and that is a property rather than a behaviour.",
        },
        {
          title: "An unknown role sees nothing, not even public",
          body: "The restrictive policy's final branch is false rather than a public default. A request that somehow forgot to set its role returns an empty result instead of quietly degrading to the most permissive view, which is the direction a security control should fail in.",
        },
        {
          title: "Derive the tenant from who signed the login",
          body: "The bridge maps a verified issuer to a tenant and takes the lowest role the claims support. Nothing about the tenant comes from the request body, a header or a token the client could shape, and the OIDC issuer and SAML entity ID are pinned to configuration rather than trusted from a discovery document.",
        },
        {
          title: "Hold the audit log at arm's length from the app",
          body: "The application role has INSERT on the audit table and not SELECT, so a compromised application can write its own trail but cannot read or erase it. Each chat records the exact chunk IDs handed to the model, which is what makes the independent re-check meaningful rather than decorative.",
        },
        {
          title: "Turn the tool boundary into a test",
          body: "The agent's schema sets additionalProperties false, so a call carrying a tenant_id or role is rejected with an error rather than silently ignored, and a test asserts the rejection. Another asserts the tool returns exactly what a direct search returns, which is the only way to know the agent path has not grown a second opinion about access.",
        },
      ],
      learned:
        "The thing I did not expect was the approximate index. Vector search with an HNSW index returns candidates first and lets row-level security filter them afterwards, so an employee asking about salaries got zero results rather than the five public ones they were entitled to: the index had handed back only rows the policy then removed. Enabling iterative scans fixed it. It taught me that adding an authorization layer underneath a retrieval system changes the retrieval system's behaviour, and that correctness here was not just about what leaks out but about what stops coming back.",
    },
  },
  {
    slug: "gatekeeper-enclave",
    name: "Gatekeeper Enclave",
    tagline: "The same assistant, sealed into a GCP network with no route to the internet",
    summary:
      "A companion deployment that puts Gatekeeper into a private GCP project with no NAT, no internet route and no external IP, where the only way out is Google's restricted API range and the only way in is an IAP tunnel to a bastion. Releases arrive as one checksummed offline bundle because nothing inside can download anything. Every guarantee it claims was drilled on the running system and written up with timings, including the two drills that failed on the first attempt.",
    lane: "infra",
    lanes: ["infra"],
    stack: [
      "Terraform",
      "GKE private cluster",
      "Cloud SQL 17",
      "Helm",
      "Binary Authorization",
      "Workload Identity",
      "Secret Manager",
      "Vertex AI / Gemini",
      "IAP",
      "Cloud Monitoring",
      "k6",
    ],
    facts: [
      {
        value: "0",
        label: "failed requests through upgrade, rollback and failover",
        source: "docs/drills: upgrade and HA drills under k6 load, each passed on a second attempt after a documented failure",
      },
      {
        value: "24 min",
        label: "to recover from a deletion, against a 60-minute target",
        source: "docs/drills/2026-10-23-restore.md: RTO 24 minutes, RPO about 5 seconds",
      },
      {
        value: "~3.5 min",
        label: "from an egress attempt to the alert firing",
        source: "docs/drills/2026-10-23-egress-alert.md",
      },
      {
        value: "10",
        label: "Terraform modules, with a CI guard against drifting open",
        source: "proof/check_terraform_plan.py rejects NAT, 0.0.0.0/0 routes, external IPs and public endpoints",
      },
    ],
    repo: `${GH}/GateKeeper-enclave`,
    period: "2026",
    featured: true,
    hasDiagram: true,
    caseStudy: {
      problem:
        "A customer whose security team will not allow outbound internet cannot run most AI applications at all, because the usual deployment assumes a model behind a public API, images pulled at deploy time, and packages installed on the fly. Saying a system is air-gapped is easy. The harder question is whether the claim survives contact with an operator: whether a release can actually get in, whether a failover drops requests, whether a restore meets its target, and whether anyone has ever checked rather than assumed.",
      approach:
        "The network is built with no NAT, no default route and no external IPs, so its only egress is Google's restricted API range, which is also how it reaches Gemini on Vertex. That constraint is what swapped the model: the application repo calls Claude over the public internet, which here would be an egress violation. A deny-all egress firewall logs every attempt and raises an alert. Releases are built on a separate machine into one checksummed bundle carrying images, chart, SBOMs and signatures, and the installer on the bastion verifies each pushed digest against the signed one before Binary Authorization will admit it. Pods use Workload Identity with no service-account keys, and secrets arrive from Secret Manager as mounted files rather than Kubernetes Secrets. Ten Terraform modules describe the whole thing, and a plan guard rejects any change that would reintroduce a route out.",
      decisions: [
        {
          title: "Make the network unable to drift open",
          body: "A guard reads every Terraform plan and fails on a Cloud NAT, a route to anywhere, an external IP, a public GKE control plane or a Cloud SQL public address. The point is that zero egress is a property someone can reinstate by accident in one line, so the check belongs in the pipeline rather than in a reviewer's memory. The guard has its own unit tests, which run in CI.",
        },
        {
          title: "Ship releases as a bundle, because nothing can download",
          body: "The build machine records each image digest, generates an SBOM and signs every digest. The bastion verifies checksums, pushes, confirms each pushed digest matches the signed one, and installs the chart by digest. Binary Authorization then refuses anything unsigned, which the supply-chain drill proved by pushing a tampered image under the release's own tag and watching it get refused and logged.",
        },
        {
          title: "Drill the claims, and keep the failures",
          body: "Each guarantee has a script in proof/ and a dated write-up in docs/drills/. The upgrade drill and the node-drain drill both failed the first time and the write-ups say so, along with what changed. A drill that has never failed has mostly tested the person writing it, so the first attempts are the most useful artifacts in the repository.",
        },
        {
          title: "Separate the recovery target from the recovery time",
          body: "The restore drill set an RPO of 15 minutes and an RTO of an hour, then measured about 5 seconds and 24 minutes. Nearly all the 24 went to Cloud SQL cloning, and the drill found that the clone command gives up after 10 minutes while this clone took 24, so the script now starts it and polls instead of waiting on the call.",
        },
        {
          title: "State what is not hardened",
          body: "Keycloak runs as a single replica, VPC Service Controls are absent because they need a Google Cloud Organization this project does not have, and the private CA is a Terraform-managed key where production would use Certificate Authority Service. None of those undo zero egress, and listing them is cheaper than having a security reviewer find them.",
        },
      ],
      learned:
        "The game day was worth more than any individual drill. Three failures at once, fixed using nothing but the runbook, took 11 minutes 54 seconds, and about 9 of those went to a gap in the runbook rather than to the failures themselves. Fixing the document brought the expected time to roughly 3 minutes. I had been treating the runbook as documentation of the system, and it is better understood as part of the system, with its own failure modes and its own need to be exercised.",
    },
  },
  {
    slug: "voicedesk",
    name: "VoiceDesk",
    tagline: "A voice support agent that checks every sentence for grounding before it is spoken",
    summary:
      "A real-time phone-support agent that answers from a policy knowledge base, takes actions through tools, and hands off to a human with a written summary when it is not confident. The engine is domain-agnostic; the reference deployment is tier-one support for a fictional ticketing company. What distinguishes it is the measurement: every number it reports comes from a dated run directory, the improvements are paired significance tests on identical seeds, and the figures produced without a live model are labelled as such everywhere rather than left to imply more than they show.",
    lane: "ml-eval",
    lanes: ["ml-eval", "agentic-ai", "full-stack"],
    stack: [
      "Python",
      "Pipecat",
      "Silero VAD",
      "Deepgram",
      "Cartesia",
      "PostgreSQL",
      "pgvector",
      "BM25 + RRF",
      "Vertex AI / Gemini 2.5 Flash",
      "OpenTelemetry",
      "FastAPI",
    ],
    facts: [
      {
        value: "p = 1.5e-5",
        label: "McNemar exact, containment 0.737 to 0.793",
        source: "results/2026-10-15-feedback-cycle/metrics.json: 300 calls, identical seeds, paired +17 and -0",
      },
      {
        value: "0",
        label: "duplicate side effects across 34 fault tests",
        source: "eval/fault_injection: 34 tests counted, including commit-then-timeout and concurrent duplicates",
      },
      {
        value: "0.31 → 0.86",
        label: "handoff recall after calibration",
        source: "results/2026-10-15-handoff-calibration/metrics.json: 95% CI 0.72 to 0.93, n = 94",
      },
      {
        value: "2 of 46",
        label: "checker false positives on known-good answers",
        source: "results/checker-catch-rate: invented numbers, dates and entities caught 23/23, 5/5, 4/4",
      },
    ],
    repo: `${GH}/Voice-Desk`,
    period: "2026",
    featured: true,
    hasDiagram: true,
    caseStudy: {
      problem:
        "A support agent that speaks has no undo. Text gives a reader a moment to notice that an answer looks wrong, and a caller gets none: a fabricated refund window or an invented date is simply said, out loud, and acted upon. Two consequences follow. The sentence has to be checked before it reaches the speaker rather than after, and any claim that a change made the agent better has to survive a paired test rather than a demo, because a voice system has far too many ways to look improved on the call you chose to replay.",
      approach:
        "A turn flows from endpointing through transcription into a conversation loop that imports nothing from the audio layer, which is what makes a turn testable without a microphone. The loop retrieves over a hybrid of BM25 and vector search fused with reciprocal rank, calls the model, and passes each generated sentence to a grounding checker before anything is spoken. A sentence that cannot be traced to a retrieved passage does not get said; hard rules and a calibrated soft score decide between answering and handing off with a written summary. Tool calls go through an idempotency ledger backed by a partial unique index, so a commit followed by a timeout does not produce a second transfer. Improvements are measured by running a simulated caller population, generating a gap report, making exactly one change, and re-running on identical seeds.",
      decisions: [
        {
          title: "Check grounding before the speaker, not after",
          body: "The checker runs per sentence at a p95 of 0.07 milliseconds, which is what makes it affordable in the speaking path at all. It catches invented numbers, dates and entities at 23 of 23, 5 of 5 and 4 of 4, and fabricated policy claims at 7 of 8, against 2 false positives in 46 known-good answers. The 7 of 8 is the honest number: it is the category a template cannot fully cover, and the repo does not round it up.",
        },
        {
          title: "One change per cycle, on identical seeds",
          body: "The feedback loop runs a baseline, produces a gap report, applies a single corpus change, and re-runs the same 300 simulated calls with the same seed. The run directory records the corpus hash before and after and names the higher-ranked action that was deliberately skipped, so the result is attributable to one change rather than to a batch of them.",
        },
        {
          title: "Report the paired test, not the difference",
          body: "Containment moving from 0.737 to 0.793 is two overlapping confidence intervals and proves little on its own. The pairing is what carries it: the same calls, +17 improved and -0 regressed, McNemar exact p = 1.5e-5. The same cycle rerun on the live model moved the target intent +16 and -0, while other intents moved +14 and -22 at p = 0.24, which the repo calls sampling noise instead of a regression.",
        },
        {
          title: "Make duplicate side effects structurally impossible",
          body: "A partial unique index in Postgres is the ledger, so a retried transfer collides at the database rather than relying on the agent remembering. The fault suite drove 34 cases at it, including commit-then-timeout and five concurrent identical transfers, and the concurrent case resolved to one committed row. The race that test exposed was real and is written up rather than quietly fixed.",
        },
        {
          title: "Label the agent behind every number",
          body: "No API key was available while the measurement harness was built, so most behavioural figures come from an offline extractive agent, and every result says which agent produced it. A README that implied a live model would have been easier to read and worth nothing, and the list of what is still unmeasured, including voice latency over a real sample, sits beside the results rather than at the end.",
        },
      ],
      learned:
        "I set out to build the agent and ended up building the instrument. The measurement harness is most of this repository, and the part that changed how I work is the convention of keeping superseded run directories instead of deleting them: two of the fourteen are labelled superseded and remain, so the history of what I believed and when is recoverable. It is also where the uncomfortable results live. The retrieval sufficiency signal showed dense cosine at 0.93 AUC against the fused score's 0.51, which means the score I had been ranking with was the worse predictor of whether retrieval had actually found the answer.",
    },
  },
  {
    slug: "adsight",
    name: "AdSight",
    tagline: "Ad campaign dashboard over 10,000 rows, measured against a naive build",
    summary:
      "A campaign performance dashboard where the engineering claims are backed by committed measurement artifacts. An Express BFF fans out to four simulated upstreams and serves the same aggregator over both REST and GraphQL. The table renders 10,000 rows virtualized and memoized, benchmarked against a deliberately naive implementation kept in the repo so the comparison can be rerun. A natural-language query bar proposes a filter and waits for a person to accept it.",
    lane: "full-stack",
    lanes: ["full-stack", "agentic-ai", "infra"],
    stack: [
      "TypeScript",
      "Next.js",
      "React Query",
      "Redux Toolkit",
      "Express 5",
      "GraphQL",
      "Turborepo",
      "Vitest",
      "Playwright",
      "Google Cloud Run",
      "Vertex AI / Gemini 2.5 Flash",
      "zod",
    ],
    facts: [
      {
        value: "190x",
        label: "faster mount at 10,000 rows",
        source: "perf/render.json: 6,472 ms naive against 34 ms virtualized, median of 5 headless runs",
      },
      {
        value: "463",
        label: "DOM elements, against 510,025 naive",
        source: "perf/render.json at 10,000 rows. Constant cost: 34 ms at 1,000 rows too",
      },
      {
        value: "145",
        label: "tests, run in CI on every push",
        source: "135 Vitest across three workspaces plus 10 Playwright e2e, counted in the repo",
      },
      {
        value: "+0.1%",
        label: "bundle change from deferring my own components",
        source: "perf/bundle.json: 150.8 against 150.9 kB gzip. Measured, and reported as a non-result",
      },
    ],
    repo: `${GH}/AdCampaign-Dashboard`,
    live: "https://adsight-web-p7zkgdrfpa-uc.a.run.app",
    period: "2026",
    featured: true,
    hasDiagram: true,
    caseStudy: {
      problem:
        "A table of 10,000 rows is where a dashboard usually stops being pleasant. The natural implementation puts every row in the DOM, formats each cell as it renders, and re-renders all of them whenever anything changes. It works at a hundred rows and quietly stops working somewhere before ten thousand, and because it degrades gradually there is rarely a moment where anyone decides to fix it. The other half of the problem is that a filtered query over that many records touches several backing services, and doing that work in the wrong order makes the expensive parts run on rows that were about to be discarded.",
      approach:
        "The dashboard is a Turborepo monorepo with a Next.js front end and an Express BFF, deployed as two Cloud Run services. The BFF fans out to four simulated upstreams and joins them in a deliberate order: cheap config predicates cut 10,000 campaigns to a few hundred, the metrics rollup scans only those survivors as a contiguous Int32Array, and the two page-scoped upstreams run last on a single sliced page of 50. The same aggregator serves REST and GraphQL. On the client, Redux holds the question and React Query holds the answer, joined by one memoized selector that is simultaneously the cache key, the request URL and the browser URL. The naive table implementation stays in the repo next to the optimized one, and a harness at /perf mounts both over the same rows and times them.",
      decisions: [
        {
          title: "Keep the slow implementation in the repo",
          body: "CampaignTableNaive is not dead code, it is the control. Without it the optimization is an assertion; with it the comparison is a command anyone can rerun. It is also what makes the result honest about its own limits: the scroll figure is bounded by the display refresh rate, so the 4.1x there is a floor rather than a measurement of headroom.",
        },
        {
          title: "Order the fan-out by cost, not by dependency",
          body: "Filtering on config before rolling up metrics is what makes a threshold query over 10,000 campaigns affordable, because reporting only ever scans rows that already survived the cheap predicates. Fetching catalog and pacing after the page slice turns what would be a hundred upstream calls into two batched ones.",
        },
        {
          title: "One selector as cache key, request URL and address bar",
          body: "Because all three derive from the same memoized string, they cannot disagree. Opening the filter panel produces the same string and so does not refetch, and there is a test asserting exactly that. A filtered view is a shareable link parsed by the same codec on both sides.",
        },
        {
          title: "The model proposes, a person applies",
          body: "The query bar streams a rationale token by token and renders the result as reviewable chips, with anything it could not express shown as prominently as what it could. Nothing touches the view until it is accepted, and accepting dispatches the same action URL hydration uses, so an AI-built filter is indistinguishable from a hand-built one.",
        },
        {
          title: "Partial failure as a route, not an exception",
          body: "The budget upstream fails 6% of the time by default. The aggregator catches that specific error, returns a null pacing column and names the failure in the response so the UI shows a banner. Anything that is not an upstream-unavailable error is rethrown as a 500, and a test asserts the distinction, because a real bug must not be silently downgraded to a missing column.",
        },
      ],
      learned:
        "The bundle work is the part I would keep. Deferring three of my own components measured as a 0.1% change, which is nothing, and the repo says so rather than dressing it up. What the measurement did find was a real problem I could not have read my way to: routing those components through one barrel module registered a 108 kB charting library against a route that draws no charts, because a route's chunk list includes everything its imports reference even when execution is deferred. The tell was that the before and after came out identical, which was implausible enough to dig into. I have started treating a suspiciously flat result as a finding rather than a null.",
    },
  },
  {
    slug: "argus",
    name: "Argus",
    tagline: "Event-driven multi-agent AI code review on AWS",
    summary:
      "A pull-request review platform built as a distributed event system rather than one large prompt. A webhook parses and chunks the diff, SNS fans it out to four specialist agents (security, performance, style, test coverage), each on its own queue, and a summary agent aggregates their findings from DynamoDB into a single severity-ranked comment. A separate learning loop records recurring patterns per repository.",
    lane: "agentic-ai",
    lanes: ["agentic-ai", "infra"],
    stack: [
      "Python",
      "AWS CDK",
      "Lambda",
      "SNS",
      "SQS",
      "DynamoDB",
      "Amazon Bedrock",
      "Nova Pro / Nova Micro",
      "React",
      "GitHub Actions",
    ],
    facts: [
      {
        value: "8",
        label: "Lambda functions",
        source: "webhook, parser, 4 specialists, summary, ltm-writer",
      },
      {
        value: "7",
        label: "SQS queues, each with its own DLQ",
        source: "maxReceiveCount: 3 on every queue",
      },
      {
        value: "4",
        label: "SNS topics",
        source: "pr-webhook, pr-parsed, review-findings, review-complete",
      },
      {
        value: "4",
        label: "CDK stacks",
        source: "Messaging, Storage, Api, Agents",
      },
    ],
    repo: `${GH}/Argus---Event-Driven-Agent-Architecture`,
    period: "2026",
    featured: true,
    hasDiagram: true,
    caseStudy: {
      problem:
        "Code review has two failure modes that pull in opposite directions. Reviewers who read carefully are slow, and reviewers who read quickly miss things. Handing the whole diff to a single language model reproduces the second problem: one prompt asked to check security, performance, style and test coverage at once does all four shallowly, and you cannot tune or debug any one of them without disturbing the others.",
      approach:
        "Argus splits review into independent specialists that run in parallel. A GitHub webhook hits API Gateway, a webhook Lambda validates the HMAC signature, and a parser agent chunks the diff and writes it to DynamoDB. Publishing to an SNS topic fans the parsed diff out to four SQS-backed Lambdas, each with its own model choice and prompt. As findings land, a summary agent reads them back from DynamoDB, deduplicates, ranks by severity, and posts one consolidated Markdown comment. A final event feeds a long-term-memory writer that records recurring patterns per repository.",
      decisions: [
        {
          title: "Fan-out over a monolithic prompt",
          body: "Four agents on four queues run concurrently and can be tuned, versioned and debugged independently. Adding a fifth reviewer is an SNS subscription, not a prompt rewrite.",
        },
        {
          title: "A dedicated queue and DLQ per agent",
          body: "Every queue has its own dead-letter queue at maxReceiveCount 3. A slow or failing security agent cannot stall style or test coverage, and its poison messages land somewhere inspectable instead of disappearing.",
        },
        {
          title: "Two model tiers, chosen per task",
          body: "Security and performance run on Nova Pro because they need deeper reasoning. Style and test coverage run on Nova Micro, which is roughly twenty times cheaper per token. The split is a deliberate cost decision, not a default.",
        },
        {
          title: "A transport abstraction the agents cannot bypass",
          body: "Agents publish through a transport module selected by an environment variable rather than calling boto3 directly. Swapping SQS for another broker is a configuration change, and it keeps queue semantics out of agent logic.",
        },
        {
          title: "A learning loop, not just a reviewer",
          body: "Review completion emits an event to a separate queue whose writer records per-repository patterns and accuracy in DynamoDB. The system accumulates knowledge about a codebase instead of starting cold on every pull request.",
        },
      ],
      learned:
        "The interesting part of this project turned out to be the queue topology rather than the prompts. Once each agent had its own failure domain, debugging changed character: instead of asking why the review was wrong, I could ask which queue was backed up. That is the difference between a system you can reason about and one you can only re-run.",
    },
  },

  {
    slug: "observeai",
    name: "ObserveAI",
    tagline: "A distributed system built to be observed while it fails",
    summary:
      "Nine instrumented FastAPI services around a checkout flow, wired through Redpanda, Postgres and Redis, with OpenTelemetry traces, metrics and logs flowing into self-hosted SigNoz. Twelve scripted failure scenarios inject real latency, errors and poison messages so the telemetry has something to reveal. Trace context propagates across the Kafka boundary, so a consumer span is a child of the checkout trace that caused it.",
    lane: "infra",
    lanes: ["infra", "data-eng"],
    stack: [
      "Python",
      "FastAPI",
      "Redpanda",
      "PostgreSQL",
      "Redis",
      "OpenTelemetry",
      "SigNoz",
      "ClickHouse",
      "Docker Compose",
    ],
    facts: [
      {
        value: "12",
        label: "scripted failure scenarios",
        source: "all confirmed in services/traffic and services/ui",
      },
      {
        value: "14",
        label: "alert definitions with thresholds",
        source: "alerts/. ClickHouse queries against signoz_traces",
      },
      {
        value: "22",
        label: "dashboard queries",
        source: "dashboards/, 6 groups",
      },
      {
        value: "3",
        label: "Kafka topics, including a dead-letter queue",
        source: "fraud.check.requested / .completed / .dlq",
      },
    ],
    repo: `${GH}/ObserveAI`,
    period: "2026",
    featured: true,
    hasDiagram: true,
    caseStudy: {
      problem:
        "Observability is easy to read about and hard to feel. Tutorials show you a trace waterfall that is already broken, which teaches you what the UI looks like but not how to get from an alert to a cause. I wanted a system where I could break a specific thing on purpose and then find it from the telemetry alone.",
      approach:
        "A synthetic e-commerce checkout: a checkout service orchestrates cart, inventory and payment over HTTP, writes orders to Postgres, and publishes a fraud-check request to Redpanda. A fraud service consumes it, scores it with deterministic rules, and publishes a result that two independent consumer groups (notification and analytics) both read. Failed messages retry three times and then go to a dead-letter topic that analytics also consumes. Everything exports OTLP to a collector and on into SigNoz, with twelve scenarios that inject specific pathologies on demand.",
      decisions: [
        {
          title: "Trace context that survives the broker",
          body: "A header carrier injects trace context on publish and extracts it on consume, so an async consumer span is a genuine child of the checkout trace. Without this the async half of the system is a separate, uncorrelated island, which is exactly where real incidents hide.",
        },
        {
          title: "Rules-based fraud scoring, deliberately",
          body: "The fraud service uses thresholds on order value and item count, not a model. The subject of this project is the telemetry, and a deterministic scorer means a given input always produces the same span. Adding a model would have made the traces harder to reason about, not more impressive.",
        },
        {
          title: "Failure scenarios as first-class code",
          body: "Each of the twelve scenarios is a named, triggerable path rather than something you cause by hand: slow payment, provider timeout, out-of-stock, slow fraud inference, consumer lag, poison message to DLQ, slow and failing notifications, slow analytics, and a Postgres slow query.",
        },
        {
          title: "Alerting on the shape of failure, not just its volume",
          body: "One alert fires on three or more errors for the same session within five minutes. Five users failing once is a blip; one user failing five times is someone stuck. Aggregate error rate cannot tell those apart.",
        },
        {
          title: "Ports offset to coexist with SigNoz",
          body: "SigNoz runs separately and owns the conventional ports, so every service here is deliberately offset. Small detail, but it is why the two stacks can run on one laptop at all.",
        },
      ],
      learned:
        "Building the failure scenarios taught me more than building the services. Writing the poison-message path forced me to decide what a retry means, where the message goes when retries are exhausted, and who is responsible for noticing, and those are the questions that separate a system that logs from one you can operate.",
    },
  },

  {
    slug: "secsignal",
    name: "SecSignal",
    tagline: "Agentic RAG over SEC filings, deployed and evaluated",
    summary:
      "A live full-stack platform that turns SEC 10-K and 10-Q filings into queryable intelligence. A LangGraph supervisor classifies each question, extracts tickers and time ranges, then dispatches to eight specialist agents in parallel, trend, comparison, anomaly, valuation, sentiment, peer group, general and web search. Results merge in a synthesizer that returns a cited answer with chart specifications, streamed to the client over SSE.",
    lane: "agentic-ai",
    lanes: ["agentic-ai", "data-eng"],
    stack: [
      "Python",
      "LangGraph",
      "FastAPI",
      "Next.js",
      "React",
      "Snowflake Cortex",
      "Cortex Search",
      "dbt",
      "Airflow",
      "GCS",
      "OpenTelemetry",
    ],
    facts: [
      {
        value: "8",
        label: "specialist agents dispatched in parallel",
        source: "agents/graph.py, 8 nodes, conditional-edge routing",
      },
      {
        value: "Live",
        label: "deployed on Vercel and Render",
        source: "sec-signal.vercel.app",
      },
      {
        value: "4",
        label: "scored evaluation dimensions",
        source: "evaluation/scorers.py. LLM-judge plus heuristics",
      },
      {
        value: "1024-d",
        label: "embeddings via Cortex",
        source: "EMBED_TEXT_1024, snowflake-arctic-embed-l-v2.0",
      },
    ],
    repo: `${GH}/SecSignal`,
    live: "https://sec-signal.vercel.app",
    period: "2026",
    featured: true,
    hasDiagram: true,
    caseStudy: {
      problem:
        "Financial filings are long, structurally inconsistent, and mix narrative with numbers. A single retrieval pass over them answers shallow questions and fails on anything comparative, asking how two companies' risk disclosures diverged over three years is not one lookup, and a system that pretends it is will confidently return something wrong.",
      approach:
        "Filings are pulled from EDGAR, parsed section-aware, landed in GCS and then Snowflake, and transformed through dbt staging, intermediate and marts layers. At query time a classifier extracts tickers and a time range, validates the tickers against the warehouse, and builds an execution plan. A conditional edge dispatches that plan to as many of the eight specialist agents as it needs, which draw on structured SQL over the marts, semantic retrieval through Cortex Search, and a web-search fallback for tickers not in the corpus. A synthesizer merges their outputs into one cited answer with a confidence score.",
      decisions: [
        {
          title: "Plan first, then dispatch",
          body: "Classification produces an explicit execution plan, and routing is a conditional edge that emits one dispatch per planned agent. Agents are chosen because the question needs them, and the plan is inspectable when an answer is wrong.",
        },
        {
          title: "Structured and semantic retrieval as peers",
          body: "Numbers come from dbt marts through SQL; narrative comes from Cortex Search over filing text. Forcing both through one vector index would have made the numbers unreliable, which is the one thing a financial tool cannot afford.",
        },
        {
          title: "A web-search agent as an explicit fallback",
          body: "Asked about a ticker outside the corpus, the system says so and falls back to web search rather than hallucinating from adjacent filings. Knowing the edge of your own knowledge base is a feature.",
        },
        {
          title: "Streaming because agent runs are slow",
          body: "Typed SSE events stream classification, per-agent progress and the final answer, so the interface renders incrementally instead of blocking on a multi-agent run. Perceived latency is a design problem, not just an optimisation.",
        },
        {
          title: "An evaluation harness with curated cases",
          body: "A runner drives a curated case suite through scorers covering answer relevance, source attribution, chart appropriateness and factual accuracy, combining LLM-as-judge with heuristic checks. It is the part of this repo I would want reviewed first.",
        },
      ],
      learned:
        "Splitting retrieval by data type rather than by question type was the decision that made this work. My first attempt pushed everything through semantic search, which produced fluent answers with wrong numbers, the worst possible failure for a financial tool, because it is invisible until someone checks.",
    },
  },

  {
    slug: "lincoln-judge-evals",
    name: "Lincoln AI-Judge Evals",
    tagline: "An LLM judge, and the work of validating the judge",
    summary:
      "A pipeline that asks whether what biographers say about Lincoln matches what Lincoln himself wrote. It scrapes primary sources from the Library of Congress and secondary accounts from Project Gutenberg, extracts claims about five events, and scores consistency with a DSPy judge. The part I care about is the second half: measuring the judge against human labels and reporting where it disagrees.",
    lane: "ml-eval",
    lanes: ["ml-eval", "agentic-ai"],
    stack: [
      "Python",
      "DSPy",
      "Gemini 2.5 Flash",
      "text-embedding-004",
      "scikit-learn",
      "Streamlit",
      "Plotly",
      "BeautifulSoup",
    ],
    facts: [
      {
        value: "0.41",
        label: "Cohen's kappa against human labels",
        source: "data/evaluated/kappa_report.json, moderate agreement",
      },
      {
        value: "0.80",
        label: "raw agreement with human labels",
        source: "same report, over 10 labelled pairs",
      },
      {
        value: "5",
        label: "historical events across primary and secondary sources",
        source: "1860 election through Ford's Theatre",
      },
      {
        value: "0.7",
        label: "hybrid retrieval alpha, keyword versus embedding",
        source: "hybrid_retriever.py",
      },
    ],
    repo: `${GH}/Lincoln-Scraping-AI-Judge-Evals`,
    period: "2026",
    featured: true,
    hasDiagram: true,
    caseStudy: {
      problem:
        "LLM-as-judge is the default way to evaluate generative systems, and it is usually taken on faith. A judge produces a number, the number goes in a report, and nobody asks whether the judge agrees with a human. If it does not, every downstream conclusion is decoration.",
      approach:
        "The pipeline has five stages: scrape primary and secondary sources, normalise them, extract claims about five events using hybrid retrieval that blends keyword scoring with embedding similarity, score consistency with a DSPy judge that classifies contradictions as factual, interpretive or omission with a severity, and present the results. Two validators branch off that: one measures the judge against human labels with Cohen's kappa and tests self-consistency by running the same comparison five times at non-zero temperature, and one compares zero-shot, chain-of-thought and few-shot prompting by variance.",
      decisions: [
        {
          title: "Constrain the judge to the provided text",
          body: "The judge may only reason from the passages given to it, not from what the model already knows about Lincoln. Otherwise it grades against its pretraining and the exercise measures nothing.",
        },
        {
          title: "Typed contradictions, not a single score",
          body: "A factual contradiction, a difference of interpretation and an omission are different findings. Collapsing them into one consistency number throws away the distinction that matters most to a historian.",
        },
        {
          title: "Measure the judge against humans",
          body: "Ten pairs were labelled by hand and compared to the judge's verdicts. Kappa came out at 0.41 (moderate agreement), with raw agreement at 0.80. Reporting the kappa rather than the raw agreement is the point; raw agreement flatters a judge that mostly says yes.",
        },
        {
          title: "Test the judge against itself",
          body: "Running the same comparison five times at temperature 0.7 shows how much of a score is signal and how much is sampling noise. A judge that disagrees with itself cannot arbitrate anything.",
        },
        {
          title: "Compare prompting strategies by variance",
          body: "Zero-shot, chain-of-thought and few-shot are compared on the standard deviation of their scores, not just the mean. Stability is what makes a judge usable for regression detection.",
        },
      ],
      learned:
        "The kappa of 0.41 is the most useful number I have produced, precisely because it is mediocre. Raw agreement of 0.80 would have looked fine in a summary and would have been misleading, the judge agrees because it usually says consistent, and kappa is what exposes that. I now build the judge-validation step before trusting any judge-derived metric.",
    },
  },

  {
    slug: "docintel",
    name: "DocIntel",
    tagline: "A serverless GCP platform, then a multi-agent assistant over its data",
    summary:
      "Two halves on one platform. A document pipeline where Cloud Run takes the upload and returns immediately, a storage notification triggers a Go Cloud Function, and Gemini returns schema-constrained JSON into Firestore. Then a LangGraph supervisor over six agents that answers questions about the data, routing each turn to one specialist and enforcing a single rule: exact figures come from BigQuery over text-to-SQL, narrative comes from vector search, and numbers are never read out of an embedding. Built level by level, with the agent layer added after the platform was finished rather than planned into it.",
    lane: "agentic-ai",
    lanes: ["agentic-ai", "infra", "data-eng"],
    stack: [
      "Python",
      "Go",
      "FastAPI",
      "LangGraph",
      "Cloud Run",
      "Cloud Functions",
      "Pub/Sub",
      "Firestore vector search",
      "BigQuery",
      "Vertex AI",
      "Gemini",
      "Terraform",
      "Cloud Build",
    ],
    facts: [
      {
        value: "6",
        label: "agents behind one supervisor",
        source: "services/agent/multiagent.py: supervisor, four ReAct specialists, synthesizer",
      },
      {
        value: "150",
        label: "real CFPB mortgage complaints, queried both ways",
        source: "ingest_cfpb.py TOTAL = 150 from the public consumerfinance.gov API",
      },
      {
        value: "L0→L5",
        label: "levels, each recording what broke",
        source: "docs/architecture.md, then extended with the RAG and agent layer",
      },
      {
        value: "2",
        label: "committed architecture diagrams, IAM-annotated",
        source: "docs/architecture-high-level.svg and -low-level.svg",
      },
    ],
    repo: `${GH}/DocIntel`,
    live: "https://docintel-api-825091457104.us-central1.run.app/",
    period: "2026",
    featured: true,
    hasDiagram: true,
    caseStudy: {
      problem:
        "Document processing with a language model is slow enough that doing it inside the request is the wrong design, but the naive fix (a background thread) loses work on restart and gives you nothing to observe. I also wanted to build cloud architecture the way it is actually learned, one constraint at a time, rather than starting from a finished diagram. The second problem arrived once the data was in place: a single assistant asked to handle both precise figures and open questions will happily answer a revenue question from a paragraph it retrieved, and be confidently wrong by a rounding error or an order of magnitude.",
      approach:
        "The upload endpoint writes the blob to Cloud Storage, creates a Firestore record marked processing, and returns immediately. A storage finalize notification publishes to Pub/Sub, which triggers a Go Cloud Function that calls Gemini through Vertex AI with a response schema constraining the output shape, then merges the summary, entities and document type into the same Firestore record and marks it done. A separate scheduled path computes statistics. On top of that platform sits a LangGraph supervisor: it routes each turn to one of four ReAct specialists, and a synthesizer writes the final answer and names the agent that produced it. Financial figures and complaint counts resolve through text-to-SQL against BigQuery, narrative questions through Firestore vector search, and the retrieval graph abstains rather than answering when its distance gate or groundedness check fails.",
      decisions: [
        {
          title: "Return before the work is done",
          body: "The client gets a document ID immediately and polls. Nothing about model latency is the caller's problem, and the pipeline can retry independently of any open connection.",
        },
        {
          title: "Let Vertex fetch the blob directly",
          body: "The prompt references the file by storage URI instead of shipping bytes through the function. That required granting the Vertex service agent read access explicitly: a small IAM detail that is invisible until it fails.",
        },
        {
          title: "Constrain the model's output shape",
          body: "The generation request carries a response schema, so the model returns a typed object rather than prose to be parsed. Most brittle LLM plumbing is parsing, and this removes it.",
        },
        {
          title: "Rewrite the processor in Go",
          body: "Same trigger, same service account, different language. Doing a like-for-like rewrite is how you find out what your interface boundaries were actually worth, and cold-start behaviour was the reason.",
        },
        {
          title: "Retire broad IAM as a distinct step",
          body: "An early level used a broad editor role to get moving; a later one replaced it with per-service least-privilege accounts. Recording that transition, including the outage it caused, is more honest than presenting the end state as if it were the plan.",
        },
        {
          title: "Numbers from SQL, narrative from vectors",
          body: "The specialists are split along that line rather than by topic. A question about revenue or a complaint count becomes a generated SELECT against BigQuery, and only prose questions go to vector search. Embeddings are good at finding the paragraph that discusses a figure and useless at guaranteeing the figure, so the boundary is enforced by which tool each agent holds rather than by asking the model to be careful.",
        },
        {
          title: "One specialist per turn, and a graph that abstains",
          body: "The supervisor commits to a single specialist and then synthesizes, which keeps a turn debuggable: the answer names the agent that produced it. The retrieval graph grades its own results against a cosine-distance gate, rewrites the query once, checks the generated answer for groundedness, and returns nothing rather than something unsupported.",
        },
      ],
      learned:
        "Building this in levels rather than all at once changed what I learned. Each level failed in a specific way, a missing ignore file silently changed the build system, an IAM grant that only surfaced at inference time, and writing those down as they happened produced a far more useful document than any architecture diagram I would have drawn up front. The agent layer taught me the same lesson from the other direction. It went on top of a finished platform rather than into the plan, and it only worked once I stopped treating retrieval as a general answer engine and gave the precise questions their own path to a database.",
    },
  },

  {
    slug: "cloudtask",
    name: "CloudTask",
    tagline: "A three-tier AWS application, provisioned entirely as code",
    summary:
      "A task-management application deployed across eight subnets in two availability zones, defined in Terraform. Traffic flows from an internet-facing load balancer through an Nginx web tier to an internal load balancer and a Flask API tier, backed by RDS MySQL. All compute sits in private subnets with no public addresses and no SSH access, reachable only through Session Manager, with five chained security groups enforcing tier-to-tier isolation.",
    lane: "infra",
    lanes: ["infra"],
    stack: [
      "Terraform",
      "AWS VPC",
      "EC2",
      "ALB",
      "Auto Scaling",
      "RDS MySQL",
      "NAT Gateway",
      "IAM",
      "Nginx",
      "Flask",
      "Gunicorn",
    ],
    facts: [
      {
        value: "8",
        label: "subnets across 2 availability zones",
        source: "public, web, app and db tiers × 2 AZs",
      },
      {
        value: "5",
        label: "chained security groups, ingress by SG reference",
        source: "ext-alb → web → int-alb → app → db",
      },
      {
        value: "2→4",
        label: "instances per tier under CPU load",
        source: "target tracking at 70% average CPU",
      },
      {
        value: "0",
        label: "SSH keys, bastions or open port 22",
        source: "AmazonSSMManagedInstanceCore only",
      },
    ],
    repo: `${GH}/CloudTask_High-Availability-Multi-AZ-Distributed-Platform`,
    period: "2026",
    featured: true,
    hasDiagram: true,
    caseStudy: {
      problem:
        "Three-tier architecture diagrams are easy to draw and easy to get subtly wrong. I wanted to build one where the isolation was real, where I could point at the security group rule that makes the database unreachable from the web tier, rather than asserting it.",
      approach:
        "Terraform provisions a VPC with four tiers of subnets across two availability zones: public for the external load balancer and NAT, then private web, app and database tiers. Nginx serves static content and proxies API paths to an internal load balancer, which forwards to a Flask tier on port 5000, which talks to RDS MySQL. Each tier's security group accepts traffic only from the previous tier's security group by reference, never by CIDR. Both compute tiers auto-scale on CPU, and instances are stateless so they can be replaced.",
      decisions: [
        {
          title: "Ingress by security group reference, not CIDR",
          body: "Each rule names the previous tier's security group as its source. The chain holds as subnets change, and the intent is legible in the code rather than encoded in address ranges.",
        },
        {
          title: "No SSH anywhere",
          body: "No key pairs, no bastion, no port 22 in any security group. Access is Session Manager through an instance profile, which removes a whole class of exposure and the key management that goes with it.",
        },
        {
          title: "The internal load balancer lives in the app subnets",
          body: "Not the web subnets, which is the more common drawing. It sits inside the tier it fronts, so the web tier's only route to the application is through it.",
        },
        {
          title: "Instance identity surfaced to the browser",
          body: "A small local service queries instance metadata over IMDSv2 and returns which instance and availability zone served the request, proxied through Nginx. It makes load balancing and failover visible instead of theoretical.",
        },
        {
          title: "Stateless tiers so scaling is safe",
          body: "Neither compute tier holds state, so the auto-scaling group can replace an instance without data loss, and the target-tracking policy can act without coordination.",
        },
      ],
      learned:
        "Reading my own Terraform line by line taught me more than writing it did. Tracing every route table and security group is how you find out what a diagram actually guarantees, which rule makes the database unreachable, which single resource everything else quietly depends on. I now size the claim to what the code enforces, because that is the version that holds up in a design conversation.",
    },
  },

  {
    slug: "glassbox",
    name: "GlassBox",
    tagline: "One AI endpoint, instrumented until nothing is hidden",
    summary:
      "A deliberately small FastAPI service with a single question-answering endpoint backed by Gemini on Vertex AI, instrumented so every request produces a trace, eight metrics and a structured log correlated by trace ID. The centrepiece is a comparison: the same image reports as local or production via a resource attribute, so identical code can be compared side by side in one SigNoz instance.",
    lane: "infra",
    lanes: ["infra", "agentic-ai"],
    stack: [
      "Python",
      "FastAPI",
      "Vertex AI",
      "Gemini",
      "OpenTelemetry",
      "SigNoz",
      "ClickHouse",
      "GCP Compute Engine",
      "Docker",
    ],
    facts: [
      {
        value: "8",
        label: "custom metric instruments",
        source: "metrics.py, rate, latency, tokens, cost, errors, SLO",
      },
      {
        value: "11",
        label: "dashboard panels, 3 comparing local to production",
        source: "dashboards/glassbox-dashboard.json",
      },
      {
        value: "3",
        label: "alerts across metrics and logs",
        source: "p95 latency, error rate, per-session error clustering",
      },
      {
        value: "80",
        label: "characters of a question ever logged",
        source: "question_preview truncation",
      },
    ],
    repo: `${GH}/GlassBox`,
    period: "2026",
    caseStudy: {
      problem:
        "AI services have three blind spots that generic instrumentation misses: you cannot see why a request was slow, what it cost, or why it failed. Token spend in particular is invisible in ordinary request metrics, two requests with identical latency can differ tenfold in cost.",
      approach:
        "One endpoint, three signals. An auto-instrumented server span wraps a manual span around the model call carrying token counts and an estimated cost. Eight metric instruments record rate, a latency histogram, input and output tokens, cumulative spend, errors, cost attributed per session, and how many requests fell inside the latency objective. One structured log per request carries the trace ID and a truncated preview of the question. Three scenarios (normal, slow and failing) make each signal do something visible.",
      decisions: [
        {
          title: "Record metrics in a finally block",
          body: "Failures are recorded exactly like successes. Instrumentation that only runs on the happy path hides the requests you most need to see.",
        },
        {
          title: "Cost as a first-class metric",
          body: "Token counts convert to dollars and accumulate per session, so spend is attributable to a user rather than being one line on a monthly bill.",
        },
        {
          title: "Alert on per-session error clustering",
          body: "Three or more errors for one session in five minutes is a separate alert from overall error rate, because one user failing repeatedly is a different incident from scattered failures.",
        },
        {
          title: "Environment as a resource attribute",
          body: "Local and production emit the same signals tagged differently, which turns the comparison into a group-by rather than two dashboards to eyeball.",
        },
        {
          title: "Truncate the prompt in logs",
          body: "Only the first eighty characters of a question are ever logged. Enough to debug, not enough to be a data-retention problem.",
        },
      ],
      learned:
        "Making cost a metric rather than a line item changed how I read the dashboard. Latency and error rate are the reflexive things to graph, but on an AI service spend is the one that surprises you, and attributing it per session immediately showed that a small number of sessions accounted for most of it.",
    },
  },

  {
    slug: "mealmind",
    name: "MealMind",
    tagline: "Snowflake-native multi-agent nutrition planning",
    summary:
      "A meal-planning application built entirely inside Snowflake, with two halves that share almost nothing. Underneath is a medallion pipeline: USDA nutrition data scraped with Selenium, staged through S3, then transformed by dbt from four raw food sets into three marts that Cortex Search indexes. On top is a LangGraph graph where a router dispatches to retrieval, adjustment, recipe and calorie agents, all reaching the warehouse through one MCP tool. A scheduled evaluation DAG scores outputs with an LLM judge and stamps each run with a run ID and model version.",
    lane: "agentic-ai",
    lanes: ["agentic-ai", "data-eng"],
    stack: [
      "Python",
      "LangGraph",
      "Snowflake Cortex",
      "Cortex Search",
      "MCP",
      "dbt",
      "Airflow",
      "Streamlit",
    ],
    facts: [
      {
        value: "3",
        label: "medallion layers, bronze through golden",
        source: "Images/Basic System Architecture.png",
      },
      {
        value: "5",
        label: "Cortex models compared in a judged arena",
        source: "utils/model_arena.py",
      },
      {
        value: "10",
        label: "node LangGraph routing graph",
        source: "utils/meal_router_agent.py",
      },
      {
        value: "2",
        label: "daily Airflow DAGs, planning and evaluation",
        source: "airflow_docker/dags/",
      },
    ],
    repo: `${GH}/MealMind`,
    period: "2025",
    team: "Team of 3 · my fork of a teammate's repository, 43 of ~60 commits mine",
    featured: true,
    hasDiagram: true,
    caseStudy: {
      problem:
        "A nutrition assistant that invents food data is worse than useless. Generated meal plans need to be grounded in real nutritional values, and the quality of a generated plan is not something you can check by reading one example. It needs measuring repeatedly, because model behaviour drifts.",
      approach:
        "Bronze: Selenium pulls seven USDA extracts (the food sets plus Food, Nutrient and Food_Nutrient) into S3, and an external stage copies them into RAW_SCHEMA, joining each food set against the nutrient tables on load. Silver: four staging views normalise them, then intermediate views union, clean, score branded quality, deduplicate and assign tiers, with dbt tests and macros producing a completeness score. Golden: three marts materialise as tables, and the search catalog is what Cortex Search indexes. Airflow orchestrates the path. Above it, a LangGraph router loads durable preferences, dispatches to the specialist agents, and routes every tool call through one MCP server; a feedback agent writes corrections back so the next run starts from them.",
      decisions: [
        {
          title: "Retrieval as an MCP tool, not an embedded call",
          body: "A JSON-RPC MCP server exposes search as a tool the agents call. It keeps retrieval behind a contract instead of scattering warehouse queries through agent code.",
        },
        {
          title: "Generate a week in two batches",
          body: "Seven days at once produced drift and repetition. Splitting into four days then three, with a consolidation pass, kept plans coherent across the week.",
        },
        {
          title: "Join at load, deduplicate in the middle layer",
          body: "Each USDA food set is joined against Food, Nutrient and Food_Nutrient as it lands, so staging reads one shape per source. Deduplication and tier assignment then happen once in the intermediate layer rather than per mart, the marts differ in what they expose, not in how clean they are.",
        },
        {
          title: "Evaluation on a schedule, with history",
          body: "Scores are appended to a warehouse table with a run ID, execution date and model version, so regressions are visible as a trend rather than discovered by a user.",
        },
        {
          title: "Compare models rather than assume one",
          body: "Five Cortex models were run against each other with a judge picking winners. Model choice became a measurement instead of a default.",
        },
        {
          title: "Two memory horizons",
          body: "Durable preferences and feedback live in warehouse tables; conversational state lives in thread checkpoints. Conflating them makes an assistant that either forgets everything or never lets a correction go.",
        },
      ],
      learned:
        "The evaluation DAG was the piece that changed how the team worked. Once scores landed in a table with a run ID, a regression became a row you could point at in a standup instead of an argument about whether the output felt worse.",
    },
  },

  {
    slug: "careiq",
    name: "CareIQ",
    tagline: "A clinical AI assistant that shows its work and its limits",
    summary:
      "A governed assistant over clinical documents on synthetic patient data, scoped and shipped solo in 48 hours. Requests pass through PHI masking, guardrails and intent classification before retrieval, then generation with inline citations, a faithfulness check against the retrieved sources, and an audit write. Every external dependency has a documented degradation path, so losing the vector store or the model API downgrades behaviour rather than breaking it.",
    lane: "agentic-ai",
    lanes: ["agentic-ai", "ml-eval"],
    stack: [
      "Python",
      "FastAPI",
      "Claude",
      "Voyage embeddings",
      "Pinecone",
      "BigQuery",
      "Presidio",
      "spaCy",
      "MCP",
      "React",
      "Recharts",
    ],
    facts: [
      {
        value: "4",
        label: "guardrail stages before the model is called",
        source: "PHI masking, input guardrails, intent, retrieval",
      },
      {
        value: "47",
        label: "patient care-gap queue",
        source: "synthetic cohort in the Surface view",
      },
      {
        value: "48h",
        label: "from scope to shipped, solo",
        source: "hackathon build",
      },
    ],
    repo: `${GH}/CareIQ`,
    period: "2026",
    caseStudy: {
      problem:
        "Clinical text is exactly the kind of data you should not send to a model casually, and clinical answers are exactly the kind you should not accept without a citation. Any useful system here has to handle both at once, and has to be honest that it is not validated for clinical use.",
      approach:
        "A linear pipeline with explicit stages: mask protected health information, run input guardrails, classify intent, retrieve from a vector store with embeddings, call tools where the question needs live data, generate an answer with inline citations, check that the answer is faithful to the retrieved sources, and write an audit record. An MCP server fronts an external drug-label API so tool access sits behind a contract. Each dependency has a fallback, local vectors without the vector store, deterministic drafts without the model.",
      decisions: [
        {
          title: "Mask before anything else",
          body: "PHI masking with a named-entity recogniser plus regex runs before guardrails, retrieval or generation. It is the first stage because the point is that identifiers never reach a third-party API at all.",
        },
        {
          title: "Citations from the model, not stitched on after",
          body: "Generation uses a citations API so the model attributes claims to the retrieved passages as it writes, rather than having sources appended afterwards to look rigorous.",
        },
        {
          title: "Check faithfulness as a pipeline stage",
          body: "A dedicated step verifies the answer is supported by what was retrieved. Retrieval quality and generation faithfulness fail in different ways, so they get measured separately.",
        },
        {
          title: "A documented degradation path per dependency",
          body: "Losing Pinecone falls back to local vectors; losing the model API falls back to deterministic drafts. In a governed context, predictable degradation beats a 500.",
        },
        {
          title: "Audit as a product surface",
          body: "Audit records go to BigQuery and there is a view that reads them. If nobody can inspect the log, the log is not really governance.",
        },
      ],
      learned:
        "Ordering the stages was the whole design. My first version classified intent before masking, which meant raw clinical text reached a model call in the classification step, technically upstream of the 'real' pipeline, and completely defeating the purpose. Guardrails only work if nothing runs before them.",
    },
  },

  {
    slug: "support-intel",
    name: "Support Intel",
    tagline: "An ELT pipeline with traceable lineage into Snowflake",
    summary:
      "Support-ticket data lands from Azure Blob Storage into Snowflake and is transformed through dbt staging, intermediate and mart layers, orchestrated by Airflow. Ten models produce dimension and fact tables with lineage you can follow from source to consumption, which is what makes it possible to say precisely which questions the warehouse can answer.",
    lane: "data-eng",
    lanes: ["data-eng"],
    stack: [
      "Python",
      "SQL",
      "Airflow",
      "dbt",
      "Snowflake",
      "Azure Blob Storage",
      "PostgreSQL",
      "Docker Compose",
    ],
    facts: [
      {
        value: "10",
        label: "dbt models across 3 layers",
        source: "5 staging views, 1 intermediate view, 4 mart tables",
      },
      {
        value: "20k",
        label: "source tickets, multi-language",
        source: "HuggingFace customer-support-tickets dataset",
      },
      {
        value: "5",
        label: "raw tables landed via external stage",
        source: "COPY INTO from @RAW.azure_stage",
      },
    ],
    repo: `${GH}/Support_Intel`,
    period: "2026",
    featured: true,
    hasDiagram: true,
    caseStudy: {
      problem:
        "Warehouse pipelines fail quietly. A model runs, rows appear, a dashboard renders a number, and nothing tells you the join silently dropped most of the data. I wanted to build the layered structure properly and then trace it end to end to see what it actually supported.",
      approach:
        "Support tickets come from a public dataset; customers, agents, products and SLA policies are synthesised with a fixed seed. All five land as CSVs in Azure Blob Storage, are copied into Snowflake raw tables through an external stage, and transformed by dbt: staging views normalise and cast, an intermediate view enriches tickets with SLA policy, and mart tables materialise facts and dimensions. Airflow orchestrates load, then each dbt layer in sequence.",
      decisions: [
        {
          title: "Views for staging, tables for marts",
          body: "Staging and intermediate materialise as views so they cost nothing to keep current; marts materialise as tables because they are read repeatedly. The layer boundary and the materialisation boundary line up.",
        },
        {
          title: "Cast defensively at the edge",
          body: "Staging uses try-cast variants and filters null keys, so malformed source rows fail at the boundary rather than propagating a type error into a mart.",
        },
        {
          title: "Derive categorisation once, upstream",
          body: "Complexity buckets and priority ranks are computed in the intermediate layer, so every downstream consumer inherits one definition instead of each dashboard inventing its own.",
        },
      ],
      learned:
        "This is the project I would most want to be asked about, because it is where lineage earned its keep. Following the keys from source through each layer showed me exactly which questions the marts could answer and which the source data could never support: before anything was built on top of them. That is the whole argument for layered pipelines: the structure surfaces the modelling problem while it is still cheap to fix.",
    },
  },

  {
    slug: "datapilot",
    name: "DataPilot",
    tagline: "Natural language to governed SQL over BigQuery",
    summary:
      "A self-serve analytics system that resolves business meaning before generating SQL. An ontology layer holds metric definitions, join paths and access policies, so a question is mapped to governed semantics first and only then handed to a model for generation, with validation, PII checks and a dry-run cost estimate before anything executes.",
    lane: "data-eng",
    lanes: ["data-eng", "agentic-ai"],
    stack: [
      "Python",
      "SQL",
      "BigQuery",
      "dbt",
      "Vertex AI",
      "Gemini",
      "FastAPI",
      "Next.js",
      "Cloud Run",
      "Terraform",
    ],
    facts: [],
    repo: `${GH}/DataPilot`,
    period: "2026",
    caseStudy: {
      problem:
        "Text-to-SQL systems fail in a way that is worse than erroring: they return a plausible number computed the wrong way. If revenue means something specific in your business, a model that infers it from column names will get it subtly wrong, and nobody will notice until two dashboards disagree.",
      approach:
        "Resolve semantics before generating anything. An intent classifier routes the question, an ontology layer resolves metric definitions, join paths and role-based access policy, and only then does a model generate SQL against that resolved context. Generated SQL passes through guardrails that reject destructive statements, a PII check, and a dry run for cost before execution. A fallback manager handles templates for common questions.",
      decisions: [
        {
          title: "Semantics first, generation second",
          body: "The model never sees a bare question and a schema. It receives resolved metric definitions and join paths, which turns generation from inference into translation.",
        },
        {
          title: "Validate before executing, always",
          body: "Destructive statements are rejected outright, and a dry run bounds cost before a query touches the warehouse. On a metered engine, an unvalidated generated query is a billing incident waiting to happen.",
        },
        {
          title: "Templates for the common path",
          body: "Frequently asked questions resolve to reviewed templates rather than fresh generation, which is both cheaper and more consistent.",
        },
      ],
      learned:
        "Writing the ontology layer before the generation layer forced me to answer a question I had been avoiding: what does this metric actually mean, and who is allowed to see it. That turned out to be the hard part of text-to-SQL. Generating syntactically valid SQL is nearly solved; generating SQL that computes what the business means is a data modelling problem wearing an AI costume.",
    },
  },

  {
    slug: "myclaw",
    name: "MyClaw",
    tagline: "Agentic automation with approval gates on side effects",
    summary:
      "A private Discord-first assistant across four Cloud Run services. Retrieval runs over documents ingested asynchronously through Pub/Sub, and anything with an irreversible side effect (sending mail, creating calendar events) produces an approval request rather than executing. The design principle was to fix the manual workflow first and only then automate it.",
    lane: "agentic-ai",
    lanes: ["agentic-ai", "infra"],
    stack: [
      "TypeScript",
      "Cloud Run",
      "Cloud SQL",
      "Pub/Sub",
      "GCS",
      "Vertex AI",
      "Next.js",
      "Discord API",
      "Docker",
    ],
    facts: [
      {
        value: "4",
        label: "Cloud Run services in one monorepo",
        source: "gateway, assistant-api, ingestion-worker, admin-web",
      },
      {
        value: "0",
        label: "irreversible actions taken without approval",
        source: "calendar and email create an approval request",
      },
    ],
    repo: `${GH}/MyClaw---Personal-Assistant`,
    period: "2026",
    caseStudy: {
      problem:
        "An assistant that can send email on your behalf is one bad inference away from an embarrassing, unrecallable action. The usual response is a better prompt. The better response is to make the irreversible path require a human.",
      approach:
        "A Discord gateway verifies request signatures and handles slash commands, forwarding to an assistant API that holds state in Postgres, runs retrieval, and calls Vertex AI. Document uploads land in storage and trigger a Pub/Sub message that an ingestion worker consumes to chunk and embed asynchronously. Any action with an external side effect creates an approval record that must be confirmed by an explicit command before it executes.",
      decisions: [
        {
          title: "Approval gates on side effects, structurally",
          body: "Irreversible actions cannot execute inline. They create a record and wait. The gate is in the architecture rather than in a prompt instruction the model might ignore.",
        },
        {
          title: "Ingestion off the request path",
          body: "Uploads return immediately and processing happens through Pub/Sub, so a large document does not block a chat turn and a failed parse can retry without the user present.",
        },
        {
          title: "Fix the process, then automate it",
          body: "I mapped and corrected the manual workflow before building the agentic layer. Automating a broken process just produces failures faster.",
        },
      ],
      learned:
        "Approval gates turned out to change the product, not just its safety. Once irreversible actions surfaced as explicit requests, I could see how often the agent wanted to do the wrong thing, which was a far more useful signal than a benchmark, and it came for free from the safety mechanism.",
    },
  },

  {
    slug: "aide",
    name: "AIDE",
    tagline: "LLM schema profiling behind a typed service contract",
    summary:
      "A lightweight master-data tool that infers each column's semantic type from sample values, flags primary match-key candidates, and returns a confidence score with reasoning. Three services in a strict chain (React client, a Spring Boot proxy, and a Python profiler), with real CI running tests in all three languages.",
    lane: "full-stack",
    lanes: ["full-stack", "agentic-ai"],
    stack: [
      "TypeScript",
      "React",
      "Vite",
      "Java",
      "Spring Boot",
      "Python",
      "FastAPI",
      "Claude",
      "LangChain",
      "Cloud Run",
      "Docker",
    ],
    facts: [
      {
        value: "3",
        label: "languages tested in one CI pipeline",
        source: "Vitest, JUnit with MockMvc, Pytest, on every push",
      },
      {
        value: "1",
        label: "typed endpoint contract between tiers",
        source: "POST /profile-schema, columns in, typed inferences out",
      },
    ],
    repo: `${GH}/AIDE---Lightweight-MDM-Tool`,
    period: "2026",
    featured: true,
    caseStudy: {
      problem:
        "Identity resolution starts with knowing what your columns mean, and that knowledge is usually locked in someone's head. Column names lie, and sample values are more honest than schemas.",
      approach:
        "The client parses CSVs locally and sends column names with sample values through a Spring Boot proxy to a Python profiler, which asks a model to infer a semantic type, a confidence score between zero and one, whether the column is a plausible match key, and its reasoning. The middle tier exists so the browser never holds a model credential.",
      decisions: [
        {
          title: "A proxy tier so the client holds no credentials",
          body: "The browser talks to Spring Boot, which talks to the profiler. It is an extra hop that exists purely so no API key reaches the client.",
        },
        {
          title: "Return confidence and reasoning, not just a label",
          body: "A semantic type with a confidence score and an explanation can be reviewed. A bare label has to be trusted or discarded.",
        },
        {
          title: "Test all three tiers in one pipeline",
          body: "Vitest, JUnit with MockMvc, and Pytest run on every push. This is the only one of my repos with CI covering multiple languages, and it is the one that made me stop hand-verifying the contract.",
        },
      ],
      learned:
        "Three languages behind one endpoint made me care about the contract rather than the implementations. Once Vitest, JUnit and Pytest all ran on every push, the tier boundary was the thing being tested, and I stopped hand-verifying that the proxy and the profiler still agreed on the shape of a response.",
    },
  },

  {
    slug: "campus-vitality",
    name: "Campus Vitality",
    tagline: "Student insurance platform, built by a team of five",
    summary:
      "A MERN web platform for students to compare and buy insurance plans, with three user roles, Stripe payments and email notification. I led a five-engineer team and established the review standards the repository was built to.",
    lane: "full-stack",
    lanes: ["full-stack"],
    stack: [
      "JavaScript",
      "React",
      "Tailwind CSS",
      "Material UI",
      "Node.js",
      "Express",
      "MongoDB",
      "Stripe",
      "JWT",
    ],
    facts: [
      {
        value: "5",
        label: "engineers, team I led",
        source: "5 named contributors",
      },
      {
        value: "3",
        label: "user roles with distinct permissions",
        source: "students, admins, sales teams",
      },
    ],
    repo: `${GH}/Campus-Vitality---Insurance-Management-System`,
    period: "2024",
    team: "Team of 5 · I led the team",
    caseStudy: {
      problem:
        "Five engineers on one codebase for a semester, all learning as they went. The technical problem was ordinary; the coordination problem was not.",
      approach:
        "A React client with Tailwind and Material UI against an Express API and MongoDB, with JWT authentication, three role-based permission sets, Stripe checkout including webhook handling, and transactional email.",
      decisions: [
        {
          title: "Review standards before feature work",
          body: "We agreed on what a reviewable pull request looked like before building anything, which is what kept five people from producing five codebases.",
        },
        {
          title: "Roles as a first-class model",
          body: "Students, administrators and sales each have distinct permissions, modelled explicitly rather than accumulating conditionals in the UI.",
        },
        {
          title: "Webhooks for payment truth",
          body: "Payment state comes from Stripe webhooks rather than the client's success redirect, so a closed tab does not lose an order.",
        },
      ],
      learned:
        "Leading this taught me that review standards are a coordination tool before they are a quality tool. The reviews caught bugs, but their real function was keeping five people's mental models close enough together that the parts fit.",
    },
  },

  {
    slug: "subscription-manager",
    name: "Subscription Manager",
    tagline: "Native iOS subscription tracking with on-device inference",
    summary:
      "A SwiftUI app that consolidates recurring subscriptions into one dashboard, schedules renewal reminders, and surfaces spending by category with monthly and yearly totals. Insights run through Core ML on-device, and data syncs through Firebase.",
    lane: "full-stack",
    lanes: ["full-stack"],
    stack: ["Swift", "SwiftUI", "Firebase", "Core ML"],
    facts: [
      { value: "iOS 16+", label: "minimum supported version", source: "README" },
    ],
    repo: `${GH}/Subscription-Manager`,
    period: "2025",
    caseStudy: {
      problem:
        "Subscriptions are individually small and collectively significant, and they are deliberately easy to forget. The useful thing is not tracking them but being reminded before a renewal, not after.",
      approach:
        "SwiftUI views over Firebase for authentication and sync, local notifications scheduled against renewal dates, and a Core ML model producing spending insights on-device.",
      decisions: [
        {
          title: "Inference on-device",
          body: "Spending patterns are personal financial data. Core ML keeps the analysis local rather than shipping a spend history to a server for a convenience feature.",
        },
        {
          title: "Reminders before renewal, not receipts after",
          body: "The notification fires ahead of the charge, when cancelling is still possible.",
        },
      ],
      learned:
        "Building for iOS made the privacy question concrete in a way web work had not. Core ML meant the interesting feature cost nothing in data exposure, and that reordered how I thought about where computation should live.",
    },
  },

  {
    slug: "damg-7374-labs",
    name: "DAMG 7374 Course Labs",
    tagline: "Five graduate labs on GenAI in data engineering, authored as TA",
    summary:
      "The lab material for Northeastern's DAMG 7374, Data Engineering: Impact of Generative AI with LLMs, which I authored and maintained as teaching assistant under Professor Kishore Aaradhya. Five labs take graduate engineers from Snowflake fundamentals through dbt into agent routing, parallel execution and multi-agent reflection, the same patterns I build with.",
    lane: "teaching",
    lanes: ["teaching", "agentic-ai", "data-eng"],
    stack: [
      "Python",
      "Jupyter",
      "Snowflake",
      "dbt",
      "LangGraph",
      "RAG",
      "SQL",
    ],
    facts: [
      {
        value: "5",
        label: "labs authored and maintained",
        source: "Lab-1 through Lab-5",
      },
      {
        value: "26",
        label: "engineers across 9 concurrent team projects",
        source: "Spring 2026 cohort",
      },
      {
        value: "4",
        label: "GitHub stars, my most-starred repository",
        source: "students used it",
      },
    ],
    repo: `${GH}/DAMG-7374-GenAI-with-LLM---Spring-2026`,
    period: "Jan–Apr 2026",
    team: "Teaching assistant · instructor Prof. Kishore Aaradhya",
    featured: true,
    caseStudy: {
      problem:
        "Teaching agent architecture to people who have just learned dbt is a sequencing problem. Go too abstract and they build things they cannot debug; go too concrete and they copy code without understanding the pattern. Each lab has to leave them able to diagnose their own failures.",
      approach:
        "Five labs in deliberate order. Snowflake fundamentals across five worksheets. A full dbt project with models, seeds, tests, macros and snapshots, plus setup and teardown scripts so a broken environment is recoverable. A RAG and routing lab with a router dispatching to three specialist tools. A parallelisation lab structured as planner, parallel executor and synthesizer over three analyst agents sharing a base class. Finally a multi-agent reflection pipeline.",
      decisions: [
        {
          title: "Warehouse before agents",
          body: "Two labs of Snowflake and dbt before any agent code. Students who cannot trace a record through transformation layers cannot debug a retrieval pipeline either, and agentic failures look like magic until you can inspect the data underneath.",
        },
        {
          title: "A shared base class in the parallelisation lab",
          body: "The three analysts inherit from one base, so the lesson is the orchestration pattern (planner, executor, synthesizer) rather than three variations of prompt writing.",
        },
        {
          title: "Teardown scripts alongside setup",
          body: "Every lab can be reset. Students break environments, and a recoverable environment is the difference between a bad afternoon and a lost week.",
        },
        {
          title: "Evaluation rubrics as measurable checks",
          body: "I wrote rubrics that turned vague quality questions into checks teams could apply to their own systems, which is the same discipline I use on my own projects.",
        },
      ],
      learned:
        "Administering the Snowflake environment behind nine simultaneous team projects taught me more about role-based access and warehouse sizing than my own projects had, because nine teams find every sharp edge at once. And explaining agent orchestration to people who would immediately try to break it forced a precision in my own understanding that building alone had not.",
    },
  },
];

export const featuredProjects = projects.filter((p) => p.featured);

export const projectsBySlug = new Map(projects.map((p) => [p.slug, p]));

export function getProject(slug: string) {
  return projectsBySlug.get(slug);
}
