// What the family's search finds of this site: one entry per addon and tool,
// for the index abap2UI5/docs builds (scripts/lib/search-index.mjs there
// fetches this file at build time and carries it as the "Addons & Tools"
// group, read by the search box on https://abap2ui5.github.io/ and the
// playground). The shape is the one every site of the family publishes:
// { site, url, entries: [{ title, text, headings, terms, url, links }] }.
//
// A hit leads to the addon's page here (or to its own site), and `links`
// offers the repository beside it - the search shows them as the actions of
// the hit. The headings are the five sections every page has, so "install
// sql console" can land on Installation.
import type { APIRoute } from "astro";
import { groups, orgOf } from "../data/catalog";
import { addon } from "../data/addons";

const SECTIONS: [string, string][] = [
  ["What it does", "what"],
  ["Requirements", "requirements"],
  ["Installation", "install"],
  ["Usage", "usage"],
];

export const GET: APIRoute = async ({ site }) => {
  const root = new URL(import.meta.env.BASE_URL, site).href;
  const entries = groups.flatMap((g) =>
    g.entries.map((e) => {
      const a = addon(e.repo);
      const github = `https://github.com/${orgOf(e)}/${a.repo}`;
      return {
        title: a.title,
        text: a.tagline,
        headings: e.site ? [] : SECTIONS,
        terms: [g.title, a.repo, a.summary, ...a.features, ...a.requirements, a.cloud ? "abap cloud" : "", a.nw702 ? "7.02 downport" : ""]
          .join(" ")
          .toLowerCase(),
        code: a.repo,
        url: e.site ?? `${root}${a.repo}/`,
        links: [{ label: "Repository", url: github }],
      };
    }),
  );
  return new Response(JSON.stringify({ site: "Addons & Tools", url: root, entries }), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
