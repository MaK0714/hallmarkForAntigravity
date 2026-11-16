#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { hallmarkHooks, pluginHookCommand } from "./hook-config.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const has = (f) => args.includes(f);

const globalPlugin = has("--global");
const settingsPath = globalPlugin
  ? join(homedir(), ".gemini", "config", "plugins", "hallmarkForAntigravity", "hooks.json")
  : join(process.cwd(), ".agents", "hooks.json");

const hookConfig = hallmarkHooks(globalPlugin ? pluginHookCommand : `node "${join(HERE, "lint-hook.mjs")}"`);

function readSettings() {
  if (!existsSync(settingsPath)) return {};
  try { return JSON.parse(readFileSync(settingsPath, "utf8")); } catch {
    console.error(`refusing to overwrite unparseable ${settingsPath}; fix or delete it first.`);
    process.exit(1);
  }
}

if (has("--print")) {
  console.log(`# add to ${settingsPath} :`);
  console.log(JSON.stringify(hookConfig, null, 2));
  process.exit(0);
}

if (has("--remove") && !existsSync(settingsPath)) {
  console.log(`no ${settingsPath}; nothing to remove`);
  process.exit(0);
}

const settings = readSettings();
if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
  console.error(`refusing to rewrite ${settingsPath}: it is not a JSON object`);
  process.exit(1);
}

const save = () => {
  const dest = existsSync(settingsPath) ? realpathSync(settingsPath) : settingsPath;
  const tmp = `${dest}.hallmark-tmp`;
  writeFileSync(tmp, JSON.stringify(settings, null, 2) + "\n");
  renameSync(tmp, dest);
};

if (has("--remove")) {
  delete settings["hallmark-linter"];
  save();
  console.log(`removed the Hallmark lint hook from ${settingsPath}`);
  process.exit(0);
}

Object.assign(settings, hookConfig);
mkdirSync(dirname(settingsPath), { recursive: true });
save();
console.log(`installed the Hallmark edit-time lint hook into ${settingsPath}`);
console.log(`it reports advisory defect diagnostics for stamped Hallmark files on write. Remove with --remove.`);
