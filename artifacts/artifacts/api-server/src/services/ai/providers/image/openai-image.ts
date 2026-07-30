import OpenAI from "openai";
import { classifyError } from "../../errors";
import type { ImageProvider } from "../../types";

export function createOpenAiImageProvider(): ImageProvider {
  return {
    id: "openai-image",
    label: "OpenAI Image (DALL-E)",
    envKey: "OPENAI_API_KEY",
    isConfigured() {
      return Boolean(process.env["OPENAI_API_KEY"]);
    },
    async generateImage(prompt) {
      const apiKey = process.env["OPENAI_API_KEY"];
      if (!apiKey) throw new Error("OPENAI_API_KEY not set");
      try {
        const client = new OpenAI({ apiKey, timeout: 30_000 });
        const response = await client.images.generate({
          model: "dall-e-2",
          prompt: `${prompt}. Photorealistic, vivid colors, centered subject, clean background, no text.`,
          n: 1,
          size: "512x512",
        });
        const url = response.data?.[0]?.url;
        if (!url) throw new Error("OpenAI returned no image URL");
        return url;
      } catch (err) {
        throw classifyError("openai-image", err);
      }
    },
  };
}
