// Fetches the stars and the last push of every repository of the two
// organizations from the GitHub API and writes src/data/stats.json, which the
// build reads. The pages workflow runs it before the build (and once a day,
// so the figures stay fresh). It never fails the build: when the API cannot
// be reached it writes an empty object and the pages show no stars.
//
// The API hands out at most 100 repositories a page, so the pages are walked
// - up to five, the same as the docs' search index (abap2UI5/docs,
// scripts/lib/search-family.mjs) - until one comes back short. With one page
// only, the 101st repository of an organization silently had no stars.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUT = path.join(import.meta.dirname, "..", "src", "data", "stats.json");
const ORGS = ["abap2UI5-addons", "abap2UI5"];
export const PER_PAGE = 100;
export const MAX_PAGES = 5;

const headers = () => {
  const h = { Accept: "application/vnd.github+json", "User-Agent": "abap2ui5-addons-site" };
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
};

/** Every public repository of `org`, page by page. */
export async function fetchRepos(org, fetchFn = globalThis.fetch) {
  const all = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await fetchFn(`https://api.github.com/orgs/${org}/repos?per_page=${PER_PAGE}&type=public&page=${page}`, { headers: headers() });
    if (!res.ok) throw new Error(`${org}: HTTP ${res.status}`);
    const rows = await res.json();
    all.push(...rows);
    if (rows.length < PER_PAGE) break;
  }
  return all;
}

/** `{ "org/name": { stars, pushed } }` for every repository of `orgs`. */
export async function collectStats(orgs = ORGS, fetchFn = globalThis.fetch) {
  const stats = {};
  for (const org of orgs) {
    for (const r of await fetchRepos(org, fetchFn)) stats[`${org}/${r.name}`] = { stars: r.stargazers_count, pushed: r.pushed_at };
  }
  return stats;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let stats = {};
  try {
    stats = await collectStats();
    console.log(`stats: ${Object.keys(stats).length} repositories`);
  } catch (e) {
    stats = {};
    console.warn(`stats: ${e.message} - the pages are built without stars`);
  }
  fs.writeFileSync(OUT, JSON.stringify(stats, null, 2) + "\n");
}
