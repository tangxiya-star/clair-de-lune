import { createRoom } from "./room.js";
import { bandToTextures } from "./band.js";
import { makeLatticeSvg } from "./lattice.js";

// The band the lamp opens wearing. The procedural lattice below is only the
// parachute if the file is missing.
const PREBAKE = { word: "雅", file: "/prebake/YA.svg" };
const FALLBACK_WORD = "lattice";

const canvas = document.getElementById("room");
const download = document.getElementById("download");

const room = createRoom(canvas);

let current = { word: null, svg: null };

async function hang(svgText, word) {
  const textures = await bandToTextures(svgText);
  room.setBand(textures);
  current = { word, svg: textures.svg };
  // Whatever is on the lamp is downloadable — the band hanging now is the cut.
  download.hidden = !textures.svg;
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

// --- download --------------------------------------------------------------
download.addEventListener("click", () => {
  if (!current.svg) return;
  const url = URL.createObjectURL(new Blob([current.svg], { type: "image/svg+xml" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${current.word || FALLBACK_WORD}-lantern.svg`;
  // Safari only honours download on an anchor that is actually in the document,
  // and revoking in the same tick can beat the save. Both are why this is fussy.
  a.style.display = "none";
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

// --- the lamp opens wearing a real cut --------------------------------------
(async () => {
  try {
    const res = await fetch(PREBAKE.file);
    if (!res.ok) throw new Error("missing");
    await hang(await res.text(), PREBAKE.word);
  } catch {
    await hang(makeLatticeSvg(), null);
  }
})().catch(console.error);
