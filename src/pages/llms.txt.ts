// The catalogue for a model, in the llms.txt convention (https://llmstxt.org/):
// an H1, a summary as a blockquote, a paragraph, then sections of link lists.
// The reader is an agent that is building an abap2UI5 app and should learn,
// before it writes a dialog or a filter bar by hand, that there is an addon
// for it, which classes to call and what has to be installed first.
//
// The same records as /addons.json (src/data/agents.ts). One section per
// catalogue group; "Building blocks" comes first, because those are the
// addons app code calls - the other groups keep the catalogue's order, and so
// do the addons inside every group. A link leads to the raw README, which a
// model reads better than a rendered page.
import type { APIRoute } from "astro";
import { groups } from "../data/catalog";
import { records, type AgentRecord } from "../data/agents";

const FIRST = "building-blocks";

function line(a: AgentRecord): string {
  const parts = [a.useWhen ?? a.tagline];
  if (a.entryPoints.length) parts.push(`Entry points: ${a.entryPoints.map((c) => `\`${c}\``).join(", ")}.`);
  if (a.dependsOn) parts.push(a.dependsOn.length ? `Install first: abap2UI5, ${a.dependsOn.join(", ")}.` : "Needs no other addon.");
  parts.push(`Repository: ${a.github}`);
  return `- [${a.title}](${a.readme}): ${parts.join(" ")}`;
}

export const GET: APIRoute = async ({ site }) => {
  const root = new URL(import.meta.env.BASE_URL, site).href;
  const all = records(root);
  const ordered = [...groups.filter((g) => g.id === FIRST), ...groups.filter((g) => g.id !== FIRST)];
  const text = [
    "# abap2UI5 Addons & Tools",
    "",
    "> The addons and developer tools of abap2UI5, for an agent that is building an abap2UI5 app: what each one is for, which classes app code calls and which repositories have to be installed first. Check this list before writing a dialog, a filter, a table layout or a custom control by hand.",
    "",
    `An addon is a repository of its own with ABAP classes that build on abap2UI5. It is not part of the core: it is installed with abapGit next to abap2UI5, after the core and after the repositories it depends on, in the order given below ("Install first"). A class of an addon that is not installed does not compile, so name the addon and its dependencies to the user whenever your code calls one. The same list as data, with requirements, install notes and a usage snippet per addon: ${root}addons.json`,
    "",
    ...ordered.flatMap((g) => [`## ${g.title}`, "", g.lead, "", ...all.filter((a) => a.group === g.id).map(line), ""]),
    "## Related",
    "",
    `- [addons.json](${root}addons.json): this list, machine-readable - useWhen, entryPoints, dependsOn, requirements, install, usage and the README address of every addon`,
    "- [abap2UI5 core](https://github.com/abap2UI5/abap2UI5/blob/main/llms.txt): the map of the framework itself - the app interface, the client, the view builder",
    "- [abap2UI5 documentation](https://abap2ui5.github.io/docs/llms.txt): the map of the documentation",
    "",
  ].join("\n");
  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
