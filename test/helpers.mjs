// Shared helpers: open the app in an iPad-sized Chromium and collect JS errors.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
export const APP = 'file://' + path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'index.html');

export async function openApp({ lang = 'de' } = {}) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices['iPad Pro 11'], locale: lang });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(APP);
  await page.waitForFunction(() => typeof S === 'object' && S && S.glyphs);
  return { browser, page, errors, close: () => browser.close() };
}

// Run buildFont inside the page and return the binary as a Node ArrayBuffer.
export async function exportFont(page, cff) {
  const r = await page.evaluate(c => {
    const r = c ? buildOTF() : buildTTF();
    return { bytes: Array.from(new Uint8Array(r.buf)), glyphs: r.glyphs, pairs: r.pairs };
  }, cff);
  const u8 = Uint8Array.from(r.bytes);
  return { ...r, buf: u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) };
}
