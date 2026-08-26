# Lattice Lantern / 窗花灯

**PRD — build this, nothing else.**

Event: QuiverAI x a16z x Cursor Creative Coding Night, China Basin, 2026-08-25.
Build window ~2h. Must use Quiver (API or Studio) and Cursor. Ship a deployed webpage.

**One line:** Type a short word (hanzi or English). Arrow cuts it as one connected paper-cut. Wrap it on a lantern. The mouse is the lamp. The wall holds the shadow. Download is the real SVG.

---

## What you are making

A dark-room web page with one hanging lantern.

- Visitor types one or two Chinese characters, or a short English word (2–7 letters).
- App calls Quiver Arrow. Arrow returns a jianzhi / chuanghua stencil: the word is the motif, filigree grows from the letters, every counter is bridged so the piece would survive a physical cut.
- That SVG wraps a cylinder (LOEWE Jade lantern logic).
- Pointer moves a point light. Cutouts throw a pattern on a back wall.
- Download the SVG.

The product is a character that lights — not a sticker, not a chat agent, not a portrait. Live demo: ask for a visitor's own name, type it in front of them, cut it live. Light moves. Hand them the SVG. No canned celebrity or judge names as content.

## Why this, not the other tweets

Do NOT clone anything already on the Luma inspiration board or already viral tonight:

- No cream-paper gallery wall (Yoko office tweet)
- No React Bits sticker-peel
- No Praveen ASCII birth cards
- No m0b1 stroke-by-stroke agent draws
- No Surya / p5.brush watercolor
- No Quiver crane woodcut as the look
- No Dann 24-badge sheet
- No photoreal faces
- No chat-agent UI
- No tourist zodiac / fu character as default content. The craft RULE of jianzhi is the point; the CONTENT is the visitor word.

## Judges

- **Joan (Quiver):** real SVG, path topology. Counters that would fall out fail the demo.
- **Yoko:** beautiful, interactive, playable. The light has to feel good in the hand.
- **Dann:** it ships. Polish over explanation.

## Visual

Dark room. One object.

| Token | Value |
| --- | --- |
| Room | charcoal `#1A1410` |
| Paper | vermillion `#C41E3A` |
| Light | warm tungsten `#FFC978` |
| Ink / metal ring | `#2B2118` |
| Optional gold | `#D18800` on the frame only, not on the cut |

- **Lantern:** cylinder (or octagon), wood/metal rings top and bottom. Optional short tassel. Prefer cylinder over palace-lantern kitsch.
- **Cut:** thick connected shapes, flat fills, no stacked gradients, no drop shadows in the SVG. Transparent background so light reads through holes.
- **English letterforms:** high-contrast serif caps, LOEWE-band energy — not script, not a logo lockup.
- **Chinese:** jianzhi stencil / chuanghua, NOT brush calligraphy, not printed kai. The character is cut from paper.

## Input rules

Accept only:

- 1–3 CJK characters (a given name or a full Chinese name), or
- 2–9 Latin letters matching `^[A-Za-z]{2,9}$`

Normalize: trim, collapse spaces, Latin to uppercase. Reject punctuation, emoji, URLs, sentences.

The input is the visitor's own name. It is typed and cut on the spot; nothing is pre-listed for them to pick.

Examples that must work: `雅` `雅涵` `张雅涵` `MIYABI` `XIYA` `CATHERINE`
Placeholder: `你的名字 / your name`

## Interaction

- **Empty state:** dim lantern with a pre-cut lattice; cursor already moves the light so the page is playable before anyone types.
- **Submit:** disable input, keep the light alive, swap the band when SVG arrives.
- Pointer equals a point light. Shadow on a large back plane. Soft, warm, obvious.
- No click-hold required.
- Download the raw SVG. Filename is `WORD-lantern.svg`.
- No orbit-control chrome. Slow auto-rotate is ok; stop while the pointer moves.
- If Three.js shadows are ugly in 15 minutes: SVG as `alphaMap` on the cylinder, plus a huge back plane with the same SVG as a stretched translucent projection that parallax-offsets with the pointer. Fake shadow beats a broken shadow map.

## Stack (do not bikeshed)

- Vite + vanilla Three.js + a tiny server route.
- Three.js `SVGLoader` to turn Arrow output into a mesh, OR rasterize SVG to canvas then `CanvasTexture` + `alphaMap` if `SVGLoader` fights you. Texture path is the 2h-safe path. Loader path is the Joan-flex path. **Texture first.**
- Deploy on Vercel or Cloudflare Pages. Server route `/api/generate` forwards to Quiver.
- Do not write custom GLSL. Do not add React unless you already type it faster. Do not add physics, AR, or audio.
- Builder is fluent in Three.js and prefers existing tools over writing shaders.

