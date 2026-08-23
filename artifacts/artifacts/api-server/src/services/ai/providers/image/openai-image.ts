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
        // Note: this account only has access to gpt-image-1 — dall-e-2/3
        // return "model does not exist" (400) on this key. gpt-image-1
        // returns base64 only (no `url` field), so we wrap it as a data URL.
        // quality: "low" keeps generation to ~10-15s; "medium"/"high" took
        // 45-90s each and caused concurrent question batches to time out.
        // The game blurs these images anyway, so low quality is not a
        // visible tradeoff.
        const response = await client.images.generate({
          model: "gpt-image-1",
          prompt: `${prompt}. Photorealistic, vivid colors, centered subject, clean background, no text.`,
          n: 1,
          size: "1024x1024",
          quality: "low",
        });
        const b64 = response.data?.[0]?.b64_json;
        const url = response.data?.[0]?.url;
        if (url) return url;
        if (b64) return `data:image/png;base64,${b64}`;
        throw new Error("OpenAI returned no image data");
      } catch (err) {
        throw classifyError("openai-image", err);
      }
    },
  };
}
