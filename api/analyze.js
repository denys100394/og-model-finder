import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { task } = req.body;

    if (!task) {
      return res.status(400).json({ error: "No task provided" });
    }

    const prompt = `
You are an AI assistant.

Analyze the task and return ONLY valid JSON.

Format:
{
  "category": "...",
  "direction": "...",
  "keywords": ["...", "..."],
  "confidence": 0.0
}

Task:
${task}
`;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const text = response.output_text;

    // 🔥 SAFE PARSE (не падає)
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = {
        category: "General AI task",
        direction: text,
        keywords: ["ai", "model"],
        confidence: 0.5,
      };
    }

    res.status(200).json(data);

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
}
