import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { artifactDigest, runReviewLoop, validateReview, invokeNative } from './review-loop.mjs';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'hallmark-review-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const workspace = join(root, 'site');
  await mkdir(workspace);
  return { workspace, output: join(root, 'review'), prompt: 'Build the supplied page with native file tools.', model: 'test-model', maxRepairs: 2 };
}
const review = (state, findings = []) => ({
  artifactDigest: state.artifactDigest,
  checks: Object.fromEntries(['subject', 'hierarchy', 'mobilePath', 'facts'].map((key) => [key, { pass: findings.length === 0, evidence: 'Observed in the current desktop and mobile captures.' }])),
  findings,
});
async function capture({ output }, checks = [{ name: 'task', pass: true }]) {
  const screenshots = [];
  for (const view of ['desktop', 'mobile']) {
    const path = join(output, view + '.png');
    await writeFile(path, 'test capture');
    screenshots.push({ view, path });
  }
  return { screenshots, checks };
}

test('mechanical repairs continue the same conversation and cannot imply visual acceptance', async (t) => {
  const config = await fixture(t);
  const calls = [];
  const dependencies = {
    invoke: async (_, call) => {
      calls.push(call);
      await writeFile(join(config.workspace, 'index.html'), calls.length === 1 ? '<h1>Draft</h1>' : '<h1>Repaired</h1>');
      return { code: 0, conversation: 'same-conversation' };
    },
    verify: async (input) => capture(input, [{ name: 'contrast', pass: calls.length > 1, detail: 'Caption contrast is 3:1.' }]),
  };
  let state = await runReviewLoop(config, dependencies);
  assert.equal(state.phase, 'needs-review');
  assert.equal(calls.length, 2);
  assert.equal(calls[1].conversation, 'same-conversation');
  assert.match(calls[1].prompt, /Caption contrast/);
  await writeFile(state.reviewPath, JSON.stringify(review(state)));
  state = await runReviewLoop(config, dependencies);
  assert.equal(state.phase, 'complete');
  assert.equal(calls.length, 2);
  assert.equal(await readFile(join(config.output, 'review-1-1/source/index.html'), 'utf8'), '<h1>Draft</h1>');
});

test('visual feedback triggers scoped repair and a fresh review', async (t) => {
  const config = await fixture(t);
  let calls = 0;
  const dependencies = {
    invoke: async () => { await writeFile(join(config.workspace, 'index.html'), `<h1>Version ${++calls}</h1>`); return { conversation: 'visual', code: 0 }; },
    verify: capture,
  };
  const first = await runReviewLoop(config, dependencies);
  await writeFile(first.reviewPath, JSON.stringify(review(first, ['The mobile filter has two 200px empty blocks. Reset its flex basis.'])));
  const second = await runReviewLoop(config, dependencies);
  assert.equal(second.phase, 'needs-review');
  assert.equal(calls, 2);
  assert.notEqual(second.reviewPath, first.reviewPath);
  assert.equal(second.repairs, 1);
});

test('a successful native envelope without a file is never accepted', async (t) => {
  const config = { ...await fixture(t), maxRepairs: 1 };
  let calls = 0;
  const dependencies = { invoke: async () => { calls++; return { code: 0, conversation: 'empty' }; }, verify: async () => assert.fail('No artifact to inspect') };
  const state = await runReviewLoop(config, dependencies);
  assert.equal(state.phase, 'unresolved');
  assert.equal(calls, 2);
  assert.match(state.findings.join(' '), /Missing or empty/);
  await runReviewLoop(config, dependencies);
  assert.equal(calls, 2);
});

test('missing host captures stop repair attempts and can resume after recovery', async (t) => {
  const config = await fixture(t);
  let calls = 0;
  const invoke = async () => { calls++; await writeFile(join(config.workspace, 'index.html'), '<h1>Page</h1>'); return { conversation: 'capture' }; };
  const state = await runReviewLoop(config, { invoke, verify: async () => ({ checks: [{ name: 'load', pass: true }], screenshots: [] }) });
  assert.equal(state.phase, 'unresolved');
  assert.equal(calls, 1);
  const resumed = await runReviewLoop(config, { invoke, verify: capture });
  assert.equal(resumed.phase, 'needs-review');
  assert.equal(calls, 1);
});

