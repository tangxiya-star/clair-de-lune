// Turns an Arrow SVG string into the two textures the lantern needs:
//   paper — the cut itself, vermillion where paper remains
//   light — the inverse, warm where light gets through, soft-edged so the
//           wall projection falls off instead of ending in a hard rectangle

import * as THREE from "three";

const PAPER_WIDTH = 2048;
const MAX_HEIGHT = 1024;

export class BandError extends Error {}

function parse(svgText) {
  const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
  if (doc.querySelector("parsererror")) throw new BandError("SVG did not parse");
  const svg = doc.documentElement;
  if (!svg || svg.tagName.toLowerCase() !== "svg") throw new BandError("No <svg> root");
  return { doc, svg };
}

function viewBoxOf(svg) {
  const raw = (svg.getAttribute("viewBox") || "").trim().split(/[\s,]+/).map(Number);
  if (raw.length === 4 && raw.every(Number.isFinite) && raw[2] > 0 && raw[3] > 0) {
    return { x: raw[0], y: raw[1], w: raw[2], h: raw[3] };
  }
  const w = parseFloat(svg.getAttribute("width")) || 1200;
  const h = parseFloat(svg.getAttribute("height")) || 400;
  return { x: 0, y: 0, w, h };
}

const SHAPES = "path,rect,circle,ellipse,polygon,polyline,line";

function parseColor(value) {
  if (!value) return null;
  const hex = value.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1];
    const full = h.length === 3 ? h.replace(/./g, (c) => c + c) : h;
    return [
      parseInt(full.slice(0, 2), 16),
      parseInt(full.slice(2, 4), 16),
      parseInt(full.slice(4, 6), 16),
    ];
  }
  const rgb = value.trim().match(/^rgba?\(([^)]+)\)$/i);
  if (rgb) {
    const nums = rgb[1].split(",").map((n) => parseFloat(n));
    if (nums.length >= 3 && nums.every(Number.isFinite)) return nums.slice(0, 3);
  }
  return null;
}

// The brief allows exactly two paints: vermillion and nothing. Anything that
// is not red is a backdrop plate, a highlight, or a gradient Arrow slipped in,
// and any of those would block the light. Keep the paper, drop the rest.
function isPaper(rgb) {
  if (!rgb) return false;
  const [r, g, b] = rgb;
  return r > 70 && r > g * 1.35 && r > b * 1.35;
}

function fillOf(el, styles) {
  const direct = el.getAttribute("fill");
  if (direct) return direct;

  const inline = el.getAttribute("style");
  const fromStyle = inline && inline.match(/fill\s*:\s*([^;]+)/i);
  if (fromStyle) return fromStyle[1];

  for (const cls of (el.getAttribute("class") || "").split(/\s+/)) {
    if (cls && styles.has(cls)) return styles.get(cls);
  }

  const parent = el.parentElement;
  if (parent && parent.tagName.toLowerCase() !== "svg") return fillOf(parent, styles);
  return null;
}

// Arrow writes its palette into a <style> block keyed by class.
function readStyleBlock(svg) {
  const styles = new Map();
  for (const style of svg.querySelectorAll("style")) {
    const css = style.textContent || "";
    for (const rule of css.matchAll(/\.([\w-]+)\s*\{([^}]*)\}/g)) {
      const fill = rule[2].match(/fill\s*:\s*([^;]+)/i);
      if (fill) styles.set(rule[1], fill[1].trim());
    }
  }
  return styles;
}

function keepOnlyPaper(svg) {
  const styles = readStyleBlock(svg);

  for (const dead of svg.querySelectorAll("defs,linearGradient,radialGradient,pattern,filter,image,mask,clipPath")) {
    dead.remove();
  }

  let dropped = 0;
  for (const shape of [...svg.querySelectorAll(SHAPES)]) {
    const fill = fillOf(shape, styles);
    if (isPaper(parseColor(fill))) continue;
    // A shape with no fill at all but a red stroke is still cut paper.
    if (!fill && isPaper(parseColor(shape.getAttribute("stroke")))) continue;
    shape.remove();
    dropped += 1;
  }

  for (const style of svg.querySelectorAll("style")) style.remove();
  return dropped;
}

