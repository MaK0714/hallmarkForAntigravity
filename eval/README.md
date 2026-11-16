# Hallmark eval harness

Repo-internal tooling for benchmarking the Hallmark skill across harnesses and prompt packs.
**Not shipped with the skill**: the `package.json` `files` whitelist only includes `skills/`, so nothing in `eval/` reaches the published package.

**Direction note.** Hallmark targets Google Antigravity. Tier B below is retained as an archive of the bare-API open-model experiments (the b1-b6 runs feed the gallery); it is no longer a development target.

## Two-tier design

- **Tier B (this directory, implemented)**: bare API calls. The skill text is compiled into a system prompt (a "pack"), the brief is the user message, and the model gets exactly one nudge if it produces no HTML. No tools, no file system, no vision. This measures how much of Hallmark survives as pure prompt.
- **Tier A (`gen-cli.mjs`)**: drives the REAL Claude Code binary (`claude -p "/hallmark <brief>"`) with the skill copied into a scratch project, and parses the stream-json transcript for conformance: skill loaded (stamp present), files written, reference-read count + load-order discipline, cost. NOTE (measured): skills do not auto-trigger in `claude -p`, so we invoke by name; this is a CONFORMANCE harness, not an auto-trigger test. The `claude` arm uses your subscription (no key, must be logged in); `glm`/`kimi` arms are Anthropic-shaped (Z.ai / Moonshot) and disabled until you add their auth tokens (Together/OpenRouter cannot back `claude -p`). Cells drop into the same `runs/` tree as `<brief>/<arm>-cli/`. Run: `node gen-cli.mjs --arm claude --brief all` in a logged-in terminal.

## Files

| File | Role |
| --- | --- |
| `briefs.json` | The 8 briefs, `b1`..`b8`, each with an `expect` block (`page`, `component`, or `study-decline`). b1-b3 are parity reruns of hallmark-lab gen-01..03; b4 tempts fabricated metrics; b5 tests component routing; b6 probes the no-vision capability check; b7 is a craft brief; b8 a photo-led trade brief for the photo library. |
| `models.json` | The model arms (Anthropic + OpenAI-compatible endpoints) and the key files to read variable names from. `enabled: false` arms are skipped by `--arm all` but run when named explicitly. |
| `make-pack.mjs` | Compiles the skill into a system prompt. `--pack floor` is the Floor and Flow sections of `SKILL.md` behind a 3-line one-shot preamble; `--pack full` is all of `SKILL.md` plus `references/craft.md` and the gate table from `references/gates.md`, with file-path separators. |
| `gen-direct.py` | Runs the (brief x arm x pack) matrix sequentially against the raw APIs. Stdlib only. |
| `runs/` | One directory per cell: `runs/<briefId>/<armId>-<pack>/` with `index.html`, `raw.txt`, `run.json`, and later `score.json` (sloplint) + `judge.json` (vision judge). |
| `_shots/` | Screenshots: `<briefId>-<armId>-<pack>-{hero,full,mobile}.png`. |
| `_packs/` | Compiled pack cache written by `gen-direct.py` (regenerated every invocation). |
| `screenshot.mjs` | Hero (1280x800 viewport), full (1280 full-page), mobile (375x812 full-page) PNGs into `_shots/`. Uses puppeteer-core with the installed Chrome when the package is available, otherwise spawns Chrome headless with `--screenshot` (no npm install needed). `CHROME_PATH` overrides the binary. |
| `score.mjs` | Runs `skills/hallmark/scripts/sloplint.mjs <run>/index.html --json` per run and writes `score.json` with a `floorClean` flag (gates 1, 10, 14, 20, 26, 27, 34, 38a, 48, 54 free of FAILs). Component scope for any brief whose `expect.scope` is `component` (b5). Writes `{unavailable: true}` and continues if sloplint is absent or errors. |
| `judge.py` | Stdlib-only vision judge (claude-fable-5) over the hero + mobile shots. Writes `judge.json`: six pre-emit axes 1-5 (Philosophy, Hierarchy, Execution, Specificity, Restraint, Variety), verdicts on judged gates 6, 9, 42, 43, 81, and an overall 1-10 with a one-line rationale. Skips b5/b6 and cells with an existing `judge.json`. |
| `report.mjs` | Assembles `eval/index.html`: a static, self-contained dark gallery with one row per brief, one card per arm-pack cell (hero thumb, runstats, sloplint and judge chips, click opens the artifact), and a per-arm summary table at the top compared against `fable-baseline`. |
| `serve.py` | `http://127.0.0.1:4201` rooted at `eval/` (loopback only). |
| `run-matrix.py` | Orchestrates gen -> screenshot -> score -> (repair loop) -> judge -> report. `--repair N` re-prompts failing cells through `gen-direct.py --repair`; see the docstring at the top of `run-matrix.py` for the loop contract. |

