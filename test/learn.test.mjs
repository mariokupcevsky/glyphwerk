// "Hand lehrt Maschine": letters drawn as plain outlines with known rule parameters must be
// recognised again, i.e. the learnt rules regenerate n o H O that measure like the drawing.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { openApp } from './helpers.mjs';

let app;
before(async () => { app = await openApp(); });
after(async () => { await app?.close(); });

const cases = [
  { name: 'light upright', P: { w: 60, c: 20, a: 15, wd: 95, wc: 100, sl: 0, ov: 12 }, xh: 480, cap: 690 },
  { name: 'bold contrasty slanted', P: { w: 150, c: 60, a: 30, wd: 115, wc: 90, sl: 10, ov: 20 }, xh: 540, cap: 720 },
];

for (const k of cases) {
  test(`learns rules back from drawn n o H O (${k.name})`, async () => {
    const r = await app.page.evaluate(({ P, xh, cap }) => {
      const T = { ...GENP0, ...P };
      // "draw" the target letters as plain outlines (not rule glyphs), like hand drawing would be
      const sx = XH, sc = CAP; XH = xh; CAP = cap; const G = genSkel(T); XH = sx; CAP = sc;
      for (const ch of LEARN_CH) {
        const c = []; for (const st of genStrokes(G[ch], T)) c.push(...strokeCs(st));
        S.glyphs[ch] = { c, k: [], l: 0, r: 0, v: 1 };
      }
      MC.clear();
      const t0 = performance.now(); const L = learnRules(); const ms = performance.now() - t0;
      return { L, ms };
    }, k);
    assert.ok(r.L, 'nothing learnt');
    assert.deepEqual(r.L.from.sort(), ['H', 'O', 'n', 'o']);
    const { P, xh, cap, err } = r.L;
    assert.ok(Math.abs(xh - k.xh) <= 15, `x-height ${xh} vs ${k.xh}`);
    assert.ok(Math.abs(cap - k.cap) <= 15, `cap height ${cap} vs ${k.cap}`);
    assert.ok(Math.abs(P.sl - k.P.sl) <= 2, `slant ${P.sl} vs ${k.P.sl}`);
    assert.ok(Math.abs(P.wd - k.P.wd) <= 12, `width ${P.wd} vs ${k.P.wd}`);
    assert.ok(err < 2, `residual error ${err.toFixed(2)} too high: ${JSON.stringify(P)}`);
    assert.ok(r.ms < 8000, `learning took ${Math.round(r.ms)} ms`);
    console.log(`  ${k.name}: ${Math.round(r.ms)} ms, err ${err.toFixed(2)}, P ${JSON.stringify(P)}`);
  });
}

test('fewer than two key letters: nothing to learn', async () => {
  const r = await app.page.evaluate(() => { for (const ch of LEARN_CH) delete S.glyphs[ch]; MC.clear(); return learnRules(); });
  assert.equal(r, null);
});

test('"Learn from my hand" button sets the rule sliders from the drawing', async () => {
  const r = await app.page.evaluate(async () => {
    const T = { ...GENP0, w: 120, c: 40, a: 25, wd: 105, sl: 6 };
    const sx = XH, sc = CAP; XH = 520; CAP = 710; const G = genSkel(T); XH = sx; CAP = sc;
    for (const ch of LEARN_CH) { const c = []; for (const st of genStrokes(G[ch], T)) c.push(...strokeCs(st)); S.glyphs[ch] = { c, k: [], l: 0, r: 0, v: 1 }; }
    S.example = false; MC.clear();
    document.getElementById('bGen').click();
    document.getElementById('gLearn').click();
    await new Promise(res => { const t = setInterval(() => { if (!document.getElementById('gLearn').disabled && /Gelernt|Learnt/.test(document.getElementById('hint').textContent)) { clearInterval(t); res(); } }, 50); });
    const out = { hint: document.getElementById('hint').textContent, sl: +document.getElementById('gS').value, xh: XH, nHand: !isGenGlyph(S.glyphs.n) };
    document.getElementById('gOk').click();
    out.aGen = isGenGlyph(S.glyphs.a);
    return out;
  });
  assert.match(r.hint, /(Gelernt aus|Learnt from) .*n/);
  assert.equal(r.sl, 6);
  assert.ok(Math.abs(r.xh - 520) <= 10, `x-height ${r.xh}`);
  assert.ok(r.nHand, 'hand-drawn n was replaced');
  assert.ok(r.aGen, 'a was not generated from the learnt rules');
  assert.deepEqual(app.errors, []);
});
