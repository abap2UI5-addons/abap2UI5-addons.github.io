/* The facts of every add-on, read from src/data/addons/<repo>.json at build
 * time. The shape is the contract between the JSON and the two pages; a
 * missing or malformed file fails the build, not the reader. */
import fs from "node:fs";
import { entries } from "./catalog";

export type Link = { text: string; href: string };
export type Addon = {
  repo: string;
  title: string;
  tagline: string;
  summary: string;
  features: string[];
  requirements: string[];
  install: { abapgit_url: string; notes: string[] };
  usage: string;
  links: Link[];
  screenshot: string;
  status: "stable" | "experimental" | "archived" | "unknown";
  license: string;
  cloud?: boolean;
  nw702?: boolean;
};

/* Stars and last push of a repository, from src/data/stats.json, which
 * scripts/stats.mjs writes before the build. Missing when it could not be
 * fetched - then the pages show no stars and no "active" badge. */
export type Stats = { stars: number; pushed: string };
let statsFile: Record<string, Stats> = {};
try { statsFile = JSON.parse(fs.readFileSync("src/data/stats.json", "utf8")); } catch { statsFile = {}; }
const built = Date.now();
export function stats(org: string, repo: string): Stats | undefined { return statsFile[`${org}/${repo}`]; }
/* pushed to within the last 60 days of the build */
export function active(s?: Stats): boolean { return !!s && built - Date.parse(s.pushed) < 60 * 864e5; }

const files = import.meta.glob<{ default: Addon }>("./addons/*.json", { eager: true });
const byRepo = new Map<string, Addon>();
for (const [file, mod] of Object.entries(files)) {
  const a = mod.default;
  const name = file.replace(/^.*\//, "").replace(/\.json$/, "");
  if (a.repo !== name) throw new Error(`${file}: "repo" is ${a.repo}, the file is ${name}`);
  for (const key of ["title", "tagline", "summary"] as const) {
    if (typeof a[key] !== "string" || a[key].trim() === "") throw new Error(`${file}: ${key} is empty`);
  }
  byRepo.set(name, a);
}

export function addon(repo: string): Addon {
  const a = byRepo.get(repo);
  if (!a) throw new Error(`src/data/addons/${repo}.json is missing - the catalogue names it`);
  return a;
}

export const addons: Addon[] = entries.map((e) => addon(e.repo));
