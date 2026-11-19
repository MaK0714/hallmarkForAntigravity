# Color decisions

**Start here.** Assign color roles to the visitor's task. Choose a surface that suits the subject, readable ink, and a signal for the next action. Validate those pairs before refining the palette.

## What you can change

| Property | What to look for |
| --- | --- |
| Lightness | Builds hierarchy and separates foreground from surface. Set the readable range before tuning hues. Check a grayscale preview to see where important elements merge. |
| Hue | Relates colors to each other, the brand and the imagery. Extract a hue from genuine material when possible. A hue's associations change with culture, subject and surroundings. |
| Chroma | Controls intensity. Give intense color a reason, such as identifying an active control or expressing the character of an illustration. A large saturated field has a different effect from a small swatch. |
| Proportion and adjacency | Adjust the amount and location of color. A quiet surrounding makes a small accent more noticeable. Evaluate it beside the real image and surface. |

## Choose a relationship

- **One hue plus neutrals** gives a transactional UI a clear hierarchy or an editorial page a specific atmosphere. Vary lightness enough to keep levels distinct.
- **Neighboring hues** make related surfaces feel coherent. Give texts, controls and data enough contrast or an extra cue when the hues are similar.
- **Complementary or split-complementary accents** can create tension or sharply separate tasks. Give each hue a role. A strong field and smaller signal often read more clearly than two equally intense surfaces.
- **Triadic or other multi-hue palettes** fit a playful brand, category system or illustration. Assign a stable job to each hue and check that a new visitor still knows what to click first.
- **Warm and cool surfaces** can create a sense of material. In Odd Hours, the cool dark gallery held the object art. Warm paper made the schedule easier to scan. The yellow strip grouped arrival facts, and a yellow button made the jump to the programme recognizable. These are jobs the colors do on this page.

## Role pairs

Start with canvas, surface, ink, secondary ink and a divider. Pair an action fill with its label. Add focus, selection, error, success or warning tokens as states earn them. Check separate pairs on dark, light and colored surfaces. A dark theme needs its own hierarchy and states. For charts, start with a scale suited to the data: distinct hues for categories, ordered lightness for magnitude, and two directions around a meaningful midpoint. Label or otherwise distinguish values that need to survive color loss.

Use perceptual lightness and chroma when tuning a family in OKLCH. Review the final in-gamut browser output on its real background. Contrast ratios use relative luminance. A difference between OKLCH lightness values or attractive complementary hues gives no contrast result on its own.

## Verify

- WCAG 2.2 AA uses at least **4.5:1** for ordinary text and **3:1** for qualifying large text (at least 18pt regular or 14pt bold, or equivalent). WCAG uses **3:1** against adjacent colors for required visual cues in applicable controls, states and essential graphics. Check the standard for scope and exceptions. Test normal, hover, focus, selected and error on the surfaces where they appear. [Text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) · [Non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- Check tinted inputs, small secondary labels, placeholder, overlay text and focus rings in the browser. On gradients or images, examine the least favorable portion behind text. Use a stable text surface or scrim when the background varies.
- Give statuses such as Sold out or Error readable labels. Reinforce relevant meaning with an icon, shape, pattern or position. [WCAG use of color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)
- Check forced colors where practical. Preserve semantic controls and a visible outline.

For a catalog palette recipe, see [craft.md](../craft.md#2-colour). For real applications, compare [BAGGU](../design-cases/baggu.md), [NHS](../design-cases/nhs.md), and [Our World in Data](../design-cases/our-world-in-data.md).
