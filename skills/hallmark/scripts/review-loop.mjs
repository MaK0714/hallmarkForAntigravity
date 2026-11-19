#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { execFile, spawn } from 'node:child_process';
import { copyFile, mkdir, open, readFile, readdir, rename, stat, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs, promisify } from 'node:util';

const skipped = new Set(['.git', '.agents', '.hallmark', 'node_modules']);
const json = async (path) => JSON.parse(await readFile(path, 'utf8'));
const save = async (path, value) => {
  const temporary = path + '.tmp';
  await writeFile(temporary, JSON.stringify(value, null, 2) + '\n');
  await rename(temporary, path);
};

export async function artifactDigest(workspace, output, snapshotDirectory, implementationOnly = false) {
  const files = [];
  async function walk(directory) {
    for (const item of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const path = join(directory, item.name);
      if (skipped.has(item.name) || path === output) continue;
      if (item.isDirectory()) await walk(path);
      else if (item.isFile() || item.isSymbolicLink() && (await stat(path)).isFile()) {
        const name = relative(workspace, path).split('\\').join('/');
        if (implementationOnly && !/\.(?:html?|css|m?js|json|svg|png|jpe?g|webp|avif|gif|woff2?|ttf|mp4|webm)$/i.test(name)) continue;
        const bytes = await readFile(path);
        files.push([name, createHash('sha256').update(bytes).digest('hex')]);
        if (snapshotDirectory) {
          const destination = join(snapshotDirectory, name);
          await mkdir(dirname(destination), { recursive: true });
          await writeFile(destination, bytes);
        }
      }
    }
  }
  await walk(workspace);
  return createHash('sha256').update(JSON.stringify(files)).digest('hex');
}

export function validateReview(review, digest) {
  if (review.artifactDigest !== digest) throw new Error('Visual review belongs to a different artifact. Inspect the current captures.');
  for (const key of new Set(['subject', 'hierarchy', 'mobilePath', 'facts', ...Object.keys(review.checks || {})])) {
    const check = review.checks?.[key];
    if (typeof check?.pass !== 'boolean' || !check.evidence?.trim()) throw new Error(`Visual review needs an observed result for ${key}`);
  }
  if (!Array.isArray(review.findings) || review.findings.some((finding) => typeof finding !== 'string' || !finding.trim())) {
    throw new Error('Visual findings must be an array of concrete repair instructions');
  }
  const passed = Object.values(review.checks).every((check) => check.pass === true) && review.findings.length === 0;
  if (!passed && review.findings.length === 0) throw new Error('A failed visual check needs a concrete finding');
  return passed;
}

export async function invokeNative(config, { prompt, conversation, turn, output }) {
  const args = [...(config.cliArgs || [])];
  if (conversation) args.push('--conversation', conversation);
  const settings = config.settings || { permissions: { allow: ['command(ls)', 'command(pwd)', 'command(cat)', 'command(rg)'] } };
  args.push('-p', prompt, '--model', config.model, '--mode', 'accept-edits', '--sandbox', '--settings', JSON.stringify(settings), '--print-timeout', `${config.timeoutSeconds || 180}s`, '--output-format', 'stream-json');
  const tracePath = join(output, `turn-${turn}.ndjson`);
  const stdout = await open(tracePath, 'w');
  const stderr = await open(join(output, `turn-${turn}.stderr`), 'w');
  let result;
  try {
    result = await new Promise((resolveRun, reject) => {
      const child = spawn(config.cli || process.env.HALLMARK_AGY || 'agy', args, { cwd: config.workspace, stdio: ['ignore', stdout.fd, stderr.fd] });
      let timedOut = false;
      let forceTimer;
      const timer = setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
        forceTimer = setTimeout(() => child.kill('SIGKILL'), 2000);
      }, ((config.timeoutSeconds || 180) + 15) * 1000);
      child.once('error', (error) => { clearTimeout(timer); clearTimeout(forceTimer); reject(error); });
      child.once('exit', (code, signal) => { clearTimeout(timer); clearTimeout(forceTimer); resolveRun({ code, signal, timedOut }); });
    });
  } finally {
    await stdout.close();
    await stderr.close();
  }
  let conversationId = conversation;
  for (const line of (await readFile(tracePath, 'utf8')).split('\n')) {
    try { const event = JSON.parse(line); if (event.event === 'init') conversationId = event.conversation_id; } catch {}
  }
  return { ...result, conversation: conversationId };
}