test('asset changes invalidate an accepted review and require new captures', async (t) => {
  const config = await fixture(t);
  let calls = 0;
  const dependencies = { invoke: async () => { calls++; await writeFile(join(config.workspace, 'index.html'), '<h1>Page</h1>'); return { conversation: 'assets' }; }, verify: capture };
  let state = await runReviewLoop(config, dependencies);
  await writeFile(state.reviewPath, JSON.stringify(review(state)));
  state = await runReviewLoop(config, dependencies);
  assert.equal(state.phase, 'complete');
  const accepted = state.artifactDigest;
  await writeFile(join(config.workspace, 'style.css'), 'body { color: red; }');
  assert.notEqual(await artifactDigest(config.workspace, config.output), accepted);
  state = await runReviewLoop(config, dependencies);
  assert.equal(state.phase, 'needs-review');
  assert.equal(calls, 1);
  assert.notEqual(state.artifactDigest, accepted);
  assert.throws(() => validateReview({ ...review(state), artifactDigest: accepted }, state.artifactDigest), /different artifact/);
});

test('review needs observed evidence and findings for a failed judgment', () => {
  assert.throws(() => validateReview({ artifactDigest: 'x', checks: {}, findings: [] }, 'x'), /observed result/);
  const failed = review({ artifactDigest: 'x' }, ['Fix the hierarchy']);
  failed.findings = [];
  assert.throws(() => validateReview(failed, 'x'), /concrete finding/);
});

test('verifier failure releases its lock and resumes verification without regenerating', async (t) => {
  const config = await fixture(t);
  let calls = 0;
  const invoke = async () => { calls++; await writeFile(join(config.workspace, 'index.html'), '<h1>Page</h1>'); return { conversation: 'retry' }; };
  await assert.rejects(runReviewLoop(config, { invoke, verify: async () => { throw new Error('Chrome unavailable'); } }), /Chrome unavailable/);
  const state = await runReviewLoop(config, { invoke, verify: capture });
  assert.equal(state.phase, 'needs-review');
  assert.equal(calls, 1);
});

test('native invocation forwards a continuation ID and records a complete stream', async (t) => {
  const config = await fixture(t);
  await mkdir(config.output);
  const cli = join(config.workspace, 'fake-cli.mjs');
  await writeFile(cli, `import {writeFileSync} from 'node:fs';\nwriteFileSync('args.json',JSON.stringify(process.argv.slice(2)));\nprocess.stdout.write(JSON.stringify({event:'init',conversation_id:'preserved'})+'\\n');\n`);
  const result = await invokeNative({ ...config, cli: process.execPath, cliArgs: [cli] }, { prompt: 'repair', conversation: 'preserved', turn: 2, output: config.output });
  assert.equal(result.conversation, 'preserved');
  const args = JSON.parse(await readFile(join(config.workspace, 'args.json'), 'utf8'));
  assert.equal(args[args.indexOf('--conversation') + 1], 'preserved');
  assert.match(await readFile(join(config.output, 'turn-2.ndjson'), 'utf8'), /preserved/);
});

test('an interrupted host recovers an existing native write without generating again', async (t) => {
  const config = await fixture(t);
  let calls = 0;
  const invoke = async (_, call) => {
    calls++;
    await writeFile(join(config.workspace, 'index.html'), '<h1>Written before interruption</h1>');
    await writeFile(join(config.output, `turn-${call.turn}.ndjson`), JSON.stringify({ event: 'init', conversation_id: 'recovered' }) + '\n');
    throw new Error('Host interrupted');
  };
  await assert.rejects(runReviewLoop(config, { invoke, verify: capture }), /Host interrupted/);
  const state = await runReviewLoop(config, { invoke, verify: capture });
  assert.equal(state.phase, 'needs-review');
  assert.equal(state.conversation, 'recovered');
  assert.equal(calls, 1);
});

