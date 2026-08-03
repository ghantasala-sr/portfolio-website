import * as THREE from "three";

/**
 * A unit quad as InstancedBufferGeometry, shared by the hero packets and the
 * about-page scene, should one land there again.
 *
 * Instanced quads rather than THREE.Points, for four reasons:
 *
 *  1. Point primitives are clipped by their CENTRE. A packet whose centre
 * crosses the viewport edge vanishes instantly, taking its glow with it
 *     constant visible popping on a full-bleed hero.
 *  2. ALIASED_POINT_SIZE_RANGE max is spec-minimum 1. Desktop gives 1024+,
 *     but ANGLE and mobile drivers capping at 63 or 255 are real and shipping,
 *     so gl_PointSize silently stops growing on approach.
 *  3. Quads can align to a direction. We already compute the Bézier tangent,
 *     and a packet stretched along travel reads as motion rather than a dot.
 *  4. Offsetting in view space keeps size in world units and lets the
 *     projection matrix handle perspective attenuation correctly.
 *
 * Cost is 4 vertices instead of 1 per instance. Still one draw call.
 */
export function createBillboardGeometry(count: number): THREE.InstancedBufferGeometry {
  const geo = new THREE.InstancedBufferGeometry();

  // Corner offsets in [-0.5, 0.5]; the vertex shader scales and orients these.
  const corners = new Float32Array([
    -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5,
  ]);
  const uv = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);

  geo.setAttribute("aCorner", new THREE.BufferAttribute(corners, 2));
  geo.setAttribute("aUv", new THREE.BufferAttribute(uv, 2));
  geo.setIndex([0, 1, 2, 0, 2, 3]);
  geo.instanceCount = count;

  // A generous bounding sphere. Positions are computed in the vertex shader,
  // so three cannot derive bounds itself; without this the mesh gets frustum-
  // culled the moment the camera moves.
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 40);

  return geo;
}

/**
 * RawShaderMaterial injects NOTHING, no #defines, and crucially no built-in
 * uniform or attribute declarations. The renderer still *binds* these matrices
 * if the program declares them, but the shader source must declare them
 * itself. Omitting this block fails compilation with
 * "'viewMatrix' : undeclared identifier", and since a failed program simply
 * draws nothing, the symptom is a silently black canvas.
 *
 * (ShaderMaterial prepends these for you. RawShaderMaterial is the trade:
 * full control of the source, full responsibility for the preamble.)
 */
export const matrixUniformsGLSL = /* glsl */ `
  uniform mat4 modelMatrix;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform mat4 viewMatrix;
  uniform mat3 normalMatrix;
  uniform vec3 cameraPosition;
`;

/**
 * Shared GLSL: view-space billboard expansion with optional tangent
 * alignment. Included by both scenes' vertex shaders.
 */
export const billboardGLSL = /* glsl */ `
  // Expand a corner offset into view space at worldPos, oriented along dir
  // (already normalised, in world space). stretch > 1 elongates along the
  // direction of travel.
  vec4 billboard(vec3 worldPos, vec2 corner, float size, vec3 dir, float stretch) {
    vec4 mv = viewMatrix * vec4(worldPos, 1.0);

    // Direction in view space, flattened to the screen plane.
    vec3 dv = normalize((viewMatrix * vec4(dir, 0.0)).xyz);
    vec2 axis = length(dv.xy) > 0.0001 ? normalize(dv.xy) : vec2(1.0, 0.0);
    vec2 perp = vec2(-axis.y, axis.x);

    vec2 offset = axis * (corner.x * size * stretch) + perp * (corner.y * size);
    mv.xy += offset;
    return projectionMatrix * mv;
  }

  // Axis-aligned variant, for particles with no meaningful direction.
  vec4 billboardFlat(vec3 worldPos, vec2 corner, float size) {
    vec4 mv = viewMatrix * vec4(worldPos, 1.0);
    mv.xy += corner * size;
    return projectionMatrix * mv;
  }
`;

/** Cubic Bézier evaluation and its tangent. Affine in control points. */
export const bezierGLSL = /* glsl */ `
  vec3 bez(vec3 a, vec3 b, vec3 c, vec3 d, float t) {
    float u = 1.0 - t;
    return u*u*u*a + 3.0*u*u*t*b + 3.0*u*t*t*c + t*t*t*d;
  }

  vec3 bezTangent(vec3 a, vec3 b, vec3 c, vec3 d, float t) {
    float u = 1.0 - t;
    return 3.0*u*u*(b - a) + 6.0*u*t*(c - b) + 3.0*t*t*(d - c);
  }
`;

/** Cheap hash/noise for per-instance drift. */
export const noiseGLSL = /* glsl */ `
  float hash11(float p) {
    p = fract(p * 0.1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
  }

  vec3 hash31(float p) {
    vec3 p3 = fract(vec3(p) * vec3(0.1031, 0.1030, 0.0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xxy + p3.yzz) * p3.zyx);
  }

  // Cheap swirling drift, not true curl noise, but visually sufficient and
  // a fraction of the ALU cost.
  vec3 drift(float seed, float t) {
    return vec3(
      sin(t * 0.7 + seed * 6.28) * cos(t * 0.31 + seed * 2.1),
      cos(t * 0.53 + seed * 4.19) * sin(t * 0.44 + seed * 3.7),
      sin(t * 0.39 + seed * 5.11)
    );
  }
`;
