import type { Topology } from "./types";

/**
 * One turn, with the boundary the project is organised around.
 *
 * Everything to the left of the turn loop is audio and everything inside it is
 * plain Python with no audio imports at all, which is what makes the
 * conversation testable without a microphone. The grounding checker sits
 * between the model and the speaker: a sentence that cannot be traced to a
 * retrieved passage is never spoken, and the call hands off instead.
 */
export const voicedeskTopology: Topology = {
  id: "voicedesk",
  width: 1240,
  height: 520,
  groups: [
    {
      id: "conversation",
      label: "harness/ · no audio imports, so a turn is testable without a mic",
      x: 560,
      y: 60,
      width: 230,
      height: 390,
    },
  ],
  nodes: [
    { id: "caller", label: "Caller", meta: "browser mic · PCM16", x: 95, y: 230, kind: "source", key: true },
    { id: "vad", label: "Silero VAD", meta: "endpointing · barge-in", x: 285, y: 230, kind: "compute", key: true },
    { id: "stt", label: "STT", meta: "Deepgram / Whisper", x: 470, y: 230, kind: "compute" },
    { id: "ret", label: "Hybrid search", meta: "BM25 + pgvector · RRF", x: 660, y: 95, kind: "store", key: true },
    { id: "loop", label: "Turn loop", meta: "no audio imports", x: 660, y: 230, kind: "compute", key: true },
    { id: "llm", label: "Gemini 2.5 Flash", meta: "Vertex AI", x: 660, y: 390, kind: "model", key: true },
    { id: "checker", label: "Grounding checker", meta: "p95 0.07 ms / sentence", x: 900, y: 230, kind: "observe", key: true },
    { id: "tts", label: "Cartesia TTS", meta: "spoken form", x: 1130, y: 150, kind: "sink", key: true },
    { id: "handoff", label: "Handoff", meta: "written summary", x: 1130, y: 330, kind: "sink", key: true },
    { id: "ledger", label: "Idempotency ledger", meta: "partial unique index", x: 420, y: 410, kind: "store", key: true },
  ],
  edges: [
    { from: "caller", to: "vad", kind: "sync" },
    { from: "vad", to: "stt", kind: "sync" },
    { from: "stt", to: "loop", kind: "sync" },
    { from: "ret", to: "loop", kind: "data" },
    { from: "loop", to: "llm", kind: "sync" },
    { from: "llm", to: "checker", kind: "sync" },
    { from: "checker", to: "tts", kind: "sync" },
    { from: "checker", to: "handoff", kind: "dlq" },
    { from: "loop", to: "ledger", kind: "async" },
  ],
  flow: ["caller", "vad", "stt", "loop", "llm", "checker", "tts"],
};

/**
 * Headline figures, each read out of a committed run directory under results/
 * rather than from the README. `agent` records which agent produced the number,
 * because most of them come from the offline extractive agent: no API key was
 * available while the measurement harness was built, and the repo labels that
 * everywhere rather than quietly implying a live model.
 */
export const voicedeskResults = [
  { metric: "Duplicate side effects under fault injection", value: "0", detail: "Across all 34 fault tests, including commit-then-timeout and concurrent duplicates.", agent: "n/a" },
  { metric: "Handoff recall, after calibration", value: "0.86", detail: "95% CI 0.72 to 0.93, n = 94 with 42 positives. Recall was 0.31 before calibration.", agent: "deterministic" },
  { metric: "Checker false positives", value: "2 of 46", detail: "Against known-good answers. Invented numbers, dates and entities were caught 23/23, 5/5 and 4/4.", agent: "n/a" },
  { metric: "Containment after one corpus change", value: "0.737 to 0.793", detail: "300 simulated calls on identical seeds, paired +17 and -0, McNemar exact p = 1.5e-5.", agent: "extractive" },
  { metric: "Same cycle, live model", value: "+16 / -0", detail: "Target intent, p = 3e-5. Other intents moved +14 / -22 at p = 0.24, which is sampling noise.", agent: "Gemini 2.5 Flash" },
  { metric: "Voice-to-voice latency", value: "~3.1 s", detail: "Two recorded calls only, a smoke test rather than a results directory. Named as not yet measured.", agent: "Gemini 2.5 Flash" },
] as const;
