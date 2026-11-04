// Collects the ABAP objects of every addon (and of the abap2UI5 core) from
// the GitHub API and writes src/data/objects.json, which the namespaces page
// reads: which repository owns which name segment (z2ui5_cl_<segment>_...),
// which table number (z2ui5_t_NN), which ICF node, BSP, message class... and
// where two repositories claim the same name. The pages workflow runs it
// before the build and once a day. When the API cannot be reached it keeps
// the file it finds, so a build never fails on the network.
//
// The object list comes from the file names alone - abapGit writes one
// <name>.<type>.xml per object under src/ - one tree request per repository;
// only the short texts of the tables are read from their XML.
import fs from "node:fs";
import path from "node:path";
import { groups, orgOf } from "../src/data/catalog.ts";

const OUT = path.join(import.meta.dirname, "..", "src", "data", "objects.json");
const headers = { Accept: "application/vnd.github+json", "User-Agent": "abap2ui5-addons-site" };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

const get = async (url) => {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.json();
};

// the core first: its names are the ones an addon must not take
const repos = [{ org: "abap2UI5", repo: "abap2UI5" }];
for (const g of groups) for (const e of g.entries) repos.push({ org: orgOf(e), repo: e.repo });

const result = { generated: new Date().toISOString(), repos: [] };
try {
  for (const { org, repo } of repos) {
    const info = await get(`https://api.github.com/repos/${org}/${repo}`);
    const branch = info.default_branch;
    const tree = await get(`https://api.github.com/repos/${org}/${repo}/git/trees/${branch}?recursive=1`);
    const objects = [];
    for (const t of tree.tree) {
      // src/<package path>/<name>.<type>.xml - the object's main file
      const m = t.type === "blob" && /^src\/(?:(.*)\/)?([^/]+)\.([a-z0-9]{4})\.xml$/.exec(t.path);
      if (!m || m[3] === "devc") continue;
      const name = m[2].replace(/#/g, "/").toUpperCase();
      objects.push({ type: m[3].toUpperCase(), name, path: t.path });
    }
    // the short text of a table says what it holds
    for (const o of objects.filter((x) => x.type === "TABL" && /^Z2UI5_T_\d+$/.test(x.name))) {
      try {
        const xml = await (await fetch(`https://raw.githubusercontent.com/${org}/${repo}/${branch}/${o.path}`)).text();
        o.text = /<DDTEXT>([^<]*)<\/DDTEXT>/.exec(xml)?.[1];
      } catch { /* no text */ }
    }
    if (objects.length) result.repos.push({ org, repo, branch, objects });
    console.log(`objects: ${org}/${repo} - ${objects.length}`);
  }
  fs.writeFileSync(OUT, JSON.stringify(result, null, 1) + "\n");
} catch (e) {
  console.warn(`objects: ${e.message} - keeping ${path.relative(process.cwd(), OUT)} as it is`);
  if (!fs.existsSync(OUT)) fs.writeFileSync(OUT, JSON.stringify({ generated: null, repos: [] }) + "\n");
}
