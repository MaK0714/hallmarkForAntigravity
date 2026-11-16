#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, mkdtempSync, lstatSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { assessArtifact, assessBrowser } from './antigravity-outcome.mjs';

const evalDir = dirname(fileURLToPath(import.meta.url));
const repo = dirname(evalDir);
const skill = join(repo, 'skills', 'hallmark');
const cli = process.env.HALLMARK_AGY || 'agy';
const { values } = parseArgs({ options: {
  model: { type: 'string' }, brief: { type: 'string' }, repeats: { type: 'string', default: '3' },
  current: { type: 'string', default: 'd02777a948a1d256fc136f33b6eb208aefb41457' },
  output: { type: 'string' }, score: { type: 'string' }, 'dry-run': { type: 'boolean' },
  timeout: { type: 'string', default: '180' }, help: { type: 'boolean' },
} });

const json = (path) => JSON.parse(readFileSync(path, 'utf8'));
const writeJson = (path, value) => writeFileSync(path, JSON.stringify(value, null, 2) + '\n');
const escape = (text) => String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const arms = ['off', 'current', 'revised'];
const settings = JSON.stringify({ permissions: { allow: [
  'command(pwd)', 'command(ls)', 'command(cat)', 'command(rg)', 'command(head)', 'command(tail)',
  'command(which)', 'command(grep)', 'command(regex:^git (?:status|diff|log)(?: [^;&|]*)?$)',
  'command(regex:^find [a-zA-Z0-9_./-]+(?: -maxdepth [0-9]+)?$)',
  'command(regex:^node (?:[^ ;|&]+/)?[.]agents/skills/hallmarkForAntigravity/scripts/(?:sloplint|theme)[.]mjs(?: [^;&|]*)?$)',
] } });
const fail = (message) => { throw new Error(message); };
const revision = (ref) => command('git', ['rev-parse', '--verify', '--end-of-options', `${ref}^{commit}`], repo).stdout.trim();

function command(executable, args, cwd, options = {}) {
  const res = spawnSync(executable, args, { cwd, encoding: 'utf8', timeout: 120000, maxBuffer: 24 * 1024 * 1024, ...options });
  if (res.error) fail(`${executable}: ${res.error.message}`);
  if (res.status !== 0) fail(`${executable} exited ${res.status}: ${String(res.stderr).trim()}`);
  return res;
}

function checkIsolation() {
  const plugins = JSON.parse(command(cli, ['plugin', 'list', '--json'], tmpdir()).stdout);
  const extra = plugins.filter((plugin) => plugin.enabled && /hallmark|modern-web-guidance/i.test([plugin.name, ...(plugin.skills || [])].join(' ')));
  if (extra.length) fail(`Disable competing design plugins for the benchmark or use a dedicated CLI profile: ${extra.map((p) => p.name).join(', ')}`);
  for (const dir of ['.gemini/config/skills', '.gemini/antigravity-cli/skills', '.gemini/skills']) {
    const path = join(homedir(), dir);
    if (existsSync(path) && readdirSync(path).some((name) => /hallmark/i.test(name))) fail(`Remove Hallmark from the benchmark profile's global skill discovery at ${path}`);
  }
}

function snapshot(dir, parent = '') {
  const files = {};
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const key = parent ? `${parent}/${entry.name}` : entry.name;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) Object.assign(files, snapshot(path, key));
    else if (entry.isFile()) files[key] = createHash('sha256').update(readFileSync(path)).digest('hex');
    else files[key] = entry.isSymbolicLink() ? '<symbolic link>' : '<special file>';
  }
  return files;
}

function changes(before, after) {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])].filter((name) => before[name] !== after[name]).sort();
}

