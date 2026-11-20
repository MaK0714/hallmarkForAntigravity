# Host driven design workflow

Use this for a complete new standalone frontend when a host can run Antigravity and Chrome. The supplied runner expects index.html; framework projects need a project-specific host adapter. Preserve a requested stack rather than rewriting it to fit this runner. Interactive agents with a working browser can perform the same stages directly. Native CLI turns must not start nested CLI agents or claim that an installed browser skill supplies a browser connection.

## Setup once

Select the intended deployment model and record its actual preset and effort. Do not silently substitute a low-effort model and attribute the result to the whole platform. The local `agy models` command lists the account's available choices. Compare model settings separately before claiming equivalence.

Keep the installed Antigravity executable, Chrome and existing puppeteer-core available to the host. Set `cli` or `HALLMARK_AGY` when agy is not on PATH. Optional `chromePath` and `puppeteerRoot` select existing installations; no repository dependency installation is required. The runner verifies the CLI version and actual desktop and phone PNG capture before generation. Native image viewing is verified later by successful capture reads in its tool trace. Missing capabilities stop acceptance rather than becoming invented observations.

Provide the task and authoritative content in the workspace. Put supplied assets in assets/. The runner writes an exact filename manifest and preserves an existing index.html before editing. Supply one or two relevant reference captures with their source URLs and capture dates. Use the case index to select by task and material, not by popularity. Do not load all annotations. Reference captures are research evidence, not assets to copy into the product.

## Run two stages

Run this from the host, not inside a native build turn:

```sh
node <skill-dir>/scripts/design-loop.mjs --config ./design.json
```

The JSON config needs `workspace`, a pinned `model`, `prompt`, `implementationPrompt`, `implementationVerifier`, and `references`. Each reference contains `url`, `capturedAt`, `desktop` and `mobile` file paths. An optional `compositionVerifier` replaces the basic renderer. See [host-review.md](host-review.md) for the verifier contract. Set `maxRepairs` from zero to two; this is shared across both stages. A repair round counts even when the native turn makes no edit or stops at a denied command, preventing endless retries.

The first stage studies the actual reference images before writing a composition. It records a concise transfer and captures the real proposal. Both stages add 320px, 375px and 390px phone captures alongside desktop and any task-state captures. The reviewer must record a separate observation and decision for each phone width; a failing width cannot pass mobilePath. Native screenshot review checks subject, hierarchy, mobile reach, facts, grouping, visible reference transfer and craft. Every supplied capture must be opened successfully; review receipts bind image hashes and source digest. A source edit by the reviewer invalidates acceptance. These checks establish inspection, not objective taste.

Only an accepted composition proceeds to the interaction stage. The task verifier must exercise the actual flow and report `interactionVerification: passed`. Fresh native image review follows the new captures. A passing functional suite alone cannot complete the workflow. Ordinary controls, useful cards and quiet interfaces remain legitimate; there is no universal box ban.

## Read the outcome

Results, snapshots and native traces live under .hallmark/design/. Keep output inside the workspace when native file tools are restricted to that workspace. An external host output folder can cause capture reads to be denied; that is a capability failure, not a completed visual review. `complete` means both stages passed their configured checks and native visual review, not independent design approval or publication. `unresolved` means a defect, capability gap or exhausted budget remains. An unchanged page cannot be reported as a new implementation. Native failures and repairs remain in the history.

A reviewer capability failure stops automatic source repairs. After correcting the environment, `resumeReview: true` requests fresh captures and a new review attempt. Keep the old evidence. Reuse the same output only for the same brief, assets, references and model.

## Evaluate independence

For benchmarks, freeze the briefs, content, model, reference captures and scoring criteria first. Use varied tasks and actual material. Record source repairs, review turns, execution failures and any manual layout instructions separately. The optional manualLayoutInstructions count is an operator attestation; the runner reports null when it was not supplied. Prepare anonymized screenshot pairs when feasible, but do not call self-review or an author review independent. Assess hierarchy, task fit, visual specificity, grouping and craft separately from functional correctness. Report remaining weaknesses, including a conventional result that passes tests. Broader reference expansion is justified only when missing examples are the limiting factor.
