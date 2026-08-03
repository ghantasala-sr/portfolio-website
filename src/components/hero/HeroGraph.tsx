"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "@/lib/scroll/scrollState";
import {
  createBillboardGeometry,
  billboardGLSL,
  bezierGLSL,
  matrixUniformsGLSL,
} from "@/components/webgl/billboard";
import {
  buildEdgeCurves,
  heroNodes,
  packCurveTexture,
  labelledNodes,
} from "./topology";
import {
  createCurveTexture,
  createPacketMaterial,
} from "./packets/packetMaterial";
import { PacketScheduler, MAX_PACKETS } from "./packets/scheduler";

/** Hover result reported up to the DOM label. */
export interface HoverInfo {
  id: string;
  label: string;
  meta: string;
  x: number;
  y: number;
}

/* ─────────────────────────────────────────────────────────────────────────
   Wires: all edges merged into one geometry, one draw call. A faint gradient
   scrolls along each wire so the topology reads as energized between packet
   bursts. Also doubles as the lowest-power tier.
   ──────────────────────────────────────────────────────────────────────── */

const SEGMENTS = 26;

const wireVertex = /* glsl */ `
  precision highp float;

  ${matrixUniformsGLSL}

  in vec3 position;      // unused for placement; drives the vertex count
  in float aT;           // 0..1 along the edge
  in float aEdge;        // edge row in the curve texture
  in float aSide;        // -1 / +1 for ribbon width

  uniform sampler2D uCurves;
  uniform float uMorph;
  uniform float uWidth;

  out float vT;
  out float vPresence;

  ${bezierGLSL}

  void main() {
    int e = int(aEdge);
    vec4 a0 = texelFetch(uCurves, ivec2(0, e), 0);
    vec4 a1 = texelFetch(uCurves, ivec2(1, e), 0);
    vec4 a2 = texelFetch(uCurves, ivec2(2, e), 0);
    vec4 a3 = texelFetch(uCurves, ivec2(3, e), 0);
    vec4 b0 = texelFetch(uCurves, ivec2(4, e), 0);
    vec4 b1 = texelFetch(uCurves, ivec2(5, e), 0);
    vec4 b2 = texelFetch(uCurves, ivec2(6, e), 0);
    vec4 b3 = texelFetch(uCurves, ivec2(7, e), 0);

    vec3 p0 = mix(a0.xyz, b0.xyz, uMorph);
    vec3 p1 = mix(a1.xyz, b1.xyz, uMorph);
    vec3 p2 = mix(a2.xyz, b2.xyz, uMorph);
    vec3 p3 = mix(a3.xyz, b3.xyz, uMorph);

    vPresence = mix(a0.w, b0.w, uMorph);
    vT = aT;

    vec3 pos = bez(p0, p1, p2, p3, aT);
    vec3 tan = normalize(bezTangent(p0, p1, p2, p3, aT) + vec3(0.0001));

    // Widen in view space so the ribbon always faces the camera.
    vec4 mv = viewMatrix * vec4(pos, 1.0);
    vec3 dv = normalize((viewMatrix * vec4(tan, 0.0)).xyz);
    vec2 perp = normalize(vec2(-dv.y, dv.x));
    mv.xy += perp * aSide * uWidth;

    gl_Position = projectionMatrix * mv;
  }
`;

const wireFragment = /* glsl */ `
  precision highp float;
  in float vT;
  in float vPresence;
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uBase;
  out vec4 fragColor;

  void main() {
    if (vPresence < 0.01) discard;
    // A slow travelling brightening: the wire is carrying current.
    float pulse = 0.5 + 0.5 * sin((vT * 5.0 - uTime * 0.55) * 3.14159);
    float a = (uBase + pulse * 0.055) * vPresence;
    fragColor = vec4(uColor * (0.55 + pulse * 0.5), a);
  }
`;

