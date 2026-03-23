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
Return JSON:
{
  "status": "...",
  "category": "...",
  "direction": "...",
  "keywords": ["..."],
  "confidence": 0,
  "confidenceMessage": "..."
}

Task:
${task}
`;

    const response = await client.responses.create({
      model: "gpt-5.4",
      input: prompt,
    });

    const text = response.output_text;
    const data = JSON.parse(text);

    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
