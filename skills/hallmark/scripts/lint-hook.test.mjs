import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { editToolMatcher } from './hook-config.mjs';

test('Antigravity edits get advisory diagnostics only on stamped files', (t) => {
  const cwd = mkdtempSync(join(tmpdir(), 'hallmark-hook-'));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  mkdirSync(join(cwd, '.hallmark'));
  const file = join(cwd, 'index.html');
  const hook = fileURLToPath(new URL('./lint-hook.mjs', import.meta.url));
  const run = (name, error, field = 'TargetFile') => spawnSync(process.execPath, [hook], {
    cwd, input: JSON.stringify({ toolCall: { name, args: { [field]: file } }, error }), encoding: 'utf8',
  });
  const installer = fileURLToPath(new URL('./install-hook.mjs', import.meta.url));
  const install = spawnSync(process.execPath, [installer], { cwd, encoding: 'utf8' });
  assert.equal(install.status, 0, install.stderr);
  const config = JSON.parse(readFileSync(join(cwd, '.agents', 'hooks.json')));
  assert.equal(config['hallmark-linter'].PostToolUse[0].matcher, editToolMatcher);

  const html = '<h1><em>Quiet</em> Type</h1><img alt="Diagram">';
  writeFileSync(file, html);
  assert.equal(run('write_to_file').stderr, '');
  writeFileSync(file, `<style>/* Hallmark */</style>${html}`);
  for (const name of ['write_to_file', 'replace_file_content', 'multi_replace_file_content', 'write_file', 'edit_file']) {
    assert.ok(new RegExp(`^(?:${editToolMatcher})$`).test(name));
    const result = run(name, undefined, ['write_file', 'edit_file'].includes(name) ? 'Path' : 'TargetFile');
    assert.equal(result.status, 0);
    assert.deepEqual(JSON.parse(result.stdout), {});
    assert.match(result.stderr, /gate 76/);
    assert.doesNotMatch(result.stderr, /gate 38i/);
  }
  assert.equal(run('replace_file_content', 'write failed').stderr, '');
});
