import type { Topology } from "./types";

/**
 * The real dbt DAG, from the ref() calls, 10 models across 3 layers.
 *
 * Two things the diagram makes visible that the README does not:
 *   - stg_products is a terminal orphan; nothing refs it.
 *   - dim_customers and dim_agents have NO edge to fct_tickets, because the
 *     source tickets carry no customer_id or agent_id. The star has arms that
 *     do not connect, which is exactly what tracing lineage is for.
 *
 * Also: the landing zone is Azure Blob Storage. The README says nothing about
 * Azure at all.
 */
export const supportIntelTopology: Topology = {
  id: "support-intel",
  width: 1160,
  height: 520,
  groups: [
    { id: "raw", label: "RAW · Snowflake", x: 300, y: 30, width: 170, height: 460 },
    { id: "stg", label: "staging · views", x: 500, y: 30, width: 180, height: 460 },
    { id: "int", label: "intermediate · view", x: 710, y: 120, width: 180, height: 130 },
    { id: "marts", label: "marts · tables", x: 920, y: 30, width: 190, height: 460 },
  ],
  nodes: [
    { id: "hf", label: "HuggingFace", meta: "~20k multi-language tickets", x: 70, y: 110, kind: "source", key: true },
    { id: "faker", label: "Faker · seed 42", meta: "5,000 customers · 50 agents", x: 70, y: 300, kind: "source" },
    { id: "azure", label: "Azure Blob", meta: "container: datalake", x: 190, y: 200, kind: "store", key: true },

    { id: "r_tick", label: "TICKETS", x: 385, y: 80, kind: "store", key: true },
    { id: "r_cust", label: "CUSTOMERS", x: 385, y: 170, kind: "store" },
    { id: "r_agent", label: "AGENTS", meta: "no load task", x: 385, y: 260, kind: "store" },
    { id: "r_prod", label: "PRODUCTS", meta: "no load task", x: 385, y: 350, kind: "store" },
    { id: "r_sla", label: "SLA_POLICIES", meta: "no load task", x: 385, y: 440, kind: "store" },

    { id: "s_tick", label: "stg_tickets", meta: "try_cast · body_length", x: 590, y: 80, kind: "compute", key: true },
    { id: "s_cust", label: "stg_customers", x: 590, y: 170, kind: "compute" },
    { id: "s_agent", label: "stg_agents", x: 590, y: 260, kind: "compute" },
    { id: "s_prod", label: "stg_products", meta: "orphan. Nothing refs it", x: 590, y: 350, kind: "compute", key: true },
    { id: "s_sla", label: "stg_sla_policies", x: 590, y: 440, kind: "compute" },

    { id: "i_enr", label: "int_tickets_enriched", meta: "join hardcoded to tier 'starter'", x: 800, y: 185, kind: "compute", key: true },

    { id: "f_tick", label: "fct_tickets", x: 1015, y: 110, kind: "store", key: true },
    { id: "f_met", label: "fct_ticket_metrics", meta: "group by queue · priority · type", x: 1015, y: 200, kind: "store" },
    { id: "d_cust", label: "dim_customers", meta: "unjoinable, no customer_id on tickets", x: 1015, y: 330, kind: "store", key: true },
    { id: "d_agent", label: "dim_agents", meta: "unjoinable, no agent_id on tickets", x: 1015, y: 430, kind: "store", key: true },
  ],
  edges: [
    { from: "hf", to: "azure", kind: "data" },
    { from: "faker", to: "azure", kind: "data" },
    { from: "azure", to: "r_tick", kind: "data" },
    { from: "azure", to: "r_cust", kind: "data" },
    { from: "azure", to: "r_agent", kind: "data" },
    { from: "azure", to: "r_prod", kind: "data" },
    { from: "azure", to: "r_sla", kind: "data" },

    { from: "r_tick", to: "s_tick", kind: "data" },
    { from: "r_cust", to: "s_cust", kind: "data" },
    { from: "r_agent", to: "s_agent", kind: "data" },
    { from: "r_prod", to: "s_prod", kind: "data" },
    { from: "r_sla", to: "s_sla", kind: "data" },

    { from: "s_tick", to: "i_enr", kind: "data" },
    { from: "s_sla", to: "i_enr", kind: "data" },
    { from: "i_enr", to: "f_tick", kind: "data" },
    { from: "f_tick", to: "f_met", kind: "data", bend: -25 },
    { from: "s_cust", to: "d_cust", kind: "data", bend: 40 },
    { from: "s_agent", to: "d_agent", kind: "data", bend: 40 },
  ],
  flow: ["hf", "azure", "r_tick", "s_tick", "i_enr", "f_tick", "f_met"],
};
