# AGENTS.md

The addons of abap2UI5: the overview at the root of
https://abap2ui5-addons.github.io/ and one page per addon below it, at
`/<repo>/`. Built the way the entry page abap2UI5/abap2UI5.github.io is built
(Astro, no script, nothing from another origin) and in the same look, so a
reader moves between the two sites without noticing a seam. The facts of
every addon are committed as JSON, not fetched; only the stars and the last
push come from the GitHub API at build time (`scripts/stats.mjs`), and the
build does not depend on them.

## Layout

| Path | Purpose |
| --- | --- |
| `src/data/catalog.ts` | The catalogue: every addon, in groups, in order; which addon has a site of its own |
| `src/data/addons/<repo>.json` | The facts of one addon - title, tagline, summary, features, requirements, install notes, usage snippet, links, status, license |
| `src/data/addons.ts` | Reads the JSON at build time and holds it to the shape; a missing or empty file fails the build |
| `src/pages/index.astro` | The overview: the heading, then the groups with a tile per addon across the full width - no menu, no search, no prose |
| `src/pages/[repo].astro` | The addon page, one shape for all: title and tagline, the two buttons, then what it does, requirements, installation, usage, links |
| `src/components/Tile.astro` | One tile of the overview: title, tagline, badges |
| `src/components/Badges.astro` | The badge row, the same on the tile and on the addon page |
| `src/pages/search.json.ts` | What the family's search finds of this site: one entry per addon and tool (title, tagline, the five sections, the words of its facts, the repository as an action). abap2UI5/docs fetches it at build time into the one search index the home page https://abap2ui5.github.io/ and the playground read; the shape `{ site, url, entries }` is the same on every site of the family |
| `scripts/stats.mjs` | Writes `src/data/stats.json` (stars, last push) from the GitHub API; run by the workflow, never fails |
| `src/layouts/Page.astro` | The document: head, the Content-Security-Policy, the top line (the wordmark, Home and Addons as tabs), the one-line foot |
| `src/styles/global.css` | The one stylesheet; the entry page's, plus the addon page |
| `public/shots/` | Optional: `<repo>.png` (or jpg, webp, gif) is shown on that addon's page. Empty today: the README images sit on GitHub's asset host and have to be saved here by hand |
| `test/site.test.mjs` | `node:test` over `dist/` |
| `.github/workflows/pages.yml` | Build + test on every PR; deploy on main |

## Commands

```bash
npm ci
npm run dev      # dev server, http://localhost:4321/
npm run build    # dist/
npm test         # the tests, against dist/ - build first
npm run check    # build + test, what CI runs
```

## Rules

- **The catalogue and the facts are two files, on purpose.** `catalog.ts`
  places an addon (group, order, own site); `addons/<repo>.json` says what
  it is. A new addon needs both; the test fails when one is missing.
- **The facts come from the addon's README and say nothing it does not say.**
  Plain text, no markdown. An empty field is right when the README is silent -
  the page then says so in one line (`requirements`, `usage`) rather than
  inventing. `status` is `stable`, `experimental`, `archived` or `unknown`,
  as the README states it; `unknown` shows nothing.
- **Badges say only what is true.** Stars and "Active" (a push in the last 60
  days) come from the API at build time. "Beta" is `status: experimental`;
  "ABAP Cloud" (`cloud`) and "7.02" (`nw702`) are set by hand in the JSON,
  only where the README promises them - "the downport is linted" is not a
  promise. Every tile stays on the site, in the same tab, with a straight arrow (→): the developer tools have pages here too.
- **Every page has the same five sections**, `what`, `requirements`,
  `install`, `usage`, `links`, in that order, present even when thin. The
  test holds every page to them. Do not add a section to one page.
- **An entry with a site of its own** (`site` in the catalogue: abap-cloud-gui,
  and the developer tools of the abap2UI5 organization, which are listed here
  so the overview is the one place for everything around the framework) gets
  no page here: GitHub Pages serves a repository's
  project site at `/<repo>/` in front of anything this site puts there. The
  tile leads to that site and says so (`label`, default "own site").
- **No script.** The policy is `script-src 'self'` and no page ships one -
  no search, no filter, no menu of the groups on the overview: the search
  box on https://abap2ui5.github.io/ finds every addon and tool, from this
  site's `search.json`. No inline script, no `on…=` handler, no inline
  `style=""` - the test refuses them.
- **Nothing from another origin.** No CDN, no web font service, no analytics,
  no image from GitHub; the font, the logo and any screenshot are in `public/`.
- **The look is the entry page's.** `global.css` starts with a copy of
  abap2UI5/abap2UI5.github.io's stylesheet; change the shared part there
  first, then here.
- **Toolchain:** Node 22 (`.nvmrc`, `engines`), every dependency pinned
  exactly (astro 7.3.8), actions pinned to commits. Deployment needs
  Settings → Pages → Source: "GitHub Actions" once.
