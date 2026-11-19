# Component choice and placement

**Start here.** Place each component at the moment the visitor needs it. Map the path from arrival through the first action, decision, feedback and recovery. Put the source of truth for each state near the control that changes it.

## Page structure by job

| Visitor job | Useful sequence and placement |
| --- | --- |
| Learn about an offer | Identity and orientation in the header. In the opening, say who it is for and show a genuine example. Put the next action alongside the evidence someone needs before acting. Use later sections to answer independent questions. |
| Attend or book | Lead with the event, date, place and verified terms. Make the programme or booking path quickly reachable. Show the time, location and availability where a person compares options. Put verified access and arrival details before a commitment when they affect feasibility. Keep session time, title and status at the granularity the brief supplies. Add speakers, rooms, queue rules and transport only with project evidence. |
| Buy or compare | Put imagery and selected variant, price, stock and purchase action together. Keep variant-specific changes in that area. Make shipping and return terms easy to reach. Put specifications where they help compare. |
| Read or explore | Use the heading and lead to tell readers where they are. Place byline, date, navigation and references where they support the material. Use in-page navigation for longer documents with distinct sections. |
| Complete a transaction | Name the task, prerequisites and consequence before the entry control. Place questions in reading order and put Continue or Submit after the fields it acts on. Put guidance next to the field or decision, and show errors where visitors can repair them. Confirm what happened and what comes next. |
| Use a dashboard or tool | Keep context and important actions near the workspace. Group filters above the results they affect. Keep units, time range, comparison and selection near the chart or table. Use consistent status and recovery near the affected area. |

## Choose the control

| Need | Component and expected location |
| --- | --- |
| Navigate to a destination | Use a link, including a visually prominent link that jumps to a programme. Use a button for an in-place action, submit or state change. Put repeated primary actions only where a visitor reaches a new decision. |
| Offer a handful of mutually exclusive choices | Use visible radios when choices should be compared. Use a select to conserve space when labels are familiar. Use tabs for views within one context, with an obvious active view and keyboard behavior. |
| Apply independent filters | Use labelled checkboxes beside the list or chart. Include live result count, visible applied state, reset and an empty state near the results. Preserve the query when that supports a visitor returning to the list. |
| Change a persistent immediate setting | Use a switch with a clear current state. Use a checkbox when the change only takes effect on submit. |
| Compare structured values | Use a real table with headers when alignment conveys meaning. Use a list for sequence and cards for self-contained items. At narrow sizes, preserve labels and comparisons; use deliberate horizontal scrolling for tabular content that needs it. |
| Disclose secondary detail | Use inline disclosure when it should stay in context. Use a page for deep, linkable content. Use a modal for a focused isolated interaction, with clear name, a close control, initial focus, Escape where applicable and focus restoration. |
| Show attention or feedback | Place field errors by the field and offer summary/navigation for longer forms. Use status text near results. Reserve a banner for a page- or site-wide condition. Toasts can acknowledge actions; durable errors need a durable place. |
| Provide help | Put a short instruction where it is needed. Use visible text for information essential to completing a task. Tooltips serve supplementary details. Put contact, legal and secondary routes in the footer or context where visitors look for them. |

## Check placement in the render

Follow the visitor's first task in the render. Then compare every operational claim and action destination against the brief. At narrow widths, check both whether the first action is visible and how far the useful content sits below it. Keep the visual and keyboard order aligned. If two components convey the same information or compete for the same action, simplify the sequence. On sticky controls, check viewport space, focus visibility and zoom. In the Odd Hours comparison a prominent mobile CTA still led to a first session at 2,032px. The finished design made the same next action explicit and reduced the amount of content before the rows.

Inspect loading, empty, error, success and disabled states that the real workflow can reach. A filtered list should hide actual rows, update its status and offer a working reset. Details controls should open the right record. Click through intent, state and recovery on desktop and mobile; read the result rather than relying on the presence of a selector.

Further reading: [GOV.UK start-service pattern](https://design-system.service.gov.uk/patterns/start-using-a-service/) · [Interaction and states](../interaction-and-states.md) · [Responsive layout](../responsive.md) · [Native component patterns](../patterns.md).
