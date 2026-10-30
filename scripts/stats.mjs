// Fetches the stars and the last push of every repository of the two
// organizations from the GitHub API and writes src/data/stats.json, which the
// build reads. The pages workflow runs it before the build (and once a day,
// so the figures stay fresh). It never fails the build: when the API cannot
// be reached it writes an empty object and the pages show no stars.
import fs from "node:fs";
import path from "node:path";

const OUT = path.join(import.meta.dirname, "..", "src", "data", "stats.json");
const ORGS = ["abap2UI5-addons", "abap2UI5"];
const headers = { Accept: "application/vnd.github+json", "User-Agent": "abap2ui5-addons-site" };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

const stats = {};
try {
  for (const org of ORGS) {
    const res = await fetch(`https://api.github.com/orgs/${org}/repos?per_page=100&type=public`, { headers });
    if (!res.ok) throw new Error(`${org}: HTTP ${res.status}`);
    for (const r of await res.json()) stats[`${org}/${r.name}`] = { stars: r.stargazers_count, pushed: r.pushed_at };
  }
  console.log(`stats: ${Object.keys(stats).length} repositories`);
} catch (e) {
  console.warn(`stats: ${e.message} - the pages are built without stars`);
}
fs.writeFileSync(OUT, JSON.stringify(stats, null, 2) + "\n");
