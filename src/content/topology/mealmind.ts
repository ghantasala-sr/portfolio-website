import type { Topology } from "./types";

/**
 * Drawn from the repo's own committed diagrams:
 * Images/Basic System Architecture.png, the medallion layering
 * Images/Data Flow _ ELT.png, source tables, dbt models, marts
 * Images/Agent_Architecture.png, the LangGraph routing graph
 *
 * Two diagrams because the project genuinely has two halves that share almost
 * nothing: a warehouse pipeline and an agent graph. Forcing them into one
 * picture would misrepresent both.
 */

/** Bronze → Silver → Golden. USDA scrape through to the marts Cortex indexes. */
export const mealmindEltTopology: Topology = {
  id: "mealmind-elt",
  width: 1280,
  height: 660,
  groups: [
    { id: "bronze", label: "Bronze \u00b7 as scraped", x: 40, y: 90, width: 300, height: 540 },
    { id: "silver", label: "Silver \u00b7 dbt views", x: 370, y: 90, width: 480, height: 540 },
    { id: "golden", label: "Golden \u00b7 marts, indexed", x: 880, y: 90, width: 360, height: 540 },
  ],
  nodes: [
    // Airflow sits above the lanes because it drives all three.
    { id: "airflow", label: "Airflow", meta: "orchestrates the path", x: 640, y: 45, kind: "observe", key: true },

    { id: "usda", label: "USDA website", meta: "Selenium drivers", x: 190, y: 160, kind: "source", key: true },
    { id: "raw", label: "7 raw extracts", meta: "4 food sets + nutrient tables", x: 190, y: 300, kind: "store", key: true },
    { id: "s3", label: "Amazon S3", meta: "external stage", x: 190, y: 430, kind: "store", key: true },
    { id: "rawschema", label: "RAW_SCHEMA", meta: "joined on load", x: 190, y: 550, kind: "store", key: true },

    // Silver runs as two columns 240 apart, y-staggered by 80, so no two
    // labels ever share a row. dbt model names are wide; this is the widest
    // layout that keeps them from colliding.
    { id: "stg", label: "4 staging views", meta: "branded \u00b7 foundation \u00b7 sr_legacy \u00b7 fndds", x: 490, y: 160, kind: "compute", key: true },
    { id: "union", label: "foods_union_all", x: 730, y: 240, kind: "compute" },
    { id: "quality", label: "branded_quality_scores", x: 490, y: 320, kind: "compute", key: true },
    { id: "dedupe", label: "branded_deduplication", x: 730, y: 400, kind: "compute" },
    { id: "clean", label: "foods_cleaned", x: 490, y: 470, kind: "compute" },
    { id: "tier", label: "foods_tier_assignment", x: 730, y: 550, kind: "compute", key: true },

    { id: "core", label: "mart_meal_planning_core", x: 1010, y: 175, kind: "store", key: true },
    { id: "curated", label: "mart_curated_products", x: 1010, y: 300, kind: "store", key: true },
    { id: "catalog", label: "mart_search_catalog", x: 1010, y: 425, kind: "store", key: true },
    { id: "cortex", label: "Cortex Search", meta: "indexes the catalog", x: 1010, y: 555, kind: "model", key: true },
  ],
  edges: [
    { from: "usda", to: "raw", kind: "data" },
    { from: "raw", to: "s3", kind: "data" },
    { from: "s3", to: "rawschema", kind: "data" },
    { from: "rawschema", to: "stg", kind: "data", bend: -60 },

    { from: "stg", to: "union", kind: "data" },
    { from: "stg", to: "quality", kind: "data" },
    { from: "union", to: "clean", kind: "data" },
    { from: "quality", to: "dedupe", kind: "data" },
    { from: "clean", to: "tier", kind: "data" },
    { from: "dedupe", to: "tier", kind: "data" },

    { from: "tier", to: "core", kind: "data", bend: -70 },
    { from: "tier", to: "curated", kind: "data", bend: -40 },
    { from: "tier", to: "catalog", kind: "data" },
    { from: "catalog", to: "cortex", kind: "data" },

    { from: "airflow", to: "stg", kind: "async", bend: 40 },
  ],
  flow: ["usda", "raw", "s3", "rawschema", "stg", "quality", "dedupe", "tier", "catalog", "cortex"],
};

/** The LangGraph routing graph, from Images/Agent_Architecture.png. */
export const mealmindAgentTopology: Topology = {
  id: "mealmind-agents",
  width: 1180,
  height: 560,
  groups: [
    {
      id: "specialists",
      label: "Specialists",
      x: 300,
      y: 130,
      width: 470,
      height: 400,
    },
  ],
  nodes: [
    { id: "start", label: "START", x: 60, y: 90, kind: "source", key: true },
    { id: "prefs", label: "load_preferences", meta: "durable, from the warehouse", x: 190, y: 90, kind: "compute", key: true },
    { id: "router", label: "Router + Planner", meta: "Meal Routing Agent", x: 380, y: 90, kind: "topic", key: true },

    { id: "retrieval", label: "Meal Retrieval", x: 380, y: 200, kind: "compute" },
    { id: "adjust", label: "Meal Adjustment", meta: "+ Monitoring Agent", x: 380, y: 300, kind: "compute", key: true },
    { id: "recipe", label: "Recipe Lookup", meta: "Recipe Agent", x: 380, y: 400, kind: "compute" },
    { id: "calorie", label: "Calorie Estimator", x: 380, y: 490, kind: "compute" },

    { id: "tools", label: "execute_tools", meta: "MCP · Cortex Search", x: 620, y: 400, kind: "topic", key: true },
    { id: "chat", label: "general_chat", meta: "tool call ⇄ return to chat", x: 620, y: 260, kind: "compute", key: true },

    { id: "respond", label: "generate_response", x: 840, y: 190, kind: "compute", key: true },
    { id: "feedback", label: "Extract feedback", meta: "Feedback Agent → warehouse", x: 990, y: 300, kind: "observe", key: true },
    { id: "end", label: "END", x: 1120, y: 190, kind: "sink", key: true },
  ],
  edges: [
    { from: "start", to: "prefs", kind: "sync" },
    { from: "prefs", to: "router", kind: "sync" },

    { from: "router", to: "retrieval", kind: "async" },
    { from: "router", to: "adjust", kind: "async" },
    { from: "router", to: "recipe", kind: "async" },
    { from: "router", to: "calorie", kind: "async" },

    { from: "calorie", to: "tools", kind: "sync" },
    { from: "recipe", to: "tools", kind: "sync", bend: -25 },
    { from: "tools", to: "chat", kind: "sync" },
    { from: "retrieval", to: "chat", kind: "sync", bend: -40 },
    { from: "adjust", to: "chat", kind: "sync", bend: -30 },

    { from: "chat", to: "respond", kind: "sync" },
    { from: "respond", to: "feedback", kind: "async" },
    { from: "feedback", to: "end", kind: "sync" },
    // The loop that makes it an assistant rather than a one-shot generator.
    { from: "feedback", to: "router", kind: "async", bend: 150 },
  ],
  flow: ["start", "prefs", "router", "adjust", "chat", "respond", "feedback", "end"],
};
