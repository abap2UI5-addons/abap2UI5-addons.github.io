/* The ABAP objects of every addon and of the abap2UI5 core, as
 * scripts/objects.mjs collected them into objects.json, and what they claim:
 * a name segment (z2ui5_cl_<segment>_...), a table number (z2ui5_t_NN), an
 * ICF node, a BSP... - and where two repositories claim the same. */
import fs from "node:fs";

export type Obj = { type: string; name: string; path: string; text?: string };
export type Repo = { org: string; repo: string; branch: string; objects: Obj[] };
type File = { generated: string | null; repos: Repo[] };

let file: File = { generated: null, repos: [] };
try { file = JSON.parse(fs.readFileSync("src/data/objects.json", "utf8")); } catch { /* no data */ }

export const generated = file.generated;
export const repos = file.repos;
export const url = (r: Repo, o: Obj) => `https://github.com/${r.org}/${r.repo}/blob/${r.branch}/${o.path}`;

// the same object (type and name) in more than one repository: a pull of the
// second overwrites the first
export const collisions = (() => {
  const by = new Map<string, { type: string; name: string; repos: string[] }>();
  for (const r of repos) for (const o of r.objects) {
    const k = `${o.type} ${o.name}`;
    const e = by.get(k) ?? { type: o.type, name: o.name, repos: [] };
    if (!e.repos.includes(r.repo)) e.repos.push(r.repo);
    by.set(k, e);
  }
  return [...by.values()].filter((e) => e.repos.length > 1);
})();

// the segment after z2ui5_cl_ / z2ui5_if_ / z2ui5_cx_: one repository each,
// so that a new class cannot happen to take a name another one has
export const SEGMENT = /^Z2UI5_(?:CL|IF|CX)_([A-Z0-9]+)_/;
export const segments = (() => {
  const by = new Map<string, Map<string, number>>();
  for (const r of repos) for (const o of r.objects) {
    if (o.type !== "CLAS" && o.type !== "INTF") continue;
    const m = SEGMENT.exec(o.name);
    if (!m) continue;
    const s = by.get(m[1]) ?? new Map<string, number>();
    s.set(r.repo, (s.get(r.repo) ?? 0) + 1);
    by.set(m[1], s);
  }
  return [...by.entries()]
    .map(([segment, owners]) => ({ segment, owners: [...owners.entries()].map(([repo, count]) => ({ repo, count })) }))
    .sort((a, b) => a.segment.localeCompare(b.segment));
})();
export const sharedSegments = segments.filter((s) => s.owners.length > 1);

// the numbered tables z2ui5_t_NN, and the numbers still free below the highest
export const tables = repos
  .flatMap((r) => r.objects.filter((o) => o.type === "TABL" && /^Z2UI5_T_\d+$/.test(o.name)).map((o) => ({ ...o, repo: r })))
  .sort((a, b) => a.name.localeCompare(b.name));
export const freeTables = (() => {
  const used = new Set(tables.map((t) => Number(t.name.slice(8))));
  const max = Math.max(0, ...used);
  return [...Array(max + 2).keys()].slice(1).filter((n) => !used.has(n)).map((n) => `Z2UI5_T_${String(n).padStart(2, "0")}`);
})();

// what is neither a class, an interface nor a dictionary type: ICF nodes,
// BSPs, message classes, authorization objects, transactions...
const DICTIONARY = new Set(["CLAS", "INTF", "TABL", "DTEL", "DOMA", "TTYP", "DDLS", "DCLS", "BDEF"]);
export const others = repos
  .flatMap((r) => r.objects.filter((o) => !DICTIONARY.has(o.type)).map((o) => ({ ...o, repo: r })))
  .sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
