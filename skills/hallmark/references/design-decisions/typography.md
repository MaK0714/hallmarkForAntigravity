# Typography decisions

**Start here.** Pick type for reading conditions and voice. Try the actual headline, a long label, a paragraph and the smallest table row. Preserve an established type system when working within an existing brand.

## Match face to job

| Job | Useful direction | Example candidates |
| --- | --- | --- |
| Long editorial reading | Use a text face with comfortable spacing, distinct letterforms and good italic and bold. A bookish serif suits some voices; readable sans also works. | Spectral, Crimson Text, or Source Sans 3. |
| Expressive headline | Give display type the visual voice where it has enough size. Use a quieter face for navigation and functional labels if the display face feels busy. | Instrument Serif for an editorial voice, Bricolage Grotesque for lively display, or Barlow Condensed for a compact poster title. |
| Forms, public info and small controls | Favor open shapes, legible numerals, distinguishable characters and weights that hold at small sizes. | Atkinson Hyperlegible Next, Source Sans 3, or a well-tested existing system stack. |
| Dense product UI | A versatile sans can cover headings, labels and data with weight, scale and spacing. Familiar forms help when the page has complex controls. | Geist, Inter, or the current product face. |
| Times, prices, metrics and code | Align like values. Tabular numerals can handle most timetable and number columns in a proportional face. Mono earns its space when alignment or code syntax matters. | Use `font-variant-numeric: tabular-nums` when supported. IBM Plex Mono or Geist Mono can serve code and compact captions. |

## Build a hierarchy

- Define display, section heading, body, control and caption roles from the content. A single family can be enough. Add a second when the two roles materially differ in voice or legibility. Choose real weights and italics when available.
- Use size, weight, spacing and measure together. Start prose around a comfortable 50 to 75 characters per line at about 1.45 to 1.65 line height, then adjust for the actual face and language. Labels and display text use different measures. Condensed headings need enough room to breathe.
- Make a narrow-width decision for long or translated headlines. Try it with the smallest supported viewport, larger text and fallback fonts. Use fluid sizes only when the copy and layout can grow gracefully. Let content wrap; reserve single-line labels for places where the space is dependable.
- Use case and letterspacing deliberately. Small white-on-dark labels, tightly tracked italics and thin weights can become faint even when large text nearby reads well. Repeated uppercase labels can suit a specimen tag; paragraph case serves longer reading.
- Check the character set for the actual languages, diacritics, currency, numerals and reading direction. Respect the project's font licences and delivery constraints. When a study is offline, use installed system fallbacks. For web fonts, load the families and weights you use and preview the fallback state.

## Before choosing

Read it at 375px and the densest desktop viewport. Ask what reads first, which detail the user could miss, and whether the design still feels like itself with the real text. In Odd Hours, the large italic serif sells the scale joke. Plain sans labels make filtering quick, and mono time labels make the schedule easy to scan. Those roles matter more than choosing the exact families.

Further reading: [Catalog font guidance](../fonts.md) · [USWDS typesetting](https://designsystem.digital.gov/design-tokens/typesetting/overview/) · [NHS typography rationale](https://service-manual.nhs.uk/design-system/styles/typography).
