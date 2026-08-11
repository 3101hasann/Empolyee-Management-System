import { GoogleGenAI } from "@google/genai";
import { CHATBOT_SYSTEM_PROMPT } from "./chatbot-system-prompt";

// We require the API key in the environment
const apiKey = process.env.GEMINI_API_KEY;

export const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function generateChatbotResponse(
  messages: { role: "user" | "model"; content: string }[],
  contextData?: string
) {
  if (!ai) {
    throw new Error("Gemini API key is missing. Please configure GEMINI_API_KEY in your environment.");
  }

  const systemInstruction = `${CHATBOT_SYSTEM_PROMPT}\n\nAdditional Context / Database Data:\n${
    contextData || "No additional context available."
  }`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: messages.map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    })),
    config: {
      systemInstruction,
      temperature: 0.2,
    },
  });

  return response.text;
}
