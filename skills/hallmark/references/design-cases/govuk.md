# GOV.UK | Public services and nonprofits

**Borrow the move.** Give a transaction a clear threshold. Name the outcome, tell the visitor what to have ready, then give them one obvious way to begin.

### Intent and emotional register

A visitor wants to resolve a specific question about a vehicle quickly. The start page lowers uncertainty by naming the task, stating what evidence is needed and clarifying that records can lag. The emotional effect is predictability. The interface has little interest in entertaining the visitor during a consequential task.

### Observed decisions

| Decision | What it does |
| --- | --- |
| Header, breadcrumb and page title | Identity and hierarchy help a deep-link visitor know where they landed. The title uses the visitor's verb and identifies the exact outcome. |
| Lead, caveat and checklist detail | The page gives the required number plate and a condition under which the result can be delayed. These details prepare the visitor before the next screen. |
| Primary link | The green Start now control links to the separate transaction. Nearby text names the destination. Secondary tasks use ordinary links, including a Welsh-language route and a related but different vehicle check. |
| First form screen | The public destination document shows a single registration-number question, carrying the start-page promise forward. The browser probe received a 403 on that endpoint. The form interaction remains unverified. |
| Type, layout and mobile | The sampled title declared GDS Transport at 48px desktop and 32px mobile. A constrained text column reads sequentially; related material sits to the side on desktop. In the phone capture the green action became full-width and followed the prerequisites, even with a consent confirmation above the header. |

### Author-stated rationale and motion

The service design guidance calls for just enough eligibility and prerequisite information and an action label that fits the task. This explains the start-page pattern directly, independently of visual interpretation. No running CSS motion was observed in the sampled opening. Navigation to a new route is the meaningful change. Preserve an accessible result and error summary for a form built from this pattern.

### Transfer

Use this flow for permits, applications, directories, membership renewals or service eligibility. Repeat the unit of information and its expected format at the input. For a lighter consumer experience, keep the sequence and bring in a project-specific visual voice outside the critical action.

Sources: [Live start page](https://www.gov.uk/check-vehicle-tax) · [First transaction screen](https://vehicleenquiry.service.gov.uk/) · [GOV.UK start-service pattern](https://design-system.service.gov.uk/patterns/start-using-a-service/).
