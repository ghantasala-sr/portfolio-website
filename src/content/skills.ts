import type { SkillGroup } from "./types";

/**
 * Ordered by how central each group is to the work shown on this site, not
 * alphabetically. Anything listed here appears in at least one linked repo.
 */
export const skills: SkillGroup[] = [
  {
    label: "Languages",
    items: [
      "Python",
      "TypeScript",
      "JavaScript",
      "SQL",
      "Go",
      "Java",
      "Swift",
      "C#",
      "R",
    ],
  },
  {
    label: "AI & LLM Systems",
    items: [
      "LangGraph",
      "LangChain",
      "DSPy",
      "RAG pipelines",
      "MCP servers",
      "agent orchestration",
      "tool & function calling",
      "LLM-as-judge evaluation",
      "judge validation",
      "chunking & embeddings",
      "prompt engineering",
      "Claude API",
      "OpenAI API",
      "Amazon Bedrock",
      "Vertex AI",
      "Snowflake Cortex",
      "Pinecone",
    ],
  },
  {
    label: "Data Engineering",
    items: [
      "Airflow",
      "dbt",
      "Snowflake",
      "BigQuery",
      "Kafka / Redpanda",
      "Spark & PySpark",
      "Databricks",
      "ETL & ELT",
      "dimensional modelling",
      "medallion architecture",
      "data lineage",
      "Great Expectations",
      "data quality",
    ],
  },
  {
    label: "Backend & Full-Stack",
    items: [
      "FastAPI",
      "Node.js",
      "Express",
      "Spring Boot",
      "Flask",
      "Django",
      "REST",
      "gRPC",
      "SSE streaming",
      "React",
      "Next.js",
      "PostgreSQL",
      "MySQL",
      "MongoDB",
      "Redis",
      "microservices",
    ],
  },
  {
    label: "Cloud & DevOps",
    items: [
      "AWS (Lambda, SNS, SQS, DynamoDB, ECS, EC2, RDS, S3, Bedrock)",
      "GCP (Cloud Run, Cloud Functions, Pub/Sub, Firestore, BigQuery, Vertex AI, GKE)",
      "Azure Blob Storage",
      "Terraform",
      "AWS CDK",
      "Docker",
      "Kubernetes",
      "GitHub Actions",
      "Cloud Build",
      "Git",
    ],
  },
  {
    label: "Observability & Quality",
    items: [
      "OpenTelemetry",
      "SigNoz",
      "ClickHouse",
      "distributed tracing",
      "trace context propagation",
      "structured logging",
      "metrics & alerting",
      "SLOs",
      "unit & integration testing",
      "code review",
      "root-cause analysis",
    ],
  },
  {
    label: "Security & Governance",
    items: [
      "RBAC",
      "least-privilege IAM",
      "PII & PHI masking (Presidio)",
      "input/output guardrails",
      "citation faithfulness checks",
      "audit logging",
      "approval-gated automation",
      "secure coding",
      "GDPR & CCPA awareness",
    ],
  },
  {
    label: "ML",
    items: [
      "PyTorch",
      "Hugging Face",
      "scikit-learn",
      "Pandas",
      "NumPy",
      "PEFT & LoRA fine-tuning",
      "feature engineering",
      "model evaluation",
      "Cohen's kappa",
      "NLP",
    ],
  },
  {
    label: "BI & Analytics",
    items: [
      "Power BI",
      "Tableau",
      "semantic layers",
      "self-serve analytics",
      "metric definition governance",
    ],
  },
  {
    label: "AI Development Tools",
    items: ["Claude Code", "Codex", "Cursor"],
  },
];

/** Headline numbers for the home page strip. Each one is checkable. */
export const verifiedStats = [
  {
    value: "4.0",
    suffix: "/4.0",
    label: "GPA, MS Information Systems",
    detail: "Northeastern University",
  },
  {
    value: "16",
    suffix: "",
    label: "public repositories shipped",
    detail: "every project on this site links to its source",
  },
  {
    value: "2",
    suffix: "",
    label: "peer-reviewed publications",
    detail: "network threat detection, both with DOIs",
  },
  {
    value: "26",
    suffix: "",
    label: "engineers taught as TA",
    detail: "across 9 concurrent team projects",
  },
] as const;

export interface NowItem {
  label: string;
  body: string;
  href?: string;
}

/** What I'm building now. Anchored on the most recently pushed repo. */
export const now: { updated: string; items: NowItem[] } = {
  updated: "July 2026",
  items: [
    {
      label: "Building",
 body: "DocIntel, serverless document intelligence on GCP, built level by level from a single container up to least-privilege service accounts, Terraform and CI. Most recently rewrote the processor from Python to Go on the same trigger.",
      href: "https://github.com/ghantasala-sr/DocIntel",
    },
    {
      label: "Thinking about",
      body: "How to make evaluation harnesses cheap enough that they get built before the system rather than after it. The Lincoln judge-validation work convinced me most LLM-as-judge numbers are unexamined.",
      href: "https://github.com/ghantasala-sr/Lincoln-Scraping-AI-Judge-Evals",
    },
    {
      label: "Next",
      body: "Adding a timing harness to Argus so its end-to-end review latency becomes a measured number instead of one I decline to publish.",
    },
    {
      label: "Looking for",
      body: "New grad and mid-level software engineering roles in AI systems, data engineering or backend infrastructure. Boston-based, open to relocation.",
    },
  ],
};