## 2-hour build order (strict)

- **0:00–0:25** Fake lamp that already feels good. Dark scene, cylinder, one fallback SVG wrapped, mouse light, wall pattern. Deploy a URL even if Quiver is not wired.
- **0:25–0:55** Quiver. Input + proxy + prompt template. Land a real Arrow SVG on the lamp. `stream false` is fine.
- **0:55–1:20** Word as the product. CJK vs Latin prompts, validation, download. If SVG has live text nodes or a solid background rect, retry once. Do not hand-edit for 20 minutes.
- **1:20–1:45** Prebake + polish. Bake one local SVG: the owner's own character `雅`. If the API dies on stage, that one still demos.
- **1:45–2:00** Deploy + one judge pass. Public URL. Type a judge name once. Confirm download.

If behind at 0:55: skip streaming, skip `SVGLoader`, skip tassel.

## Fallback SVGs

Commit `public/prebake/YA.svg` — the hanzi `雅`, generated from Arrow — **before the room fills up**. Do this first thing. If the network blips, the single chip under the input loads it. One spare band hanging there, not a gallery wall of names.

## Out of scope

- Accounts, share-to-social, a persistent wall of lanterns
- Photo upload / face to cut
- Multiplayer
- Printing a physical lantern tonight
- Training or calling any local LLM
- Cloning Islanders Studio cats, Tom Eglington forests, or LOEWE jade palette

## Done when

- Public URL
- Quiver Arrow produced the band (not a hand-drawn SVG, not Claude-only)
- Cursor was used to build it
- Typing a visitor's Latin name and a hanzi name both land a connected cut on the lamp
- Moving the mouse clearly moves the light / shadow
- Download returns real SVG
- Prebakes exist if live generate fails
- Looks like a dark room with one lantern, not a SaaS form

## Prompt templates

`WORD` is the normalized input. If any CJK, use the Chinese branch; else English.

### English prompt

> A Chinese jianzhi paper-cut stencil designed as a wraparound lantern band. The word WORD is the single dominant motif, cut as bold high-contrast serif capital letters like a luxury paper-cut letter band (LOEWE Jade lantern, not a logo lockup). Delicate lattice, vines, and geometric bridges grow FROM the letterforms and hold every counter in place so holes in O A R D P B Q stay attached by paper bridges. Seamless left-to-right. Landscape about 3:1. Vermillion red paper only. Transparent background. No extra text, no Zodiac, no photorealism, no gradients, no drop shadow, no outer rectangle.

### Chinese prompt

> Yi zhang ke zuo denglong zhao de jianzhi chuanghua. Center hanzi is WORD, must be stencil cut not brush calligraphy. All ornaments grow from the character, one connected sheet, no floating islands. Every enclosed counter (ri, kou, tian) keeps a bridge. Landscape 3:1 wraparound band. Vermillion #C41E3A, transparent bg. No zodiac, no extra characters, no gradient, no shadow, no frame.

### Shared instructions

> Single SVG. Flat fills only. Two paints max: vermillion #C41E3A and transparent. One connected component, no floating islands. Every letter or character counter has bridges. No raster, no filters, no live text nodes (the word is paths). viewBox landscape for wrapping a cylinder. Do not draw a full-bleed background rect.

## Quiver API notes

- Endpoint: `POST https://api.quiver.ai/v1/svgs/generations`
- Docs: <https://docs.quiver.ai/models/text-to-svg> and <https://docs.quiver.ai/api>
- Model: `arrow-1.1` (`arrow-1.1-max` only as a last resort)
- Body JSON fields: `model`, `prompt`, `instructions`, `n=1`, `stream` true or false
- Success payload has `data[].svg`
- Call it only from the server route `/api/generate`. Put the secret in environment, never in the client bundle.

## Cursor kickoff (paste with this PRD)

> Read this PRD. Scaffold a Vite + Three.js app with a serverless `/api/generate` proxy to Quiver Arrow model `arrow-1.1`, `POST https://api.quiver.ai/v1/svgs/generations`. Follow the 2-hour order: fake lantern + mouse light first, then wire Quiver. Do not add sticker-peel, ASCII, or a chat UI. Use the prompt templates. Store the Quiver secret in env. Add env files to gitignore.