test('concurrent runners cannot mutate one review output', async (t) => {
  const config = await fixture(t);
  let unblock;
  let entered;
  const waiting = new Promise((resolve) => { unblock = resolve; });
  const ready = new Promise((resolve) => { entered = resolve; });
  const invoke = async () => { await writeFile(join(config.workspace, 'index.html'), '<h1>One runner</h1>'); return { conversation: 'locked' }; };
  const first = runReviewLoop(config, { invoke, verify: async (input) => { entered(); await waiting; return capture(input); } });
  await ready;
  await assert.rejects(runReviewLoop(config, { invoke, verify: capture }), /already active/);
  unblock();
  assert.equal((await first).phase, 'needs-review');
});

test('default host verification uses real existing renderer captures', {
  skip: !process.env.HALLMARK_PUPPETEER || !process.env.CHROME_PATH,
}, async (t) => {
  const config = await fixture(t);
  const invoke = async () => {
    await writeFile(join(config.workspace, 'index.html'), '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Local page</title><style>body{margin:24px;font:18px system-ui;color:#111;background:white}h1{font-size:36px}a:focus-visible{outline:3px solid #111;outline-offset:3px}</style><main><h1>Local page</h1><p>A concrete local page for renderer verification.</p><a href="#content">Read the details</a><section id="content"><h2>Details</h2><p>The host captures the existing page.</p></section></main></html>');
    return { conversation: 'render' };
  };
  const state = await runReviewLoop(config, { invoke });
  assert.equal(state.phase, 'needs-review', JSON.stringify(state.findings));
  assert.equal(state.reviewStatus.interactionVerification, 'no task checks configured');
  assert.equal(state.reviewStatus.visualInspection, 'pending');
  assert.ok(state.verification.screenshots.some((shot) => shot.view === 'desktop'));
  assert.ok(state.verification.screenshots.some((shot) => shot.view === 'mobile'));
});

test('a concurrent project edit cannot be accepted with older captures', async (t) => {
  const config = await fixture(t);
  let calls = 0;
  const invoke = async () => { calls++; await writeFile(join(config.workspace, 'index.html'), '<h1>Before</h1>'); return { conversation: 'stable' }; };
  await assert.rejects(runReviewLoop(config, { invoke, verify: async (input) => {
    const result = await capture(input);
    await writeFile(join(config.workspace, 'index.html'), '<h1>Changed during capture</h1>');
    return result;
  } }), /changed during host verification/);
  const state = await runReviewLoop(config, { invoke, verify: capture });
  assert.equal(state.phase, 'needs-review');
  assert.equal(calls, 1);
});

test('changed verifier code invalidates a previously accepted artifact', async (t) => {
  const config = await fixture(t);
  config.verifier = join(dirname(config.workspace), 'verifier.mjs');
  await writeFile(config.verifier, '// first verifier');
  let calls = 0;
  const dependencies = { invoke: async () => { calls++; await writeFile(join(config.workspace, 'index.html'), '<h1>Same page</h1>'); return { conversation: 'checks' }; }, verify: capture };
  let state = await runReviewLoop(config, dependencies);
  await writeFile(state.reviewPath, JSON.stringify(review(state)));
  state = await runReviewLoop(config, dependencies);
  assert.equal(state.phase, 'complete');
  const previousReview = state.reviewPath;
  await writeFile(config.verifier, '// revised verifier');
  state = await runReviewLoop(config, dependencies);
  assert.equal(state.phase, 'needs-review');
  assert.notEqual(state.reviewPath, previousReview);
  assert.equal(calls, 1);
});

test('an unchanged existing page cannot become a new accepted candidate', async (t) => {
  const config = { ...await fixture(t), maxRepairs: 0 };
  await writeFile(join(config.workspace, 'index.html'), '<h1>Original</h1>');
  const state = await runReviewLoop(config, {
    invoke: async () => ({ code: 0, conversation: 'unchanged' }),
    verify: capture,
  });
  assert.equal(state.phase, 'unresolved');
  assert.match(state.findings.join(' '), /unchanged|no artifact change/i);
});

