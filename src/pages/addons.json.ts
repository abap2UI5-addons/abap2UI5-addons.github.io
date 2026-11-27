// The catalogue for a program - an AI coding agent that builds an abap2UI5
// app, the MCP server, a script: every addon and tool in catalogue order with
// what it is for (`useWhen`), the classes app code calls (`entryPoints`), the
// other repositories it needs (`dependsOn`, "<org>/<repo>", dependencies of
// dependencies included, in install order, abap2UI5 itself not named) and
// where to read on (`readme`, the raw README of the default branch).
//
// A pure projection of src/data/catalog.ts and src/data/addons/<repo>.json
// (src/data/agents.ts); nothing is computed or fetched here. `schema` moves
// when a field changes its meaning or goes away, not when one is added.
// /llms.txt is the same content as prose.
import type { APIRoute } from "astro";
import { records } from "../data/agents";

export const GET: APIRoute = async ({ site }) => {
  const root = new URL(import.meta.env.BASE_URL, site).href;
  return new Response(JSON.stringify({ schema: 1, url: root, addons: records(root) }), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
