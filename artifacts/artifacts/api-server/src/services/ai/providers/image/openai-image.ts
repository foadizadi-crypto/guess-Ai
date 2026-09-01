import OpenAI, { toFile } from "openai";
import { classifyError } from "../../errors";
import type { ImageGenerateOptions, ImageProvider, ImageStyle } from "../../types";

const MODEL = "gpt-image-1";
const SIZE = "1024x1024" as const;
const QUALITY = "low" as const;
const CLIENT_TIMEOUT_MS = 30_000;

const DEFAULT_SUFFIX = "Photorealistic, vivid colors, centered subject, clean background, no text.";
const CARTOON_SUFFIX =
  "3D polished cartoon chibi, mobile game, clear, appealing, no text, no watermark.";

function styleSuffix(style: ImageStyle | undefined): string {
  return style === "cartoon" ? CARTOON_SUFFIX : DEFAULT_SUFFIX;
}

function styledPrompt(prompt: string, options?: ImageGenerateOptions): string {
  return `${prompt}. ${styleSuffix(options?.style)}`;
}

function readGeneratedImage(response: { data?: Array<{ b64_json?: string | null; url?: string | null } | undefined> | null }): string {
  const b64 = response.data?.[0]?.b64_json;
  const url = response.data?.[0]?.url;
  if (url) return url;
  if (b64) return `data:image/png;base64,${b64}`;
  throw new Error("OpenAI returned no image data");
}

async function toPngFile(source: string) {
  let bytes: Buffer;
  let type = "image/png";
  let name = "scene.png";
  if (source.startsWith("data:")) {
    const comma = source.indexOf(",");
    if (comma < 0) throw new Error("Invalid data URL for image edit");
    const header = source.slice(5, comma);
    const mime = header.split(";")[0] || "image/png";
    type = mime;
    name = mime.includes("jpeg") || mime.includes("jpg") ? "scene.jpg" : "scene.png";
    bytes = Buffer.from(source.slice(comma + 1), "base64");
  } else {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Failed to fetch source image for edit (${response.status})`);
    }
    bytes = Buffer.from(await response.arrayBuffer());
  }
  return toFile(bytes, name, { type });
}

export function createOpenAiImageProvider(): ImageProvider {
  return {
    id: "openai-image",
    label: "OpenAI Image (DALL-E)",
    envKey: "OPENAI_API_KEY",
    isConfigured() {
      return Boolean(process.env["OPENAI_API_KEY"]);
    },
    async generateImage(prompt, options) {
      const apiKey = process.env["OPENAI_API_KEY"];
      if (!apiKey) throw new Error("OPENAI_API_KEY not set");
      try {
        const client = new OpenAI({ apiKey, timeout: CLIENT_TIMEOUT_MS });
        // Note: this account only has access to gpt-image-1 — dall-e-2/3
        // return "model does not exist" (400) on this key. gpt-image-1
        // returns base64 only (no `url` field), so we wrap it as a data URL.
        // quality: "low" keeps generation to ~10-15s; "medium"/"high" took
        // 45-90s each and caused concurrent question batches to time out.
        const response = await client.images.generate({
          model: MODEL,
          prompt: styledPrompt(prompt, options),
          n: 1,
          size: SIZE,
          quality: QUALITY,
        });
        return readGeneratedImage(response);
      } catch (err) {
        throw classifyError("openai-image", err);
      }
    },
    async editImage(image, prompt, options) {
      const apiKey = process.env["OPENAI_API_KEY"];
      if (!apiKey) throw new Error("OPENAI_API_KEY not set");
      try {
        const client = new OpenAI({ apiKey, timeout: CLIENT_TIMEOUT_MS });
        const file = await toPngFile(image);
        const response = await client.images.edit({
          model: MODEL,
          image: file,
          prompt: styledPrompt(prompt, options),
          n: 1,
          size: SIZE,
          quality: QUALITY,
          input_fidelity: "high",
        });
        return readGeneratedImage(response);
      } catch (err) {
        throw classifyError("openai-image", err);
      }
    },
  };
}
