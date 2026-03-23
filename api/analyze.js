import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function extractJson(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("No valid JSON found in AI response");
    }
    return JSON.parse(match[0]);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { task } = req.body || {};

    if (!task || !task.trim()) {
      return res.status(400).json({ error: "Task is required" });
    }

    const prompt = `
You are an AI assistant inside a tool called "OpenGradient AI Model Finder".

A user describes a task. Your job is to turn that task into a model discovery suggestion.

Return ONLY valid JSON in exactly this format:
{
  "status": "string",
  "category": "string",
  "direction": "string",
  "keywords": ["string", "string", "string"],
  "confidence": 0,
  "confidenceMessage": "string"
}

Rules:
- Output must be valid JSON only
- Do not add markdown
- Do not add explanations before or after JSON
- Keep category short and clear
- Keep direction practical and specific
- keywords must contain 3 to 6 short phrases
- confidence must be an integer from 0 to 100
- confidenceMessage must briefly explain the confidence score
- The tool helps users search for models on OpenGradient

User task:
${task}
`.trim();

    const response = await client.responses.create({
      model: "gpt-5.4",
      input: prompt,
    });

    const text = response.output_text || "";
    const parsed = extractJson(text);

    return res.status(200).json({
      status: parsed.status || "Analysis complete.",
      category: parsed.category || "Unknown",
      direction: parsed.direction || "No direction returned.",
      keywords: Array.isArray(parsed.keywords)
        ? parsed.keywords
        : ["OpenGradient", "model search", "AI"],
      confidence: Number.isInteger(parsed.confidence)
        ? parsed.confidence
        : 60,
      confidenceMessage:
        parsed.confidenceMessage || "Confidence was not provided.",
    });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Server error",
    });
  }
}
