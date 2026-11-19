import { createHash } from 'node:crypto';
import { readFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { invokeNative, validateReview } from './review-loop.mjs';

export const reviewKeys = ['subject', 'hierarchy', 'mobilePath', 'facts', 'grouping', 'reference', 'craft'];
const digestFile = async (path) => createHash('sha256').update(await readFile(path)).digest('hex');

export function imageReads(trace, workspace, beforePageWrite = false) {
  const paths = new Set();
  for (const line of trace.split('\n')) {
    let event;
    try { event = JSON.parse(line); } catch { continue; }
    const step = event.step_update;
    const tool = step?.tool_info;
    if (beforePageWrite && step?.state === 'ACTIVE' && ['write_file', 'edit_file'].includes(tool?.name) && /(?:^|[/\\])index\.html$/.test(tool.parameters?.Path || '')) break;
    if (step?.state !== 'DONE' || tool?.error || !['read_file', 'view_image', 'open_image'].includes(tool?.name)) continue;
    const path = tool.parameters?.Path || tool.parameters?.path;
    if (typeof path === 'string' && /\.(?:png|jpe?g|webp)$/i.test(path)) paths.add(resolve(workspace, path));
  }
  return paths;
}

export async function review(input, dependencies = {}) {
  const { config, workspace, output, reviewPath, artifactDigest, verification, reviewNumber } = input;
  const screenshots = verification.screenshots || [];
  if (!['desktop', 'mobile'].every((view) => screenshots.some((shot) => shot.view === view))) throw new Error('Native review requires desktop and mobile captures');
  const images = await Promise.all(screenshots.map(async (shot) => ({ ...shot, path: resolve(shot.path), sha256: await digestFile(shot.path) })));
  const folder = join(output, `native-review-${reviewNumber}`);
  await mkdir(folder, { recursive: true });
  const example = {
    artifactDigest,
    checks: Object.fromEntries(reviewKeys.map((key) => [key, { pass: false, evidence: 'Replace with a concrete observation from the actual images.' }])),
    findings: ['Replace with actionable defects, or an empty array only when all checks pass.'],
    limitations: ['Record subjective weaknesses and unverified areas.'],
    images: images.map(({ path, sha256 }) => ({ path, sha256 })),
  };
  const prompt = `Review the CURRENT rendered candidate, not your intentions. This is a review-only turn. Do not edit project files, notes or assets. Use the native image reader to open EVERY capture listed below. Browser capture is already complete; do not discover browsers, inspect image types in a shell or install tools.\n\n${JSON.stringify(images, null, 2)}\n\nEvaluate the supplied brief and selected reference transfer in their actual visible components. Distinguish publishable product copy from instructions to the designer. Fail craft or facts when ordinary product UI repeats instructions such as the mood should be or help someone find, unless the brief explicitly asks to publish those instructions. Also flag exposed implementation paths and host-review labels. For reference, compare the supplied reference captures if needed; a case name alone is not evidence. Check type and contrast, useful grouping rather than habitual panels, mobile reading order, meaningful use of the supplied material, and action visibility. Ordinary task interfaces can be intentionally restrained. Do not claim originality or successful interactions from a screenshot. Host interaction status: ${verification.interactionVerification || 'pending at this stage'}. Host coverage: ${verification.coverage || 'See task checks'}.\n\nWrite ONLY the review JSON to ${reviewPath}, with the exact digest and image receipts below. Every check requires boolean pass and a specific viewport/component observation. False checks require concrete scoped findings; empty findings only if all checks pass. Keep the total review under 700 words. If you cannot view an image, stop and report that gap rather than passing it. Use native edit or the documented overwrite option if the review file already exists.\n\n${JSON.stringify(example, null, 2)}`;
  const native = await (dependencies.invoke || invokeNative)(config, { prompt, conversation: input.conversation || verification.conversation, turn: `review-${reviewNumber}`, output: folder });
  if (native.timedOut || native.code !== 0) throw new Error(`Native reviewer did not finish (code ${native.code})`);
  const tracePath = join(folder, `turn-review-${reviewNumber}.ndjson`);
  const trace = await readFile(tracePath, 'utf8');
  const seen = imageReads(trace, workspace);
  for (const shot of images) {
    if (!seen.has(shot.path)) throw new Error(`No successful image read for ${shot.path}`);
    if (await digestFile(shot.path) !== shot.sha256) throw new Error(`Capture changed during review: ${shot.path}`);
  }
  const result = JSON.parse(await readFile(reviewPath, 'utf8'));
  for (const key of reviewKeys) if (typeof result.checks?.[key]?.pass !== 'boolean' || !result.checks[key].evidence?.trim()) throw new Error(`Missing observed review for ${key}`);
  for (const shot of images) if (!result.images?.some((image) => resolve(image.path) === shot.path && image.sha256 === shot.sha256)) throw new Error('Review image receipts do not match the captures');
  if (!Array.isArray(result.limitations) || result.limitations.some((item) => typeof item !== 'string')) throw new Error('Review limitations must be a string array');
  validateReview(result, artifactDigest);
  return { ...result, inspection: { method: 'native image reads verified in tool trace', trace: tracePath, conversation: native.conversation, views: images.map((shot) => shot.view) } };
}
