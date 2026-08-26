// Shared by the browser and the server route: what counts as a word, and what
// we ask Arrow to cut. No DOM, no node built-ins.

const CJK = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3005]/;
const CJK_ONLY = /^[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3005]{1,3}$/;
const LATIN_ONLY = /^[A-Za-z]{2,9}$/;

export function normalizeWord(input) {
  const raw = String(input ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s/g, "");
  if (!raw) return { ok: false, reason: "Type your name." };

  if (CJK.test(raw)) {
    if (!CJK_ONLY.test(raw)) return { ok: false, reason: "One to three characters." };
    return { ok: true, word: raw, script: "cjk" };
  }

  const upper = raw.toUpperCase();
  if (!LATIN_ONLY.test(upper)) return { ok: false, reason: "Letters only, two to nine." };
  return { ok: true, word: upper, script: "latin" };
}

export const INSTRUCTIONS =
  "Single SVG. Flat fills only. Two paints max: vermillion #C41E3A and transparent. " +
  "One connected component, no floating islands. Every letter or character counter has bridges. " +
  "No raster, no filters, no live text nodes (the word is paths). " +
  "viewBox landscape for wrapping a cylinder. Do not draw a full-bleed background rect. " +
  "The viewBox must be landscape, about three times wider than tall. " +
  "Never draw a backdrop plate of any shape or colour behind the cut, and never define a gradient.";

export function buildPrompt(word, script) {
  if (script === "cjk") {
    const chars = [...word];
    // A two or three character name has to read as one name across the band,
    // evenly spaced, not as separate stacked motifs.
    const subject =
      chars.length === 1
        ? `Center hanzi is ${word}`
        : `Center motif is the ${chars.length}-character name ${chars.join(" ")}, ` +
          "cut left to right on one baseline, evenly spaced, equal weight, joined by the lattice";

    return (
      `Yi zhang ke zuo denglong zhao de jianzhi chuanghua. ${subject}, ` +
      "must be stencil cut not brush calligraphy. All ornaments grow from the strokes, " +
      "one connected sheet, no floating islands. Every enclosed counter (ri, kou, tian) keeps a bridge. " +
      "Landscape 3:1 wraparound band. Vermillion #C41E3A, transparent bg. " +
      "No zodiac, no extra characters, no gradient, no shadow, no frame."
    );
  }

  return (
    "A Chinese jianzhi paper-cut stencil designed as a wraparound lantern band. " +
    `The word ${word} is the single dominant motif, cut as bold high-contrast serif capital letters ` +
    "like a luxury paper-cut letter band (LOEWE Jade lantern, not a logo lockup). " +
    "Delicate lattice, vines, and geometric bridges grow FROM the letterforms and hold every counter " +
    "in place so holes in O A R D P B Q stay attached by paper bridges. Seamless left-to-right. " +
    "Landscape about 3:1. Vermillion red paper only. Transparent background. " +
    "No extra text, no Zodiac, no photorealism, no gradients, no drop shadow, no outer rectangle."
  );
}
