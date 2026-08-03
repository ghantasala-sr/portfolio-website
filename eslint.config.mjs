import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  {
    // React Three Fiber's programming model is imperative by design: the
    // documented way to animate is to mutate three.js objects in place inside
    // useFrame — camera.position, mesh.rotation, BufferAttribute arrays — and
    // then flag needsUpdate. Doing it "immutably" would mean reallocating
    // geometry every frame, which is exactly what the pattern exists to avoid.
    //
    // react-hooks/immutability cannot distinguish that from accidental mutation
    // of hook state, so it is disabled for the WebGL layer only. Everywhere
    // else in the codebase the rule stays on.
    files: [
      "src/components/hero/HeroGraph.tsx",
      "src/components/hero/**/*.ts",
      "src/components/portrait/PortraitScene.client.tsx",
      "src/components/webgl/**/*.ts",
    ],
    rules: {
      "react-hooks/immutability": "off",
    },
  },

  {
    // These are deliberate mount-detection effects. ThemeToggle uses the
    // canonical next-themes pattern (the theme is unknown on the server, so
    // labelling it before mount would be a hydration mismatch); BootSequence
    // and the shader harness populate state from measurements that can only be
    // taken on the client. Each is a one-shot effect, not a render loop.
    files: [
      "src/components/chrome/ThemeToggle.tsx",
      "src/components/chrome/BootSequence.tsx",
      "src/app/dev/shader-check/page.tsx",
    ],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
