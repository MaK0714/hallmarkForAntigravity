# Existing designs

## Before

Read the requested scope, the relevant route and its implementation. Identify the visitor's task, the problem to solve, and specific strengths to keep. Record the affected files, the approved scope, and any existing user edits before changing code.

For a narrow polish, inspect the target markup and rule. A recoverable copy or the original text of the edited block is enough for rollback. Git history has no role unless the requested change depends on it. An existing baseline or a host runner can supply the before capture. Use a separate candidate when verification is delegated and the original must remain active.

Capture the actual baseline at matching desktop and mobile viewport sizes, data, theme and states. Keep screenshots outside the implementation diff. Record the interactions to retest, such as the primary action, navigation or form submission. For a local target, `sloplint <target> --advisory --require-render --before` can take screenshots and record markup and wiring. Use the live URL for framework pages. Antigravity's browser is the fallback for screenshots and interaction checks. A URL without editable source is an audit target.

## Audit

Inspect the baseline. Report the specific problem, its effect on the visitor, evidence with the route and viewport, and the smallest repair. Give a concrete example of what already works. Stop at the report.

## Polish

Use the current components, styles and tokens. Change the smallest surface that solves the stated problem. Preserve layout, identity, copy, states and wiring unless the request changes them. Fix a visual lint finding only when it explains a defect the visitor can see or experience. Keep intentional details such as editorial labels, dense workflows and brand typography.

## Redesign

Recompose only the requested routes or elements. Preserve required facts, content and established brand assets, routes, forms, analytics and component behavior. Start from the original and work in a reversible candidate. Use a scratch worktree or copy if helpful, or record a scoped diff that can undo your own edits without touching existing user changes. Keep the baseline runnable until the candidate is accepted. A user-requested new direction can change deliberate visual choices within scope.

## Creative direction before recomposition

Use this path when the user requests a stronger, more distinctive design or rejects the current composition as generic. Keep ordinary polish small. Preserve factual content, task behavior and binding brand constraints; existing section order, hero layout and card choices are revisable within the requested page.

Before editing, write three short structural directions, about 200 words total. Each names the visitor's route, the organizing idea, the main component choice and a tradeoff. A palette, font swap or decoration applied to the same layout is not a different direction. Derive options from this brief's material, not a fixed set of fashionable templates. Do not build three complete sites or pause for a choice unless the user asks. Select the direction that best serves the task and emotional intent.

Read the design case index and open one or two relevant cases. State one concrete transfer, the component it changes and why it suits this brief. Borrow the reasoning rather than a site's brand, assets or unsupported claims. A reference name in a receipt does not establish a useful transfer.

Before implementation, name the existing components to remove, merge, reorder or replace and the visible structural consequence. A split hero plus repeated cards does not become a new structure by adding labels called ledgers or tickets. Judge the actual reading order and component behavior, not the name of the concept. Implement the chosen composition in a reversible candidate. A visitor should be able to see the proposed structural difference in the rendered page. Keep the entire directions and selection handoff under 350 words, outside production UI. Do not repeat the full brief or DOM contract in this note. Native headless runs write the candidate and leave rendering to the host; unavailable screenshot tools do not justify a shell-discovery loop.

Compare matching views of original and candidate. Evaluate task reach, reading order, expressive specificity, component usefulness and all required interaction states. Explain where the new structure improves the task and where the original is stronger. Reject decorative churn and new regressions. Do not equate a changed layout with a better design or a passing behavior suite with originality.

## After

1. Capture the candidate from the same views and states as the baseline. Open both sets and compare the changes in context. Retest affected interactions and run the project's checks when available. If a before inventory exists, use `sloplint <target> --advisory --require-render --kept` with the same paths and routes. A passing inventory is supplementary evidence.
2. Give a verdict per changed route or independently reversible change. For polish, name what improved in the requested area. For redesign, name how the candidate better meets the new brief. Check control discoverability, legibility, character, responsive layout and behavior. Describe where the original is stronger. If a fresh reviewer is available, give them both screenshot sets and the requested outcome for a second read.
3. Keep only changes with an observable improvement and no material regression in the preserved qualities. Fix a regression and compare again, or manually undo only the candidate changes that caused it. When the result is a tie, screenshots cannot be reviewed, or important behavior is unverified, keep the original as the active design. If useful, show an isolated candidate with its open verification gap.
4. Report whether the original or candidate was kept, the evidence for that decision and the extent of visual and interaction verification.

## Verify the visitor outcome

Before polish, name the observed defect and the expected visitor benefit. Increasing font sizes, padding or control dimensions alone is not an acceptance criterion. Compare the first useful item position, primary anchor landing and action visibility at matching phone and desktop widths. If useful content moves farther away, explain the tradeoff and demonstrate the benefit before accepting it. Check header wrapping at 320px and 375px.

After filtering, saving and resetting, scroll to secondary actions and inspect their actual pointer targets. Sticky headers must not cover anchor headings, focused controls or button centers. Test both pointer activation and keyboard focus. A correct event listener does not establish that a control is reachable. Use scroll margins or remove unnecessary sticky behavior as appropriate to the existing design.

Compare image captions and operational copy against the brief and asset provenance. A generated illustration cannot establish venue, equipment, process or customer facts. Preserve creative tone without adding unsupported specifics.
