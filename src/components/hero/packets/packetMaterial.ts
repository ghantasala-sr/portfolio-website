import * as THREE from "three";
import {
  bezierGLSL,
  billboardGLSL,
  matrixUniformsGLSL,
} from "@/components/webgl/billboard";

/**
 * The packet shader. All packets render in one draw call as instanced quads,
 * with position computed entirely in the vertex shader.
 *
 * Control points live in a DataTexture of width 8 × height edgeCount,
 * RGBAFormat + FloatType + NearestFilter, read with texelFetch.
 *
 * Why NEAREST and control points, rather than a sampled curve with LINEAR:
 *
 *  1. FloatType + LinearFilter yields an INCOMPLETE texture on any device
 *     lacking OES_texture_float_linear (not guaranteed in WebGL2, absent on
 *     much mobile hardware). three only logs a warning and proceeds; sampling
 *     an incomplete texture returns (0,0,0,1), so every packet would collapse
 *     to the world origin on hardware we don't own.
 *  2. Filter mode is per-texture, not per-axis. Linear along the curve
 *     necessarily means linear across edge rows, blending unrelated edges so
 *     packets drift off their wires into empty space.
 *
 * With control points there is no filtering, no wrap mode, and no half-texel
 * arithmetic to get wrong. The morph also becomes exact: cubic Bézier is
 * affine in its control points, so mixing A and B control points by uMorph
 * gives precisely the curve of the mixed inputs.
 */

const vertex = /* glsl */ `
  precision highp float;

  ${matrixUniformsGLSL}

  in vec2 aCorner;
  in vec2 aUv;

  // x = edge index, y = start time (s), z = duration (s), w = size
  in vec4 iRoute;
  // x = brightness, y = stretch, z = hue shift, w = spare
  in vec4 iStyle;

  uniform sampler2D uCurves;
  uniform float uTime;
  uniform float uMorph;
  uniform float uScale;

  out vec2 vUv;
  out float vAlpha;
  out float vBright;

  ${bezierGLSL}
  ${billboardGLSL}

  void main() {
    int e = int(iRoute.x);

    vec4 a0 = texelFetch(uCurves, ivec2(0, e), 0);
    vec4 a1 = texelFetch(uCurves, ivec2(1, e), 0);
    vec4 a2 = texelFetch(uCurves, ivec2(2, e), 0);
    vec4 a3 = texelFetch(uCurves, ivec2(3, e), 0);
    vec4 b0 = texelFetch(uCurves, ivec2(4, e), 0);
    vec4 b1 = texelFetch(uCurves, ivec2(5, e), 0);
    vec4 b2 = texelFetch(uCurves, ivec2(6, e), 0);
    vec4 b3 = texelFetch(uCurves, ivec2(7, e), 0);

    // Affine-exact morph: the mixed control points define the mixed curve.
    vec3 p0 = mix(a0.xyz, b0.xyz, uMorph);
    vec3 p1 = mix(a1.xyz, b1.xyz, uMorph);
    vec3 p2 = mix(a2.xyz, b2.xyz, uMorph);
    vec3 p3 = mix(a3.xyz, b3.xyz, uMorph);

    // Per-state edge presence rides in.w of texels 0 and 4, free fade.
    float presence = mix(a0.w, b0.w, uMorph);

    float life = (uTime - iRoute.y) / max(iRoute.z, 0.0001);

    // Outside its life window or on an absent edge: clip without writing a
    // position. z > w puts the vertex outside the clip volume. We must still
    // write gl_Position, so this is the cheap way to discard.
    if (life < 0.0 || life > 1.0 || presence < 0.01) {
      gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
      vAlpha = 0.0;
      vUv = aUv;
      vBright = 0.0;
      return;
    }

    vec3 pos = bez(p0, p1, p2, p3, life);
    vec3 tan = bezTangent(p0, p1, p2, p3, life);
    vec3 dir = length(tan) > 0.0001 ? normalize(tan) : vec3(1.0, 0.0, 0.0);

    // Fade in and out at the ends of the life window so a packet arriving at
    // a node dissolves rather than teleporting back to the source.
    float ends = smoothstep(0.0, 0.08, life) * (1.0 - smoothstep(0.9, 1.0, life));

    vAlpha = presence * ends;
    vBright = iStyle.x;
    vUv = aUv;

    gl_Position = billboard(pos, aCorner, iRoute.w * uScale, dir, iStyle.y);
  }
`;

const fragment = /* glsl */ `
  precision highp float;

  in vec2 vUv;
  in float vAlpha;
  in float vBright;

  uniform vec3 uColor;
  uniform vec3 uHot;

  out vec4 fragColor;

  void main() {
    // Soft radial falloff baked into the sprite. Doing it here rather than
    // with a bloom pass avoids EffectComposer, which would take over R3F's
    // render loop via the priority mechanism.
    vec2 d = vUv - 0.5;
    float r = length(d) * 2.0;
    float core = 1.0 - smoothstep(0.0, 0.42, r);
    float halo = 1.0 - smoothstep(0.0, 1.0, r);

    float a = (core * 0.9 + halo * 0.45) * vAlpha;
    if (a < 0.004) discard;

    vec3 col = mix(uColor, uHot, core * 0.8) * vBright;
    fragColor = vec4(col, a);
  }
`;

/**
 * The assembled shader sources, exported so a test harness can compile them in
 * its own GL context. R3F will not create a root until ResizeObserver reports a
 * non-zero container size, which never happens in a hidden or headless pane
 * so verifying the GLSL through the live scene is not always possible. These
 * let the shaders be checked directly.
 */
export const packetShaderSource = { vertex, fragment };

export interface PacketUniforms {
  uCurves: { value: THREE.DataTexture };
  uTime: { value: number };
  uMorph: { value: number };
  uScale: { value: number };
  uColor: { value: THREE.Color };
  uHot: { value: THREE.Color };
}

export function createPacketMaterial(
  curveTexture: THREE.DataTexture,
  accentLinear: [number, number, number],
): THREE.RawShaderMaterial & { uniforms: PacketUniforms } {
  const mat = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: vertex,
    fragmentShader: fragment,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uCurves: { value: curveTexture },
      uTime: { value: 0 },
      uMorph: { value: 0 },
      uScale: { value: 1 },
      uColor: { value: new THREE.Color().fromArray(accentLinear) },
      uHot: { value: new THREE.Color(1, 1, 1) },
    },
  });
  return mat as THREE.RawShaderMaterial & { uniforms: PacketUniforms };
}

/**
 * Builds the control-point texture.
 *
 * DataTexture defaults both filters to NearestFilter already, but we set them
 * explicitly because this is the single most consequential line in the scene
 * see the note at the top of this file.
 *
 * needsUpdate is required: the constructor does not set it, and assigning
 * .image proxies to source.data without bumping source.version.
 */
export function createCurveTexture(
  data: Float32Array,
  width: number,
  height: number,
): THREE.DataTexture {
  const tex = new THREE.DataTexture(
    data,
    width,
    height,
    THREE.RGBAFormat,
    THREE.FloatType,
  );
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}
