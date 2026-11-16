# Hallmark

**A design skill for Google Antigravity that refuses to look AI-generated.**

[usehallmark.com](https://www.usehallmark.com) &nbsp;·&nbsp; fifty themes &nbsp;·&nbsp; custom on request &nbsp;·&nbsp; redesign and audit by name

Made by Together AI.

<p align="center">
  <img src="site/OG-hallmark.png" alt="Hallmark, the design skill that ends AI slop" />
</p>

Hallmark designs around the visitor's task and the strongest real material available. It uses the project's visual system for targeted edits, offers a catalog when a new design needs references, and compares desktop and mobile screenshots before keeping a change to an existing site.

## Step-by-Step: How Anyone Can Use It

If you are new to Google Antigravity plugins, here is the exact 4-step workflow:

### Step 1: Install Hallmark into Antigravity
Run these two commands in your terminal:

```bash
git clone https://github.com/MaK0714/hallmarkForAntigravity.git
cd hallmarkForAntigravity
node skills/hallmark/scripts/install.mjs
```

This installs Hallmark globally as an active Antigravity plugin with its optional themes and advisory edit-time lint hook. (Requires Node 18 or later).

### Step 2: Open Your Project in Google Antigravity
Open Google Antigravity and open any existing project folder, or create a fresh empty directory for a new site.

### Step 3: Tell Antigravity What to Build
You do not need to memorize complex CLI flags. Just prompt naturally in the chat and mention **Hallmark**:

- **Build a new website:**
  > *"Use Hallmark to build a modern SaaS landing page for an artisanal coffee roastery in Brooklyn."*
- **Redesign an existing website (keeps your logic and forms intact):**
  > *"Use Hallmark to redesign index.html with a clean editorial look."*
- **Audit your current site for AI design tells:**
  > *"Use Hallmark to audit my homepage and check for AI slop and accessibility issues."*

### Step 4: Review the result

Hallmark checks the live route at desktop and mobile widths and tests the primary interaction. The edit hook offers static diagnostics for stamped Hallmark files. Existing-site changes are kept when the before-and-after comparison shows a clear improvement in the requested area and preserves the rest of the experience.

## Themes

<table>
  <tr>
    <td width="20%"><a href="https://www.usehallmark.com/themes/dusk/"><img src="docs/screenshots/dusk.jpg" alt="Dusk theme: Closewise, bank reconciliation" /></a></td>
    <td width="20%"><a href="https://www.usehallmark.com/themes/cobalt/"><img src="docs/screenshots/cobalt.jpg" alt="Cobalt theme: Relay, a webhook API" /></a></td>
    <td width="20%"><a href="https://www.usehallmark.com/themes/studio/"><img src="docs/screenshots/studio.jpg" alt="Studio theme: Field Office, an identity studio" /></a></td>
    <td width="20%"><a href="https://www.usehallmark.com/themes/atelier/"><img src="docs/screenshots/atelier.jpg" alt="Atelier theme: Maison Orla, a fragrance atelier" /></a></td>
    <td width="20%"><a href="https://www.usehallmark.com/themes/ribbon/"><img src="docs/screenshots/ribbon.jpg" alt="Ribbon theme: Lull, a sleep sounds app" /></a></td>
  </tr>
  <tr>
    <td><b>Dusk</b><br/><sub>Closewise, bank reconciliation</sub></td>
    <td><b>Cobalt</b><br/><sub>Relay, a webhook API</sub></td>
    <td><b>Studio</b><br/><sub>Field Office, an identity studio</sub></td>
    <td><b>Atelier</b><br/><sub>Maison Orla, a fragrance atelier</sub></td>
    <td><b>Ribbon</b><br/><sub>Lull, a sleep sounds app</sub></td>
  </tr>
  <tr>
    <td width="20%"><a href="https://www.usehallmark.com/themes/furrow/"><img src="docs/screenshots/furrow.jpg" alt="Furrow theme: Fieldbook, farm records" /></a></td>
    <td width="20%"><a href="https://www.usehallmark.com/themes/dose/"><img src="docs/screenshots/dose.jpg" alt="Dose theme: Tandem, a family medication app" /></a></td>
    <td width="20%"><a href="https://www.usehallmark.com/themes/refract/"><img src="docs/screenshots/refract.jpg" alt="Refract theme: Bellwater Lido, an outdoor pool" /></a></td>
    <td width="20%"><a href="https://www.usehallmark.com/themes/vantage/"><img src="docs/screenshots/vantage.jpg" alt="Vantage theme: Swath, construction site scans" /></a></td>
    <td width="20%"><a href="https://www.usehallmark.com/themes/hedgerow/"><img src="docs/screenshots/hedgerow.jpg" alt="Hedgerow theme: Five Mile Gin, a distillery" /></a></td>
  </tr>
  <tr>
    <td><b>Furrow</b><br/><sub>Fieldbook, farm records</sub></td>
    <td><b>Dose</b><br/><sub>Tandem, a family medication app</sub></td>
    <td><b>Refract</b><br/><sub>Bellwater Lido, an outdoor pool</sub></td>
    <td><b>Vantage</b><br/><sub>Swath, construction site scans</sub></td>
    <td><b>Hedgerow</b><br/><sub>Five Mile Gin, a distillery</sub></td>
  </tr>
</table>

Ten of the fifty. Each theme offers a color palette, type choices, surfaces and an example in [`references/themes/`](skills/hallmark/references/themes/). Choose a theme by how well it serves your content and audience. See them all at [usehallmark.com](https://www.usehallmark.com).

## New and existing designs

For a new site, share the visitor's task, the brand and any product screenshots or photography. Hallmark can derive a direction from that material, or use a named theme when you request one.

For an existing site, choose the scope in Antigravity:

```
/hallmarkForAntigravity audit ./index.html
/hallmarkForAntigravity polish ./index.html: improve the mobile booking controls
/hallmarkForAntigravity redesign ./src/app: change the composition and visual system
```

An audit reports findings. Polish starts within the current visual system. An explicit redesign can change the stated composition or identity while preserving the required content and behavior. Hallmark keeps the original when a candidate introduces a material regression or the comparison is inconclusive.

## Advanced Usage & Team Setup

### Direct CLI Linting (Without Antigravity Chat)

You can run Hallmark's AST linter directly against any website folder or HTML file from your terminal:

```bash
node ~/.gemini/config/plugins/hallmarkForAntigravity/skills/hallmark/scripts/sloplint.mjs ./path-to-your-site
```

To run full browser-rendered visual checks (layout shifts, contrast at 8 screen widths, scroll bounds), ensure Chrome and `puppeteer-core` are available and pass `--require-render`:

```bash
node ~/.gemini/config/plugins/hallmarkForAntigravity/skills/hallmark/scripts/sloplint.mjs ./path-to-your-site --advisory --require-render --json
```

---

### Per-Project / Team Repository Setup

If you want Hallmark bundled directly inside a specific project repository so your entire team gets it automatically without installing global plugins:

```bash
# In your project's root folder:
mkdir -p .agents/skills
cp -r /path/to/hallmarkForAntigravity/skills/hallmark .agents/skills/hallmarkForAntigravity
node .agents/skills/hallmarkForAntigravity/scripts/install-hook.mjs
```

---

## Acknowledgements & Upstream

This project is an independent Google Antigravity port of **[Hallmark](https://github.com/Nutlope/hallmark)** created by **[Hassan El Mghari (@Nutlope)](https://github.com/Nutlope)** and the team at **Together AI**.

- **Original repository:** [github.com/Nutlope/hallmark](https://github.com/Nutlope/hallmark)
- **Original licence:** MIT Licence
- **This Antigravity port adds:**
  - Native Google Antigravity plugin and manifest architecture (`plugin.json`, `hooks.json`).
  - Automated `PostToolUse` background hook gating on every file write and edit.
  - Hardened anti-slop gates catching unverified review ratings, anonymous testimonials, glued arrow buttons, and modern AI cliches.
  - Chrome DevTools MCP visual inspection fallback.

## Inspired by

[Impeccable](https://github.com/pbakaus/impeccable) · [frontend-design](https://github.com/anthropics/claude-code/tree/main/plugins/frontend-design) · [Open Design](https://github.com/nexu-io/open-design) · [Kami](https://github.com/tw93/kami) · [taste-skill](https://github.com/Leonxlnx/taste-skill) · [huashu-design](https://github.com/alchaincyf/huashu-design) · [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) · [Emil Kowalski's skills](https://github.com/emilkowalski/skills) · [Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines)

## Licence

MIT. Use it, fork it, ship it.

The photo library (`skills/hallmark/scripts/photos.json`) lists photographs hosted on Wikimedia Commons and holds no image files. Each keeps its own licence (CC0, public domain, CC BY or CC BY-SA), and Hallmark credits every one it uses on the page. It does not use stock sites (Unsplash, Pexels, Pixabay), whose terms bar AI tools from picking their images.
