import "server-only";

import Groq from "groq-sdk";

import { serverEnv } from "@/lib/env";

export const GROQ_TEXT_MODEL = "llama-3.3-70b-versatile";
export const GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

export function getGroqClient() {
  return new Groq({
    apiKey: serverEnv.groqApiKey
  });
}

export function readGroqText(content: unknown) {
  if (typeof content === "string") {
    return content.trim();
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((part) => {
      if (typeof part === "string") {
        return part;
      }

      if (
        part &&
        typeof part === "object" &&
        "text" in part &&
        typeof (part as { text?: unknown }).text === "string"
      ) {
        return (part as { text: string }).text;
      }

      return "";
    })
    .join("\n")
    .trim();
}
