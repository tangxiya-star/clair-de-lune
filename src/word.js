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
  "Never draw a backdrop plate of any shape or colour behind the cut, and never define a gradient. " +
  // Arrow keeps reaching for a frame; it has to be forbidden in the instructions
  // as well as the prompt, and the cut has to run off both ends to wrap.
  "The artwork must bleed to the left and right edges of the viewBox. " +
  "Absolutely no rectangular border, no outline box, no frame, no background plate.";

// A cylinder shows only about forty percent of its circumference at once, so a
// name cut once is a name the visitor can never read whole — they get "LY", not
// "HOLLY". Repeat it around the band the way a LOEWE lantern band repeats its
// wordmark. How many times depends on how much glyph the name already spends.
function repeatsFor(chars, script) {
  if (script === "cjk") return chars.length >= 3 ? 2 : 3;
  return chars.length <= 3 ? 4 : chars.length <= 6 ? 3 : 2;
}

// Three stacked registers: a narrow ornament rail, the word, a narrow ornament
// rail. Fusing every glyph to both rails is what keeps the sheet one connected
// piece and every counter bridged — it is the rule, not decoration.
const BAND =
  "The strip is three horizontal registers: a NARROW top register of botanical paper-cut ornament, " +
  "a TALL middle register holding the name, and a NARROW bottom register mirroring the top. " +
  "Every glyph is fused to the top register at its cap height and to the bottom register at its baseline, " +
  "so the whole strip is ONE connected sheet of paper with nothing floating. " +
  "The top and bottom edges of the strip are the ornament silhouette itself: organic, scalloped, irregular. " +
  "There is NO rectangular frame, NO border box, NO straight bar along any edge, NO background plate. " +
  "The cut bleeds off the left and right edges so the two ends butt together seamlessly. " +
  "Extremely wide letterbox proportions, at least six times wider than tall. " +
  "Vermillion red paper on transparent background. No photorealism, no gradients, no shadow, no extra words.";

export function buildPrompt(word, script) {
  const chars = [...word];
  const times = repeatsFor(chars, script);

  if (script === "cjk") {
    // A two or three character name has to read as one name across the band,
    // evenly spaced, not as separate stacked motifs.
    const subject =
      chars.length === 1
        ? `The hanzi ${word}`
        : `The ${chars.length}-character name ${chars.join(" ")}, cut left to right on one baseline, ` +
          "evenly spaced, equal weight, joined by the lattice";

    return (
      "Yi zhang ke zuo denglong zhao de jianzhi chuanghua: one very long horizontal strip of vermillion " +
      "paper designed to wrap all the way around a cylinder. " +
      `${subject} is repeated ${times} times across the strip, evenly spaced, with a panel of botanical ` +
      "ornament between each repeat, so that from any single viewpoint one whole name is readable. " +
      "Every repeat is stencil cut, not brush calligraphy, with thick even strokes filling about sixty " +
      "percent of the strip height. All ornaments grow from the strokes. " +
      "Every enclosed counter (ri, kou, tian) keeps a paper bridge. No zodiac, no extra characters. " +
      BAND
    );
  }

  return (
    "A Chinese jianzhi paper-cut lantern band: one very long horizontal strip of vermillion paper " +
    "designed to wrap all the way around a cylinder. " +
    `The word ${word} is repeated ${times} times across the strip, left to right, evenly spaced, ` +
    "with a panel of botanical ornament between each repeat, so that from any single viewpoint " +
    `one whole ${word} is readable. Each repeat is spelled ${chars.join(" ")} ` +
    "in bold high-contrast serif capitals with thick even stems and small flat serifs, " +
    "all letters on one shared baseline, filling about sixty percent of the strip height. " +
    "The ornament is thistle heads, leaves, berries, seed pods and curling tendrils, and it grows " +
    "OUT of the letterforms. Every closed counter — the bowl of O, the holes in A R D P B Q — " +
    "is held by visible paper bridges into the ornament. " +
    BAND
  );
}