async function inspect(browser, workspace, images, { checks = [], focus } = {}) {
  const page = await browser.newPage();
  const result = { screenshots: [], interactions: [], pageErrors: [] };
  try {
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    page.on('pageerror', (error) => result.pageErrors.push(error.message));
    const url = pathToFileURL(join(workspace, 'index.html')).href;
    for (const [name, width, height] of [['desktop', 1440, 900], ['mobile', 375, 812]]) {
      await page.setViewport({ width, height });
      await page.goto(url, { waitUntil: 'load', timeout: 20000 });
      await page.evaluate(() => document.fonts.ready.then(() => {}));
      if (focus) {
        await page.keyboard.press('Tab');
        await page.focus(focus);
        if (!await page.$eval(focus, (el) => el.matches(':focus-visible'))) fail(`Could not capture keyboard focus on ${focus}`);
      }
      const path = join(images, `${name}.png`);
      await page.screenshot({ path, fullPage: true });
      result.screenshots.push(name);
      for (const check of checks) {
        try {
          const before = await page.$eval(check.selector, (el) => el.textContent.trim());
          if (check.click) await page.click(check.click);
          if (check.key) await page.keyboard.press(check.key);
          if (check.select) await page.select(check.select.selector, check.select.value);
          const passed = await page.$eval(check.selector, (el, expected, prior) => {
            if (expected.textChanges) return el.textContent.trim() !== prior;
            if ('checked' in expected) return el.checked === expected.checked;
            if (expected.hash) return window.location.hash === expected.hash && el.getBoundingClientRect().height > 0;
            if (expected.visible === false) return !el.getClientRects().length || getComputedStyle(el).visibility === 'hidden';
            return el.getBoundingClientRect().height > 0;
          }, check, before);
          result.interactions.push({ viewport: name, selector: check.selector, passed });
        } catch (error) {
          result.interactions.push({ viewport: name, selector: check.selector, passed: false, error: error.message });
        }
      }
    }
  } catch (error) {
    result.error = error.message;
  } finally {
    await page.close();
  }
  return result;
}

