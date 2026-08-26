// The band on the lantern before anyone types: a plain chuanghua lattice, so
// the room is already playable. Procedural, so it costs no network.

const PAPER = "#C41E3A";

export function makeLatticeSvg() {
  const w = 1800;
  const h = 600;
  const parts = [];

  const bar = (y, t) => `<rect x="0" y="${y}" width="${w}" height="${t}" fill="${PAPER}"/>`;
  parts.push(bar(0, 26), bar(h - 26, 26), bar(64, 10), bar(h - 74, 10));

  // Diagonal lattice across the open middle, both directions, so every
  // opening is closed by paper on all four sides.
  const top = 78;
  const bottom = h - 78;
  const span = bottom - top;
  const step = 74;
  const t = 9;
  for (let x = -span; x < w + span; x += step) {
    parts.push(
      `<path d="M${x} ${top} L${x + span} ${bottom} L${x + span + t * 1.6} ${bottom} L${x + t * 1.6} ${top} Z" fill="${PAPER}"/>`,
      `<path d="M${x} ${bottom} L${x + span} ${top} L${x + span + t * 1.6} ${top} L${x + t * 1.6} ${bottom} Z" fill="${PAPER}"/>`
    );
  }

  // Beads on the lattice crossings and a scallop rhythm on the borders.
  for (let x = 0; x < w; x += step) {
    parts.push(`<circle cx="${x + step / 2}" cy="${h / 2}" r="15" fill="${PAPER}"/>`);
    parts.push(`<circle cx="${x}" cy="${h / 2}" r="9" fill="${PAPER}"/>`);
    parts.push(
      `<path d="M${x} 26 Q${x + step / 2} ${72} ${x + step} 26 Z" fill="${PAPER}"/>`,
      `<path d="M${x} ${h - 26} Q${x + step / 2} ${h - 72} ${x + step} ${h - 26} Z" fill="${PAPER}"/>`
    );
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${parts.join("")}</svg>`;
}