function Wires({
  curveTexture,
  edgeCount,
  accent,
}: {
  curveTexture: THREE.DataTexture;
  edgeCount: number;
  accent: THREE.Color;
}) {
  const matRef = useRef<THREE.RawShaderMaterial>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const verts = edgeCount * (SEGMENTS + 1) * 2;
    const aT = new Float32Array(verts);
    const aEdge = new Float32Array(verts);
    const aSide = new Float32Array(verts);
    const position = new Float32Array(verts * 3);
    const indices: number[] = [];

    let v = 0;
    for (let e = 0; e < edgeCount; e++) {
      const rowStart = v;
      for (let s = 0; s <= SEGMENTS; s++) {
        const t = s / SEGMENTS;
        for (const side of [-1, 1]) {
          aT[v] = t;
          aEdge[v] = e;
          aSide[v] = side;
          v++;
        }
      }
      for (let s = 0; s < SEGMENTS; s++) {
        const i = rowStart + s * 2;
        indices.push(i, i + 1, i + 2, i + 1, i + 3, i + 2);
      }
    }

    geo.setAttribute("position", new THREE.BufferAttribute(position, 3));
    geo.setAttribute("aT", new THREE.BufferAttribute(aT, 1));
    geo.setAttribute("aEdge", new THREE.BufferAttribute(aEdge, 1));
    geo.setAttribute("aSide", new THREE.BufferAttribute(aSide, 1));
    geo.setIndex(indices);
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 40);
    return geo;
  }, [edgeCount]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(() => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = scrollState.sceneTime;
      matRef.current.uniforms.uMorph.value = scrollState.morph;
    }
  });

  return (
    <mesh geometry={geometry} frustumCulled={false}>
      <rawShaderMaterial
        ref={matRef}
        glslVersion={THREE.GLSL3}
        vertexShader={wireVertex}
        fragmentShader={wireFragment}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
        uniforms={{
          uCurves: { value: curveTexture },
          uTime: { value: 0 },
          uMorph: { value: 0 },
          uWidth: { value: 0.012 },
          uColor: { value: accent },
          uBase: { value: 0.055 },
        }}
      />
    </mesh>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Nodes: instanced quads, positions lerped A→B by uMorph on the CPU (only 24
   of them, so this costs nothing and keeps the hover projection trivial).
   ──────────────────────────────────────────────────────────────────────── */

const nodeVertex = /* glsl */ `
  precision highp float;

  ${matrixUniformsGLSL}

  in vec2 aCorner;
  in vec2 aUv;
  in vec3 iPos;
  in vec2 iMeta;   // x = size, y = hover 0..1

  uniform float uScale;
  out vec2 vUv;
  out float vHover;

  ${billboardGLSL}

  void main() {
    vUv = aUv;
    vHover = iMeta.y;
    float size = iMeta.x * uScale * (1.0 + iMeta.y * 0.5);
    gl_Position = billboardFlat(iPos, aCorner, size);
  }
`;

const nodeFragment = /* glsl */ `
  precision highp float;
  in vec2 vUv;
  in float vHover;
  uniform vec3 uColor;
  uniform vec3 uDim;
  out vec4 fragColor;

  void main() {
    vec2 d = vUv - 0.5;
    float r = length(d) * 2.0;

    // A ring, not a disc, reads as a node in a diagram rather than a particle.
    float ring = smoothstep(0.62, 0.72, r) * (1.0 - smoothstep(0.86, 0.98, r));
    float glow = (1.0 - smoothstep(0.0, 1.0, r)) * (0.1 + vHover * 0.5);
    float core = (1.0 - smoothstep(0.0, 0.3, r)) * (0.18 + vHover * 0.65);

    float a = ring * (0.85 + vHover * 0.15) + glow * 0.55 + core;
    if (a < 0.005) discard;

    vec3 col = mix(uDim, uColor, min(1.0, 0.35 + vHover));
    fragColor = vec4(col, a);
  }
`;

/** Exported so /dev/shader-check can compile these without mounting a scene. */
export const heroShaderSources = {
  wires: { vertex: wireVertex, fragment: wireFragment },
  nodes: { vertex: nodeVertex, fragment: nodeFragment },
};

function Nodes({
  accent,
  dim,
  hoverRef,
}: {
  accent: THREE.Color;
  dim: THREE.Color;
  hoverRef: React.RefObject<string | null>;
}) {
  const matRef = useRef<THREE.RawShaderMaterial>(null);
  const count = heroNodes.length;

  const { geometry, posAttr, metaAttr } = useMemo(() => {
    const geo = createBillboardGeometry(count);
    const pos = new Float32Array(count * 3);
    const meta = new Float32Array(count * 2);
    heroNodes.forEach((n, i) => {
      pos[i * 3] = n.a[0];
      pos[i * 3 + 1] = n.a[1];
      pos[i * 3 + 2] = n.a[2];
      meta[i * 2] = (n.size ?? 1) * 0.19;
      meta[i * 2 + 1] = 0;
    });
    const pa = new THREE.InstancedBufferAttribute(pos, 3);
    const ma = new THREE.InstancedBufferAttribute(meta, 2);
    geo.setAttribute("iPos", pa);
    geo.setAttribute("iMeta", ma);
    return { geometry: geo, posAttr: pa, metaAttr: ma };
  }, [count]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, dt) => {
    const m = scrollState.morph;
    const hovered = hoverRef.current;
    const pos = posAttr.array as Float32Array;
    const meta = metaAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const n = heroNodes[i];
      pos[i * 3] = n.a[0] + (n.b[0] - n.a[0]) * m;
      pos[i * 3 + 1] = n.a[1] + (n.b[1] - n.a[1]) * m;
      pos[i * 3 + 2] = n.a[2] + (n.b[2] - n.a[2]) * m;

      const target = hovered === n.id ? 1 : 0;
      const cur = meta[i * 2 + 1];
      meta[i * 2 + 1] = cur + (target - cur) * Math.min(1, dt * 10);
    }
    posAttr.needsUpdate = true;
    metaAttr.needsUpdate = true;
  });

  return (
    <mesh geometry={geometry} frustumCulled={false}>
      <rawShaderMaterial
        ref={matRef}
        glslVersion={THREE.GLSL3}
        vertexShader={nodeVertex}
        fragmentShader={nodeFragment}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
        uniforms={{
          uScale: { value: 1 },
          uColor: { value: accent },
          uDim: { value: dim },
        }}
      />
    </mesh>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Packets
   ──────────────────────────────────────────────────────────────────────── */

function Packets({
  curveTexture,
  scheduler,
  accent,
  budget,
}: {
  curveTexture: THREE.DataTexture;
  scheduler: PacketScheduler;
  accent: THREE.Color;
  budget: React.RefObject<number>;
}) {
  const { geometry, routeAttr, styleAttr, material } = useMemo(() => {
    const geo = createBillboardGeometry(MAX_PACKETS);
    const ra = new THREE.InstancedBufferAttribute(scheduler.routeArray, 4);
    const sa = new THREE.InstancedBufferAttribute(scheduler.styleArray, 4);
    ra.setUsage(THREE.DynamicDrawUsage);
    sa.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute("iRoute", ra);
    geo.setAttribute("iStyle", sa);
    const mat = createPacketMaterial(curveTexture, [
      accent.r,
      accent.g,
      accent.b,
    ]);
    return { geometry: geo, routeAttr: ra, styleAttr: sa, material: mat };
  }, [curveTexture, scheduler, accent]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame(() => {
    const t = scrollState.sceneTime;
    scheduler.update(t);

    material.uniforms.uTime.value = t;
    material.uniforms.uMorph.value = scrollState.morph;

    if (scheduler.dirty) {
      // The whole attribute is 38 KB. Partial updateRanges would generate many
      // small bufferSubData calls for no measurable gain, and note the API is
      // now `updateRanges`/`addUpdateRange`, not the old `updateRange`.
      routeAttr.needsUpdate = true;
      styleAttr.needsUpdate = true;
      scheduler.dirty = false;
    }

    geometry.instanceCount = Math.min(MAX_PACKETS, budget.current ?? MAX_PACKETS);
  });

  return <mesh geometry={geometry} material={material} frustumCulled={false} />;
}

/* ─────────────────────────────────────────────────────────────────────────
   Scene root
   ──────────────────────────────────────────────────────────────────────── */

export function HeroGraph({
  accentLinear,
  dimLinear,
  onHover,
  budgetRef,
}: {
  accentLinear: [number, number, number];
  dimLinear: [number, number, number];
  onHover: (info: HoverInfo | null) => void;
  budgetRef: React.RefObject<number>;
}) {
  const { camera, size } = useThree();
  const hoverRef = useRef<string | null>(null);
  const groupRef = useRef<THREE.Group>(null);

  const accent = useMemo(
    () => new THREE.Color().fromArray(accentLinear),
    [accentLinear],
  );
  const dim = useMemo(() => new THREE.Color().fromArray(dimLinear), [dimLinear]);

  const curves = useMemo(() => buildEdgeCurves(), []);
  const curveTexture = useMemo(() => {
    const { data, width, height } = packCurveTexture(curves);
    return createCurveTexture(data, width, height);
  }, [curves]);
  const scheduler = useMemo(() => new PacketScheduler(curves), [curves]);

  useEffect(() => () => curveTexture.dispose(), [curveTexture]);

  // Hover by CPU screen-space projection rather than raycasting. The canvas
  // keeps pointer-events: none, so scrolling and text selection over the
  // pinned hero behave natively, and there is nothing to raycast against.
  const projected = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, dt) => {
    // Pointer parallax, damped.
    if (groupRef.current) {
      const tx = scrollState.pointerY * 0.07;
      const ty = scrollState.pointerX * 0.12;
      groupRef.current.rotation.x +=
        (tx - groupRef.current.rotation.x) * Math.min(1, dt * 2.4);
      groupRef.current.rotation.y +=
        (ty - groupRef.current.rotation.y) * Math.min(1, dt * 2.4);
    }

    // Camera dolly toward the scroll-driven target.
    camera.position.z +=
      (scrollState.camZ - camera.position.z) * Math.min(1, dt * 3.2);

    const px = ((scrollState.pointerX + 1) / 2) * size.width;
    const py = ((1 - scrollState.pointerY) / 2) * size.height;

    let best: string | null = null;
    let bestDist = 46; // px
    let bx = 0;
    let by = 0;
    let bestNode = heroNodes[0];

    const m = scrollState.morph;
    for (const n of heroNodes) {
      if (!labelledNodes.has(n.id)) continue;
      projected.set(
        n.a[0] + (n.b[0] - n.a[0]) * m,
        n.a[1] + (n.b[1] - n.a[1]) * m,
        n.a[2] + (n.b[2] - n.a[2]) * m,
      );
      if (groupRef.current) projected.applyMatrix4(groupRef.current.matrixWorld);
      projected.project(camera);
      const sx = ((projected.x + 1) / 2) * size.width;
      const sy = ((1 - projected.y) / 2) * size.height;
      const d = Math.hypot(sx - px, sy - py);
      if (d < bestDist) {
        bestDist = d;
        best = n.id;
        bx = sx;
        by = sy;
        bestNode = n;
      }
    }

    if (best !== hoverRef.current) {
      hoverRef.current = best;
      onHover(
        best
          ? { id: best, label: bestNode.label, meta: bestNode.meta, x: bx, y: by }
          : null,
      );
    } else if (best) {
      onHover({ id: best, label: bestNode.label, meta: bestNode.meta, x: bx, y: by });
    }
  });

  return (
    <group ref={groupRef}>
      <Wires
        curveTexture={curveTexture}
        edgeCount={curves.length}
        accent={accent}
      />
      <Packets
        curveTexture={curveTexture}
        scheduler={scheduler}
        accent={accent}
        budget={budgetRef}
      />
      <Nodes accent={accent} dim={dim} hoverRef={hoverRef} />
    </group>
  );
}
