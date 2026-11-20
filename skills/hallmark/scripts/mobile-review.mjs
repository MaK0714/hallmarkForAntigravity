import { execFile } from 'node:child_process';
import { mkdtemp, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const here = dirname(fileURLToPath(import.meta.url));
export const mobileWidths = [320, 375, 390];

// Keep every width available to the image reviewer without duplicating the old phone shot.
export async function captureMobile({ workspace, output }, config, verification) {
  const folder = await mkdtemp(join(output, 'mobile-views-'));
  const env = { ...process.env };
  if (config.chromePath) env.CHROME_PATH = config.chromePath;
  if (config.puppeteerRoot) env.HALLMARK_PUPPETEER = config.puppeteerRoot;
  await promisify(execFile)(process.execPath, [join(here, 'capture.mjs'), join(workspace, 'index.html'), '--out', folder, '--sizes', 'narrow,mobile,phone', '--scale', '1'], { env, timeout: 120000 });
  const shots = [];
  for (const [index, size] of ['narrow', 'mobile', 'phone'].entries()) {
    const path = join(folder, `screen-home-${size}.png`);
    const bytes = await readFile(path);
    const width = mobileWidths[index];
    if (bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' || bytes.readUInt32BE(16) !== width) throw new Error(`Invalid ${width}px mobile capture`);
    shots.push({ view: width === 375 ? 'mobile' : `mobile-${width}`, width, height: bytes.readUInt32BE(20), path });
  }
  return { ...verification, mobileWidths: [...mobileWidths], screenshots: [...(verification.screenshots || []).filter((shot) => shot.view !== 'mobile'), ...shots] };
}
