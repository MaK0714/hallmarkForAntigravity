---
name: hallmarkForAntigravity
description: "Design new websites and pages, audit rendered sites, or make scoped visual improvements. Existing sites use their own design system. Use on ordinary existing-site edits only when specifically asked to improve the design or use Hallmark. Requests to replace a generic composition use creative improvement; ordinary edits stay scoped."
argument-hint: "<brief> | audit <target> | polish <target> | redesign <target>"
version: 2.0.0
---

# Hallmark

Design around what the visitor needs to do and the strongest material the project can actually show.

## Choose the scope before choosing the style

- **Audit** when asked to review, diagnose, or compare. Inspect the relevant views and report specific findings without editing the site.
- **Polish** for scoped visual fixes or a vague request to improve an existing page that does not reject its composition or ask for a new direction. Naming Hallmark alone does not authorize recomposition. Preserve the visual system, composition, copy and behavior outside the requested changes. A new page inside an established product inherits its system.
- **Creative improvement or redesign** when the user asks for a stronger or more distinctive design, calls the composition generic, or explicitly requests different layouts or components. These requests authorize recomposition of the named page, rather than only CSS polish. A vague request to improve an existing page still defaults to polish. Read the creative direction procedure in [redesign.md](references/redesign.md). Preserve the original as a candidate. Keep any brand, content, accessibility and behavior the request leaves in place.
- **Build** for a new design. Treat explicit user references, requirements and project styles as inputs. For a component or app screen, read only the corresponding guidance in [flow.md](references/flow.md).

## Deliver the first candidate

For a complete new standalone frontend with host tooling, use the [host driven design workflow](references/autonomous-workflow.md) to review a composition before wiring interactions. Its runner supplies exact assets, actual reference-image study, native screenshot review and a shared repair budget. Native CLI turns follow their assigned stage; do not start nested CLI runs. Without a render and image-viewing path, report visual verification pending.

When the user requests visual research or a visual proposal before implementation, follow [visual-study.md](references/visual-study.md). This staged path takes precedence over the ordinary task-first draft below. Keep native visual research and host capture responsibilities explicit.

- **Small polish:** read the target and [redesign.md](references/redesign.md). Make the requested change in the current style, using the file tools. Skip Git history, theme selection and the gate catalogue. If baseline capture is unavailable, keep the original recoverable and treat the edit as a candidate pending review.
- **New design:** read the brief and relevant project files. Identify the visitor's task, the strongest genuine material and one direction that suits both. Use the decision-guide routing below for the main design decision, then write a runnable first draft with the task and its states working. Keep supplied data, IDs, prices, availability and operational policies authoritative. Ground product provenance and service claims in project evidence. Distinguish publishable copy from creative instructions; do not paste the brief's directions into product UI. Put creative voice in presentation and recognizable commentary. Save optional comps, catalog exploration, legacy style diagnostics and broad critique for after the first draft. When the user supplies a reference or asks for comps first, follow that order.
- **Audit, creative improvement and redesign:** follow [redesign.md](references/redesign.md). An audit can start with the rendered page. A redesign preserves a recoverable original before editing.

For polish, require an observed visitor benefit. Compare mobile content reach and sticky-header visibility before accepting larger type or spacing. Verify image captions against asset provenance. See [redesign.md](references/redesign.md) for the outcome checks.

If this is an Antigravity headless run with host verification delegated, stop the first pass once the file or requested diff exists. Report the artifact and leave visual verification pending for the host. Use the native file tools for the edit and avoid browser or environment probes during that pass. The host can continue the same native conversation with [host review and repair](references/host-review.md).

Consult [anatomy.md](references/anatomy.md), [imagery.md](references/imagery.md), [craft.md](references/craft.md), [layout.md](references/layout.md), [responsive.md](references/responsive.md), or [interaction-and-states.md](references/interaction-and-states.md) for a decision that needs it. Use [flow.md](references/flow.md) for component, app and Antigravity-specific paths. [direction.md](references/direction.md), [macrostructures.md](references/macrostructures.md), and the [theme catalog](references/themes/README.md) are optional. For an existing system, use [design-md](references/design-md.md) or [export-formats](references/export-formats.md) when relevant.

When you need a stronger visual idea, story or interaction, use the [design case index](references/design-cases/README.md). Match by visitor task and emotional stakes, then open up to two cases. When borrowing a case, name one observable change it makes to this page and where to inspect it in the handoff. Judge that change against the visitor's task. Consider a playful direction when the brief supports it. Preserve the headless first-draft handoff.

For a new site, read one decision guide before drafting, choosing the biggest design risk in the brief. Use [component choice and placement](references/design-decisions/placement.md) for finding, comparing or completing a task, [visual direction](references/design-decisions/style.md) for expressive storytelling, [typography](references/design-decisions/typography.md) for reading or type-led work, or [color](references/design-decisions/color.md) for palette, contrast or data encoding. Apply it to a visible choice in the draft. For existing-site work, open a guide when the requested change needs it. Load further guides only for a specific unresolved decision. Keep the headless first draft moving.

## Verify the rendered result

1. Confirm the actual file or scoped diff exists. A success message alone is insufficient. Choose one available preview path: an available Antigravity browser, the provided host capture runner, or the local Node renderer. For the local renderer use `node <skill-dir>/scripts/sloplint.mjs <target> --advisory --require-render --json`, with `--url` for a running framework route and the appropriate scope. If a path cannot capture, use a known fallback or mark capture pending. Avoid repeated browser discovery and dependency probes.
2. Open desktop and mobile captures. Check both the primary action and the distance to the first useful item or form. Inspect stacked controls for oversized empty space. Test the primary task by keyboard where applicable and exercise its empty or error state. Compare the rendered results with the visible status. For filtering, check which rows actually render rather than relying on the `hidden` attribute or count alone. Check focus, contrast, responsive layout and the facts supplied by the user. Repeat narrow-width and contrast checks in revealed states such as errors, dialogs and summaries.
3. Fix verified defects within the requested scope and repeat the affected checks before accepting the candidate. Report capture, screenshot inspection and interaction verification independently. For an existing site, use the baseline and candidate comparison in [redesign.md](references/redesign.md) before accepting a visual change.
