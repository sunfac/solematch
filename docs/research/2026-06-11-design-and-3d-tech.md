# Research Dossier 3: Nike Design Language, FUT Reveal Anatomy, 3D Display Tech
*Researched 11 June 2026 (nike.com fetched live).*

## (A) Nike.com Design Language Spec
Source: live extraction from `nike.com/w/running-shoes-37v7jzy7ok` (listing) + Pegasus 42 PDP.

### Typography
| Role | Spec |
|---|---|
| UI font stack | `"Helvetica Now Text", Helvetica, Arial, sans-serif` (body), `"Helvetica Now Display/Text Medium"` (headings) |
| Weights | 400 body, 500 headings/labels/prices — rarely true bold; hierarchy from size + spacing |
| Scale | h1 24px (product title), h2 16–32px, body 12–16px; price same size/weight as title |
| Casing | Title Case product names, sentence case body, no all-caps in commerce UI. ALL-CAPS condensed (Nike TG/Futura) reserved for campaign/editorial |

### Colour
| Token | Value | Usage |
|---|---|---|
| Background | `#FFFFFF` | always white/light |
| Ink | `#111111` | text, primary CTA (black pill, white text) |
| Surface grey | `#F5F5F5` | product image tiles, inputs, chips |
| Muted | `#424B58`, `#2B333F`, `#757575` | secondary text |
| Accent orange | `#FA5400` | the ONLY loud UI colour: "Just In"/sale/member labels |
| Volt | `#BAD168` family | comes from product colourways — the product supplies the colour, chrome stays monochrome |

Components: primary button #111111 pill (radius 30px); secondary white + #111111 border (24px); inputs #F5F5F5 (24px); no shadows anywhere; 4px base spacing; cards square/4px radius.

### Photography
- Square 1:1 PNGs on flat #F5F5F5/white, soft contact shadow only.
- Hero: lateral 3/4 outstep view. PDP gallery = 8 shots: lateral, medial, heel, top-down, outsole, front/toe, macro, on-foot.
- Lifestyle 4:5 portrait. CDN transforms (`f_auto,q_auto:eco,t_PDP_1280_v1`).

### Layout
- Listing: 3-col grid (2 mobile), huge whitespace; card = image tile + #FA5400 badge + name + grey meta + price. No borders/shadows — the grey tile IS the card.
- PDP: left stacked images + thumbnail rail; right sticky buy rail (title, price, colourway swatches, size grid, black pill CTA).
- Below fold: accordions (Details / Shipping / Reviews 4.8★) + "Complete the Look" + "You Might Also Like".

### Motion
- Hover: image swaps to alt colourway; chips appear. Gallery thumbnail-driven + zoom. **No 360 viewer** — conviction via many static angles + scale. Sticky CTAs, skeletons, quiet 200–300ms eases. Energy lives in photography and type scale, not micro-animation.

### Spec presentation (pattern to copy)
- Label/value rows: "Shoe Weight — Approx. 300g/10.59oz (Men's US 10)", "Heel-to-Toe Drop — 10mm" (+tooltips).
- "What's New?" bullets vs previous model. "Features That Perform": 4:5 image cards + benefit + quantified claim ("ReactX is 13% more responsive").

## (B) FIFA/EA FC Walkout Reveal Storyboard
Walkouts = 86+ rated cards. The engine is **progressive information disclosure with anticipation gates**.

| # | Stage | Visuals / FX |
|---|---|---|
| 0 | Build-up | Stadium night, camera push-in; background drops a few shades darker (the tell); side spotlights brighten/tilt up; crowd hum |
| 1 | Tunnel glimpse (~0.5s) | Stadium-tunnel background flash confirms walkout; volumetric light from tunnel |
| 2 | Position reveal | Banner/flag with position drops and waves; camera tracks along ground light-line |
| 3–4 | Nation → league → club | One beat apart, hanging flags/crests hit by spotlight sweeps — the guessing gap is the dopamine engine |
| 5 | Pyro tell | Fireworks above where rating materialises; confetti/flames scale with tier |
| 6 | Walkout | 3D player from tunnel toward camera, rim-lit, god rays, signature celebration |
| 7 | Card materialise | Card slams/flips with diagonal shine sweep; rating flickers up; six stats (PAC SHO PAS DRI DEF PHY) tick from zero; holo foil shimmer |
| — | Double walkout tell | Club flags stay static = two 86+ players |

### Effect inventory
- Bloom/glow (rating, card edges, spotlights); god rays (radial gradient masks/volumetric cones)
- Neon rim lighting, tier-coloured (gold / special-promo neon)
- Particles: fireworks (burst + gravity fade), confetti, embers, spark trails
- Darkened vignette swap, lens flare on spotlight crossings
- Camera: slow dolly-in, pause-beat-pause pacing, screen shake on slam
- Shine sweep: white diagonal gradient across card face
- **Holographic foil**: layered linear+conic gradients, `color-dodge`/overlay blends, texture masks, pointer/gyro offset — canonical recipe `simeydotme/pokemon-cards-css`
- Parallax tilt: card rotates toward pointer/gyro, foil layers move at different rates
- Stat count-up: eased numeric tweens, staggered ~80ms

## (C) 3D Display Tech Comparison