export async function defaultVerify({ workspace, output }) {
  const executable = join(dirname(fileURLToPath(import.meta.url)), 'sloplint.mjs');
  const result = await promisify(execFile)(process.execPath, [executable, 'index.html', '--advisory', '--require-render', '--json'], {
    cwd: workspace, encoding: 'utf8', timeout: 120000, maxBuffer: 20 * 1024 * 1024,
  }).catch((error) => {
    if (error.stdout?.trim()) return error;
    throw error;
  });
  const report = JSON.parse(result.stdout);
  const screenshots = [];
  for (const path of report.summary.screenshots || []) {
    const name = relative(dirname(path), path);
    const destination = join(output, name);
    await copyFile(path, destination);
    const view = /375/.test(name) ? 'mobile' : /1440x900/.test(name) ? 'desktop' : 'additional';
    screenshots.push({ view, path: destination });
  }
  return {
    checks: [
      { name: 'required render', pass: report.summary.render === 'ran' && !(report.summary.renderFailures || []).length, detail: JSON.stringify(report.summary.renderFailures || []) },
      ...report.findings.filter((finding) => finding.grade === 'FAIL').map((finding) => ({ name: `Rendered check ${finding.gate}`, pass: false, detail: `${finding.evidence}. ${finding.fix}` })),
    ],
    screenshots,
    advisory: report.findings.filter((finding) => finding.grade !== 'FAIL'),
    interactionVerification: 'no task checks configured',
    coverage: 'Default checks cover the standalone initial route. Supply a project verifier for task interactions and revealed states.',
  };
}

function repairPrompt(findings, screenshots = []) {
  return `Host review found defects in the current candidate. Before editing, use the native image reader to VIEW these actual current captures: ${screenshots.map((shot) => shot.path).join(', ')}. Do not use shell image-type probes or claim inspection without opening them. Repair them with native file tools in this same workspace. Preserve the supplied facts, working interactions, assets and visual system outside these findings.\n\n${findings.slice(0, 8).map((finding, index) => `${index + 1}. ${finding.slice(0, 650)}`).join('\n')}\n\nStop after the scoped edits. Host capture, interaction checks and screenshot review will run again.`;
}

