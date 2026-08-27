import { normalizeWord, buildPrompt, INSTRUCTIONS } from "../src/word.js";

const ENDPOINT = "https://api.quiver.ai/v1/svgs/generations";
// Quiver pulled arrow-2 mid-event; arrow-1.1 is the current default. The roster
// has moved twice in one evening, so keep it overridable without a code change.
const MODEL = process.env.QUIVER_MODEL || "arrow-1.1";

function pickSvg(payload) {
  const svg = payload?.data?.[0]?.svg;
  return typeof svg === "string" && svg.includes("<svg") ? svg : null;
}

// A live <text> node means the word is font-dependent, not cut geometry.
function isFontCheat(svg) {
  return /<text[\s>]/i.test(svg);
}

async function callArrow(prompt, key) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      instructions: INSTRUCTIONS,
      n: 1,
      stream: false,
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Arrow ${res.status}: ${text.slice(0, 300)}`);
  }

  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error("Arrow returned a non-JSON body");
  }

  const svg = pickSvg(payload);
  if (!svg) throw new Error("Arrow returned no SVG");
  return svg;
}

export async function generateBand(rawWord) {
  const parsed = normalizeWord(rawWord);
  if (!parsed.ok) {
    const err = new Error(parsed.reason);
    err.status = 400;
    throw err;
  }

  const key = process.env.QUIVER_API_KEY || process.env.QUIVERAI_API_KEY;
  if (!key) {
    const err = new Error("QUIVER_API_KEY is not set");
    err.status = 503;
    throw err;
  }

  const prompt = buildPrompt(parsed.word, parsed.script);

  let svg = await callArrow(prompt, key);
  if (isFontCheat(svg)) {
    // One retry, then ship what we have rather than burn the demo window.
    try {
      svg = await callArrow(`${prompt} Every glyph must be a filled path, never a text element.`, key);
    } catch {
      /* keep the first result */
    }
  }

  return { svg, word: parsed.word, script: parsed.script };
}