## Running the matrix

```sh
# Inspect a pack
node eval/make-pack.mjs --pack floor --list
node eval/make-pack.mjs --pack full            # size summary only
node eval/make-pack.mjs --pack full --out /tmp/full-pack.txt

# See what would run, and whether keys resolve (names only, values never printed)
python3 eval/gen-direct.py --brief all --arm all --pack floor --dry-run

# One cell
python3 eval/gen-direct.py --brief b1 --arm fable-baseline --pack floor

# Full enabled matrix, one pack at a time
python3 eval/gen-direct.py --brief all --arm all --pack floor
python3 eval/gen-direct.py --brief all --arm all --pack full

# Re-run a cell that already has a run.json
python3 eval/gen-direct.py --brief b4 --arm glm52-together --pack full --force

# Disabled arms run only when named explicitly
python3 eval/gen-direct.py --brief all --arm deepseek-openrouter --pack full
```

## Scoring, judging, reporting

```sh
# Whole pipeline in one shot, with up to 2 repair rounds
python3 eval/run-matrix.py --repair 2

# One cell end to end
python3 eval/run-matrix.py --brief b1 --arm glm52-together --pack full

# Re-score and re-report existing artifacts without regenerating
python3 eval/run-matrix.py --skip-gen --force

# Individual stages
node eval/screenshot.mjs --brief b4 --force
node eval/score.mjs --brief b5
python3 eval/judge.py --arm fable-baseline
node eval/report.mjs
python3 eval/serve.py     # then open http://127.0.0.1:4201

# Repair pass by hand (reads score.json, re-prompts failing cells, re-scores)
python3 eval/gen-direct.py --brief all --arm all --pack floor --repair 1
```

Keys come from the process environment, then from the `keyFiles` listed in `models.json` or in an untracked `models.local.json` (`{"keyFiles": ["/path/to/.env"]}`), KEY=VALUE lines.

Notes:

- Cells with an existing `run.json` are skipped unless `--force`.
- `b6` (vision-probe) is expected to produce **no** artifact: `ok: false` there is the desired mechanical outcome, and the judge scores the decline text in `raw.txt`.
- `costUSD` is `null` for now; pricing per arm can be added to `models.json` later without changing the layout.

## Acceptance criteria (run phase)

Per arm, on the enabled matrix:

1. **6/6 artifacts** per arm (with b6 counted as a pass when it correctly declines instead of emitting a page).
2. **>= 90 percent Tier-1 mechanical pass with zero repair**: `sloplint.mjs` on the extracted `index.html` as generated, no hand edits.
3. **Zero floor-subset FAILs**: gates 1, 10, 14, 20, 26, 27, 34, 38a, 48, 54.
4. **Zero unsourced metrics on b4** (gate 46): no invented stats, testimonials, logo walls, or case-study counts.
5. **Rotation compliance** across an arm's stamps: the `/* Hallmark · macrostructure: ... */` stamps across b1-b5 must show structural variety, not one repeated macrostructure.
6. **Judge mean within 1.5 points of the fable-baseline arm** on the vision-judge rubric.

## Findings, 2026-07-23 run