test('a reviewer that edits the page cannot approve its own changed artifact', async (t) => {
  const config = await fixture(t);
  let calls = 0;
  const invoke = async () => { calls++; await writeFile(join(config.workspace, 'index.html'), '<h1>Draft</h1>'); return { code: 0, conversation: 'review' }; };
  const state = await runReviewLoop(config, { invoke, verify: capture, review: async ({ artifactDigest }) => {
    await writeFile(join(config.workspace, 'index.html'), '<h1>Uncaptured edit</h1>');
    return review({ artifactDigest });
  } });
  assert.equal(state.phase, 'unresolved');
  assert.match(state.reason, /Reviewer changed/);
  await runReviewLoop(config, { invoke, verify: capture });
  assert.equal(calls, 1);
});

test('changing only a handoff note cannot disguise an unchanged page', async (t) => {
  const config = { ...await fixture(t), maxRepairs: 0 };
  await writeFile(join(config.workspace, 'index.html'), '<h1>Original</h1>');
  const state = await runReviewLoop(config, { invoke: async () => {
    await writeFile(join(config.workspace, 'directions.md'), 'I improved the page.');
    return { code: 0, conversation: 'notes' };
  }, verify: capture });
  assert.equal(state.phase, 'unresolved');
  assert.match(state.findings.join(' '), /unchanged/);
});

test('a configured image-driven repair cannot skip opening its captures', async (t) => {
  const config = { ...await fixture(t), requireRepairImages: true, maxRepairs: 1 };
  let builds = 0;
  const state = await runReviewLoop(config, {
    invoke: async (_, call) => {
      builds++;
      if (builds > 1) assert.equal(call.requiredImages.length, 2);
      await writeFile(join(config.workspace, 'index.html'), `<h1>Build ${builds}</h1>`);
      return { code: 0, conversation: 'images' };
    },
    verify: async (input) => capture(input, [{ name: 'mobile overflow', pass: builds > 1, detail: 'The title extends beyond the phone viewport.' }]),
  });
  assert.equal(state.phase, 'unresolved');
  assert.match(state.findings.join(' '), /repair image inspection/);
});

test('an unvalidated review file left by interruption cannot skip the configured reviewer', async (t) => {
  const config = await fixture(t);
  const invoke = async () => { await writeFile(join(config.workspace, 'index.html'), '<h1>Page</h1>'); return { code: 0, conversation: 'receipt' }; };
  const first = await runReviewLoop(config, { invoke, verify: capture });
  await writeFile(first.reviewPath, JSON.stringify(review(first)));
  let inspections = 0;
  const state = await runReviewLoop(config, { invoke, verify: capture, review: async ({ artifactDigest }) => { inspections++; return review({ artifactDigest }); } });
  assert.equal(inspections, 1);
  assert.equal(state.phase, 'complete');
});

test('a corrected verifier can reassess a budget-exhausted candidate without another source repair', async (t) => {
  const config = { ...await fixture(t), maxRepairs: 0 };
  config.verifier = join(dirname(config.workspace), 'verifier.mjs');
  await writeFile(config.verifier, '// immediate transition scan');
  let calls = 0;
  const invoke = async () => { calls++; await writeFile(join(config.workspace, 'index.html'), '<h1>Unchanged site</h1>'); return { code: 0, conversation: 'stable' }; };
  const first = await runReviewLoop(config, { invoke, verify: async input => capture(input, [{ name: 'contrast', pass: false, detail: 'Transition frame sampled' }]) });
  assert.equal(first.phase, 'unresolved');
  await writeFile(config.verifier, '// settled transition scan');
  const next = await runReviewLoop(config, { invoke, verify: capture });
  assert.equal(next.phase, 'needs-review');
  assert.equal(calls, 1);
  assert.equal(next.repairs, 0);
});
