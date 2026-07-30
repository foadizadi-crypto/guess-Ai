import { classifyError } from "../../errors";
import type { ImageProvider } from "../../types";

const MODEL = "stabilityai/stable-diffusion-xl-base-1.0";

// Free/open fallback for image generation via Hugging Face's hosted
// Inference API. Returns a base64 data URL since the API responds with raw
// image bytes rather than a hosted URL — React Native's <Image> renders
// data URIs natively, so no extra storage/upload step is needed.
export function createStableDiffusionImageProvider(): ImageProvider {
  return {
    id: "stable-diffusion",
    label: "Stable Diffusion (Hugging Face)",
    envKey: "HUGGINGFACE_API_KEY",
    isConfigured() {
      return Boolean(process.env["HUGGINGFACE_API_KEY"]);
    },
    async generateImage(prompt) {
      const apiKey = process.env["HUGGINGFACE_API_KEY"];
      if (!apiKey) throw new Error("HUGGINGFACE_API_KEY not set");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30_000);

      try {
        const response = await fetch(`https://api-inference.huggingface.co/models/${MODEL}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: `${prompt}. Photorealistic, vivid colors, centered subject, clean background, no text.`,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const bodyText = await response.text().catch(() => "");
          const httpError = new Error(
            `Hugging Face responded ${response.status}: ${bodyText.slice(0, 200)}`,
          ) as Error & { status: number };
          httpError.status = response.status;
          throw httpError;
        }

        const contentType = response.headers.get("content-type") ?? "";
        if (!contentType.startsWith("image/")) {
          const bodyText = await response.text().catch(() => "");
          throw new Error(`Hugging Face returned a non-image response: ${bodyText.slice(0, 200)}`);
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        return `data:${contentType};base64,${buffer.toString("base64")}`;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          throw classifyError("stable-diffusion", new Error("Hugging Face request timed out"));
        }
        throw classifyError("stable-diffusion", err);
      } finally {
        clearTimeout(timeoutId);
      }
    },
  };
}
