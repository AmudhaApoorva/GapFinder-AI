import { generateObject, generateText } from "ai";
import { groq } from "@ai-sdk/groq";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

export function getGeminiApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) return null;
  const trimmed = key.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function hasGenerationKey(): boolean {
  return Boolean(
    getGeminiApiKey() ||
      (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim()) ||
      (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim()),
  );
}

export function getGeminiModel(
  modelId: "gemini-1.5-flash" | "gemini-2.0-flash" | "gemini-1.5-pro" = "gemini-1.5-flash",
) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;
  const google = createGoogleGenerativeAI({ apiKey });
  return google(modelId);
}

export function getModel() {
  const gemini = getGeminiModel("gemini-1.5-flash");
  if (gemini) return gemini;
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim())
    return groq("llama-3.3-70b-versatile");
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim())
    return openai("gpt-4o-mini");
  return null;
}

export async function generatePlain(
  system: string,
  prompt: string,
  temperature = 0.2,
): Promise<{ text: string | null; error?: string }> {
  const geminiKey = getGeminiApiKey();

  if (geminiKey) {
    const google = createGoogleGenerativeAI({ apiKey: geminiKey });
    const models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"];
    let lastError = "";

    for (const m of models) {
      try {
        const { text } = await generateText({
          model: google(m),
          system,
          prompt,
          temperature,
        });
        if (text && text.trim().length > 0) {
          return { text: text.trim() };
        }
      } catch (err: any) {
        lastError = err?.message || String(err);
        console.warn(`[Gemini SDK] Model ${m} call failed:`, lastError);
      }
    }

    return { text: null, error: `Gemini API call failed: ${lastError}` };
  }

  // Fallback to Groq if key exists
  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (groqKey) {
    try {
      const { text } = await generateText({
        model: groq("llama-3.3-70b-versatile"),
        system,
        prompt,
        temperature,
      });
      if (text && text.trim().length > 0) {
        return { text: text.trim() };
      }
    } catch (err: any) {
      console.warn("[Groq SDK] call failed:", err?.message || err);
    }
  }

  // Fallback to OpenAI if key exists
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  if (openaiKey) {
    try {
      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        system,
        prompt,
        temperature,
      });
      if (text && text.trim().length > 0) {
        return { text: text.trim() };
      }
    } catch (err: any) {
      console.warn("[OpenAI SDK] call failed:", err?.message || err);
    }
  }

  return {
    text: null,
    error:
      "No AI API key is configured. Please set GEMINI_API_KEY in your .env file.",
  };
}

export async function generateJson<T>(
  schema: z.ZodType<T>,
  system: string,
  prompt: string,
): Promise<T | null> {
  const geminiKey = getGeminiApiKey();
  if (geminiKey) {
    const google = createGoogleGenerativeAI({ apiKey: geminiKey });
    const models = ["gemini-1.5-flash", "gemini-2.0-flash"];
    for (const m of models) {
      try {
        const { object } = await generateObject({
          model: google(m),
          schema,
          system,
          prompt,
          temperature: 0.2,
        });
        if (object) return object;
      } catch (err: any) {
        try {
          const { text } = await generateText({
            model: google(m),
            system: system + " Respond with valid JSON only matching the schema.",
            prompt,
            temperature: 0.2,
          });
          const start =
            text.indexOf("{") === -1 ? text.indexOf("[") : text.indexOf("{");
          const end = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
          if (start !== -1 && end !== -1) {
            return schema.parse(JSON.parse(text.slice(start, end + 1)));
          }
        } catch {}
      }
    }
  }

  const fallback = getModel();
  if (!fallback) return null;
  try {
    const { object } = await generateObject({
      model: fallback,
      schema,
      system,
      prompt,
      temperature: 0.2,
    });
    return object;
  } catch {
    try {
      const { text } = await generateText({
        model: fallback,
        system: system + " Respond with valid JSON only.",
        prompt,
        temperature: 0.2,
      });
      const start =
        text.indexOf("{") === -1 ? text.indexOf("[") : text.indexOf("{");
      const end = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
      if (start === -1 || end === -1) return null;
      return schema.parse(JSON.parse(text.slice(start, end + 1)));
    } catch {
      return null;
    }
  }
}