// A live <text> node means the word is a font reference, not a cut path. The
// caller retries once when this shows up.
export function hasLiveText(svgText) {
  return /<text[\s>]/i.test(svgText);
}

const VERMILLION = "#C41E3A";

// Repaint the survivors so the file really does hold two paints and nothing
// else, whatever red Arrow happened to pick.
function normalizePaint(svg) {
  for (const shape of svg.querySelectorAll(SHAPES)) {
    const strokeOnly = !shape.getAttribute("fill") && shape.getAttribute("stroke");
    if (strokeOnly) {
      shape.setAttribute("stroke", VERMILLION);
      shape.setAttribute("fill", "none");
    } else {
      shape.setAttribute("fill", VERMILLION);
      shape.removeAttribute("stroke");
    }
    shape.removeAttribute("class");
    shape.removeAttribute("style");
    shape.removeAttribute("opacity");
    shape.removeAttribute("fill-opacity");
  }
}

export function sanitizeBand(svgText) {
  const { svg } = parse(svgText);
  const box = viewBoxOf(svg);
  keepOnlyPaper(svg);
  normalizePaint(svg);

  svg.setAttribute("viewBox", `${box.x} ${box.y} ${box.w} ${box.h}`);
  svg.setAttribute("width", String(box.w));
  svg.setAttribute("height", String(box.h));
  svg.removeAttribute("style");
  if (!svg.getAttribute("xmlns")) svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  return {
    svg: new XMLSerializer().serializeToString(svg),
    aspect: box.w / box.h,
  };
}

function rasterize(image, aspect) {
  const w = PAPER_WIDTH;
  const h = Math.max(64, Math.min(MAX_HEIGHT, Math.round(w / aspect)));

  const paper = document.createElement("canvas");
  paper.width = w;
  paper.height = h;
  const pctx = paper.getContext("2d");
  pctx.drawImage(image, 0, 0, w, h);

  const light = document.createElement("canvas");
  light.width = w;
  light.height = h;
  const lctx = light.getContext("2d");

  // Warm plate, then punch the paper out of it: what is left is the hole.
  lctx.fillStyle = "#ffc978";
  lctx.fillRect(0, 0, w, h);
  lctx.globalCompositeOperation = "destination-out";
  lctx.drawImage(image, 0, 0, w, h);

  // Feather the outer edge so the throw on the wall has no seam.
  lctx.globalCompositeOperation = "destination-in";
  const fade = lctx.createLinearGradient(0, 0, 0, h);
  fade.addColorStop(0, "rgba(0,0,0,0)");
  fade.addColorStop(0.16, "rgba(0,0,0,1)");
  fade.addColorStop(0.84, "rgba(0,0,0,1)");
  fade.addColorStop(1, "rgba(0,0,0,0)");
  lctx.fillStyle = fade;
  lctx.fillRect(0, 0, w, h);
  lctx.globalCompositeOperation = "source-over";

  return { paper, light, aspect: w / h };
}

function loadImage(svgMarkup) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([svgMarkup], { type: "image/svg+xml" }));
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new BandError("SVG failed to rasterize"));
    };
    image.src = url;
  });
}

export async function bandToTextures(svgText) {
  const { svg, aspect } = sanitizeBand(svgText);
  const image = await loadImage(svg);
  const canvases = rasterize(image, aspect);

  const paperTex = new THREE.CanvasTexture(canvases.paper);
  paperTex.colorSpace = THREE.SRGBColorSpace;
  paperTex.wrapS = THREE.RepeatWrapping;
  paperTex.anisotropy = 8;

  const lightTex = new THREE.CanvasTexture(canvases.light);
  lightTex.colorSpace = THREE.SRGBColorSpace;
  lightTex.wrapS = THREE.RepeatWrapping;
  lightTex.anisotropy = 8;

  return { paperTex, lightTex, aspect: canvases.aspect, svg };
}
