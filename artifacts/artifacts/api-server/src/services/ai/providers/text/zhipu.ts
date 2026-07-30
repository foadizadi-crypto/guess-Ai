import OpenAI from "openai";
import { classifyError } from "../../errors";
import type { TextProvider } from "../../types";

// Zhipu's GLM models are served behind an OpenAI-compatible endpoint too.
export function createZhipuTextProvider(): TextProvider {
  return {
    id: "zhipu",
    label: "Zhipu (GLM-4)",
    envKey: "ZHIPU_API_KEY",
    isConfigured() {
      return Boolean(process.env["ZHIPU_API_KEY"]);
    },
    async complete({ system, user }) {
      const apiKey = process.env["ZHIPU_API_KEY"];
      if (!apiKey) throw new Error("ZHIPU_API_KEY not set");
      try {
        const client = new OpenAI({
          apiKey,
          baseURL: "https://open.bigmodel.cn/api/paas/v4",
          timeout: 20_000,
        });
        const completion = await client.chat.completions.create({
          model: "glm-4-flash",
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          response_format: { type: "json_object" },
          temperature: 0.9,
        });
        const text = completion.choices[0]?.message.content;
        if (!text) throw new Error("Zhipu returned an empty response");
        return text;
      } catch (err) {
        throw classifyError("zhipu", err);
      }
    },
  };
}
