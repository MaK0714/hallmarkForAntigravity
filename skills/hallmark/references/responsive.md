# Responsive

Use this for every new page and mobile design repair. Design the phone reading order, not just the desktop columns at a smaller width. Preserve the established desktop system during a scoped mobile repair.

## Compose for the task

Before coding, identify what a phone visitor needs first: an item, answer, status, image, or action. Choose a short sequence that gets there. A shop may need identity, a compact filter row, then products; a story may deliberately open with an immersive image. Do not impose a universal above-the-fold rule.

Look at the space before the first useful content. Repeated context banners, badges, long introductions, oversized headings and separate filter panels can consume an entire phone screen even when nothing overflows. Consolidate redundant context while preserving required facts and notices. Keep essential controls near the content they affect. Secondary filters can use a labelled disclosure when needed; two short controls that fit can stay inline.

Choose column changes from the content. A two-column pair of small controls may work on a phone; a dense desktop sidebar may need a new arrangement. Avoid blindly stacking every column or turning every region into a full-width box. Keep DOM, visual and keyboard order coherent.

## Size from real content

Use fluid type where useful and breakpoints where a component actually stops fitting. Start with modest phone gutters around 16px and gaps around 12 to 24px, then adjust to the material. Large section gaps are a deliberate storytelling choice, not the default for task interfaces. Keep reading text comfortable and controls easy to tap without inflating every label and metadata line.

- Grid tracks often need `minmax(0, 1fr)`; flex and grid children may need `min-inline-size: 0`. Long user content needs intentional wrapping.
- When a flex row becomes a column, reset any desktop `flex-basis` that would become an unwanted height. A desktop `flex: 1 1 200px` can add 200px to each stacked filter. Use a content-based basis such as `flex: 0 1 auto` where appropriate.
- Let control rows wrap before forcing labels onto awkward lines. Shorten a label only if its meaning stays clear. Apply `white-space: nowrap` only when the control itself fits; allow longer phrases and translated links to wrap naturally.
- Use `width: 100%` rather than `100vw` inside page gutters. Fix the element causing overflow; do not conceal it with page-wide `overflow-x: hidden` or `clip`.
- Images need intrinsic dimensions and responsive sizing. Use intentional mobile crops where appropriate; preserve important subjects and captions. Do not lazy-load the leading image.
- Dense tables need deliberate column priorities, labelled stacked rows or a clearly scrollable region. Preserve the information needed to understand and act on each row.

## Phone interactions

No hover-only actions. Use capability queries for hover and coarse pointers. Allow comfortable touch areas, visible focus and space between competing actions. Avoid shrinking type or tap targets to make a row fit.

Dialogs need a constrained width, scrollable content and reachable close action. Check sticky headers, bottom controls, browser chrome, the software keyboard and safe areas together. Prefer content height for task headers; use `svh` or `dvh` when viewport height is intentional. Keep focused fields visible. Respect reduced motion and avoid scroll-dependent access to essential content.

## Inspect the actual result

Capture and open 320px, 375px and 390px views, plus desktop. With `capture.mjs`, use `--sizes desktop,narrow,mobile,phone --scale 1`. The staged design runner includes these phone captures automatically. Review each width explicitly: title wrapping, header height, controls, first useful content, image crop, alignment and overflow. Inspect below the fold too. A screenshot proves appearance only; exercise the primary action, empty results, error states, dialogs and focus separately. Repeat narrow checks in revealed states.

sloplint covers mechanical problems across several widths. It cannot judge whether the phone composition wastes space, buries the task or tells the right story. An absence of lint findings is not mobile design acceptance. For longer strings, user content and larger text, check that labels, controls and reading order remain usable.
