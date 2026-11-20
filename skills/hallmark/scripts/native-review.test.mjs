import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { imageReads, review, reviewKeys } from './native-review.mjs';

test('only successful native image reads count as visual inspection', () => {
  const event = (state, error, path = 'mobile.png') => JSON.stringify({ step_update: { state, tool_info: { name: 'read_file', parameters: { Path: path }, error } } });
  assert.deepEqual(
    [...imageReads([event('ACTIVE'), event('DONE', { message: 'missing' }), event('DONE', null, 'notes.md'), event('DONE')].join('\n'), '/site')],
    ['/site/mobile.png']
  );
});

test('a plausible passing receipt without image tool reads is rejected', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'hallmark-native-review-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const screenshots = [];
  for (const view of ['desktop', 'mobile']) {
    const path = join(root, view + '.png');
    await writeFile(path, 'test image bytes');
    screenshots.push({ view, path, ...(view === 'mobile' ? { width: 375 } : {}) });
  }
  const input = { config: {}, workspace: root, output: root, reviewPath: join(root, 'review.json'), artifactDigest: 'bound', verification: { screenshots }, reviewNumber: 1 };
  let mobileViews;
  let reads = false;
  let corruptReceipt = false;
  let changeCapture = false;
  const invoke = async (_, call) => {
    await mkdir(call.output, { recursive: true });
    const receipts = await Promise.all(screenshots.map(async ({ path }) => ({ path, sha256: createHash('sha256').update(await readFile(path)).digest('hex') })));
    if (corruptReceipt) receipts[0].sha256 = 'wrong';
    await writeFile(input.reviewPath, JSON.stringify({ artifactDigest: 'bound', checks: Object.fromEntries(reviewKeys.map((key) => [key, { pass: true, evidence: 'Observed in mobile and desktop image.' }])), findings: [], limitations: ['Subjective review'], images: receipts, mobileViews }));
    await writeFile(join(call.output, `turn-${call.turn}.ndjson`), reads ? screenshots.map(({ path }) => JSON.stringify({ step_update: { state: 'DONE', tool_info: { name: 'read_file', parameters: { Path: path } } } })).join('\n') : '');
    if (changeCapture) await writeFile(screenshots[0].path, 'changed capture');
    return { code: 0, conversation: 'same-review' };
  };
  await assert.rejects(review(input, { invoke }), /No successful image read/);
  reads = true;
  const result = await review(input, { invoke });
  assert.equal(result.inspection.conversation, 'same-review');
  assert.deepEqual(result.inspection.views, ['desktop', 'mobile']);
  input.verification.mobileWidths = [375];
  await assert.rejects(review(input, { invoke }), /Missing observed mobile review for 375px/);
  mobileViews = [{ width: 375, pass: false, evidence: 'Filter panel consumes the first phone screen.' }];
  await assert.rejects(review(input, { invoke }), /cannot pass mobilePath/);
  mobileViews[0].pass = true;
  await review(input, { invoke });
  corruptReceipt = true;
  await assert.rejects(review(input, { invoke }), /receipts do not match/);
  corruptReceipt = false;
  changeCapture = true;
  await assert.rejects(review(input, { invoke }), /Capture changed/);
});

test('image inspection after a page write cannot count as before-edit review', () => {
  const before = JSON.stringify({ step_update: { state: 'DONE', tool_info: { name: 'read_file', parameters: { Path: 'desktop.png' } } } });
  const write = JSON.stringify({ step_update: { state: 'ACTIVE', tool_info: { name: 'edit_file', parameters: { Path: '/site/index.html' } } } });
  const after = JSON.stringify({ step_update: { state: 'DONE', tool_info: { name: 'read_file', parameters: { Path: 'mobile.png' } } } });
  assert.deepEqual([...imageReads([before, write, after].join('\n'), '/site', true)], ['/site/desktop.png']);
});
