import Anthropic from "@anthropic-ai/sdk";
import { classifyError } from "../../errors";
import type { TextProvider } from "../../types";

export function createAnthropicTextProvider(): TextProvider {
  return {
    id: "anthropic",
    label: "Claude (Anthropic)",
    envKey: "ANTHROPIC_API_KEY",
    isConfigured() {
      return Boolean(process.env["ANTHROPIC_API_KEY"]);
    },
    async complete({ system, user }) {
      const apiKey = process.env["ANTHROPIC_API_KEY"];
      if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
      try {
        const client = new Anthropic({ apiKey, timeout: 25_000 });
        const message = await client.messages.create({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 4096,
          system,
          messages: [{ role: "user", content: user }],
        });
        const block = message.content.find((b) => b.type === "text");
        if (!block || block.type !== "text") throw new Error("Claude returned no text content");
        return block.text;
      } catch (err) {
        throw classifyError("anthropic", err);
      }
    },
  };
}
