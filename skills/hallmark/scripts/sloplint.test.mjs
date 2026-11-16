import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const lint = fileURLToPath(new URL('./sloplint.mjs', import.meta.url));
const run = (cwd, ...args) => spawnSync(process.execPath, [lint, ...args], { cwd, encoding: 'utf8' });

test('advisory mode keeps factual defects and treats house style as notes', (t) => {
  const cwd = mkdtempSync(join(tmpdir(), 'hallmark-advisory-'));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  cpSync(new URL('./fixtures/eyebrow-fail/index.html', import.meta.url), join(cwd, 'editorial.html'));
  writeFileSync(join(cwd, 'broken.html'), '<img alt="Diagram">');
  const result = run(cwd, 'editorial.html', 'broken.html', '--advisory', '--json');
  assert.equal(result.status, 1, result.stderr);
  const { findings } = JSON.parse(result.stdout);
  assert.ok(findings.some((entry) => entry.gate === '54' && entry.grade === 'NOTE'));
  assert.ok(findings.some((entry) => entry.gate === '76' && entry.grade === 'FAIL'));
});

test('strict render fails when no browser target can be captured', (t) => {
  const cwd = mkdtempSync(join(tmpdir(), 'hallmark-required-render-'));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  writeFileSync(join(cwd, 'style.css'), 'html,body { overflow-x: clip; }');
  const result = run(cwd, 'style.css', '--advisory', '--require-render', '--json');
  assert.equal(result.status, 2, result.stderr);
  const { summary } = JSON.parse(result.stdout);
  assert.match(summary.render, /^not run:/);
  assert.deepEqual(summary.screenshots, []);
  assert.equal(run(cwd, 'style.css', '--advisory', '--render').status, 0);
  assert.equal(run(cwd, 'style.css', '--advisory', '--require-render', '--before').status, 2);
  assert.equal(existsSync(join(cwd, '.hallmark', 'before.json')), false);
});

test('required render names fresh screenshots and reports a failed route', {
  skip: !(process.env.HALLMARK_TEST_PUPPETEER && process.env.HALLMARK_TEST_CHROME),
}, (t) => {
  const cwd = mkdtempSync(join(tmpdir(), 'hallmark-render-evidence-'));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  writeFileSync(join(cwd, 'page.html'), '<!doctype html><html lang="en"><title>Test</title><h1>Test</h1>');
  const good = run(cwd, 'page.html', '--advisory', '--require-render', '--json');
  assert.equal(good.status, 0, good.stderr);
  const { summary } = JSON.parse(good.stdout);
  assert.equal(summary.render, 'ran');
  assert.equal(summary.screenshots.length, 5);
  assert.ok(summary.screenshots.every(existsSync));
  const bad = run(cwd, 'page.html', '--url', 'http://127.0.0.1:1/', '--advisory', '--require-render', '--json');
  assert.equal(bad.status, 2, bad.stderr);
  const report = JSON.parse(bad.stdout);
  assert.equal(report.summary.render, 'incomplete');
  assert.equal(report.summary.renderFailures.length, 1);
});
