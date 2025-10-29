// services/geminiService.ts
import { ImageFile, LightingEffect, SunlightIntensity, SunlightDirection } from "../types";

export async function applyLightingEffect(
  image: ImageFile,
  effect: LightingEffect,
  sunlightIntensity: SunlightIntensity,
  sunlightDirection: SunlightDirection
): Promise<string> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image,
      effect,
      sunlightIntensity,
      sunlightDirection,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = body?.error || `API request failed (${res.status})`;
    throw new Error(msg);
  }

  const data = await res.json();
  if (!data?.image) throw new Error("No image returned from server");
  return data.image as string;
}
