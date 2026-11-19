# Host review and native repair

Use when an Antigravity CLI sandbox cannot render the project, or a host is already responsible for browser verification. The first native turn writes the candidate. A host process captures and tests it, then sends concrete findings into the same conversation. Interactive Antigravity can perform the equivalent cycle using its available browser.

## Run the host loop

Run this on the host with the existing Antigravity login. The workspace contains the brief's assets and the selected Hallmark skill. Keep the model pinned when comparing versions.

```json
{
  "workspace": "./project",
  "output": "./review",
  "model": "your-pinned-model-id",
  "prompt": "/hallmarkForAntigravity Build the supplied frontend. Use native file tools. Host verification is delegated. Stop when the requested first-draft files exist.",
  "maxRepairs": 2
}
```

```sh
node <skill-dir>/scripts/review-loop.mjs --config ./build.json
```

The default verifier reuses the advisory renderer for a standalone index.html. It needs the existing Chrome/Chromium and puppeteer-core setup described in [flow.md](flow.md). For a real task, add a `verifier` path to a host module exporting `verify({ workspace, output })`. Return nonempty `checks` with `name`, boolean `pass` and actionable `detail`, plus `screenshots` with absolute `path` and `view` equal to `desktop` or `mobile`. Add captures and checks for the actual empty, error and success states. Return `interactionVerification` as `passed` or `failed` only after exercising those interactions. Capture, screenshot inspection and task-check status are reported independently. The module can use the project's normal route and browser tests.

Mechanical failures return to the native conversation automatically within the configured repair budget. Missing host captures stop the run for environment recovery. Restore the verifier and rerun the same command. Each review preserves source files, captures and results. A completed native command alone never accepts a candidate.

## Inspect and return visual findings

When the run reports `needs-review`, open its actual captures. Fill its visual-review template and save it at the reported reviewPath. The reviewer can be the current coding agent with image access or a person. Record an observed result for each check.

| Check | Evidence to examine |
| --- | --- |
| Subject | The imagery, type, composition or interaction expresses this project's material and emotional intent. Identify the visible choice. |
| Hierarchy | The visitor can distinguish the page's subject, evidence, next action and secondary information. Components have useful jobs. |
| Mobile path | Follow the primary action and normal scrolling to the first useful item or form. Inspect empty space inside controls and revealed-state overflow. |
| Facts | Compare visible claims, prices, statuses and action consequences with the supplied brief. Inspect the error and success copy too. |

When a case was borrowed, compare its stated transfer with the actual target component. Record where the move appears and whether it helps the task. A receipt or source link alone establishes retrieval.

For a failed check, give a specific observation and scoped repair, such as the affected control, viewport and incorrect spacing. Rerun the same command. It continues the existing conversation and requests new verification. An unchanged accepted artifact can return complete. A changed asset invalidates its review. Budget exhaustion remains unresolved with findings recorded.

The review JSON is bound to a digest of the current project files. Default verification covers the initial standalone route. The host reviewer and project verifier determine the additional task and visual coverage.

## Antigravity artifact handoff

Have the host preserve the original before invoking a delegated polish. A denied backup or verification command is an unresolved execution result even when the CLI envelope says success. Do not repeat a denied command indefinitely or broaden permissions. Use the existing recoverable original or report the exact blocked operation.

Record before and candidate file digests. An unchanged digest means no implemented polish; do not claim improvement. A changed digest establishes an edit only. Require matching screenshots, task checks and a visual acceptance decision before replacing the original. Keep the original active when the candidate regresses or review is pending.

For the project verifier, add assertions for sticky-header occlusion after state changes, focus visibility, anchor heading visibility and responsive image dimensions. Review first useful content distance against the baseline. Automated functional and contrast passes do not establish visual quality or factual image provenance.

When the target file already exists and a backup is preserved, use the native edit tool or its documented overwrite option for that target. A create-only writer can reject an existing file. Treat that rejection as a tool-contract issue, retry the intended edit once with the correct option, and verify the artifact changed before reporting implementation.

## Native screenshot reviewer

For automatic visual review, set `reviewer` to the installed scripts/native-review.mjs module in a review-loop config, or use [the staged design runner](autonomous-workflow.md). The reviewer opens actual captured images in the native conversation and writes a review bound to their hashes and the project digest. A plausible receipt without successful image tool reads is rejected. Reviewer turns cannot edit the project. Missing image access, invalid JSON or changed source stops acceptance rather than triggering arbitrary design edits.

Use a project verifier for real task coverage. A task label, capture or simulated click is insufficient. The staged runner requires an explicit passed interaction result before completion, with fresh visual review afterwards. It preserves a non-passing candidate when its shared source-repair budget is exhausted.
