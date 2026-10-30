# AGENTS.md

The add-ons of abap2UI5: the overview at the root of
https://abap2ui5-addons.github.io/ and one page per add-on below it, at
`/<repo>/`. Built the way the entry page abap2UI5/abap2UI5.github.io is built
(Astro, no script, nothing from another origin) and in the same look, so a
reader moves between the two sites without noticing a seam. Nothing here
depends on another repository at build time: the facts of every add-on are
committed as JSON, not fetched.

## Layout

| Path | Purpose |
| --- | --- |
| `src/data/catalog.ts` | The catalogue: every add-on, in groups, in order; which add-on has a site of its own |
| `src/data/addons/<repo>.json` | The facts of one add-on - title, tagline, summary, features, requirements, install notes, usage snippet, links, status, license |
| `src/data/addons.ts` | Reads the JSON at build time and holds it to the shape; a missing or empty file fails the build |
| `src/pages/index.astro` | The overview: the greeting, the groups, a tile per add-on - no prose |
| `src/pages/[repo].astro` | The add-on page, one shape for all: title and tagline, the two buttons, then what it does, requirements, installation, usage, links |
| `src/components/Tile.astro` | One tile of the overview |
| `src/layouts/Page.astro` | The document: head, the Content-Security-Policy, the top line (abap2UI5, GitHub, and the way back on an add-on page), the one-line foot |
| `src/styles/global.css` | The one stylesheet; the entry page's, plus the add-on page |
| `public/shots/` | Optional: `<repo>.png` (or jpg, webp, gif) is shown on that add-on's page. Empty today: the README images sit on GitHub's asset host and have to be saved here by hand |
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
  places an add-on (group, order, own site); `addons/<repo>.json` says what
  it is. A new add-on needs both; the test fails when one is missing.
- **The facts come from the add-on's README and say nothing it does not say.**
  Plain text, no markdown. An empty field is right when the README is silent -
  the page then says so in one line (`requirements`, `usage`) rather than
  inventing. `status` is `stable`, `experimental`, `archived` or `unknown`,
  as the README states it; `unknown` shows nothing.
- **Every page has the same five sections**, `what`, `requirements`,
  `install`, `usage`, `links`, in that order, present even when thin. The
  test holds every page to them. Do not add a section to one page.
- **An add-on with a site of its own** (`site` in the catalogue, today only
  abap-cloud-gui) gets no page here: GitHub Pages serves a repository's
  project site at `/<repo>/` in front of anything this site puts there. The
  tile leads to that site and says so.
- **No script.** The policy is `script-src 'self'` and the pages ship none:
  no inline script, no `on…=` handler, no inline `style=""`.
- **Nothing from another origin.** No CDN, no web font service, no analytics,
  no image from GitHub; the font, the logo and any screenshot are in `public/`.
- **The look is the entry page's.** `global.css` starts with a copy of
  abap2UI5/abap2UI5.github.io's stylesheet; change the shared part there
  first, then here.
- **Toolchain:** Node 22 (`.nvmrc`, `engines`), every dependency pinned
  exactly (astro 7.3.8), actions pinned to commits. Deployment needs
  Settings → Pages → Source: "GitHub Actions" once.