function report(output, rows) {
  const ballot = Object.fromEntries(rows.map((row) => [row.id, { preferred: '', ratings: Object.fromEntries(row.ids.map((id) => [id, { hierarchy: null, brandFit: null, taskClarity: null, missedRequest: null, unwantedVisualChange: null, regressionFromOriginal: null }])) }]));
  writeJson(join(output, 'ballot.json'), ballot);
  const cards = rows.map((row) => `<section><h2>${escape(row.id)}</h2><p>${escape(row.prompt)}</p><div class="variants">${row.ids.map((id) => `<article><h3>${escape(id)}</h3><a href="${id}/desktop.png">Desktop</a> · <a href="${id}/mobile.png">Mobile</a><div class="shots">${['desktop', 'mobile'].map((view) => `<a href="${id}/${view}.png"><img src="${id}/${view}.png" alt="${view} preview for ${id}"></a>`).join('')}</div></article>`).join('')}</div></section>`).join('');
  writeFileSync(join(output, 'review.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Blind Antigravity design review</title><style>body{font:16px system-ui;margin:2rem;color:#172033;background:#f4f6fa}section{margin-block:3rem}.variants{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(24rem,100%),1fr));gap:1rem}article{padding:1rem;background:white}h3{margin:0 0 .5rem}.shots{display:grid;grid-template-columns:3fr 1fr;gap:.5rem;margin-top:.75rem;max-height:38rem;overflow:auto}img{display:block;width:100%;height:auto}</style><h1>Blind Antigravity design review</h1><p>Open the full desktop and mobile images. Score each candidate from 1 to 5 for hierarchy, brand fit, and task clarity. Record observable deviations from the request and regressions against the Original when present. Enter the preferred candidate ID or tie in ballot.json. Use Original if it best serves the brief.</p>${cards}</html>\n`);
}

function score(output) {
  const manifest = json(join(output, 'private-manifest.json'));
  const ballot = json(join(output, 'ballot.json'));
  const results = Object.fromEntries(arms.map((arm) => [arm, { cells: 0, incompleteRuns: 0, cliFailures: 0, wins: 0, ties: 0, ballots: 0, unexpectedFileEdits: 0, failedInteractions: 0, pageErrors: 0, toolDenials: 0, missedRequests: 0, unwantedVisualChanges: 0, visualRegressions: 0, originalPreferred: 0 }]));
  for (const row of manifest) {
    const review = ballot[row.id] || {};
    const eligible = row.cells.filter((cell) => ('artifactIssue' in cell ? !cell.artifactIssue : !cell.runError)
      && cell.screenshots.length === 2 && !cell.error && !cell.pageErrors.length
      && cell.interactions.every((check) => check.passed) && cell.review?.interactionVerification !== 'failed'
      && !cell.unexpected.length);
    const originalPreferred = row.originalId && ['original', row.originalId].includes(review.preferred);
    const preferenceValid = eligible.length === arms.length && (review.preferred === 'tie'
      || originalPreferred
      || eligible.some((cell) => cell.id === review.preferred));
    for (const cell of row.cells) {
      const result = results[cell.arm];
      result.cells++;
      if (cell.runError) result.cliFailures++;
      if (!eligible.includes(cell)) result.incompleteRuns++;
      if (preferenceValid && eligible.includes(cell)) {
        result.ballots++;
        if (review.preferred === cell.id) result.wins++;
        if (review.preferred === 'tie') result.ties++;
        if (originalPreferred) result.originalPreferred++;
      }
      if (cell.unexpected.length) result.unexpectedFileEdits++;
      result.failedInteractions += cell.interactions.filter((entry) => !entry.passed).length;
      result.pageErrors += cell.pageErrors.length;
      result.toolDenials += (cell.deniedTools || []).length;
      const rating = review.ratings?.[cell.id];
      if (!rating || !eligible.includes(cell)) continue;
      if (rating.missedRequest === true) result.missedRequests++;
      if (rating.unwantedVisualChange === true) result.unwantedVisualChanges++;
      if (rating.regressionFromOriginal === true) result.visualRegressions++;
      for (const key of ['hierarchy', 'brandFit', 'taskClarity']) {
        if (!Number.isInteger(rating[key]) || rating[key] < 1 || rating[key] > 5) continue;
        const axis = result[key] ??= { total: 0, count: 0 };
        axis.total += rating[key];
        axis.count++;
      }
    }
  }
  for (const result of Object.values(results)) {
    for (const key of ['hierarchy', 'brandFit', 'taskClarity']) {
      if (result[key]) result[key] = { mean: result[key].total / result[key].count, count: result[key].count };
    }
  }
  console.log(JSON.stringify(results, null, 2));
}

async function main() {
  if (values.help) {
    console.log('node eval/antigravity.mjs --model <agy-model> [--brief <id>] [--repeats 3] [--timeout <seconds>] [--current <git-ref>] [--output <new-dir>] [--dry-run]\nnode eval/antigravity.mjs --score <output-dir>');
    return;
  }
  if (values.score) return score(resolve(values.score));
  const briefs = json(join(evalDir, 'antigravity-briefs.json')).filter((brief) => !values.brief || brief.id === values.brief);
  const repeats = Number(values.repeats);
  if (!briefs.length) fail(`Unknown brief: ${values.brief}`);
  if (!Number.isInteger(repeats) || repeats < 1) fail('--repeats requires a positive integer');
  const timeout = Number(values.timeout);
  if (!Number.isInteger(timeout) || timeout < 1) fail('--timeout requires a positive number of seconds');
  if (!values.model) fail('Use --model to pin an Antigravity model across arms');
  const currentRevision = revision(values.current);
  if (values['dry-run']) {
    console.log(JSON.stringify({ model: values.model, currentRevision, briefs: briefs.map((b) => b.id), arms, repeats, generations: briefs.length * arms.length * repeats }, null, 2));
    return;
  }
  checkIsolation();
  const puppeteerRoot = process.env.HALLMARK_PUPPETEER || repo;
  const { createRequire } = await import('node:module');
  const puppeteer = createRequire(join(puppeteerRoot, 'package.json'))('puppeteer-core');
  const output = resolve(values.output || join(evalDir, 'runs', `antigravity-${randomUUID().slice(0, 8)}`));
  mkdirSync(dirname(output), { recursive: true });
  mkdirSync(output);
  const scratch = mkdtempSync(join(tmpdir(), 'hallmark-eval-'));
  let browser;
  try {
    const archive = command('git', ['archive', currentRevision, 'skills/hallmark'], repo, { encoding: null }).stdout;
    const prior = join(scratch, 'prior');
    mkdirSync(prior);
    command('tar', ['-xf', '-'], prior, { input: archive });
    browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', headless: true });
    const rows = [];
    const manifest = [];
    writeJson(join(output, 'metadata.json'), { model: values.model, currentRevision, revisedBase: revision('HEAD'), revisedSkillDigest: createHash('sha256').update(JSON.stringify(snapshot(skill))).digest('hex'), cli: command(cli, ['--version'], scratch).stdout.trim(), repeats });
    for (const brief of briefs) {
      for (let attempt = 1; attempt <= repeats; attempt++) {
        const row = { id: `${brief.id}-${attempt}`, prompt: brief.prompt, ids: [] };
        const cells = [];
        if (brief.fixture) {
          const id = `original-${row.id}`;
          mkdirSync(join(output, id));
          const original = await inspect(browser, join(repo, 'site', 'made', brief.fixture), join(output, id), brief);
          writeJson(join(output, id, 'browser.json'), original);
          if (original.screenshots.length !== 2 || original.interactions.some((check) => !check.passed)) fail(`The original failed its browser checks: ${row.id}`);
          row.ids.push(id);
        }
        const firstArm = (attempt - 1) % arms.length;
        for (const arm of [...arms.slice(firstArm), ...arms.slice(0, firstArm)]) {
          const id = randomUUID().slice(0, 12);
          const workspace = join(scratch, id);
          const images = join(output, id);
          mkdirSync(images);
          if (brief.fixture) cpSync(join(repo, 'site', 'made', brief.fixture), workspace, { recursive: true, filter: (path) => !path.split('/').includes('.hallmark') });
          else mkdirSync(workspace);
          if (arm !== 'off') {
            const source = arm === 'current' ? join(prior, 'skills', 'hallmark') : skill;
            cpSync(source, join(workspace, '.agents', 'skills', 'hallmarkForAntigravity'), { recursive: true });
          }
          command('git', ['init', '--quiet', '--template='], workspace);
          mkdirSync(join(workspace, '.git', 'info'), { recursive: true });
          writeFileSync(join(workspace, '.git', 'info', 'exclude'), '/.agents/\n/.hallmark/\n');
          command('git', ['add', '--all'], workspace);
          command('git', ['-c', 'user.name=Hallmark Eval', '-c', 'user.email=eval@example.invalid', '-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=.git/hooks', 'commit', '--quiet', '--no-verify', '--allow-empty', '-m', 'Benchmark baseline'], workspace);
          const before = snapshot(workspace);
          const invoke = arm === 'off' ? '' : '/hallmarkForAntigravity ';
          const prefix = brief.fixture ? 'Polish index.html: ' : '';
          const prompt = `${invoke}${prefix}${brief.prompt}\nWork in this directory with index.html as the entry point. Host verification is delegated. Read the relevant source and use the native workspace file tools to write the draft or requested edit directly. Stop this pass once the artifact exists. Leave browser capture and inspection pending for the host verifier. Use the supplied facts.`;
          console.log(`${row.id} ${arm}`);
          const args = ['-p', prompt, '--model', values.model, '--mode', 'accept-edits', '--sandbox', '--settings', settings, '--output-format', 'json', '--print-timeout', `${timeout}s`];
          const run = spawnSync(cli, args, { cwd: workspace, timeout: (timeout + 10) * 1000, encoding: 'utf8', maxBuffer: 24 * 1024 * 1024 });
          let envelope;
          try { envelope = JSON.parse(run.stdout); } catch {}
          const deniedTools = (envelope?.denied_actions || []).map((item) => item.display_name || item.action);
          const runError = run.error?.message || envelope?.error
            || (run.status !== 0 ? `CLI exited ${run.status ?? run.signal}` : null)
            || (!envelope || envelope.status !== 'SUCCESS' ? 'No successful CLI result' : null)
            || (!envelope.response?.trim() && deniedTools.length ? 'Headless tool permissions interrupted the run' : null);
          const changed = changes(before, snapshot(workspace));
          const entry = join(workspace, 'index.html');
          const artifactIssue = assessArtifact({
            entry: lstatSync(entry, { throwIfNoEntry: false })?.isFile() ? readFileSync(entry, 'utf8') : '',
            changed,
            editable: brief.editable,
          });
          const browserResult = artifactIssue
            ? { screenshots: [], interactions: [], pageErrors: [], error: artifactIssue }
            : await inspect(browser, workspace, images, brief);
          const review = assessBrowser(browserResult, 2 * (brief.checks?.length || 0));
          cells.push({ id, arm, changed, unexpected: brief.editable ? changed.filter((name) => !brief.editable.includes(name)) : [], runError, deniedTools, artifactIssue, review, ...browserResult });
          row.ids.push(id);
          mkdirSync(join(output, 'private'), { recursive: true });
          writeFileSync(join(output, 'private', `${id}.log`), `${run.stdout || ''}\n${run.stderr || ''}`);
          cpSync(workspace, join(output, 'private', id), { recursive: true, filter: (path) => !['.agents', 'node_modules', '.git'].some((part) => path.split('/').includes(part)) });
        }
        row.ids = row.ids.sort((a, b) => Number(b.startsWith('original-')) - Number(a.startsWith('original-')) || a.localeCompare(b));
        rows.push(row);
        manifest.push({ id: row.id, originalId: brief.fixture ? `original-${row.id}` : null, cells });
        writeJson(join(output, 'private-manifest.json'), manifest);
        report(output, rows);
      }
    }
    console.log(`Blind review: ${join(output, 'review.html')}`);
  } finally {
    await browser?.close();
    rmSync(scratch, { recursive: true, force: true });
  }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
