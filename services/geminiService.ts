import { GoogleGenAI, Modality } from "@google/genai";
import imageCompression from "browser-image-compression";
import { ImageFile, LightingEffect, SunlightIntensity, SunlightDirection } from "../types";

function getDirectionalPrompt(direction: SunlightDirection): string {
  switch (direction) {
    case "top": return "from the top";
    case "left": return "from the left";
    case "right": return "from the right";
    case "bottom": return "from the bottom";
    case "center": return "emanating from the center, like a spotlight";
  }
}

export async function applyLightingEffect(
  image: ImageFile,
  effect: LightingEffect,
  sunlightIntensity: SunlightIntensity,
  sunlightDirection: SunlightDirection
): Promise<string> {
  try {
    // 🧠 1. Compress the image before sending
    const compressedFile = await imageCompression(
      new File([Uint8Array.from(atob(image.base64), c => c.charCodeAt(0))], image.name, { type: image.mimeType }),
      { maxSizeMB: 2, maxWidthOrHeight: 2048, useWebWorker: true }
    );

    const compressedBase64 = await imageCompression.getDataUrlFromFile(compressedFile);
    const base64Data = compressedBase64.split(",")[1];

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const model = "gemini-2.5-flash-image";

    let prompt = "";
    const intensityMap: Record<SunlightIntensity, string> = {
      1: "natural, realistic sunlight",
      2: "bright, vibrant sunlight",
      3: "intense, dramatic sunlight with strong highlights",
    };

    switch (effect) {
      case "sunlight": {
        const intensityPrompt = intensityMap[sunlightIntensity];
        const directionPrompt = getDirectionalPrompt(sunlightDirection);
        prompt = `Add photorealistic, ${intensityPrompt} to this image. The light source should be coming ${directionPrompt}. Ensure the highlights and shadows are consistent with this light direction.`;
        break;
      }
      case "shadows":
        prompt = "Add deep, natural-looking photorealistic shadows to this image.";
        break;
      case "sunlight-and-shadows": {
        const intensityPrompt = intensityMap[sunlightIntensity];
        const directionPrompt = getDirectionalPrompt(sunlightDirection);
        prompt = `Add ${intensityPrompt} and shadows to this image. Light source ${directionPrompt}.`;
        break;
      }
      case "remove-sunlight":
        prompt = "Remove harsh sunlight, keeping lighting soft and neutral.";
        break;
      case "remove-shadows":
        prompt = "Soften all dark shadows to create even lighting.";
        break;
      case "remove-sunlight-and-shadows":
        prompt = "Neutralize all lighting, creating flat, diffuse lighting.";
        break;
    }

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: image.mimeType } },
          { text: prompt },
        ],
      },
      config: { responseModalities: [Modality.IMAGE] },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image was generated. Try again with a smaller image or different effect.");
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    throw new Error(error.message || "Failed to generate image");
  }
}
