// api/generate.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI, Modality } from "@google/genai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { image, effect, sunlightIntensity, sunlightDirection } = req.body || {};

  if (!image || !image.base64 || !image.mimeType) {
    return res.status(400).json({ error: "Missing image (base64 and mimeType required)" });
  }

  const apiKey = process.env.API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Server misconfiguration: missing API key" });

  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-2.5-flash-image"; // keep same model name you used

    // Build prompt like your frontend expects
    const getDirectionalPrompt = (direction: string) => {
      switch (direction) {
        case "top": return "from the top";
        case "left": return "from the left";
        case "right": return "from the right";
        case "bottom": return "from the bottom";
        case "center": return "emanating from the center, like a spotlight";
        default: return "from the top";
      }
    };

    const intensityMap: Record<number, string> = {
      1: "natural, realistic sunlight",
      2: "bright, vibrant sunlight",
      3: "intense, dramatic sunlight with strong highlights",
    };

    let prompt = "";
    switch (effect) {
      case "sunlight": {
        const intensityPrompt = intensityMap[sunlightIntensity] || intensityMap[2];
        const directionPrompt = getDirectionalPrompt(sunlightDirection);
        prompt = `Add photorealistic, ${intensityPrompt} to this image. The light source should be coming ${directionPrompt}. Ensure the highlights and shadows are consistent with this light direction.`;
        break;
      }
      case "shadows":
        prompt = "Add deep, natural-looking photorealistic shadows to this image. The shadows should add a sense of drama and depth to the scene.";
        break;
      case "sunlight-and-shadows": {
        const intensityPrompt = intensityMap[sunlightIntensity] || intensityMap[2];
        const directionPrompt = getDirectionalPrompt(sunlightDirection);
        prompt = `Add both photorealistic, ${intensityPrompt} and deep, natural-looking shadows to this image. The light source should be coming ${directionPrompt}.`;
        break;
      }
      case "remove-sunlight":
        prompt = "Recreate the image with neutral, diffuse lighting, removing harsh highlights of direct sunlight.";
        break;
      case "remove-shadows":
        prompt = "Recreate the image by filling in and softening deep shadows, making lighting balanced across the scene.";
        break;
      case "remove-sunlight-and-shadows":
        prompt = "Neutralize lighting: remove strong highlights and deep shadows, produce a flat, diffuse-lit image.";
        break;
      default:
        prompt = "Apply a subtle photorealistic lighting improvement to the image.";
    }

    // call the library's generateContent method (same approach as your frontend)
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            inlineData: {
              data: image.base64,
              mimeType: image.mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    // extract returned image bytes
    const candidate = response?.candidates?.[0];
    for (const part of candidate?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        const base64ImageBytes: string = part.inlineData.data;
        const mimeType: string = part.inlineData.mimeType || "image/png";
        const dataUrl = `data:${mimeType};base64,${base64ImageBytes}`;
        return res.status(200).json({ image: dataUrl });
      }
    }

    return res.status(500).json({ error: "No image returned from model" });
  } catch (err: any) {
    console.error("generate api error:", err);
    return res.status(500).json({ error: err?.message || "Unknown server error" });
  }
}
