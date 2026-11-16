# Flow branches

The parts of the flow only some builds reach. Read the section you are in and nothing else.

## Component scope

Signals: the prompt names one element (button, input, form, card, modal, dropdown, tooltip, select, checkbox, switch, tab strip, chip, badge, banner, snackbar, popover, slider, date picker, avatar, a single nav or footer); the prompt is short and refers to one element; the target file is one component; the user says "just the X". Two signals: component. Ambiguous ("a pricing section"): ask once, *One pricing card, or the whole pricing page?*, defaulting to component.

**Keeps:** project conventions and existing tokens. Render the states the component actually needs, including keyboard focus and applicable loading, empty, error and success states. See [interaction-and-states.md](interaction-and-states.md).

**Skips:** macrostructure, nav and footer, hero, imagery, the multi-section preview, and the log append (components do not rotate).

Use the project's normal component preview or route. Verify it at desktop and mobile in context. Use `--scope component` when linting a standalone preview.

## App screens

A dashboard, an admin, a settings page, a tool: a screen someone works in rather than reads. Signals: the prompt says app, dashboard, admin, console, settings or tool; the target sits behind a sign-in; the screen is tables, forms and controls. The bar is earned familiarity: the tool disappears into the task, and someone fluent in the category trusts it at once. Use `--scope app` for the browser checks. Begin with the core workflow and existing shell.

What takes their place:

- **Use a coherent palette, typography and surfaces.** A compact scale and a familiar typeface often keep controls and data legible. Use existing tokens when available.
- **Colour is restrained.** Use accent and surface contrast to make primary actions, selections, and states easy to distinguish.
- **The shell is the project's own.** A new one is a top bar; a sidebar is earned by more than about seven destinations, never reached for by reflex, and it collapses to a menu under 60rem. Standard patterns (tabs, breadcrumbs, a command palette) beat invented ones, and a modal is the last answer, after inline editing and disclosure.
- **Density is the design.** Controls 32 to 40px with a 44px hit target, one container recipe, tables before cards (a table may run wider than any prose measure), and [craft.md](craft.md) § 9 for controls, inputs, tables and stat rows.
- **Every region that loads data has four states:** loading (a skeleton in the shape of what is coming), empty (what belongs here and the one action that fills it), error (what broke and what to do) and full, per `interaction-and-states.md`. A build that draws only the full state has drawn a quarter of the screen; a redesign draws the states the app has logic for and lists the rest for the owner.
- **Preserve useful state** such as shareable filters and pagination. Give users clear feedback and recovery for destructive actions when relevant.
- **Motion is state, never decoration:** `--dur-micro` and `--dur-short`, nothing orchestrated.
- **Figures are the product's own.** A stat is a figure and its label in tabular numerals; no icon tile, no gradient, no trend arrow nobody measured (46a); on a redesign a figure the screen already shows stays and goes to the owner (`redesign.md`).
- **The signature** is still owed: the one object this tool is known by (the ledger, the timeline, the queue), not a greeting above four stat cards.

## Antigravity execution

- The workspace skill lives under `.agents/skills` and the installed copy is generated from the same source. Select a single copy in Antigravity customizations when possible.
- The edit-time hook listens for `write_to_file`, `replace_file_content` and `multi_replace_file_content`, plus the CLI forms `write_file` and `edit_file`. Its diagnostics are advisory. Run the final checks explicitly.
- The local renderer needs Node 18 or newer, Chrome or Chromium and `puppeteer-core`. It also accepts `CHROME_PATH` and `HALLMARK_PUPPETEER`. With `--require-render`, incomplete capture fails the command. Its output records the screenshots produced by that invocation.
- In an Antigravity headless run with a host verifier, make the draft or scoped edit with native file tools and hand it off. The host opens the route and captures desktop and mobile outside the agent shell sandbox. In an interactive run, use the available Antigravity browser or a working local renderer. One failed path is enough to switch to a provided fallback or report capture pending. `--render-mcp` prints a plan.
- Inspect the images before making a visual claim. Use [review-hero.md](review-hero.md) for competing first screens or [review-finish.md](review-finish.md) for a fresh review when available. Include the requested scope, actual screenshots and any baseline. A reviewer can give feedback in fresh context if the harness supports it. The main agent can also review the images itself.

## Optional references

Use [brand-truth.md](brand-truth.md) for verified brand assets, [fonts.md](fonts.md) for typography, [patterns.md](patterns.md) for component examples, [gates.md](gates.md) to interpret linter diagnostics, [comp.md](comp.md) for optional image-assisted exploration, or a relevant genre recipe ([editorial](genres/editorial.md), [minimal](genres/modern-minimal.md), [playful](genres/playful.md), [atmospheric](genres/atmospheric.md)) for examples. Optional references supply ideas and diagnostics. The scope, review and preservation rules in the entry point govern delivery.
