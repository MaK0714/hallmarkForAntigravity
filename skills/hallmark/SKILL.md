---
name: hallmarkForAntigravity
description: "Design new websites and pages, audit rendered sites, or make scoped visual improvements. Existing sites use their own design system. Use on ordinary existing-site edits only when specifically asked to improve the design or use Hallmark. A full redesign requires an explicit request."
argument-hint: "<brief> | audit <target> | polish <target> | redesign <target>"
version: 2.0.0
---

# Hallmark

Design around what the visitor needs to do and the strongest material the project can actually show.

## Choose the scope before choosing the style

- **Audit** when asked to review, diagnose, or compare. Inspect the relevant views and report specific findings without editing the site.
- **Polish** when asked to improve an existing design or when Hallmark is named on an existing site without an explicit redesign request. Preserve the visual system, composition, copy and behavior outside the requested changes. A new page inside an established product inherits its system.
- **Redesign** only when the user explicitly asks to change the visual system or substantially recompose the page. Preserve the original as a candidate. Keep any brand, content, accessibility and behavior the request leaves in place.
- **Build** for a new design. Treat explicit user references, requirements and project styles as inputs. For a component or app screen, read only the corresponding guidance in [flow.md](references/flow.md).

## Deliver the first candidate

- **Small polish:** read the target and [redesign.md](references/redesign.md). Make the requested change in the current style, using the file tools. Skip Git history, theme selection and the gate catalogue. If baseline capture is unavailable, keep the original recoverable and treat the edit as a candidate pending review.
- **New design:** read the brief and relevant project files. Identify the visitor's task, the strongest genuine material and one direction that suits both. Write a runnable first draft with the task and its states working. Open a reference before drafting only if it resolves a concrete decision. Save optional comps, catalog exploration, legacy style diagnostics and broad critique for after the first draft. When the user supplies a reference or asks for comps first, follow that order.
- **Audit and redesign:** follow [redesign.md](references/redesign.md). An audit can start with the rendered page. A redesign preserves a recoverable original before editing.

If this is an Antigravity headless run with host verification delegated, stop the first pass once the file or requested diff exists. Report the artifact and leave visual verification pending for the host. Use the native file tools for the edit and avoid browser or environment probes during that pass.

Consult [anatomy.md](references/anatomy.md), [imagery.md](references/imagery.md), [craft.md](references/craft.md), [layout.md](references/layout.md), [responsive.md](references/responsive.md), or [interaction-and-states.md](references/interaction-and-states.md) for a decision that needs it. Use [flow.md](references/flow.md) for component, app and Antigravity-specific paths. [direction.md](references/direction.md), [macrostructures.md](references/macrostructures.md), and the [theme catalog](references/themes/README.md) are optional. For an existing system, use [design-md](references/design-md.md) or [export-formats](references/export-formats.md) when relevant.

## Verify the rendered result

1. Confirm the actual file or scoped diff exists. A success message alone is insufficient. Choose one available preview path: an available Antigravity browser, the provided host capture runner, or the local Node renderer. For the local renderer use `node <skill-dir>/scripts/sloplint.mjs <target> --advisory --require-render --json`, with `--url` for a running framework route and the appropriate scope. If a path cannot capture, use a known fallback or mark capture pending. Avoid repeated browser discovery and dependency probes.
2. Open desktop and mobile captures. Test the primary task by keyboard where applicable and exercise its empty or error state. Compare the rendered results with the visible status. For filtering, check which rows actually render rather than relying on the `hidden` attribute or count alone. Check focus, contrast, responsive layout and the facts supplied by the user.
3. Report capture, screenshot inspection and interaction verification independently. For an existing site, use the baseline and candidate comparison in [redesign.md](references/redesign.md) before accepting a visual change.
