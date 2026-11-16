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

## After

1. Capture the candidate from the same views and states as the baseline. Open both sets and compare the changes in context. Retest affected interactions and run the project's checks when available. If a before inventory exists, use `sloplint <target> --advisory --require-render --kept` with the same paths and routes. A passing inventory is supplementary evidence.
2. Give a verdict per changed route or independently reversible change. For polish, name what improved in the requested area. For redesign, name how the candidate better meets the new brief. Check control discoverability, legibility, character, responsive layout and behavior. Describe where the original is stronger. If a fresh reviewer is available, give them both screenshot sets and the requested outcome for a second read.
3. Keep only changes with an observable improvement and no material regression in the preserved qualities. Fix a regression and compare again, or manually undo only the candidate changes that caused it. When the result is a tie, screenshots cannot be reviewed, or important behavior is unverified, keep the original as the active design. If useful, show an isolated candidate with its open verification gap.
4. Report whether the original or candidate was kept, the evidence for that decision and the extent of visual and interaction verification.
