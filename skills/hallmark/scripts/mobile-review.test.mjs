import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { captureMobile } from './mobile-review.mjs';

const skip = !process.env.HALLMARK_PUPPETEER || !process.env.CHROME_PATH ? 'set HALLMARK_PUPPETEER and CHROME_PATH for real-browser regressions' : false;
test('mobile capture supplies actual narrow widths and retains task-state evidence', { skip }, async (t) => {
  const workspace = await mkdtemp(join(tmpdir(), 'hallmark-mobile-'));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  await writeFile(join(workspace, 'index.html'), '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Phone fixture</title><h1>Phone composition</h1>');
  const result = await captureMobile({ workspace, output: workspace }, {}, { checks: [], screenshots: [{ view: 'desktop', path: 'desktop.png' }, { view: 'mobile', path: 'old.png' }, { view: 'additional', path: 'dialog.png' }] });
  assert.deepEqual(result.mobileWidths, [320, 375, 390]);
  assert.deepEqual(result.screenshots.slice(0, 2).map((shot) => shot.path), ['desktop.png', 'dialog.png']);
  assert.ok(!result.screenshots.some((shot) => shot.path === 'old.png'));
  for (const width of result.mobileWidths) {
    const shot = result.screenshots.find((shot) => shot.width === width);
    assert.equal((await readFile(shot.path)).readUInt32BE(16), width);
  }
  assert.equal(result.screenshots.find((shot) => shot.view === 'mobile').width, 375);
});
