// /api/hello.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { imageUrl } = req.body;

    if (!process.env.GOOGLE_API_KEY) {
      return res.status(500).json({ error: "Missing Google API Key" });
    }

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/imagen:generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GOOGLE_API_KEY,
      },
      body: JSON.stringify({
        prompt: {
          text: `Enhance lighting for image at ${imageUrl}`,
        },
      }),
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("API error:", error);
    res.status(500).json({ error: "Failed to call Google AI API" });
  }
}
