// The add-ons of abap2UI5 - the overview at the root of
// https://abap2ui5-addons.github.io/ and one page per add-on below it,
// published by GitHub Pages (.github/workflows/pages.yml). The pages are
// built from src/data/addons/*.json; nothing here depends on another
// repository at build time.
//
// Static output only: no client component, no island, no script at all; the
// policy is `script-src 'self'` (src/layouts/Page.astro), and
// test/site.test.mjs fails a build with any script.
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://abap2ui5-addons.github.io",
  base: "/",
  trailingSlash: "ignore",
  build: {
    format: "directory",
    assets: "assets",
    // one stylesheet file, cached, rather than a <style> per page
    inlineStylesheets: "never",
  },
  devToolbar: { enabled: false },
  markdown: { syntaxHighlight: false },
});
