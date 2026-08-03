"use client";

import { useEffect, useState } from "react";
import { packetShaderSource } from "@/components/hero/packets/packetMaterial";
import { heroShaderSources } from "@/components/hero/HeroGraph";

/**
 * Dev-only shader compile harness.
 *
 * The live scene cannot always be inspected: R3F refuses to create a root until
 * ResizeObserver reports a non-zero container size, and a hidden or headless
 * browser pane never delivers that. So this page compiles and links the real
 * shader sources in a GL context it creates itself, with explicit dimensions,
 * and reports the driver's own logs.
 *
 * It caught exactly one real bug: RawShaderMaterial injects no built-in uniform
 * declarations, so `viewMatrix` and `projectionMatrix` were undeclared and every
 * program silently failed to link, leaving a black canvas.
 */
interface Result {
  name: string;
  vertexOk: boolean;
  fragmentOk: boolean;
  linkOk: boolean;
  vertexLog: string;
  fragmentLog: string;
  programLog: string;
  attributes: string[];
  uniforms: string[];
}

function compile(
  gl: WebGL2RenderingContext,
  name: string,
  vertexSrc: string,
  fragmentSrc: string,
): Result {
  // three prepends the version directive for GLSL3 materials; do the same.
  const withVersion = (src: string) =>
    src.trimStart().startsWith("#version") ? src : `#version 300 es\n${src}`;

  const vs = gl.createShader(gl.VERTEX_SHADER)!;
  gl.shaderSource(vs, withVersion(vertexSrc));
  gl.compileShader(vs);
  const vertexOk = gl.getShaderParameter(vs, gl.COMPILE_STATUS) as boolean;
  const vertexLog = gl.getShaderInfoLog(vs) ?? "";

  const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
  gl.shaderSource(fs, withVersion(fragmentSrc));
  gl.compileShader(fs);
  const fragmentOk = gl.getShaderParameter(fs, gl.COMPILE_STATUS) as boolean;
  const fragmentLog = gl.getShaderInfoLog(fs) ?? "";

  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  const linkOk = gl.getProgramParameter(prog, gl.LINK_STATUS) as boolean;
  const programLog = gl.getProgramInfoLog(prog) ?? "";

  const attributes: string[] = [];
  const uniforms: string[] = [];
  if (linkOk) {
    const na = gl.getProgramParameter(prog, gl.ACTIVE_ATTRIBUTES) as number;
    for (let i = 0; i < na; i++) {
      const info = gl.getActiveAttrib(prog, i);
      if (info) attributes.push(info.name);
    }
    const nu = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS) as number;
    for (let i = 0; i < nu; i++) {
      const info = gl.getActiveUniform(prog, i);
      if (info) uniforms.push(info.name);
    }
  }

  gl.deleteShader(vs);
  gl.deleteShader(fs);
  gl.deleteProgram(prog);

  return {
    name,
    vertexOk,
    fragmentOk,
    linkOk,
    vertexLog,
    fragmentLog,
    programLog,
    attributes: attributes.sort(),
    uniforms: uniforms.sort(),
  };
}

// Diagnostic only, not part of the site.
const ENABLED = process.env.NODE_ENV !== "production";

export default function ShaderCheck() {
  const [results, setResults] = useState<Result[] | null>(null);
  const [floatLinear, setFloatLinear] = useState<boolean | null>(null);

  useEffect(() => {
    if (!ENABLED) return;
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const gl = canvas.getContext("webgl2");
    if (!gl) {
      setResults([]);
      return;
    }

    // The extension whose absence makes FloatType + LinearFilter return
    // (0,0,0,1), the reason the curve texture must be NearestFilter.
    setFloatLinear(gl.getExtension("OES_texture_float_linear") !== null);

    setResults(
      (
        [
          ["hero / packets", packetShaderSource],
          ["hero / wires", heroShaderSources.wires],
          ["hero / nodes", heroShaderSources.nodes],
        ] as const
      ).map(([name, src]) => compile(gl, name, src.vertex, src.fragment)),
    );
  }, []);

  if (!ENABLED) return null;

  const allOk =
    results !== null &&
    results.length > 0 &&
    results.every((r) => r.vertexOk && r.fragmentOk && r.linkOk);

  return (
    <div className="shell py-32 font-mono text-sm">
      <h1 className="text-d3 mb-2">Shader compile check</h1>
      <p className="label mb-8">
        Compiles the real hero shader sources in a self-created GL context, so
        the result does not depend on R3F having a measured container size.
      </p>

      <p className="mb-6" data-status={allOk ? "pass" : "fail"}>
        <span
          style={{ color: allOk ? "var(--accent)" : "var(--crit)" }}
        >{`${allOk ? "PASS" : "FAIL"}`}</span>
        {"  "}
        <span style={{ color: "var(--muted)" }}>
          OES_texture_float_linear:{" "}
          {floatLinear === null ? "?" : floatLinear ? "present" : "ABSENT"}
        </span>
      </p>

      {results === null && <p>running…</p>}
      {results?.length === 0 && <p>No webgl2 context available.</p>}

      {results?.map((r) => (
        <div key={r.name} className="mb-10 border border-line p-5">
          <p className="mb-3 font-semibold">{r.name}</p>
          <ul className="mb-4 space-y-1">
            {(
              [
                ["vertex compile", r.vertexOk, r.vertexLog],
                ["fragment compile", r.fragmentOk, r.fragmentLog],
                ["program link", r.linkOk, r.programLog],
              ] as const
            ).map(([label, ok, log]) => (
              <li key={label}>
                <span style={{ color: ok ? "var(--accent)" : "var(--crit)" }}>
                  {ok ? "ok  " : "FAIL"}
                </span>{" "}
                {label}
                {log ? (
                  <pre className="mt-1 whitespace-pre-wrap text-xs" style={{ color: "var(--warn)" }}>
                    {log}
                  </pre>
                ) : null}
              </li>
            ))}
          </ul>
          <p className="label mb-1">Active attributes</p>
          <p className="mb-3 text-xs" style={{ color: "var(--text-dim)" }}>
            {r.attributes.join(" · ") || ""}
          </p>
          <p className="label mb-1">Active uniforms</p>
          <p className="text-xs" style={{ color: "var(--text-dim)" }}>
            {r.uniforms.join(" · ") || ""}
          </p>
        </div>
      ))}
    </div>
  );
}
