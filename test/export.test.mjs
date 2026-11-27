// Export round-trip: what Glyphwerk writes must parse as a valid font with the
// glyphs, metrics and kerning the user made. This is the part that breaks silently.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import opentype from 'opentype.js';
import { openApp, exportFont } from './helpers.mjs';

let app;
before(async () => {
  app = await openApp();
  // Load the built-in example shapes (hand-drawn style contours), like a user would.
  await app.page.evaluate(() => document.getElementById('bExLoad').click());
});
after(async () => { await app?.close(); });

for (const cff of [false, true]) {
  const kind = cff ? 'OTF (CFF)' : 'TTF';
  test(`${kind} export parses and contains the drawn glyphs`, async () => {
    const { buf, glyphs } = await exportFont(app.page, cff);
    assert.ok(glyphs > 0, 'no glyphs exported');
    const f = opentype.parse(buf);
    assert.equal(f.unitsPerEm, 1000);
    assert.equal(f.outlinesFormat, cff ? 'cff' : 'truetype');
    const drawn = await app.page.evaluate(() => Object.keys(S.glyphs).filter(k => [...k].length === 1 && hasInk(S.glyphs[k])));
    assert.ok(drawn.length > 0, 'example shapes did not load');
    for (const ch of drawn) {
      const g = f.charToGlyph(ch);
      assert.ok(g && g.index > 0, `"${ch}" missing from cmap`);
      assert.ok(g.advanceWidth > 0, `"${ch}" has no width`);
      assert.ok(g.getPath(0, 0, 1000).commands.length > 0, `"${ch}" has no outline`);
    }
    assert.ok(f.charToGlyph(' ').advanceWidth > 0, 'space has no width');
  });
}

test('pair kerning set by the user ends up in the font', async () => {
  const pair = await app.page.evaluate(() => {
    const d = Object.keys(S.glyphs).filter(k => [...k].length === 1 && hasInk(S.glyphs[k]));
    const [a, b] = [d[0], d[1] || d[0]];
    S.kern[kernKey(a, b)] = -77; ACK = null;
    return [a, b];
  });
  const { buf, pairs } = await exportFont(app.page, false);
  assert.ok(pairs > 0, 'no kerning pairs exported');
  const f = opentype.parse(buf);
  const v = f.getKerningValue(f.charToGlyph(pair[0]), f.charToGlyph(pair[1]));
  // Auto-kerning may add to the user value, so only require a clearly negative pair.
  assert.ok(v < 0, `expected negative kerning for ${pair.join('')}, got ${v}`);
});

test('rules-generated alphabet exports a-z', async () => {
  await app.page.evaluate(() => { genOpen(); genClose(true); });
  const { buf } = await exportFont(app.page, false);
  const f = opentype.parse(buf);
  for (const ch of 'abcdefghijklmnopqrstuvwxyz') {
    const g = f.charToGlyph(ch);
    assert.ok(g.index > 0 && g.getPath(0, 0, 1000).commands.length > 0, `"${ch}" missing after rules`);
  }
});
