import OpenAI from "openai";
import { classifyError } from "../../errors";
import type { TextProvider } from "../../types";

// Groq exposes an OpenAI-compatible chat completions API, so we reuse the
// `openai` SDK with a different base URL and key instead of a bespoke client.
export function createGroqTextProvider(): TextProvider {
  return {
    id: "groq",
    label: "Groq (Llama 3.3)",
    envKey: "GROQ_API_KEY",
    isConfigured() {
      return Boolean(process.env["GROQ_API_KEY"]);
    },
    async complete({ system, user }) {
      const apiKey = process.env["GROQ_API_KEY"];
      if (!apiKey) throw new Error("GROQ_API_KEY not set");
      try {
        const client = new OpenAI({ apiKey, baseURL: "https://api.groq.com/openai/v1", timeout: 20_000 });
        const completion = await client.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          response_format: { type: "json_object" },
          temperature: 0.9,
        });
        const text = completion.choices[0]?.message.content;
        if (!text) throw new Error("Groq returned an empty response");
        return text;
      } catch (err) {
        throw classifyError("groq", err);
      }
    },
  };
}
