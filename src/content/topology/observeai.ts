import type { Topology } from "./types";

/**
 * Drawn from docker-compose.yml and the service code, NOT from
 * ObserveAI_README.md, that file describes a different, larger system
 * ("ObservableShop AI") with 10 Kafka topics and services that do not exist.
 *
 * The real shape: 3 topics, analytics as a *sibling* consumer of
 * fraud.check.completed (not downstream of notification) and the sole
 * consumer of the DLQ.
 */
export const observeaiTopology: Topology = {
  id: "observeai",
  width: 1200,
  height: 560,
  groups: [
    {
      id: "sync",
      label: "Synchronous dependencies",
      x: 300,
      y: 30,
      width: 250,
      height: 250,
    },
    {
      id: "async",
      label: "Event backbone · Redpanda · trace context propagated via headers",
      x: 580,
      y: 300,
      width: 470,
      height: 230,
    },
  ],
  nodes: [
    { id: "traffic", label: "traffic-generator", meta: "~1.5 req/s baseline", x: 60, y: 90, kind: "source" },
    { id: "browser", label: "Browser / UI", meta: "scenario triggers", x: 60, y: 200, kind: "source", key: true },
    { id: "checkout", label: "checkout-service", meta: "root span: checkout.workflow", x: 210, y: 150, kind: "compute", key: true },

    { id: "cart", label: "cart-service", x: 420, y: 70, kind: "compute" },
    { id: "inventory", label: "inventory-service", x: 420, y: 150, kind: "compute" },
    { id: "payment", label: "payment-service", meta: "span: payment.provider_call", x: 420, y: 240, kind: "compute", key: true },

    { id: "redis", label: "Redis", x: 545, y: 70, kind: "store" },
    { id: "pg", label: "PostgreSQL", meta: "orders · fraud_results · notifications", x: 300, y: 400, kind: "store", key: true },

    { id: "t_req", label: "fraud.check.requested", x: 640, y: 150, kind: "topic", key: true },
    { id: "fraud", label: "ai-fraud-service", meta: "rules · 3 retries · fraud.inference", x: 800, y: 150, kind: "compute", key: true },
    { id: "t_done", label: "fraud.check.completed", x: 660, y: 360, kind: "topic", key: true },
    { id: "t_dlq", label: "fraud.check.dlq", x: 660, y: 480, kind: "queue", key: true },

    { id: "notify", label: "notification-service", meta: "group: notification-v2", x: 870, y: 340, kind: "compute" },
    { id: "analytics", label: "analytics-service", meta: "2 groups: completed + dlq", x: 890, y: 460, kind: "compute", key: true },

    { id: "otel", label: "OTel Collector", meta: "memory_limiter → batch", x: 1090, y: 150, kind: "observe", key: true },
    { id: "signoz", label: "SigNoz", meta: "ClickHouse · 22 dashboards · 14 alerts", x: 1090, y: 60, kind: "observe", key: true },
  ],
  edges: [
    { from: "traffic", to: "checkout", kind: "sync" },
    { from: "browser", to: "checkout", kind: "sync" },
    { from: "checkout", to: "cart", kind: "sync" },
    { from: "checkout", to: "inventory", kind: "sync" },
    { from: "checkout", to: "payment", kind: "sync" },
    { from: "cart", to: "redis", kind: "data" },
    { from: "checkout", to: "pg", kind: "data", bend: 30 },

    { from: "checkout", to: "t_req", kind: "async", bend: -70 },
    { from: "t_req", to: "fraud", kind: "async" },
    { from: "fraud", to: "t_done", kind: "async", bend: 60 },
    { from: "fraud", to: "t_dlq", kind: "dlq", bend: 110 },

    { from: "t_done", to: "notify", kind: "async" },
    { from: "t_done", to: "analytics", kind: "async" },
    { from: "t_dlq", to: "analytics", kind: "dlq" },
    { from: "fraud", to: "pg", kind: "data", bend: -80 },
    { from: "notify", to: "pg", kind: "data", bend: -60 },

    { from: "checkout", to: "otel", kind: "async", bend: -140 },
    { from: "fraud", to: "otel", kind: "async", bend: -40 },
    { from: "analytics", to: "otel", kind: "async", bend: -120 },
    { from: "otel", to: "signoz", kind: "data" },
  ],
  flow: ["browser", "checkout", "t_req", "fraud", "t_done", "analytics", "otel", "signoz"],
};

/** The 12 scenarios, verified against services/traffic/main.py SCENARIOS. */
export const observeaiScenarios = [
  { id: "normal", label: "Normal", injects: "", expect: "200" },
  { id: "payment_slow", label: "Slow payment", injects: "sleep 1.2s", expect: "200" },
  { id: "payment_fail", label: "Payment declined", injects: "HTTP 502", expect: "502" },
  { id: "provider_timeout", label: "Provider timeout", injects: "HTTP 502", expect: "502" },
  { id: "inventory_fail", label: "Out of stock", injects: "HTTP 409", expect: "409" },
  { id: "fraud_ai_slow", label: "Slow fraud inference", injects: "sleep 1.5s", expect: "200" },
  { id: "kafka_consumer_slow", label: "Consumer lag", injects: "sleep 5.0s", expect: "200" },
  { id: "poison_message", label: "Poison message → DLQ", injects: "3 retries then DLQ", expect: "200" },
  { id: "notification_slow", label: "Slow notification", injects: "sleep 2.0s", expect: "200" },
  { id: "notification_fail", label: "Notification failure", injects: "RuntimeError", expect: "200" },
  { id: "analytics_slow", label: "Slow analytics", injects: "sleep 1.5s", expect: "200" },
  { id: "db_slow", label: "Slow query", injects: "pg_sleep(1)", expect: "200" },
] as const;
