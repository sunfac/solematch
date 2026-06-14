/**
 * Generates the static social-share card: assets/og/og-default.png (1200×630).
 *
 * This is the image social bots (iMessage/WhatsApp/Slack/X) show when a
 * SoleMatch link is pasted — the first impression. We render it ONCE, locally,
 * with Playwright (already a devDep for e2e) and COMMIT the PNG. seo-postbuild
 * then copies it into dist/ with a plain fs copy, so the Railway/Vercel deploy
 * build never needs a browser.
 *
 * Regenerate after changing the card:  npx tsx scripts/gen-og-card.ts
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const OUT_DIR = join(__dirname, '..', 'assets', 'og');
const OUT = join(OUT_DIR, 'og-default.png');

// Instrument aesthetic: volt #C8FF00 on near-black, Martian Mono readouts,
// Archivo display headline, Inter body — same language as the app.
const html = `<!doctype html><html><head><meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700&family=Inter:wght@400;500&family=Martian+Mono:wght@500;600&display=swap" rel="stylesheet" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; }
  body {
    background: #0A0B0F;
    color: #F5F6F7;
    font-family: 'Inter', sans-serif;
    position: relative;
    overflow: hidden;
  }
  /* atmosphere: volt glow + faint instrument grid */
  .glow {
    position: absolute; inset: -200px auto auto -200px; width: 760px; height: 760px;
    background: radial-gradient(circle, rgba(200,255,0,0.16), rgba(200,255,0,0) 62%);
  }
  .grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
    background-size: 48px 48px;
    mask-image: radial-gradient(circle at 30% 40%, #000 30%, transparent 78%);
  }
  .frame { position: absolute; inset: 36px; border: 1px solid #2A2E38; border-radius: 22px; }
  .pad { position: absolute; inset: 80px 0 80px 84px; width: 700px; display: flex; flex-direction: column; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .dot { width: 12px; height: 12px; border-radius: 50%; background: #C8FF00; box-shadow: 0 0 14px #C8FF00; }
  .wordmark { font-family: 'Martian Mono', monospace; font-weight: 600; font-size: 22px; letter-spacing: 6px; color: #F5F6F7; }
  .eyebrow { font-family: 'Martian Mono', monospace; font-weight: 500; font-size: 16px; letter-spacing: 3.5px; color: #C8FF00; margin-top: 70px; }
  h1 { font-family: 'Archivo', sans-serif; font-weight: 700; font-size: 72px; line-height: 1.03; letter-spacing: -2px; margin-top: 18px; max-width: 600px; }
  .sub { font-size: 26px; line-height: 1.42; color: #9AA0AC; margin-top: 24px; max-width: 600px; }
  .sub b { color: #F5F6F7; font-weight: 500; }
  .cta { margin-top: auto; display: inline-flex; align-items: center; gap: 12px; align-self: flex-start;
    font-family: 'Martian Mono', monospace; font-weight: 600; font-size: 17px; letter-spacing: 2px; color: #C8FF00;
    border: 1.5px solid #C8FF00; border-radius: 999px; padding: 15px 26px; }

  /* right-side match gauge (svg + centred number share one positioned box) */
  .gaugeWrap { position: absolute; right: 88px; top: 50%; transform: translateY(-50%); width: 320px; height: 320px; }
  .gaugeWrap svg { position: absolute; inset: 0; width: 100%; height: 100%; }
  .gnum { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .gnum .v { font-family: 'Archivo', sans-serif; font-weight: 700; font-size: 104px; line-height: 1; color: #F5F6F7; letter-spacing: -4px; }
  .gnum .l { font-family: 'Martian Mono', monospace; font-size: 15px; letter-spacing: 5px; color: #C8FF00; margin-top: 6px; }
</style></head>
<body>
  <div class="glow"></div>
  <div class="grid"></div>
  <div class="frame"></div>

  <div class="gaugeWrap">
    <svg viewBox="0 0 320 320">
      <circle cx="160" cy="160" r="142" fill="none" stroke="#1B1E26" stroke-width="14" />
      <circle cx="160" cy="160" r="142" fill="none" stroke="#C8FF00" stroke-width="14"
        stroke-linecap="round" stroke-dasharray="892.21" stroke-dashoffset="53.5"
        transform="rotate(-90 160 160)" />
      <circle cx="160" cy="160" r="112" fill="none" stroke="#2A2E38" stroke-width="1" />
    </svg>
    <div class="gnum"><div class="v">94</div><div class="l">MATCH</div></div>
  </div>

  <div class="pad">
    <div class="brand"><span class="dot"></span><span class="wordmark">SOLEMATCH</span></div>
    <div class="eyebrow">SCIENCE-BACKED · INDEPENDENT MATCHING</div>
    <h1>Find your perfect running shoe.</h1>
    <div class="sub">A quick quiz drives an <b>evidence-cited engine</b> across 100+ road &amp; trail shoes — every pick cites the research.</div>
    <div class="cta">TAKE THE QUIZ &nbsp;→</div>
  </div>
</body></html>`;

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(() => (document as any).fonts.ready);
  await page.waitForTimeout(350); // let webfonts paint
  await page.screenshot({ path: OUT, type: 'png' });
  await browser.close();
  console.log(`+ OG card -> ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
