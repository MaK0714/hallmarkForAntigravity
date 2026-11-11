#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = path.dirname(HERE);
const HOME = homedir();

const PAYLOAD = ["SKILL.md", "LICENSE", "references", "scripts", "agents", "assets"];

const TARGETS = {
  antigravity: {
    label: "Google Antigravity",
    dir: path.join(HOME, ".gemini", "config", "plugins", "hallmark"),
    detect: () => true,
    plugin: true,
  },
};

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const FLAGS = ["--dry-run", "--force", "--remove", "--help", "-h"];
const unknown = args.filter((a) => !FLAGS.includes(a));
if (has("--help") || has("-h") || unknown.length) {
  if (unknown.length) console.log(`Unknown option: ${unknown.join(" ")}\n`);
  console.log(`node install.mjs [--dry-run] [--force] [--remove]

  Installs Hallmark as a Google Antigravity plugin after checking every theme and reference.
  --dry-run  print what would be copied and change nothing
  --force    install even if the checks find a problem
  --remove   delete every installed copy`);
  process.exit(unknown.length ? 2 : 0);
}
const DRY = has("--dry-run");

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === ".DS_Store" || entry.name === ".hallmark" || entry.name === "node_modules" || entry.name === "fixtures") continue;
    if (entry.isSymbolicLink()) continue; // never follow a link out of the skill into the install
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function installTo(target) {
  const dir = typeof target === "string" ? target : target.dir;
  const isPlugin = typeof target === "object" && Boolean(target.plugin);
  if (DRY) return console.log(`  would install -> ${dir}`);
  const tmp = dir + ".tmp-install";
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(tmp, { recursive: true });
  const skillDest = isPlugin ? path.join(tmp, "skills", "hallmark") : tmp;
  for (const item of PAYLOAD) {
    const src = path.join(SKILL_ROOT, item);
    if (!fs.existsSync(src)) continue;
    const dest = path.join(skillDest, item);
    if (fs.statSync(src).isDirectory()) copyDir(src, dest);
    else { fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.copyFileSync(src, dest); }
  }
  if (isPlugin) {
    const pluginManifest = {
      "$schema": "https://antigravity.google/schemas/v1/plugin.json",
      name: "hallmark",
      displayName: "Hallmark",
      version: "2.0.0",
      description: "Design skill for websites and new pages that look designed, not generated. A hard floor against AI slop, 50 catalog themes, custom direction, and browser-tested craft gates. Powered by Together AI.",
      logo: "skills/hallmark/assets/logo.png",
      author: {
        name: "Together AI",
        url: "https://www.usehallmark.com"
      },
      homepage: "https://www.usehallmark.com",
      repository: "https://github.com/Nutlope/hallmark",
      license: "MIT",
      suggestedPrompts: [
        "Use Hallmark to build a landing page for my product",
        "Use Hallmark to redesign this existing page",
        "Use Hallmark to audit this page for AI-generated design patterns"
      ],
      keywords: ["design", "ui", "anti-ai-slop", "themes", "frontend", "antigravity"]
    };
    fs.writeFileSync(path.join(tmp, "plugin.json"), JSON.stringify(pluginManifest, null, 2) + "\n");
    const hooksConfig = {
      "hallmark-linter": {
        "PostToolUse": [
          {
            "matcher": "write_to_file|replace_file_content|multi_replace_file_content",
            "hooks": [
              {
                "type": "command",
                "command": "node skills/hallmark/scripts/lint-hook.mjs",
                "timeout": 15
              }
            ]
          }
        ]
      }
    };
    fs.writeFileSync(path.join(tmp, "hooks.json"), JSON.stringify(hooksConfig, null, 2) + "\n");
  }
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(dir), { recursive: true });
  fs.renameSync(tmp, dir);
  console.log(`  installed -> ${dir}`);
}

function removeAt(dir) {
  if (!fs.existsSync(dir)) return;
  if (DRY) return console.log(`  would remove ${dir}`);
  fs.rmSync(dir, { recursive: true, force: true });
  console.log(`  removed ${dir}`);
}

if (has("--remove")) {
  console.log("Removing Hallmark from Antigravity plugin directory:");
  for (const t of Object.values(TARGETS)) removeAt(t.dir);
  process.exit(0);
}

const picked = Object.keys(TARGETS);

const { execFileSync } = await import("node:child_process");
try {
  if (!DRY) execFileSync(process.execPath, [path.join(HERE, "theme.mjs"), "index"], { stdio: "inherit" });
} catch {
  console.log("  (theme index not rebuilt; run node scripts/theme.mjs index)");
}
const gate = (label, argv) => {
  try { execFileSync(process.execPath, argv, { stdio: "pipe" }); return true; }
  catch (e) { console.log(`\n${label} failed:\n${String(e.stdout || "").trim()}`); return false; }
};
const themeFiles = fs.readdirSync(path.join(SKILL_ROOT, "references", "themes")).filter((f) => f.endsWith(".md")).map((f) => path.join(SKILL_ROOT, "references", "themes", f));
const clean = gate("refcheck", [path.join(HERE, "refcheck.mjs"), "--errors"]) & gate("theme validate", [path.join(HERE, "theme.mjs"), "validate", ...themeFiles]);
if (!clean && !has("--force")) {
  console.log("\nNothing installed. Fix the findings above, or pass --force to install anyway.");
  process.exit(1);
}
console.log(`Hallmark installer${DRY ? " (dry run)" : ""} · payload: ${PAYLOAD.join(", ")}`);

for (const key of picked) {
  const t = TARGETS[key];
  console.log(`\n${t.label}:`);
  installTo(t);
}

console.log(`\nDone. Invoke in Antigravity as: /hallmark <prompt> or use hallmark to build ...`);
