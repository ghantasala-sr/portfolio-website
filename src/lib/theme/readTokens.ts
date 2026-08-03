/**
 * Reads theme colours out of CSS custom properties so the WebGL layer and the
 * stylesheet can never drift. Values come back as linear-space RGB triples
 * ready for a shader uniform.
 *
 * R3F converts colour *props* to linear when ColorManagement is enabled, but
 * it does NOT touch values you place in `uniforms` yourself. So a raw sRGB
 * hex fed straight into a uniform renders with a visibly wrong palette.
 */

function srgbChannelToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function parseColor(input: string): [number, number, number] {
  const value = input.trim();

  if (value.startsWith("#")) {
    const hex = value.slice(1);
    const full =
      hex.length === 3
        ? hex
            .split("")
            .map((c) => c + c)
            .join("")
        : hex;
    const n = parseInt(full.slice(0, 6), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  const nums = value.match(/[\d.]+/g);
  if (nums && nums.length >= 3) {
    return [
      Number(nums[0]) / 255,
      Number(nums[1]) / 255,
      Number(nums[2]) / 255,
    ];
  }

  return [1, 1, 1];
}

/** Returns the token as LINEAR rgb, safe to hand to a custom uniform. */
export function readTokenLinear(
  name: string,
  fallback = "#ffffff",
): [number, number, number] {
  if (typeof window === "undefined") return parseColor(fallback);
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  const [r, g, b] = parseColor(raw || fallback);
  return [
    srgbChannelToLinear(r),
    srgbChannelToLinear(g),
    srgbChannelToLinear(b),
  ];
}

/** Returns the token as raw sRGB 0-1, for anything that wants sRGB. */
export function readTokenSrgb(
  name: string,
  fallback = "#ffffff",
): [number, number, number] {
  if (typeof window === "undefined") return parseColor(fallback);
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return parseColor(raw || fallback);
}

export function readNumericToken(name: string, fallback: number): number {
  if (typeof window === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}
