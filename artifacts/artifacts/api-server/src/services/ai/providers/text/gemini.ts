import { GoogleGenerativeAI } from "@google/generative-ai";
import { classifyError } from "../../errors";
import type { TextProvider } from "../../types";
import { withTimeout } from "../../util";

export function createGeminiTextProvider(): TextProvider {
  return {
    id: "gemini",
    label: "Gemini Flash",
    envKey: "GEMINI_API_KEY",
    isConfigured() {
      return Boolean(process.env["GEMINI_API_KEY"]);
    },
    async complete({ system, user }) {
      const apiKey = process.env["GEMINI_API_KEY"];
      if (!apiKey) throw new Error("GEMINI_API_KEY not set");
      try {
        const client = new GoogleGenerativeAI(apiKey);
        const model = client.getGenerativeModel({
          model: "gemini-2.0-flash",
          systemInstruction: system,
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.9,
          },
        });
        const result = await withTimeout(model.generateContent(user), 20_000, "Gemini");
        const text = result.response.text();
        if (!text) throw new Error("Gemini returned an empty response");
        return text;
      } catch (err) {
        throw classifyError("gemini", err);
      }
    },
  };
}
