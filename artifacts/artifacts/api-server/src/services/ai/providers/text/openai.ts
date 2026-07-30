import OpenAI from "openai";
import { classifyError } from "../../errors";
import type { TextProvider } from "../../types";

export function createOpenAiTextProvider(): TextProvider {
  return {
    id: "openai",
    label: "OpenAI (GPT-4o)",
    envKey: "OPENAI_API_KEY",
    isConfigured() {
      return Boolean(process.env["OPENAI_API_KEY"]);
    },
    async complete({ system, user }) {
      const apiKey = process.env["OPENAI_API_KEY"];
      if (!apiKey) throw new Error("OPENAI_API_KEY not set");
      try {
        const client = new OpenAI({ apiKey, timeout: 25_000 });
        const completion = await client.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          response_format: { type: "json_object" },
          temperature: 0.9,
        });
        const text = completion.choices[0]?.message.content;
        if (!text) throw new Error("OpenAI returned an empty response");
        return text;
      } catch (err) {
        throw classifyError("openai", err);
      }
    },
  };
}