| Option | Web (RN Web) | Native | Asset cost | Effort | Mobile perf | Wow |
|---|---|---|---|---|---|---|
| (a) react-three-fiber + GLB | Excellent — r3f 9.6.1 (React 19), drei 10.7.7, useGLTF + Draco | **Broken/risky 2025-26**: Expo SDK 53/54 ships expo-gl@15, r3f native expects expo-gl@11; pmndrs/native self-describes "unstable, incomplete". Alternative: react-native-filament (Margelo, GLB, production-proven) — no web | High (GLB per shoe) | High | Good for ONE shoe: DPR≤2, ≤100k tris, Draco/meshopt+KTX2, 5–30MB | Highest |
| (b) 360 sprite spin (24–72 frames) | Trivial — ~100-line component: preloaded Image array + pan gesture → frame index. Same code web+native | Same component | Medium (frames per colourway; ~£150 turntable or services: PhotoSpherix, Snap36/1WorldSync) | Low | Excellent | High |
| (c) Pseudo-3D parallax card | reanimated + pointer | reanimated + expo-sensors gyro | Near zero (cutout PNG) | Low | Excellent 60fps | Med-high with foil/glow — this IS the FUT look |

### Recommendation: tiered
1. **Tier 1 (every shoe) — FUT pseudo-3D card.** Layers: bg gradient → glow rim → shoe cutout (counter-parallax) → foil/glare → stats. Stack: react-native-reanimated 4.x (+ react-native-worklets; needs New Architecture — 3.16.x on old arch; web via babel-preset-expo) + gesture-handler + expo-sensors (gyro) / pointer (web) + expo-linear-gradient. Foil: **@shopify/react-native-skia — works on web** via CanvasKit WASM (2.9MB gz, async load, `setup-skia-web`); SkSL runtime effects = true holo/iridescence cross-platform. Fireworks/confetti: lottie-react-native v7 (React 19/web fixed) or @lottiefiles/dotlottie-react-native.
2. **Tier 2 — 360 sprite spin** in the same card frame (36 frames sweet spot). Own turntable photography or licensed services.
3. **Tier 3 (5–20 heroes) — true GLB 3D.** Web: r3f 9 + drei 10 (PresentationControls, Environment, ContactShadows), lazy canvas. Native: do NOT bet on r3f/native now — fall back to Tier 2 or react-native-filament. Re-evaluate r3f v10/WebGPU-native in 6–12 months.

## (D) Legal / Sourcing
**Imagery:** affiliate datafeeds are the clean route (networks license product imagery to approved affiliates for promoting linked products; Datafeedr exposes ~1B products). Feeds are stills, not 360 sets; licence conditional on linking out. Brand media kits = editorial use. Google Merchant 360 spins are Google-surface-only. Scraping static.nike.com outside affiliate terms = infringement risk. Realistic 360 plan: buy/borrow shoes and shoot (PhotoSpherix ship-in services exist).

**3D models:** Sketchfab has CC-BY sneaker GLBs (incl. photogrammetry) — dev placeholders only; fan-made branded meshes carry trademark/trade-dress risk commercially. No brand distributes official 3D models. Photogrammetry per shoe feasible: turntable, 360° spins at several heights + flip, RealityScan/Polycam/KIRI → GLB; ~30–60 min capture + 1–3h cleanup (laces/mesh/reflective trims hardest); target ≤30MB, <100k tris. Photographing/scanning real shoes to sell/review them = GOAT/StockX nominative-use pattern; get legal advice before shipping gamified presentation of branded products; pair with affiliate links to stay in licensed territory.

## (E) Sources
- Nike live: nike.com/w/running-shoes-37v7jzy7ok · Pegasus 42 PDP · fontsinuse.com/uses/14239/nike-website-2016 · designyourway.net/blog/nike-font/
- FUT: charlieintel.com/fifa-23-ultimate-team-pack-animations/200629/ · fifauteam.com/fc-26-walkout-player/ · games.gg/ea-sports-fc-26/guides/ea-fc-26-walkout-animation/ · dexerto.com/guides/fifa-23-pack-animations · onlyfarms.gg/wiki/fifa-fc/walkout-animation-meaning · github.com/simeydotme/pokemon-cards-css · css-tricks.com/holographic-trading-card-effect/
- 3D: npmjs.com/package/@react-three/fiber · @react-three/drei · r3f.docs.pmnd.rs · github.com/pmndrs/native · medium.com/@codedomen/current-state-of-react-native-tech-stack-expo-react-three-fiber · trifonstatkov.medium.com (r3f in RN+Expo) · github.com/margelo/react-native-filament
- FX: shopify.github.io/react-native-skia/docs/getting-started/web/ · docs.expo.dev/versions/latest/sdk/skia/ · docs.swmansion.com/react-native-reanimated/docs/guides/web-support/ · github.com/LottieFiles/dotlottie-react-native · github.com/expo/expo/issues/38583
- 360/photogrammetry: spritespin.ginie.eu · cssscript.com (Threesixty.js) · learn.poly.cam/how-to-scan-a-shoe · realityscan.com · kiriengine.app · photospherix.com/3d-view/360-spin-of-shoes/ · snap36.com/industries/footwear/ · support.google.com/merchants/answer/13671720 · datafeedr.com · sketchfab.com/tags/shoe