- **The full pack is load-bearing on open models.** Full-pack cells: Kimi K2.7-Code 0 mechanical FAILs across 6 briefs, GLM 11 FAILs across 6 (all cleared in exactly one repair round), Claude 0. Floor-only cells: GLM 96 FAILs (every cell floor-dirty), Kimi 30. The floor block alone is a safety net, not a substitute; ship the whole skill to open models.
- **The repair loop works.** 100 percent of GLM's Tier-1 FAILs cleared with one `--repair` round fed by sloplint findings; the residual tells were exactly the targeted ones (italic em in headings, tag-beside-heading grids, off-scale spacing).
- **The no-vision path holds.** On the vision-probe brief every model, including text-only GLM, declined in the capability-check language instead of hallucinating a diagnosis. (They then emitted a generic fallback page because this bench's preamble demands an artifact per cell; in a real conversation the flow stops at the decline. Expected harness quirk.)
- **Zero invented metrics** on the metric-temptation brief, all arms.
- **Rotation:** no macrostructure repeated more than twice within any arm's six briefs; component brief correctly skipped the page stamp. Kimi quirk: it occasionally invents a macro name ("Split Hero + Feature Bento"); the theme-axes table keeps the theme axes checkable anyway.
- **Kimi K3 arm** still awaits an OPENROUTER_API_KEY (or Together hosting, expected within a week; swap the model id in models.json). K2.7-Code is the documented stand-in.
- Claude on the drum-machine brief needs the 64K output ceiling (32K truncated mid-CSS).

## API keys

The eval harness never uses your Anthropic key by default. Generation arms run on Together (GLM, Kimi stand-in); the baseline uses whatever `ANTHROPIC_API_KEY` you set only if you run that arm. The vision judge defaults to **operator mode** (`python3 judge.py`): it lists the screenshots for the Claude Code operator (Opus 4.8 on your subscription) to score by the rubric, spending nothing. `--provider together` runs an automated pass on a Together vision model; `--provider anthropic` is opt-in and the only path that touches your Anthropic key.

## Antigravity CLI design benchmark

`eval/antigravity.mjs` uses the same pinned model and brief for three arms: skill off, the pre-change Hallmark skill from a Git revision, and the revised skill from the current workspace. Each attempt gets a fresh Git workspace with its baseline recorded. It explicitly invokes Hallmark on the two skill arms. This measures outcomes after invocation. Auto-discovery should be checked separately in the Antigravity customization panel.

The five briefs cover two tightly scoped edits to existing sites, a new landing page, a portfolio, and a dashboard. The default is three independent attempts per brief (45 generations). Start with the dry run to inspect the plan. Use a dedicated Antigravity CLI profile without a global Hallmark skill or temporarily disable its global plugin for the benchmark. The runner checks for globally enabled Hallmark and Modern Web Guidance, which can otherwise start its own shell workflow in every arm. Keep other customizations identical across arms. Set `HALLMARK_AGY` if `agy` is outside your path. Set `CHROME_PATH` for Chrome outside the default Linux path and use `HALLMARK_PUPPETEER` for an existing external installation of `puppeteer-core`.

```bash
node eval/antigravity.mjs --model <agy-model-id> --dry-run
node eval/antigravity.mjs --model <agy-model-id> --brief couples-polish --repeats 1
node eval/antigravity.mjs --model <agy-model-id>
node eval/antigravity.mjs --score eval/runs/<session>
```

`--current <git-ref>` sets the baseline revision. The default is the last revision before the preservation-first changes. Set `--timeout <seconds>` to change the per-generation limit. Each generated directory includes a blind review gallery with anonymous candidate IDs, a ballot template, and private arm mappings and CLI logs. Have reviewers open only the gallery and ballot until scoring is complete. Enter `tie`, `original`, or a candidate ID as the preference. Grade hierarchy, brand fit and task clarity from 1 to 5 and answer the request, scope and regression fields. Prefer multiple independent reviews and score each ballot separately.

The slider brief captures the keyboard-focused state at both viewport widths. The runner also exercises key browser interactions at desktop and mobile widths, checks recent edits against the requested file scope, and records incomplete runs, page errors and headless tool denials. File checks can detect an out-of-scope file change. Reviewers should also flag visual collateral changes within a permitted file. Track preference wins, original retained, confirmed regressions, unwanted changes and failed interactions across repetitions. Preference totals use complete three-arm rows with ballots. Incomplete runs remain visible in the technical counts.

The headless generation pass hands off the draft or requested diff before browser review. The host runner checks for a non-empty entry and a scoped edit on edit briefs, then captures the output and runs interactions outside the agent sandbox. The manifest tracks CLI errors, artifact failure, capture, visual inspection and interaction verification separately. A draft written before a CLI timeout can still enter review if host verification passes. Use the blind gallery and ballot to perform the visual inspection.
