// What the built site must keep, read off dist/ after `npm run build`.
// node:test, no browser: the pages are static HTML, so the properties worth
// holding are in the files - every addon of the catalogue has a tile and a
// page, every page has the same sections, no script, nothing loaded from
// outside dist/.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const DIST = path.join(import.meta.dirname, "..", "dist");
const home = fs.readFileSync(path.join(DIST, "index.html"), "utf8");
const facts = fs.readdirSync(path.join(import.meta.dirname, "..", "src", "data", "addons")).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));
const catalog = fs.readFileSync(path.join(import.meta.dirname, "..", "src", "data", "catalog.ts"), "utf8");
const own = [...catalog.matchAll(/repo: "([^"]+)", site: "([^"]+)"/g)].map((m) => [m[1], m[2]]);
const hosts = ["abap2ui5.github.io", "abap2ui5-addons.github.io", "github.com/abap2UI5"];
const pages = facts.filter((r) => !own.some(([o]) => o === r));

function noScript(html, name) {
  // the one script allowed is the menu marker, a file of this origin
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    assert.match(m[1], /\ssrc="\/toc\.js"/, `${name}: a script other than /toc.js`);
    assert.equal(m[2].trim(), "", `${name}: inline script code`);
  }
  assert.doesNotMatch(html, /\son[a-z]+=/i, `${name}: an inline event handler`);
  assert.doesNotMatch(html, /\sstyle="/i, `${name}: an inline style the policy would refuse`);
  const csp = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/);
  assert.ok(csp, `${name}: a Content-Security-Policy meta`);
  assert.match(csp[1], /script-src 'self'(;|$)/);
}
function localOnly(html, name) {
  for (const ref of [...html.matchAll(/\s(?:src|href)="([^"#]+)"/g)].map((m) => m[1]).filter((u) => u.startsWith("/"))) {
    const file = path.join(DIST, ref.slice(1) || "index.html");
    const target = fs.existsSync(file) && fs.statSync(file).isDirectory() ? path.join(file, "index.html") : file;
    assert.ok(fs.existsSync(target), `${name}: ${ref} is not in dist/`);
  }
  for (const m of html.matchAll(/\s(?:src)="(https?:[^"]+)"/g)) assert.fail(`${name} loads ${m[1]}`);
  assert.doesNotMatch(html, /rel="stylesheet" href="https?:/);
}

test("every addon in the catalogue has a fact file, and every fact file is in the catalogue", () => {
  const listed = [...catalog.matchAll(/repo: "([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual([...listed].sort(), [...facts].sort());
  assert.ok(facts.length >= 20, `${facts.length} addons`);
});

test("the overview is the greeting and a tile per addon", () => {
  assert.match(home, /<h1 class="welcome">[\s\S]*Addons &amp; Tools/);
  for (const r of pages) assert.match(home, new RegExp(`<a class="tile inside" href="/${r}/">`), `a tile for ${r}, in the same tab`);
  assert.doesNotMatch(home, /<a class="tile[^"]*"[^>]*target="_blank"/, "no tile leaves in a new tab");
  assert.ok((home.match(/class="badge beta"/g) || []).length >= 3, "the beta addons say so");
  assert.ok((home.match(/class="badge cloud"/g) || []).length >= 8, "the ABAP Cloud addons say so");
  for (const [r, site] of own) {
    assert.match(home, new RegExp(`<a class="tile inside" href="${site.replace(/[./]/g, "\\$&")}"`), `${r} leads to its own site`);
    assert.ok(hosts.some((h) => site.includes(h)), `${r}: ${site} is not one of the project's places`);
  }
  assert.doesNotMatch(home, /<header|<nav class="nav"|class="intro"/, "no header, no prose");
  const toc = home.match(/<nav class="toc"[^>]*>([\s\S]*?)<\/nav>/);
  assert.ok(toc, "a menu of the groups");
  for (const id of [...catalog.matchAll(/id: "([^"]+)"/g)].map((m) => m[1])) {
    assert.match(toc[1], new RegExp(`href="#${id}"`), `the menu links #${id}`);
    assert.match(home, new RegExp(`<section class="group" id="${id}"`), `#${id} is a section`);
  }
  assert.ok(fs.existsSync(path.join(DIST, "toc.js")), "toc.js is published");
  // no search of its own: the box on the entry page finds every addon (search.json)
  assert.doesNotMatch(home, /<form|role="search"|filter\.js/, "no search on the overview");
  assert.ok(!fs.existsSync(path.join(DIST, "filter.js")), "filter.js is gone");
  assert.match(home, /<nav class="sites"[\s\S]*href="https:\/\/abap2ui5\.github\.io\/">Home<\/a>[\s\S]*\/<\/span>\s*<span aria-current="page">Addons &amp; Tools<\/span>/, "the breadcrumb reads Home / Addons & Tools, Addons current");
  noScript(home, "index");
  localOnly(home, "index");
});

test("every addon page is built in the same shape", () => {
  for (const r of pages) {
    const file = path.join(DIST, r, "index.html");
    assert.ok(fs.existsSync(file), `${r}/ is built`);
    const html = fs.readFileSync(file, "utf8");
    for (const id of ["what", "requirements", "install", "usage", "links"]) assert.match(html, new RegExp(`<section class="part" id="${id}"`), `${r}: #${id}`);
    assert.match(html, new RegExp(`https://github.com/abap2UI5(-addons)?/${r}"`), `${r}: links its repository`);
    assert.match(html, /<a href="\/">Addons &amp; Tools<\/a>[\s\S]*<span aria-current="page">[^<]+<\/span>/, `${r}: leads back to the overview, the addon current`);
    assert.match(html, /<link rel="canonical" href="https:\/\/abap2ui5-addons\.github\.io\/[a-zA-Z0-9-]+\/">/, `${r}: canonical`);
    noScript(html, r);
    localOnly(html, r);
  }
  for (const [r] of own) assert.ok(!fs.existsSync(path.join(DIST, r)), `${r} has its own site, no page here`);
});

test("the canonical address of the overview is the published one", () => {
  assert.match(home, /<link rel="canonical" href="https:\/\/abap2ui5-addons\.github\.io\/">/);
});

test("the search feed: every addon and tool once, leading to its page or its own site", () => {
  const feed = JSON.parse(fs.readFileSync(path.join(DIST, "search.json"), "utf8"));
  assert.equal(feed.site, "Addons & Tools");
  assert.equal(feed.url, "https://abap2ui5-addons.github.io/");
  assert.deepEqual(feed.entries.map((e) => e.code).sort(), [...facts].sort(), "one entry per addon");
  for (const e of feed.entries) {
    assert.ok(e.title && e.text, `${e.code}: a title and a line`);
    const ownSite = own.find(([r]) => r === e.code);
    if (ownSite) assert.equal(e.url, ownSite[1], `${e.code}: its own site`);
    else {
      assert.equal(e.url, `https://abap2ui5-addons.github.io/${e.code}/`, `${e.code}: its page here`);
      const html = fs.readFileSync(path.join(DIST, e.code, "index.html"), "utf8");
      for (const [, anchor] of e.headings) assert.match(html, new RegExp(`id="${anchor}"`), `${e.code}#${anchor}`);
    }
    assert.ok(e.links.length && e.links.every((l) => hosts.some((h) => l.url.includes(h)) || l.url.startsWith("https://github.com/abap2UI5-addons/")), `${e.code}: the repository`);
  }
});
