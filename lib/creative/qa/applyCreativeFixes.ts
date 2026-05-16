import type { CreativeJson } from "@/lib/creative/schema";

export function applyCreativeFixes(creative: CreativeJson, qaResult: any): CreativeJson {
  const patched = { ...creative } as CreativeJson;

  // Shorten headline if recommended
  if (patched.headline && patched.headline.length > 72) {
    patched.headline = `${patched.headline.slice(0, 68).trim()}…`;
  }

  // Shorten CTA if too long
  if (patched.cta && patched.cta.length > 32) {
    patched.cta = patched.cta.slice(0, 32).trim();
  }

  // If high density and lots of text, lower density
  const textLength = [patched.headline || "", patched.subheadline || ""].join(" ").length;
  if (patched.visual.density === "high" && textLength > 200) {
    patched.visual = { ...patched.visual, density: "medium" };
  }

  // If contrast problem suggested, switch backgroundStyle to 'gradient' as safer default
  if (qaResult && qaResult.problems && qaResult.problems.some((p: any) => p.category === "readability")) {
    patched.visual = { ...patched.visual, backgroundStyle: "gradient" };
  }

  return patched;
}
