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

function noScript(html, name, { search = false } = {}) {
  // no script but the search box: public/filter.js, a module of this
  // origin that narrows the tiles, on the overview only
  if (search) {
    assert.equal((html.match(/<script\b/gi) || []).length, 1, `${name}: one script`);
    assert.match(html, /<script type="module" src="\/filter\.js"><\/script>/, `${name}: the search module`);
    html = html.replace(/<script type="module" src="\/filter\.js"><\/script>/, "");
  }
  assert.doesNotMatch(html, /<script\b/i, `${name}: a script`);
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
    // the site of its own leaves this site: the arrow out, rel="external", same tab
    assert.match(home, new RegExp(`<a class="tile" href="${site.replace(/[./]/g, "\\$&")}" rel="external">`), `${r} leads to its own site, marked as leaving`);
    assert.ok(hosts.some((h) => site.includes(h)), `${r}: ${site} is not one of the project's places`);
  }
  assert.doesNotMatch(home, /<header|<nav class="nav"|class="intro"/, "no header, no prose");
  for (const id of [...catalog.matchAll(/id: "([^"]+)"/g)].map((m) => m[1])) {
    assert.match(home, new RegExp(`<section class="group" id="${id}"`), `#${id} is a section`);
  }
  assert.doesNotMatch(home, /<nav class="toc"|toc\.js/, "no menu of the groups");
  // the search box narrows the tiles of this page (public/filter.js): every
  // tile carries what it is searched by
  assert.match(home, /<div class="search" id="search" role="search" hidden>/, "the search box");
  assert.doesNotMatch(home, /<form/, "no form");
  assert.ok(fs.existsSync(path.join(DIST, "filter.js")), "filter.js");
  const tiles = (home.match(/<a class="tile/g) || []).length;
  assert.ok(tiles >= 20, `${tiles} tiles`);
  assert.equal((home.match(/<li data-search="/g) || []).length, tiles, "every tile can be searched");
  assert.match(home, /<nav class="sites"[\s\S]*href="https:\/\/abap2ui5\.github\.io\/">Home<\/a>[\s\S]*\/<\/span>\s*<span aria-current="page">Addons &amp; Tools<\/span>/, "the breadcrumb reads Home / Addons & Tools, Addons current");
  noScript(home, "index", { search: true });
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

test("the namespaces page lists every repository and no object is in two of them", () => {
  const html = fs.readFileSync(path.join(DIST, "namespaces", "index.html"), "utf8");
  noScript(html, "namespaces");
  localOnly(html, "namespaces");
  const data = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, "..", "src", "data", "objects.json"), "utf8"));
  assert.ok(data.repos.length >= 20, `${data.repos.length} repositories`);
  for (const r of data.repos) assert.match(html, new RegExp(`<summary>${r.repo} `), `${r.repo} is listed`);
  // the same object in two repositories: installed together, the second
  // overwrites the first
  const seen = new Map();
  for (const r of data.repos) for (const o of r.objects) {
    const k = `${o.type} ${o.name}`;
    assert.ok(!seen.has(k) || seen.get(k) === r.repo, `${k} is in ${seen.get(k)} and ${r.repo}`);
    seen.set(k, r.repo);
  }
  // linked from the abap2UI5 documentation (resources/addons), not from the overview
});

test("the old addresses of renamed addons land on the 404 page, which forwards them", async () => {
  const page = fs.readFileSync(path.join(DIST, "404.html"), "utf8");
  assert.match(page, /<script type="module" src="\/moved\.js"><\/script>/, "the forwarder");
  assert.match(page, /<meta name="robots" content="noindex">/);
  assert.match(page, /href="\/embed-excel\/"/, "a link for a reader without script");
  const { movedTo } = await import(path.join(DIST, "moved.js"));
  assert.equal(movedTo("/office-addin/guide/install"), "/embed-excel/guide/install");
  assert.equal(movedTo("/embed-control"), "/embed-ui5-control/");
  assert.equal(movedTo("/embed-controls/"), null, "a path that only starts like one");
});

// What an agent that builds an app reads: addons.json (a program) and
// llms.txt (a model), both from the catalogue and the fact files.
const order = [...catalog.matchAll(/repo: "([^"]+)"/g)].map((m) => m[1]);
const fact = (r) => JSON.parse(fs.readFileSync(path.join(import.meta.dirname, "..", "src", "data", "addons", `${r}.json`), "utf8"));

test("the agent fields of the fact files: when to use it, what to call, what it needs", () => {
  for (const r of facts) {
    const a = fact(r);
    assert.ok(typeof a.useWhen === "string" && /^[A-Z].*\.$/.test(a.useWhen) && a.useWhen.length >= 40, `${r}: useWhen is one sentence for an agent`);
    assert.doesNotMatch(a.useWhen, /\n/, `${r}: useWhen is one line`);
    for (const key of ["entryPoints", "dependsOn"]) {
      if (a[key] === undefined) continue; // not verified: left out, not guessed
      assert.ok(Array.isArray(a[key]), `${r}: ${key} is a list`);
      assert.equal(new Set(a[key]).size, a[key].length, `${r}: ${key} names nothing twice`);
    }
    // a class or an interface of the z2ui5 namespace, in lower case
    for (const c of a.entryPoints ?? []) assert.match(c, /^z2ui5_(cl|if)_[a-z0-9_]+$/, `${r}: entry point ${c}`);
    const deps = a.dependsOn ?? [];
    deps.forEach((d, i) => {
      assert.match(d, /^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9._-]+$/, `${r}: dependsOn ${d} is <org>/<repo>`);
      const [org, repo] = d.split("/");
      assert.notEqual(d, "abap2UI5/abap2UI5", `${r}: the core is not named, every addon needs it`);
      assert.notEqual(repo, r, `${r} does not depend on itself`);
      // a repository of the project is one of the catalogue, under the organization the catalogue gives it
      if (org === "abap2UI5-addons" || org === "abap2UI5") {
        assert.ok(facts.includes(repo), `${r}: dependsOn ${d} is not in the catalogue`);
        const listedOrg = new RegExp(`repo: "${repo}"[^}]*org: "abap2UI5"`).test(catalog) ? "abap2UI5" : "abap2UI5-addons";
        assert.equal(org, listedOrg, `${r}: ${repo} is a repository of ${listedOrg}`);
        // the list is complete and in install order: what a dependency needs comes before it
        for (const dd of fact(repo).dependsOn ?? []) {
          assert.ok(deps.indexOf(dd) > -1 && deps.indexOf(dd) < i, `${r}: ${d} needs ${dd}, which has to be listed before it`);
        }
      }
    });
  }
  // the case the fields were made for
  assert.deepEqual(fact("popups").dependsOn, ["abap2UI5-addons/layout-management"]);
  assert.ok(fact("popups").entryPoints.includes("z2ui5_cl_popup_to_confirm"));
});

test("addons.json: every addon once, in catalogue order, with the facts of its file", () => {
  const feed = JSON.parse(fs.readFileSync(path.join(DIST, "addons.json"), "utf8"));
  assert.equal(feed.schema, 1);
  assert.equal(feed.url, "https://abap2ui5-addons.github.io/");
  assert.deepEqual(feed.addons.map((a) => a.repo), order, "catalogue order");
  const groupIds = [...catalog.matchAll(/id: "([^"]+)"/g)].map((m) => m[1]);
  const keys = ["repo", "org", "github", "site", "group", "title", "tagline", "summary", "useWhen", "entryPoints", "dependsOn", "requirements", "install", "usage", "cloud", "nw702", "readme"];
  for (const a of feed.addons) {
    assert.deepEqual(Object.keys(a), keys, `${a.repo}: the fields, in this order`);
    const f = fact(a.repo);
    assert.match(a.org, /^abap2UI5(-addons)?$/, `${a.repo}: org`);
    assert.equal(a.github, `https://github.com/${a.org}/${a.repo}`);
    assert.equal(a.readme, `https://raw.githubusercontent.com/${a.org}/${a.repo}/HEAD/README.md`);
    const ownSite = own.find(([r]) => r === a.repo);
    assert.equal(a.site, ownSite ? ownSite[1] : `https://abap2ui5-addons.github.io/${a.repo}/`, `${a.repo}: its own site or its page here`);
    if (!ownSite) assert.ok(fs.existsSync(path.join(DIST, a.repo, "index.html")), `${a.repo}: the page it names is built`);
    assert.ok(groupIds.includes(a.group), `${a.repo}: group ${a.group}`);
    // a projection: nothing but what the file says
    for (const key of ["title", "tagline", "summary", "requirements", "install", "usage"]) assert.deepEqual(a[key], f[key], `${a.repo}: ${key}`);
    assert.equal(a.useWhen, f.useWhen ?? null, `${a.repo}: useWhen`);
    assert.deepEqual(a.entryPoints, f.entryPoints ?? [], `${a.repo}: entryPoints`);
    assert.deepEqual(a.dependsOn, f.dependsOn ?? null, `${a.repo}: dependsOn`);
    assert.equal(a.cloud, f.cloud === true);
    assert.equal(a.nw702, f.nw702 === true);
  }
  // the groups are contiguous, in the catalogue's order
  assert.deepEqual([...new Set(feed.addons.map((a) => a.group))], groupIds);
});

test("llms.txt: the convention, every addon with what to call and what to install first", () => {
  const txt = fs.readFileSync(path.join(DIST, "llms.txt"), "utf8");
  const lines = txt.split("\n");
  assert.equal(lines[0], "# abap2UI5 Addons & Tools", "one H1, first");
  assert.equal(lines.filter((l) => /^# /.test(l)).length, 1);
  assert.match(lines[2], /^> \S/, "the summary as a blockquote");
  assert.match(txt, /abapGit/, "how an addon is installed");
  assert.match(txt, /https:\/\/abap2ui5-addons\.github\.io\/addons\.json/, "names the machine-readable form");
  assert.match(txt, /\]\(https:\/\/github\.com\/abap2UI5\/abap2UI5\/blob\/main\/llms\.txt\)/, "the core's map");
  assert.match(txt, /\]\(https:\/\/abap2ui5\.github\.io\/docs\/llms\.txt\)/, "the documentation's map");
  // one section per group, by its title; the building blocks first
  const titles = [...catalog.matchAll(/id: "[^"]+",\s*title: "([^"]+)"/g)].map((m) => m[1]);
  const h2 = lines.filter((l) => l.startsWith("## ")).map((l) => l.slice(3));
  assert.deepEqual(h2, ["Building blocks", ...titles.filter((t) => t !== "Building blocks"), "Related"]);
  // every addon once, as a link line, inside its group in catalogue order
  const listed = [];
  for (const r of order) {
    const a = fact(r);
    const mine = lines.filter((l) => new RegExp(`^- \\[[^\\]]+\\]\\(https://raw\\.githubusercontent\\.com/abap2UI5(-addons)?/${r}/HEAD/README\\.md\\): `).test(l));
    assert.equal(mine.length, 1, `${r}: one link line`);
    listed.push(lines.indexOf(mine[0]));
    assert.ok(mine[0].includes(`[${a.title}]`) && mine[0].includes(a.useWhen), `${r}: its title and when to use it`);
    for (const c of a.entryPoints ?? []) assert.ok(mine[0].includes(`\`${c}\``), `${r}: names ${c}`);
    for (const d of a.dependsOn ?? []) assert.ok(mine[0].includes(d), `${r}: names ${d}`);
    assert.match(mine[0], new RegExp(`Repository: https://github\\.com/abap2UI5(-addons)?/${r}$`), `${r}: its repository`);
  }
  const blocks = order.filter((r) => new RegExp(`id: "building-blocks"[\\s\\S]*?repo: "${r}"[\\s\\S]*?id: "embed"`).test(catalog));
  assert.ok(blocks.length >= 5, "the building blocks of the catalogue");
  const at = (r) => listed[order.indexOf(r)];
  for (const r of order) if (!blocks.includes(r)) assert.ok(at(r) > Math.max(...blocks.map(at)), `${r} comes after the building blocks`);
  for (const part of [blocks, order.filter((r) => !blocks.includes(r))]) assert.deepEqual([...part].sort((a, b) => at(a) - at(b)), part, "catalogue order");
  // plain text of this site: no markup a page would need a policy for
  assert.doesNotMatch(txt, /<script|<style|<img/i);
  // the overview names both, for whoever reads the head
  assert.match(home, /<link rel="alternate" type="text\/markdown" href="\/llms\.txt"/);
  assert.match(home, /<link rel="alternate" type="application\/json" href="\/addons\.json"/);
});
