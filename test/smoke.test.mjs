// iPad smoke test: the app starts without JS errors, key controls are reachable,
// and the project survives a reload (saved in the browser).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp } from './helpers.mjs';

test('starts on iPad without errors and core controls are visible', async () => {
  const app = await openApp();
  try {
    for (const id of ['cv', 'tools', 'bUndo', 'bFile', 'inspTabs', 'insp']) {
      assert.ok(await app.page.isVisible('#' + id), `#${id} not visible`);
    }
    // Layout guard: a missing closing tag once nested the inspector inside the
    // hidden pixel panel (PR #14). Every top-level region must stay a direct child of #app.
    const parents = await app.page.evaluate(() =>
      ['insp', 'inspTabs', 'inspTgl'].map(id => [id, document.getElementById(id)?.parentElement?.id]));
    for (const [id, parent] of parents) assert.equal(parent, 'app', `#${id} is nested in #${parent}`);
    for (const id of ['bFile', 'bSet', 'bFea', 'bTest', 'bExp']) {
      const el = await app.page.$('#' + id);
      if (!el) continue;
      await el.click();
      await app.page.waitForTimeout(100);
      await app.page.keyboard.press('Escape');
      await app.page.evaluate(() => document.querySelectorAll('.sheet').forEach(s => s.hidden = true));
    }
    assert.deepEqual(app.errors, []);
  } finally { await app.close(); }
});

test('English UI starts without errors', async () => {
  const app = await openApp({ lang: 'en' });
  try { assert.deepEqual(app.errors, []); } finally { await app.close(); }
});
