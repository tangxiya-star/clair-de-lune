import { generateBand } from "./_arrow.js";

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const result = await generateBand(body.word);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 502).json({ error: err.message || "Generation failed" });
  }
}
