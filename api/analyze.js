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

The user describes a task. Your job is to convert that task into a practical model discovery suggestion.

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
- Output JSON only
- No markdown
- No code fences
- Keep category short
- Keep direction practical
- keywords must contain 3 to 6 short phrases
- confidence must be an integer from 0 to 100
- confidenceMessage should briefly explain the confidence

User task:
${task}
`.trim();

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt
      })
    });

    const raw = await response.text();

    if (!response.ok) {
      return res.status(500).json({
        error: `OpenAI error: ${raw}`
      });
    }

    let parsedApi;
    try {
      parsedApi = JSON.parse(raw);
    } catch {
      return res.status(500).json({
        error: `OpenAI returned non-JSON: ${raw}`
      });
    }

    const outputText = parsedApi.output_text || "";

    let parsedResult;
    try {
      parsedResult = JSON.parse(outputText);
    } catch {
      const match = outputText.match(/\{[\s\S]*\}/);
      if (!match) {
        return res.status(500).json({
          error: `Model did not return valid JSON: ${outputText}`
        });
      }
      parsedResult = JSON.parse(match[0]);
    }

    return res.status(200).json({
      status: parsedResult.status || "Analysis complete.",
      category: parsedResult.category || "Unknown",
      direction: parsedResult.direction || "No direction returned.",
      keywords: Array.isArray(parsedResult.keywords)
        ? parsedResult.keywords
        : ["OpenGradient", "model search", "AI"],
      confidence: Number.isInteger(parsedResult.confidence)
        ? parsedResult.confidence
        : 60,
      confidenceMessage:
        parsedResult.confidenceMessage || "Confidence was not provided."
    });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Server error"
    });
  }
}