export async function runReviewLoop(input, dependencies = {}) {
  const config = { maxRepairs: 2, ...input };
  config.workspace = resolve(config.workspace);
  config.output = resolve(config.output || join(config.workspace, '.hallmark', 'review'));
  if (!config.prompt?.trim() || !config.model) throw new Error('A prompt and pinned model are required');
  if (!Number.isInteger(config.maxRepairs) || config.maxRepairs < 0) throw new Error('maxRepairs must be a nonnegative integer');
  await mkdir(config.output, { recursive: true });
  const lockPath = join(config.output, 'lock');
  let lock;
  for (let attempt = 0; attempt < 2 && !lock; attempt++) {
    try { lock = await open(lockPath, 'wx'); }
    catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const owner = Number(await readFile(lockPath, 'utf8'));
      if (!Number.isInteger(owner) || owner < 1) throw new Error('Review output has an incomplete lock file');
      try { process.kill(owner, 0); throw new Error('A review runner is already active for this output'); }
      catch (probe) { if (probe.code !== 'ESRCH') throw probe; }
      await unlink(lockPath).catch((error) => { if (error.code !== 'ENOENT') throw error; });
    }
  }
  if (!lock) throw new Error('Review output is locked by another runner');
  await lock.writeFile(String(process.pid));
  const statePath = join(config.output, 'run.json');
  const invoke = dependencies.invoke || invokeNative;
  let state;
  try {
    let reviewer = dependencies.review;
    if (!reviewer && config.reviewer) reviewer = (await import(pathToFileURL(resolve(config.reviewer)).href)).review;
    const reviewerDigest = config.reviewer ? createHash('sha256').update(await readFile(resolve(config.reviewer))).digest('hex') : null;
    let verify = dependencies.verify;
    if (!verify) {
      verify = config.verifier ? (await import(pathToFileURL(resolve(config.verifier)).href)).verify : defaultVerify;
    }
    const verifierFile = config.verifier ? resolve(config.verifier) : fileURLToPath(import.meta.url);
    const verifierDigest = createHash('sha256').update(await readFile(verifierFile)).digest('hex');
    try { state = await json(statePath); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    const identity = createHash('sha256').update(JSON.stringify({ workspace: config.workspace, prompt: config.prompt, model: config.model, verifier: config.verifier, reviewer: config.reviewer })).digest('hex');
    if (state && state.identity !== identity) throw new Error('This output belongs to different build inputs. Choose a fresh output directory.');
    state ||= { identity, phase: 'generate', repairs: 0, turn: 0, history: [], conversation: config.conversation };
    if (['complete', 'needs-review', 'unresolved'].includes(state.phase) && (state.verifierDigest !== verifierDigest || state.reviewerDigest !== reviewerDigest)) state.phase = 'verify';
    if (state.phase === 'complete') {
      if (await artifactDigest(config.workspace, config.output) === state.artifactDigest) return state;
      state.phase = 'verify';
    }
    if (state.phase === 'unresolved') {
      if (state.reason?.startsWith('Visual reviewer incomplete')) {
        if (!config.resumeReview) return state;
        state.phase = 'verify';
      }
      else if (state.reason?.startsWith('Host capture incomplete')) state.phase = 'verify';
      else if (state.conversation && state.repairs < config.maxRepairs) state.phase = 'feedback';
      else return state;
    }
    while (true) {
      if (state.phase === 'native-pending') {
        // Recover a finished write after an interrupted host process without regenerating it.
        const trace = await readFile(join(config.output, `turn-${state.turn}.ndjson`), 'utf8').catch(() => '');
        for (const line of trace.split('\n')) {
          try { const event = JSON.parse(line); if (event.event === 'init') state.conversation = event.conversation_id; } catch {}
        }
        const digest = await artifactDigest(config.workspace, config.output);
        if (await artifactDigest(config.workspace, config.output, undefined, true) === (state.beforeImplementationDigest || state.beforeDigest)) {
          state.phase = 'unresolved';
          state.reason = 'Interrupted native turn has no verified artifact change';
          await save(statePath, state);
          return state;
        }
        state.nativeChanged = true;
        state.phase = 'verify';
      }
      if (state.phase === 'generate' || state.phase === 'repair') {
        const requiredImages = state.phase === 'repair' && config.requireRepairImages ? (state.verification?.screenshots || []).map((shot) => resolve(shot.path)) : [];
        const prompt = state.phase === 'generate' ? config.prompt : repairPrompt(state.findings, state.verification?.screenshots);
        state.turn++;
        state.beforeDigest = await artifactDigest(config.workspace, config.output);
        state.beforeImplementationDigest = await artifactDigest(config.workspace, config.output, undefined, true);
        state.phase = 'native-pending';
        await save(statePath, state);
        const native = await invoke(config, { prompt, conversation: state.conversation, turn: state.turn, output: config.output, requiredImages });
        state.nativeChanged = await artifactDigest(config.workspace, config.output, undefined, true) !== state.beforeImplementationDigest;
        state.repairImageRead = null;
        if (requiredImages.length) {
          const trace = await readFile(join(config.output, `turn-${state.turn}.ndjson`), 'utf8').catch(() => '');
          const { imageReads } = await import('./native-review.mjs');
          const seen = imageReads(trace, config.workspace, true);
          state.repairImageRead = requiredImages.every((path) => seen.has(path));
        }
        state.conversation = native.conversation;
        state.history.push({ turn: state.turn, native });
        state.phase = 'verify';
        await save(statePath, state);
      }
      if (state.phase === 'verify') {
        state.captureRound = (state.captureRound || 0) + 1;
        const folder = join(config.output, `review-${state.turn}-${state.captureRound}`);
        await mkdir(folder, { recursive: true });
        const entry = await readFile(join(config.workspace, 'index.html'), 'utf8').catch(() => '');
        const issue = !entry.trim() ? 'Missing or empty index.html' : state.nativeChanged === false ? 'Native turn made no artifact change; existing implementation is unchanged' : null;
        const captureDigest = await artifactDigest(config.workspace, config.output);
        const result = issue ? { checks: [{ name: 'artifact', pass: false, detail: issue }], screenshots: [] }
          : await verify({ workspace: config.workspace, output: folder });
        if (!Array.isArray(result.checks) || !result.checks.length || result.checks.some((check) => typeof check.pass !== 'boolean')) throw new Error('Verifier must return nonempty boolean checks');
        if (state.repairImageRead === false) result.checks.push({ name: 'repair image inspection', pass: false, detail: 'Open every supplied current capture with the native image reader before editing.' });
        state.artifactDigest = await artifactDigest(config.workspace, config.output, join(folder, 'source'));
        if (state.artifactDigest !== captureDigest) {
          await save(statePath, state);
          throw new Error('Project files changed during host verification. Rerun when edits have settled.');
        }
        state.verification = result;
        state.verifierDigest = verifierDigest;
        state.reviewerDigest = reviewerDigest;
        state.reviewStatus = { capture: 'pending', visualInspection: 'pending', interactionVerification: result.interactionVerification || 'not reported' };
        const captureIssues = [];
        for (const view of ['desktop', 'mobile']) {
          const shot = result.screenshots?.find((screenshot) => screenshot.view === view);
          if (!shot || !(await stat(shot.path).catch(() => null))?.size) captureIssues.push(`Missing ${view} capture`);
        }
        state.reviewStatus.capture = captureIssues.length ? 'incomplete' : 'complete';
        state.findings = [...result.checks.filter((check) => !check.pass).map((check) => `${check.name}: ${check.detail || 'failed'}`), ...(issue ? [] : captureIssues)];
        await save(join(folder, 'verification.json'), { artifactDigest: state.artifactDigest, ...result });
        if (!issue && captureIssues.length) {
          state.phase = 'unresolved';
          state.reason = 'Host capture incomplete. Restore the verifier before resuming.';
          await save(statePath, state);
          return state;
        }
        if (state.findings.length) state.phase = 'feedback';
        else {
          state.phase = 'needs-review';
          state.reviewPath = join(folder, 'visual-review.json');
          await save(join(folder, 'visual-review-template.json'), { artifactDigest: state.artifactDigest, screenshots: result.screenshots, checks: Object.fromEntries(['subject', 'hierarchy', 'mobilePath', 'facts', ...(result.referenceDecision ? ['reference'] : [])].map((key) => [key, { pass: null, evidence: '' }])), findings: [] });
        }
        await save(statePath, state);
      }
      if (state.phase === 'needs-review') {
        const digest = await artifactDigest(config.workspace, config.output);
        if (digest !== state.artifactDigest) {
          state.phase = 'verify';
          continue;
        }
        let review;
        try {
          review = await json(state.reviewPath);
          const receiptHash = createHash('sha256').update(JSON.stringify(review)).digest('hex');
          if (reviewer && (state.validatedReviewPath !== state.reviewPath || state.validatedReviewHash !== receiptHash)) {
            await copyFile(state.reviewPath, `${state.reviewPath}.unvalidated-${state.reviewTurns || 0}.json`);
            review = undefined;
          }
        } catch (error) { if (error.code !== 'ENOENT') throw error; }
        if (!review) {
          if (!reviewer) return state;
          try {
            state.reviewTurns = (state.reviewTurns || 0) + 1;
            await save(statePath, state);
            review = await reviewer({ config, workspace: config.workspace, output: config.output, reviewPath: state.reviewPath, conversation: state.conversation, artifactDigest: digest, verification: state.verification, reviewNumber: state.reviewTurns });
            if (await artifactDigest(config.workspace, config.output) !== digest) throw new Error('Reviewer changed project files');
            validateReview(review, digest);
            await save(state.reviewPath, review);
            state.validatedReviewPath = state.reviewPath;
            state.validatedReviewHash = createHash('sha256').update(JSON.stringify(review)).digest('hex');
            await save(statePath, state);
          } catch (reviewError) {
            state.phase = 'unresolved';
            state.reason = `Visual reviewer incomplete: ${reviewError.message}`;
            await save(statePath, state);
            return state;
          }
        }
        const passed = validateReview(review, digest);
        state.reviewStatus ||= { capture: 'complete', interactionVerification: state.verification.interactionVerification || 'not reported' };
        state.reviewStatus.visualInspection = passed ? 'passed' : 'failed';
        state.history.push({ turn: state.turn, review });
        if (passed) { delete state.reason; state.phase = 'complete'; await save(statePath, state); return state; }
        state.findings = review.findings;
        state.phase = 'feedback';
      }
      if (state.phase === 'feedback') {
        if (!state.conversation || state.repairs >= config.maxRepairs) {
          state.phase = 'unresolved';
          state.reason = !state.conversation ? 'Native conversation ID unavailable' : 'Configured repair budget exhausted';
          await save(statePath, state);
          return state;
        }
        state.repairs++;
        state.phase = 'repair';
        await save(statePath, state);
      }
    }
  } finally {
    await lock.close();
    await unlink(lockPath);
  }
}

async function main() {
  const { values } = parseArgs({ options: { config: { type: 'string' }, help: { type: 'boolean' } } });
  if (values.help || !values.config) {
    console.log('node review-loop.mjs --config <json>\nRuns native draft, host verification and scoped repair. Resume with the same command after writing the requested visual-review.json. See references/host-review.md.');
    return;
  }
  const path = resolve(values.config);
  const config = await json(path);
  for (const key of ['workspace', 'output', 'verifier', 'reviewer']) if (config[key]) config[key] = resolve(dirname(path), config[key]);
  const state = await runReviewLoop(config);
  console.log(JSON.stringify({ phase: state.phase, repairs: state.repairs, reviewPath: state.reviewPath, findings: state.findings, reason: state.reason, reviewStatus: state.reviewStatus, coverage: state.verification?.coverage }, null, 2));
  if (state.phase === 'unresolved') process.exitCode = 1;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
