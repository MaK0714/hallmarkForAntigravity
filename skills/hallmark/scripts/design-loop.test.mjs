import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { prepareInputs, runDesignLoop } from './design-loop.mjs';

test('stages share one bounded repair budget and keep implementation behind visual acceptance', async (t) => {
  const workspace = await mkdtemp(join(tmpdir(), 'hallmark-design-'));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  await mkdir(join(workspace, 'assets'));
  await writeFile(join(workspace, 'assets', 'Font [opsz].ttf'), 'font bytes');
  const image = join(workspace, 'reference.png');
  await writeFile(image, 'reference bytes');
  const config = { workspace, prompt: 'Choose an essay', implementationPrompt: 'Open its reader', model: 'test', manualLayoutInstructions: 0, references: [{ url: 'https://example.com/', capturedAt: '2026-11-19', desktop: image, mobile: image }] };
  const inputs = await prepareInputs(config);
  assert.equal(inputs.assets[0].path, 'assets/Font [opsz].ttf');
  let builds = 0;
  let visual = 0;
  let finalChecks = 0;
  const screenshots = async ({ output }) => {
    const shots = [];
    for (const view of ['desktop', 'mobile']) { const path = join(output, view + '.png'); await writeFile(path, 'capture'); shots.push({ path, view }); }
    return { screenshots: shots, checks: [{ name: 'render', pass: true }] };
  };
  const state = await runDesignLoop(config, {
    invoke: async (_, call) => {
      builds++;
      if (call.output.endsWith('implementation')) { assert.ok(visual >= 2); assert.equal(call.conversation, 'retained'); }
      const extra = (call.requiredImages || []).map((path) => JSON.stringify({ step_update: { state: 'DONE', tool_info: { name: 'read_file', parameters: { Path: path } } } }));
      const events = inputs.references.flatMap((source) => source.images.map(({ path }) => JSON.stringify({ step_update: { state: 'DONE', tool_info: { name: 'read_file', parameters: { Path: path } } } })));
      await writeFile(join(call.output, `turn-${call.turn}.ndjson`), [...events, ...extra].join('\n'));
      await writeFile(join(workspace, 'index.html'), `<h1>Version ${builds}</h1>`);
      return { code: 0, conversation: 'retained' };
    },
    review: async ({ artifactDigest, verification }) => {
      assert.deepEqual(verification.mobileWidths, [320, 375, 390]);
      visual++;
      const pass = visual > 1;
      return { artifactDigest, checks: Object.fromEntries(['subject', 'hierarchy', 'mobilePath', 'facts'].map((key) => [key, { pass, evidence: 'Observed the current matching captures.' }])), findings: pass ? [] : ['The first mobile item is hidden behind the oversized introduction.'] };
    },
    captureMobile: async (args, config, result) => ({ ...result, mobileWidths: [320, 375, 390] }),
    captureMobile: async (args, config, result) => {
      assert.ok(args.output);
      assert.equal(config.workspace, workspace);
      return { ...result, mobileWidths: [320, 375, 390] };
    },
    compositionVerify: screenshots,
    implementationVerify: async (args) => ({ ...await screenshots(args), checks: [{ name: 'reader', pass: ++finalChecks > 1, detail: 'Close does not restore focus.' }], interactionVerification: finalChecks > 1 ? 'passed' : 'failed' }),
  });
  assert.equal(state.outcome, 'complete');
  assert.equal(state.metrics.repairs, 2);
  assert.equal(builds, 4);
  assert.equal(state.composition.repairs, 1);
  assert.equal(state.implementation.repairs, 1);
  assert.equal(state.metrics.hostLayoutInstructions, 0);
  const resumed = await runDesignLoop(config, { implementationVerify: screenshots });
  assert.equal(resumed.outcome, 'complete');
  assert.equal(builds, 4);
  await assert.rejects(runDesignLoop({ ...config, prompt: 'Different task' }, { implementationVerify: screenshots }), /inputs changed/);
});

test('a task verifier is required before any native generation', async () => {
  await assert.rejects(runDesignLoop({ workspace: tmpdir(), output: join(tmpdir(), 'hallmark-missing-task-verifier'), prompt: 'Build', implementationPrompt: 'Do', model: 'test' }), /task-specific implementation verifier/);
});

test('missing CLI is diagnosed by preflight before browser or generation work', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'hallmark-preflight-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const { preflight } = await import('./design-loop.mjs');
  await assert.rejects(preflight({ output: root, cli: join(root, 'missing-agy') }), /Set cli or HALLMARK_AGY/);
});
