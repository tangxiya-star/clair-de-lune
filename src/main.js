import { createRoom } from "./room.js";
import { bandToTextures } from "./band.js";
import { makeLatticeSvg } from "./lattice.js";
import { normalizeWord } from "./word.js";

// One pre-cut band, kept only so the lamp still has paper on it if Arrow is
// unreachable on stage. The live cut is the product.
const PREBAKES = [
  { word: "雅", file: "/prebake/YA.svg" },
  { word: "HOLLY", file: "/prebake/HOLLY.svg" },
];

const canvas = document.getElementById("room");
const form = document.getElementById("form");
const input = document.getElementById("word");
const cut = document.getElementById("cut");
const note = document.getElementById("note");
const chips = document.getElementById("chips");
const download = document.getElementById("download");

const room = createRoom(canvas);

let current = { word: null, svg: null };

function say(text, state = "") {
  note.textContent = text;
  note.dataset.state = state;
}

async function hang(svgText, word) {
  const textures = await bandToTextures(svgText);
  room.setBand(textures);
  current = { word, svg: textures.svg };
  download.hidden = !word;
  if (word) download.textContent = `Download ${word}-lantern.svg`;
}

// --- the lamp in the hand ---------------------------------------------------
function track(clientX, clientY) {
  room.movePointer(
    (clientX / window.innerWidth) * 2 - 1,
    -((clientY / window.innerHeight) * 2 - 1)
  );
}

window.addEventListener("pointermove", (e) => track(e.clientX, e.clientY), { passive: true });
window.addEventListener(
  "touchmove",
  (e) => {
    const t = e.touches[0];
    if (t) track(t.clientX, t.clientY);
  },
  { passive: true }
);

// --- cutting ---------------------------------------------------------------
let busy = false;

async function generate(raw) {
  const parsed = normalizeWord(raw);
  if (!parsed.ok) {
    say(parsed.reason, "error");
    return;
  }

  busy = true;
  input.disabled = true;
  cut.disabled = true;
  input.value = parsed.word;
  say(`Cutting ${parsed.word}`, "busy");

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word: parsed.word }),
    });
    const payload = await res.json();
    if (!res.ok) {
      const err = new Error(payload.error || "Arrow refused");
      err.status = res.status;
      throw err;
    }

    await hang(payload.svg, parsed.word);
    say(`${parsed.word} · one connected cut`);
  } catch (err) {
    console.error(err);
    if (err.status === 400) say(err.message, "error");
    else if (err.status === 503) say("No Quiver key on the server.", "error");
    else say("The cut failed. Try again, or take the pre-cut band.", "error");
  } finally {
    busy = false;
    input.disabled = false;
    cut.disabled = false;
    input.focus();
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!busy) generate(input.value);
});

// --- pre-cut bands, for when the network blips ------------------------------
async function loadPrebake(entry) {
  if (busy) return;
  say(`${entry.word} · pre-cut`, "busy");
  try {
    const res = await fetch(entry.file);
    if (!res.ok) throw new Error("missing");
    await hang(await res.text(), entry.word);
    input.value = entry.word;
    say(`${entry.word} · one connected cut`);
  } catch {
    say("That band is not on disk.", "error");
  }
}

for (const entry of PREBAKES) {
  const chip = document.createElement("button");
  chip.type = "button";
  chip.className = "chip";
  chip.textContent = entry.word;
  chip.addEventListener("click", () => loadPrebake(entry));
  chips.append(chip);
}

// --- download --------------------------------------------------------------
download.addEventListener("click", () => {
  if (!current.svg || !current.word) return;
  const url = URL.createObjectURL(new Blob([current.svg], { type: "image/svg+xml" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${current.word}-lantern.svg`;
  a.click();
  URL.revokeObjectURL(url);
});

// --- empty state: already playable -----------------------------------------
hang(makeLatticeSvg(), null).catch(console.error);
