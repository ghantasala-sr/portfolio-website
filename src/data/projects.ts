export interface Project {
  title: string;
  subtitle: string;
  description: string;
  tech: string[];
  github?: string; // GitHub repo slug: "owner/repo"
  date: string;
  featured?: boolean;
  specialBadge?: string;
  highlights?: string[];
}

/**
 * ============================================================
 *  ADD NEW PROJECTS HERE
 *  Just copy one of the blocks below and fill in your details.
 *  The website will automatically pick it up!
 * ============================================================
 */
export const projects: Project[] = [
  {
    title: "GenAI with LLMs",
    subtitle: "Course Curriculum & Assignments (TA)",
    description:
      "Architected and delivered the comprehensive curriculum for a graduate-level Generative AI course. Focuses on prompt engineering, agentic orchestration, tool calling, and RAG systems.",
    tech: ["Python", "LangChain", "OpenAI", "Agentic Systems", "RAG"],
    github: "ghantasala-sr/DAMG-7374-GenAI-with-LLM---Spring-2026",
    date: "Spring 2026",
    featured: true,
    specialBadge: "🎓 Featured Teaching Work",
    highlights: [
      "Presented weekly to 25+ graduate students",
      "Designed advanced agentic workflows & tooling",
      "End-to-end LLM orchestration assignments",
    ],
  },
  {
    title: "MyClaw",
    subtitle: "AI Interaction Platform with Observability",
    description:
      "Launched solo a platform that captures, processes, and governs AI interactions across document ingestion, LLM-powered retrieval, and approval-gated actions, deploying 4 services on Cloud Run with full observability.",
    tech: ["TypeScript", "Next.js", "Vertex AI", "Cloud Run", "PostgreSQL", "Pub/Sub"],
    github: "ghantasala-sr/MyClaw---Personal-Assistant",
    date: "Mar 2026",
    featured: true,
    highlights: [
      "4 deployable microservices on Cloud Run",
      "LLM-powered retrieval with citations",
      "Structured logging for auditability",
    ],
  },
  {
    title: "Argus",
    subtitle: "Real-Time AI Classification Platform",
    description:
      "Engineered distributed classification system with 6 independent services that analyze inputs in real time, implementing cost-driven model routing to select optimal ML models per interaction.",
    tech: ["Python", "LangChain", "AWS Lambda", "SNS/SQS", "DynamoDB", "CloudWatch"],
    github: "ghantasala-sr/Argus---Event-Driven-Agent-Architecture",
    date: "Mar 2026",
    featured: true,
    highlights: [
      "6 event-driven microservices",
      "Results delivered in under 15 seconds",
      "Zero silent failures with fault-tolerant retry",
    ],
  },
  {
    title: "HarvestIQ",
    subtitle: "High-Throughput Event Processing Platform",
    description:
      "Sustained 100K+ events/hour ingestion by deploying event-driven microservices with Kafka pipelines on AWS ECS, processing high-frequency streaming data from 100 simulated sources.",
    tech: ["Python", "Kafka", "PyTorch", "AWS ECS", "Docker", "PostgreSQL"],
    date: "Jan 2026",
    featured: true,
    highlights: [
      "100K+ events/hour throughput",
      "Real-time ML classification with PyTorch",
      "Kafka pipelines on AWS ECS",
    ],
  },
  {
    title: "CloudTask",
    subtitle: "Reliable Backend Infrastructure",
    description:
      "Architected production-grade three-tier backend system using infrastructure-as-code across multiple Availability Zones, implementing auto-scaling (2-4 instances).",
    tech: ["Java", "AWS VPC", "EC2", "RDS", "ALB", "Auto Scaling", "Terraform"],
    github: "ghantasala-sr/CloudTask_High-Availability-Multi-AZ-Distributed-Platform",
    date: "Feb 2026",
    highlights: [
      "Multi-AZ high availability",
      "Infrastructure-as-code with Terraform",
      "Chained security groups & load balancers",
    ],
  },
  {
    title: "MealMind",
    subtitle: "Data-Intensive AI Application",
    description:
      "Hit 94% query resolution accuracy across 360,000+ records by curating retrieval datasets, designing intent classification workflows, and iterating on data quality.",
    tech: ["Python", "LangGraph", "Snowflake", "Spark", "AWS", "Docker"],
    github: "ghantasala-sr/MealMinds_dbt",
    date: "Sep 2025",
    highlights: [
      "94% query resolution accuracy",
      "360,000+ records processed",
      "Spark-based data pipeline optimization",
    ],
  },
  {
    title: "Support Intel",
    subtitle: "Data Pipeline with Governance",
    description:
      "Architected ETL pipeline to ingest, normalize, and classify data from multiple fragmented sources into Snowflake, establishing data governance workflows.",
    tech: ["Python", "SQL", "Airflow", "Snowflake", "dbt", "AWS"],
    github: "ghantasala-sr/Support_Intel",
    date: "Oct 2025",
    highlights: [
      "Automated data quality checks with dbt",
      "End-to-end data integrity & traceability",
      "Multi-source ETL consolidation",
    ],
  },
  {
    title: "CampusVitality",
    subtitle: "Student Insurance & Wellness Platform",
    description:
      "Led 5-engineer team building reliable backend ecosystem handling authentication, inter-service communication, and payment integration for student wellness workflows.",
    tech: ["Java", "JavaScript", "Node.js", "MongoDB", "Stripe API"],
    github: "ghantasala-sr/Campus-Vitality---Insurance-Management-System",
    date: "Dec 2023",
    featured: true,
    highlights: [
      "Cross-functional team leadership",
      "Decoupled, maintainable architecture",
      "Robust data validation & security",
    ],
  },
  {
    title: "Automobile Management",
    subtitle: "Enterprise Java Application",
    description:
      "Developed a comprehensive management system for automobile dealerships with complex object-oriented patterns, role-based access control, and a rich Java Swing UI.",
    tech: ["Java", "Design Patterns", "Swing", "OOP"],
    github: "ghantasala-sr/Automobile_Management_System-AED",
    date: "Dec 2023",
  },
  {
    title: "Smart City Management",
    subtitle: "Urban Infrastructure Simulator",
    description:
      "Engineered a scalable smart city simulator tracking utility services, emergency response workflows, and municipal administration using advanced software design patterns.",
    tech: ["Java", "Systems Design", "Swing", "Algorithms"],
    github: "ghantasala-sr/Smart-City-Project-AED",
    date: "Dec 2023",
  },
];
