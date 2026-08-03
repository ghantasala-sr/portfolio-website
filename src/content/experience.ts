import type { Education, ExperienceRole, Publication } from "./types";

export const experience: ExperienceRole[] = [
  {
    org: "Northeastern University",
    title: "Graduate Teaching Assistant. DAMG 7374",
    location: "Boston, MA",
    period: "Jan 2026 – Apr 2026",
    artifact: {
      label: "Course labs on GitHub",
      href: "https://github.com/ghantasala-sr/DAMG-7374-GenAI-with-LLM---Spring-2026",
    },
    bullets: [
      "Teaching assistant for Data Engineering: Impact of Generative AI with LLMs, under Professor Kishore Aaradhya, supporting 26 engineers across 9 concurrent team projects.",
      "Administered the Snowflake environment underpinning all nine projects, provisioning role-based access and compute warehouses, and resolving reliability issues before they blocked delivery.",
      "Authored and maintained the five course labs, taking students from Snowflake and dbt fundamentals through agent routing, parallel execution and multi-agent reflection.",
      "Diagnosed team failures by tracing records from source through each transformation layer, which is the skill most of them were missing rather than any framework knowledge.",
      "Reviewed pull requests against shared engineering standards and wrote documentation on data models, metric definitions and transformation logic.",
      "Designed evaluation rubrics that turned vague quality questions into measurable checks teams could apply to their own AI systems.",
    ],
    detail: {
      heading: "The five labs",
      items: [
        {
          name: "Lab 1. Snowflake fundamentals",
          body: "Five SQL worksheets building from warehouse basics to query profiling.",
        },
        {
          name: "Lab 2, dbt",
          body: "A full project with models, seeds, tests, macros, analyses and snapshots, plus Snowflake setup and cleanup scripts so a broken environment is always recoverable.",
        },
        {
          name: "Lab 3. RAG and routing agent",
          body: "A router dispatching to three specialist tools (retrieval, maps and news) over a Snowflake connection.",
        },
        {
          name: "Lab 4. Parallelisation with LLM agents",
          body: "Planner, parallel executor and synthesizer orchestrating market, purchase and review analysts that share a common base class.",
        },
        {
          name: "Lab 5. Multi-agent reflection",
          body: "A pipeline where agents critique and revise each other's output before a result is returned.",
        },
      ],
    },
  },
  {
    org: "CVR Research Lab",
    title: "Machine Learning Research Assistant",
    location: "Hyderabad, India",
    period: "Jan 2024 – May 2024",
    bullets: [
      "Developed and evaluated classification systems in Python and PyTorch for network threat detection, through iterative feature engineering and model tuning.",
      "Published two peer-reviewed papers documenting system design, tradeoffs and evaluation methodology, one on DDoS detection using SMOTE-balanced classifiers, one on Android malware detection with deep neural networks.",
      "Built reproducible training and evaluation pipelines with automated regression detection, turning manual verification into a repeatable process.",
      "This is where I learned that a number is only meaningful if you can explain what it does and does not tell you, the habit that later made me validate an LLM judge against human labels rather than trusting its scores.",
    ],
  },
  {
    org: "AIThinkers",
    title: "Full-Stack Engineering Intern",
    location: "Hyderabad, India",
    period: "Jan 2023 – Dec 2023",
    bullets: [
      "Shipped production full-stack features and backend APIs at an early-stage startup, owning delivery from specification through deployment and monitoring.",
      "Diagnosed a silent data-corruption defect through systematic log analysis and profiling, then shipped a targeted fix that eliminated a recurring class of downstream errors.",
      "Worked directly with product and engineering stakeholders to clarify requirements and iterate under startup timelines.",
    ],
  },
];

export const education: Education[] = [
  {
    org: "Northeastern University",
    degree: "Master of Science, Information Systems",
    location: "Boston, MA",
    period: "Aug 2024 – May 2026",
    gpa: "4.0 / 4.0",
  },
  {
    org: "CVR College of Engineering",
    degree: "Bachelor of Technology, Computer Science",
    focus: "Data Science specialisation · Cybersecurity minor",
    location: "Hyderabad, India",
    period: "Aug 2020 – May 2024",
    gpa: "9.2 / 10.0",
  },
];

export const publications: Publication[] = [
  {
    title:
      "The Investigative Study on the Performance Analysis of SMOTE employed Machine Learning Classifier Models to DDoS Attack Detection",
    authors:
      "G. Sravan Kumar, M. Sunitha, G. Srinivasa Rithik, S. Veeresh Kumar, K. Sreerama Murthy",
    me: "G. Srinivasa Rithik",
    venue:
      "International Journal on Recent and Innovation Trends in Computing and Communication, 11(9), pp. 702–708",
    year: "2023",
    doi: "10.17762/ijritcc.v11i9.8862",
    href: "https://doi.org/10.17762/ijritcc.v11i9.8862",
    note: "Class imbalance is the central problem in attack detection, a classifier that always predicts benign scores well on an unbalanced set and is useless. This paper compares SMOTE-balanced classifiers on that basis.",
  },
  {
    title:
      "Malware Detection in Android Applications Using Deep Learning Neural Networks",
    authors:
      "Sravan Kumar, Srinivas Rithik Ghantasala, Ratnam Dodda, Sunitha, Basha, Veeresh Kumar",
    me: "Srinivas Rithik Ghantasala",
    venue: "Book chapter, CRC Press / Taylor & Francis",
    year: "2025",
    doi: "10.1201/9781003616252-41",
    href: "https://doi.org/10.1201/9781003616252-41",
    // TODO(rithik): the publisher's CDN blocks automated fetches, so I could
    // not retrieve the containing book's title. Fill it in here.
    note: "Chapter 41. Deep neural network architectures for classifying Android applications as benign or malicious from extracted features.",
  },
];
