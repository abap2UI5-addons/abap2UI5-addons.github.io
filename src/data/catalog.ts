/* The catalogue: every addon of github.com/abap2UI5-addons, in groups, in
 * the order the overview shows them. The facts of an addon - what it does,
 * what it needs, how it is installed - live in src/data/addons/<repo>.json;
 * this file only places it. A new addon is one line here and one JSON file
 * there.
 *
 * `site` names an addon that publishes a site of its own at
 * https://abap2ui5-addons.github.io/<repo>/ - the VitePress site of its
 * repository (site/, the same shape in every addon), which GitHub Pages
 * serves in front of anything this site would put at that address. For such
 * an addon the overview's tile leads there, marked as leaving this site, and
 * this site builds no page. Every addon of abap2UI5-addons has one; the
 * entries without `site` are the ones that do not (yet). */

export type Entry = { repo: string; site?: string; label?: string; org?: string };
export const orgOf = (e: Entry) => e.org ?? "abap2UI5-addons";
export type Group = { id: string; title: string; lead: string; entries: Entry[] };

// Grouped by what a reader is after, not by technique: an app to install and
// use, pieces to build an app from, a way to reach apps from elsewhere, what
// many apps in production need, and the tools a developer works with.
export const groups: Group[] = [
  {
    id: "apps",
    title: "Ready-made apps",
    lead: "Install and open: classic transactions and tools of the SAP GUI, running in the browser.",
    entries: [
      { repo: "sapgui" },
      { repo: "se16n", site: "https://abap2ui5-addons.github.io/se16n/" },
      { repo: "table-maintenance", site: "https://abap2ui5-addons.github.io/table-maintenance/" },
      { repo: "sql-console", site: "https://abap2ui5-addons.github.io/sql-console/" },
      { repo: "table-content-loader", site: "https://abap2ui5-addons.github.io/table-content-loader/" },
      { repo: "fork-abapToC" },
      { repo: "open-source-libs", site: "https://abap2ui5-addons.github.io/open-source-libs/" },
    ],
  },
  {
    id: "building-blocks",
    title: "Building blocks",
    lead: "Pieces to build your own apps from: the report model, selection screens, popups, user layouts and controls.",
    entries: [
      { repo: "abap-cloud-gui", site: "https://abap2ui5-addons.github.io/abap-cloud-gui/" },
      { repo: "range-filter", site: "https://abap2ui5-addons.github.io/range-filter/" },
      { repo: "popups", site: "https://abap2ui5-addons.github.io/popups/" },
      { repo: "layout-management", site: "https://abap2ui5-addons.github.io/layout-management/" },
      { repo: "rap-ext", site: "https://abap2ui5-addons.github.io/rap-ext/" },
      { repo: "custom-controls", site: "https://abap2ui5-addons.github.io/custom-controls/" },
      { repo: "custom-controls-customer", site: "https://abap2ui5-addons.github.io/custom-controls-customer/" },
    ],
  },
  {
    id: "integration",
    title: "Integration",
    lead: "Your apps beyond the abap2UI5 page: other systems, the Fiori Launchpad, Excel, other UI5 apps and AI agents.",
    entries: [
      { repo: "rfc-connector", site: "https://abap2ui5-addons.github.io/rfc-connector/" },
      { repo: "http-connector", site: "https://abap2ui5-addons.github.io/http-connector/" },
      { repo: "launchpad-kpi", site: "https://abap2ui5-addons.github.io/launchpad-kpi/" },
      { repo: "office-addin", site: "https://abap2ui5-addons.github.io/office-addin/" },
      { repo: "embed-control", org: "abap2UI5" },
      { repo: "abap-agent-runtime", site: "https://abap2ui5-addons.github.io/abap-agent-runtime/" },
    ],
  },
  {
    id: "operations",
    title: "Operations",
    lead: "What many apps in production need: configuration in tables, real locks and an administrator's view.",
    entries: [
      { repo: "config-management", site: "https://abap2ui5-addons.github.io/config-management/" },
      { repo: "lock-manager", site: "https://abap2ui5-addons.github.io/lock-manager/" },
      { repo: "admin-cockpit", site: "https://abap2ui5-addons.github.io/admin-cockpit/" },
    ],
  },
  {
    id: "developer-tools",
    title: "Developer tools",
    lead: "What goes into your editor, your pipeline or your agent once you build apps for real.",
    entries: [
      { repo: "linter", org: "abap2UI5" },
      { repo: "vscode-extension", org: "abap2UI5" },
      { repo: "mcp-server", org: "abap2UI5" },
      { repo: "app-template", org: "abap2UI5" },
      { repo: "headless-frontend", org: "abap2UI5" },
    ],
  },
];

export const entries: Entry[] = groups.flatMap((g) => g.entries);
