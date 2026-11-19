#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { cp, copyFile, mkdir, open, readFile, readdir, rename, stat, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs, promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { defaultVerify, runReviewLoop } from './review-loop.mjs';
import { imageReads } from './native-review.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const save = async (path, value) => {
  const temporary = path + '.tmp';
  await writeFile(temporary, JSON.stringify(value, null, 2) + '\n');
  await rename(temporary, path);
};

export async function preflight(config) {
  const cli = config.cli || process.env.HALLMARK_AGY || 'agy';
  let version;
  try { version = (await promisify(execFile)(cli, ['--version'], { timeout: 15000, encoding: 'utf8' })).stdout.trim(); }
  catch (error) { throw new Error(`Antigravity CLI unavailable (${cli}). Set cli or HALLMARK_AGY to the installed executable. ${error.code || error.message}`); }
  const folder = join(config.output, 'preflight');
  await mkdir(folder, { recursive: true });
  const page = join(folder, 'capture-probe.html');
  await writeFile(page, '<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Capture probe</title><main><h1>Hallmark capture probe</h1><p>Host rendering is available.</p></main></html>');
  const env = { ...process.env };
  if (config.chromePath) env.CHROME_PATH = config.chromePath;
  if (config.puppeteerRoot) env.HALLMARK_PUPPETEER = config.puppeteerRoot;
  await promisify(execFile)(process.execPath, [join(here, 'capture.mjs'), page, '--out', folder, '--sizes', 'desktop,phone', '--scale', '1'], { env, timeout: 45000 });
  for (const name of ['screen-home-desktop.png', 'screen-home-phone.png']) {
    const bytes = await readFile(join(folder, name));
    if (bytes.length < 100 || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error('Capture preflight did not produce real PNG files');
  }
  const result = { cli, version, browserPath: 'host capture verified', folder };
  await save(join(folder, 'result.json'), result);
  return result;
}

export async function prepareInputs(config) {
  const folder = join(config.workspace, '.hallmark', 'input');
  await mkdir(folder, { recursive: true });
  const assets = [];
  async function walk(directory) {
    for (const item of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const path = join(directory, item.name);
      if (item.isDirectory()) await walk(path);
      else if (item.isFile()) assets.push({ path: relative(config.workspace, path).split('\\').join('/'), bytes: (await stat(path)).size, sha256: hash(await readFile(path)) });
    }
  }
  if ((await stat(join(config.workspace, 'assets')).catch(() => null))?.isDirectory()) await walk(join(config.workspace, 'assets'));
  const references = [];
  if (!Array.isArray(config.references) || config.references.length < 1 || config.references.length > 2) throw new Error('Supply one or two references with source URLs, capture dates, desktop and mobile images');
  for (const [index, source] of config.references.entries()) {
    if (!/^https?:\/\//.test(source.url || '') || !source.capturedAt || !source.desktop || !source.mobile) throw new Error('Reference provenance and both views are required');
    const images = [];
    for (const view of ['desktop', 'mobile']) {
      const destination = join(folder, `reference-${index + 1}-${view}.png`);
      await copyFile(resolve(source[view]), destination);
      images.push({ view, path: destination, sha256: hash(await readFile(destination)) });
    }
    references.push({ url: source.url, capturedAt: source.capturedAt, images });
  }
  await save(join(folder, 'manifest.json'), { assets, references });
  const skill = join(config.workspace, '.agents', 'skills', 'hallmarkForAntigravity');
  if (!(await stat(join(skill, 'SKILL.md')).catch(() => null))) {
    await mkdir(dirname(skill), { recursive: true });
    await cp(dirname(here), skill, { recursive: true, errorOnExist: true, force: false });
  }
  const entry = join(config.workspace, 'index.html');
  if ((await stat(entry).catch(() => null))?.isFile() && !(await stat(join(folder, 'original.html')).catch(() => null))) await copyFile(entry, join(folder, 'original.html'));
  return { folder, assets, references };
}

export async function hasReferenceStudy(output, references, workspace) {
  const required = references.flatMap((source) => source.images.map((image) => resolve(image.path)));
  for (const name of await readdir(output)) {
    if (!/^turn-\d+\.ndjson$/.test(name)) continue;
    const lines = (await readFile(join(output, name), 'utf8')).split('\n');
    const beforeWrite = [];
    for (const line of lines) {
      let event;
      try { event = JSON.parse(line); } catch { continue; }
      const step = event.step_update;
      const tool = step?.tool_info;
      if (step?.state === 'ACTIVE' && ['write_file', 'edit_file'].includes(tool?.name) && /(?:^|[/\\])index\.html$/.test(tool.parameters?.Path || '')) break;
      beforeWrite.push(line);
    }
    const seen = imageReads(beforeWrite.join('\n'), workspace);
    if (required.every((path) => seen.has(path))) return true;
  }
  return false;
}

async function runUnlocked(input, dependencies = {}) {
  const config = { maxRepairs: 2, timeoutSeconds: 210, ...input };
  config.workspace = resolve(config.workspace);
  config.output = resolve(config.output || join(config.workspace, '.hallmark', 'design'));
  if (!config.prompt?.trim() || !config.implementationPrompt?.trim() || !config.model) throw new Error('Task prompt, interaction requirements and pinned model are required');
  if (!Number.isInteger(config.maxRepairs) || config.maxRepairs < 0 || config.maxRepairs > 2) throw new Error('Use a total repair budget from zero to two');
  if (!config.implementationVerifier && !dependencies.implementationVerify) throw new Error('A task-specific implementation verifier is required');
  const inputs = await prepareInputs(config);
  await mkdir(config.output, { recursive: true });
  const statePath = join(config.output, 'progress.json');
  const identity = hash(JSON.stringify({ prompt: config.prompt, implementationPrompt: config.implementationPrompt, model: config.model, references: inputs.references, assets: inputs.assets, maxRepairs: config.maxRepairs }));
  let progress;
  try { progress = JSON.parse(await readFile(statePath, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (progress && progress.identity !== identity) throw new Error('Design inputs changed. Use a fresh output directory.');
  progress ||= { identity, phase: 'composition', startedAt: new Date().toISOString() };
  if (progress.phase !== 'complete' && !progress.preflight && !dependencies.invoke && !dependencies.runLoop) progress.preflight = await (dependencies.preflight || preflight)(config);
  const common = { ...config, requireRepairImages: true, reviewer: join(here, 'native-review.mjs') };
  const referencePaths = inputs.references.flatMap((source) => source.images.map((image) => image.path));
  const handoff = `Read .agents/skills/hallmarkForAntigravity/SKILL.md and ${join(inputs.folder, 'manifest.json')}. All resource filenames are exact; do not guess font names, inspect font binaries or discover browsers. Host capture and task tests are provided. Use native file tools. Existing index.html has a host backup; use edit_file or the documented overwrite option when replacing it. Keep review receipts outside product UI. Do not claim host testing yourself.`;
  const loop = dependencies.runLoop || runReviewLoop;
  if (progress.phase === 'composition') {
    const stageOutput = join(config.output, 'composition');
    const verify = dependencies.compositionVerify || (config.compositionVerifier ? (await import(pathToFileURL(resolve(config.compositionVerifier)).href)).verify : defaultVerify);
    const composition = await loop({ ...common, output: stageOutput, verifier: config.compositionVerifier, prompt: `${config.prompt}\n\n${handoff}\n\nFirst create a visual composition, not the fully wired application. Before editing, use the image reader to view these actual reference captures: ${referencePaths.join(', ')}. Select one useful transfer and state its visible effect in ${join(inputs.folder, 'design-note.md')} under 250 words. Choose the composition yourself from the task and real material. Group content with type, spacing, alignment, imagery, rules or containers according to purpose. Include real content below the fold and leave interaction wiring pending the visual review. Stop when the composition exists.` }, {
      ...dependencies,
      verify: async (args) => {
        const result = await verify(args);
        const studied = await hasReferenceStudy(stageOutput, inputs.references, config.workspace);
        return { ...result, checks: [...result.checks, { name: 'reference image study before implementation', pass: studied, detail: studied ? 'Successful image reads precede the first page write in the native trace.' : `Use the image reader on these actual captures before editing: ${referencePaths.join(', ')}` }], interactionVerification: 'pending until composition acceptance' };
      },
    });
    progress.composition = composition;
    if (composition.phase !== 'complete') {
      progress.metrics = { repairs: composition.repairs, nativeBuildTurns: composition.turn, nativeReviewTurns: composition.reviewTurns || 0, hostLayoutInstructions: config.manualLayoutInstructions ?? null };
      progress.elapsedSeconds = Math.round((Date.now() - Date.parse(progress.startedAt)) / 1000);
      await save(statePath, progress); return { ...progress, outcome: composition.phase };
    }
    progress.phase = 'implementation';
    await save(statePath, progress);
  }
  const remaining = config.maxRepairs - progress.composition.repairs;
  const verify = dependencies.implementationVerify || (await import(pathToFileURL(resolve(config.implementationVerifier)).href)).verify;
  const implementation = await loop({ ...common, conversation: progress.composition.conversation, output: join(config.output, 'implementation'), verifier: config.implementationVerifier, maxRepairs: remaining, prompt: `${config.prompt}\n\n${handoff}\n\nThe composition has passed the screenshot-based visual review. Preserve its accepted visual structure while implementing these task requirements:\n${config.implementationPrompt}\n\nDo not restart the design. Stop after implementation for fresh host captures, task tests and native image review.` }, {
    ...dependencies,
    verify: async (args) => {
      const result = await verify(args);
      return { ...result, checks: [...result.checks, { name: 'task interactions actually verified', pass: result.interactionVerification === 'passed', detail: 'A task verifier must exercise real interactions and report passed, not just capture the page.' }] };
    },
  });
  progress.implementation = implementation;
  progress.phase = implementation.phase === 'complete' ? 'complete' : 'implementation';
  progress.elapsedSeconds = Math.round((Date.now() - Date.parse(progress.startedAt)) / 1000);
  progress.metrics = { repairs: progress.composition.repairs + implementation.repairs, nativeBuildTurns: progress.composition.turn + implementation.turn, nativeReviewTurns: (progress.composition.reviewTurns || 0) + (implementation.reviewTurns || 0), hostLayoutInstructions: config.manualLayoutInstructions ?? null };
  await save(statePath, progress);
  return { ...progress, outcome: implementation.phase };
}

export async function runDesignLoop(input, dependencies = {}) {
  const output = resolve(input.output || join(resolve(input.workspace), '.hallmark', 'design'));
  await mkdir(output, { recursive: true });
  const path = join(output, 'design.lock');
  let lock;
  try { lock = await open(path, 'wx'); }
  catch (error) {
    if (error.code !== 'EEXIST') throw error;
    const owner = Number(await readFile(path, 'utf8'));
    if (!Number.isInteger(owner) || owner < 1) throw new Error('Incomplete design lock');
    try { process.kill(owner, 0); throw new Error('A design runner is already active for this output'); }
    catch (probe) { if (probe.code !== 'ESRCH') throw probe; }
    await unlink(path);
    lock = await open(path, 'wx');
  }
  await lock.writeFile(String(process.pid));
  try { return await runUnlocked(input, dependencies); }
  finally { await lock.close(); await unlink(path); }
}

async function main() {
  const { values } = parseArgs({ options: { config: { type: 'string' } } });
  if (!values.config) throw new Error('Usage: node design-loop.mjs --config <json>');
  const path = resolve(values.config);
  const config = JSON.parse(await readFile(path, 'utf8'));
  for (const key of ['workspace', 'output', 'compositionVerifier', 'implementationVerifier']) if (config[key]) config[key] = resolve(dirname(path), config[key]);
  for (const source of config.references || []) for (const view of ['desktop', 'mobile']) if (source[view]) source[view] = resolve(dirname(path), source[view]);
  const result = await runDesignLoop(config);
  console.log(JSON.stringify({ outcome: result.outcome, phase: result.phase, metrics: result.metrics, reason: result.implementation?.reason || result.composition?.reason }, null, 2));
  if (result.outcome !== 'complete') process.exitCode = 1;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error.stack); process.exitCode = 1; });
