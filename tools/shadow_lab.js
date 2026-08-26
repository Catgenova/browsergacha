#!/usr/bin/env node
// Shadow lab: drop every hero on a real battle background, draw the
// shadow the game would draw, and emit contact sheets to look at.
//
// This is step 1 and step 4 of docs/shadow-process.md — you cannot
// judge a shadow from a number, only from the art sitting on ground.
// Nothing here re-implements the shadow: it loads the game's own
// sprites.js, so the radius on the sheet is the radius in battle.
//
//   node tools/shadow_lab.js              # all heroes, contact sheets
//   node tools/shadow_lab.js ryn imani    # just these, one big card each
//
// Output: tools/out/shadow/*.png plus a measurements table on stdout.
// Requires a static server on 8903 (started and stopped automatically).

const { chromium } = require(require('child_process')
  .execSync('npm root -g').toString().trim() + '/playwright');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'tools', 'out', 'shadow');
const PORT = 8903;
const only = process.argv.slice(2);

// One tile of the battle map, blown up: background, ground line, hero,
// and the shadow the renderer would put under them. Big enough that a
// few pixels of radius error are obvious.
const CELL_W = 190;
const CELL_H = 210;
const ZOOM = only.length ? 2.4 : 1.35;

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const server = spawn('python3', ['-m', 'http.server', String(PORT)],
    { cwd: ROOT, stdio: 'ignore', detached: true });
  await new Promise((r) => setTimeout(r, 1500));

  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'load' });
    await page.evaluate(() => GameState.setOnboarded(true));
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(1200);

    const ids = await page.evaluate((filter) => {
      const all = Object.keys(HEROES);
      return filter.length ? all.filter((id) => filter.includes(id)) : all;
    }, only);
    if (!ids.length) throw new Error(`no such hero: ${only.join(', ')}`);

    // Load every sheet first; measurement needs the image decoded.
    const rows = await page.evaluate(async (heroIds) => {
      const out = [];
      for (const id of heroIds) {
        const def = HEROES[id];
        const sheet = await Sprites.getSheet(def);
        const anim = sheet.animations.idle;
        out.push({
          id, name: def.name,
          displayH: sheet.displayH,
          frameW: anim.frameW, frameH: anim.frameH,
          rx: sheet.shadowRX,
          legacyRx: Math.min(34, sheet.size().w * 0.3),
          offX: sheet.shadowOffsetX,
          footPad: sheet.footPad,
          scale: sheet.shadowScale,
        });
      }
      return out;
    }, ids);

    console.log('id'.padEnd(11) + 'rx'.padStart(5) + 'was'.padStart(6) +
      'delta'.padStart(7) + 'offX'.padStart(6) + 'scale'.padStart(7));
    for (const r of rows) {
      const d = r.rx == null ? '—' : (r.rx - Math.round(r.legacyRx));
      console.log(r.id.padEnd(11) + String(r.rx ?? '—').padStart(5) +
        String(Math.round(r.legacyRx)).padStart(6) + String(d).padStart(7) +
        String(r.offX).padStart(6) + String(r.scale).padStart(7));
    }

    // Draw the sheets. Each page holds up to 7x4 cells.
    const perPage = only.length ? ids.length : 28;
    for (let p = 0; p * perPage < ids.length; p++) {
      const slice = ids.slice(p * perPage, (p + 1) * perPage);
      const png = await page.evaluate(async (args) => {
        const { heroIds, CELL_W, CELL_H, ZOOM } = args;
        const cols = Math.min(7, heroIds.length);
        const rowCount = Math.ceil(heroIds.length / cols);
        const cv = document.createElement('canvas');
        cv.width = cols * CELL_W * ZOOM;
        cv.height = rowCount * CELL_H * ZOOM;
        const ctx = cv.getContext('2d');
        ctx.scale(ZOOM, ZOOM);
        ctx.imageSmoothingEnabled = false;

        const bg = new Image();
        bg.src = CONFIG.BATTLE_BGS[0];
        await new Promise((res) => { bg.onload = res; bg.onerror = res; });

        for (let i = 0; i < heroIds.length; i++) {
          const id = heroIds[i];
          const def = HEROES[id];
          const sheet = await Sprites.getSheet(def);
          const cx = (i % cols) * CELL_W;
          const cy = Math.floor(i / cols) * CELL_H;
          ctx.save();
          ctx.beginPath();
          ctx.rect(cx, cy, CELL_W, CELL_H);
          ctx.clip();
          // A slice of real map, so the shadow is judged against the
          // ground it will actually sit on.
          if (bg.width) {
            ctx.drawImage(bg, (i * 137) % Math.max(1, bg.width - CELL_W),
              Math.max(0, bg.height - CELL_H - 40), CELL_W, CELL_H,
              cx, cy, CELL_W, CELL_H);
          } else {
            ctx.fillStyle = '#2a3a24';
            ctx.fillRect(cx, cy, CELL_W, CELL_H);
          }

          const groundY = cy + CELL_H - 52;
          const midX = cx + CELL_W / 2;
          // The renderer's own shadow geometry, at rest (altitude 0).
          const rx = Math.min(40, sheet.shadowRX ||
            Math.min(34, sheet.size().w * 0.3));
          ctx.fillStyle = 'rgba(8, 14, 8, 0.32)';
          ctx.beginPath();
          ctx.ellipse(midX + sheet.shadowOffsetX, groundY + 8, rx, rx * 0.34,
            0, 0, Math.PI * 2);
          ctx.fill();

          // The hero, anchored by measured feet exactly as drawUnit does.
          const player = new AnimationPlayer(sheet);
          const yc = groundY - sheet.displayH / 2 + 5 + (sheet.footPad || 0);
          player.draw(ctx, midX, yc, false);

          // Reference marks: the ground line and the frame centre, so a
          // wrong offset is visible and not just felt.
          ctx.strokeStyle = 'rgba(255,255,255,0.22)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(cx + 6, groundY + 8);
          ctx.lineTo(cx + CELL_W - 6, groundY + 8);
          ctx.stroke();

          ctx.fillStyle = '#fff';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${def.name}  r${rx}${sheet.shadowScale !== 1
            ? ` x${sheet.shadowScale}` : ''}`, midX, cy + CELL_H - 8);
          ctx.restore();
        }
        return cv.toDataURL('image/png').split(',')[1];
      }, { heroIds: slice, CELL_W, CELL_H, ZOOM });

      const name = only.length ? `focus-${only.join('-')}.png` : `sheet-${p + 1}.png`;
      fs.writeFileSync(path.join(OUT, name), Buffer.from(png, 'base64'));
      console.log('wrote', path.relative(ROOT, path.join(OUT, name)));
    }
    if (errs.length) console.log('PAGE ERRORS:', errs);
  } finally {
    await browser.close();
    try { process.kill(-server.pid); } catch (e) { /* already gone */ }
    try { execSync(`pkill -f "[h]ttp.server ${PORT}"`); } catch (e) { /* none left */ }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
