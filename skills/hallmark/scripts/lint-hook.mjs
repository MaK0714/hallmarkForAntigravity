#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";

const OK = (obj = {}) => { process.stdout.write(JSON.stringify(obj)); process.exit(0); };

function main() {
  let raw = "";
  try { raw = readFileSync(0, "utf8"); } catch { return OK(); }
  let payload;
  try { payload = JSON.parse(raw); } catch { return OK(); }
  const filePath = payload?.toolCall?.args?.Path || payload?.toolCall?.args?.TargetFile;
  if (typeof filePath !== "string" || !filePath) return OK();
  const lower = filePath.toLowerCase();
  const markup = /\.(html|css)$/.test(lower);
  const component = /\.(jsx|tsx|vue|svelte|astro)$/.test(lower);
  if (!markup && !component) return OK();
  let src = "";
  try { src = readFileSync(filePath, "utf8"); } catch { return OK(); }
  if (src.length === 0) return OK();
  if (payload.error || !/\/\*\s*Hallmark/.test(src)) return OK();
  const gm = src.match(/genre:\s*(editorial|modern-minimal|atmospheric|playful)/i);
  const args = [filePath, "--json", "--advisory", "--tier", "floor"];
  if (gm) args.push("--genre", gm[1].toLowerCase());
  if (/shape:\s*app screen/i.test(src)) args.push("--scope", "app");
  if (/·\s*component:/i.test(src) || lower.endsWith(".preview.html")) args.push("--scope", "component");
  const sloplint = join(dirname(fileURLToPath(import.meta.url)), "sloplint.mjs");
  let out = "";
  try {
    out = execFileSync(process.execPath, [sloplint, ...args], { encoding: "utf8", timeout: 4000, stdio: ["ignore", "pipe", "ignore"] });
  } catch (e) {
    out = e?.stdout?.toString?.() ?? "";
  }
  if (!out) return OK();
  let report;
  try { report = JSON.parse(out); } catch { return OK(); }
  const fails = (report?.findings ?? []).filter((f) => f.grade === "FAIL");
  if (fails.length === 0) return OK();
  const name = basename(filePath);
  const lines = fails.slice(0, 10).map((f) => `- gate ${f.gate} (line ${f.line}): ${f.evidence} -> ${f.fix}`);
  const more = fails.length > 10 ? `\n  (+${fails.length - 10} more)` : "";
  const ctx = `Hallmark advisory check on ${name}: ${fails.length} FAIL${fails.length === 1 ? "" : "s"}.\n${lines.join("\n")}${more}\nConfirm each defect in the browser and address it when it affects the requested scope.`;
  process.stderr.write(`${ctx}\n`);
  return OK({});
}

try { main(); } catch { OK(); }
