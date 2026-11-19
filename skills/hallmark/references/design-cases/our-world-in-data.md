# Our World in Data | Dashboards and web apps

**Borrow the move.** Let a chart answer one concrete question immediately. Give the reader controlled ways to compare, inspect values, and trace the source.

### Intent and emotional register

A reader wants to understand how life expectancy changes over time and compare places. A researcher may need the exact data and the reasons for discontinuities. The design balances curiosity with evidence: the plot draws the eye, and an adjacent definition tells the visitor what the quantity means. Trust comes from accessible provenance and scale labels.

### Observed decisions

| Decision | What it does |
| --- | --- |
| Chart title and definition | A plain subject and a short definition establish the claim and unit before interaction. They give screenshots and exported views a stable frame. |
| View controls | Table, map, line and bar controls support different reading questions. Keep the chosen entity, unit and time window visible when switching. Clicking Table changed the URL and rendered named rows with exact values and trend lines. This supports exact-value questions without forcing a hover. |
| Country and time controls | The sampled desktop chart places country selection beside the plot. On the phone it uses a compact Edit countries route. A time range remains close to the plot, with labeled endpoints and a play affordance. |
| Legend and annotations | Direct color labels and visible axis units tie series to meaning. The explanatory notes add caveats and context for interpreting large breaks. |
| Export and provenance | The source offers full and currently displayed data as distinct downloads. Its metadata shows units, update information, sources and processing. Keep the current filter scope explicit on exports. |
| Typography | The chart title declares Playfair Display and the controls declare Lato. The serif title signals editorial subject, while the sans utility text stays compact for exploration. |

### Motion and tradeoffs

Play time-lapse is optional, visible motion for changing the time dimension. The line view already tells the main story in a static state. In the browser the Play control changed to Pause, and clicking Pause returned it to Play. Timing, behavior beyond pausing and reduced motion were outside the verified sample. For adaptation, support pause, manual time control and an equivalent static view. Dense controls can crowd a narrow viewport. Prioritize chart and current selection before additional settings.

### Transfer

Start a dashboard with a default question and one useful comparison. Add shareable selections or exports when the task calls for them. Verify that visible rows, legend, summary text and download scope stay in agreement after filtering.

Sources: [Interactive chart and metadata](https://ourworldindata.org/grapher/life-expectancy) · [Grapher chart and export documentation](https://docs.owid.io/projects/etl/api/chart-api/).
