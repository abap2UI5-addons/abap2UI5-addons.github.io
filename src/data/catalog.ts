/* The catalogue: every add-on of github.com/abap2UI5-addons, in groups, in
 * the order the overview shows them. The facts of an add-on - what it does,
 * what it needs, how it is installed - live in src/data/addons/<repo>.json;
 * this file only places it. A new add-on is one line here and one JSON file
 * there.
 *
 * `site` names an add-on that publishes a site of its own at
 * https://abap2ui5-addons.github.io/<repo>/ - the project site of its
 * repository, which GitHub Pages serves in front of anything this site would
 * put at that address. For such an add-on the overview links there and this
 * site builds no page. */

export type Entry = { repo: string; site?: string };
export type Group = { id: string; title: string; lead: string; entries: Entry[] };

export const groups: Group[] = [
  {
    id: "classic",
    title: "Classic ABAP on the web",
    lead: "The selection screen, the ALV, the table maintenance and the transactions you know, as abap2UI5 apps on ABAP Cloud and NW 7.02.",
    entries: [
      { repo: "abap-cloud-gui", site: "https://abap2ui5-addons.github.io/abap-cloud-gui/" },
      { repo: "selection-screen" },
      { repo: "sapgui" },
      { repo: "se16n" },
      { repo: "table-maintenance" },
      { repo: "sql-console" },
      { repo: "table-content-loader" },
      { repo: "popups" },
    ],
  },
  {
    id: "integration",
    title: "Integration",
    lead: "Where an abap2UI5 app meets the rest of the landscape: RFC and HTTP, the Fiori Launchpad, RAP, Excel and AI agents.",
    entries: [
      { repo: "rfc-connector" },
      { repo: "http-connector" },
      { repo: "launchpad-kpi" },
      { repo: "rap-ext" },
      { repo: "office-addin" },
      { repo: "abap-agent-runtime" },
    ],
  },
  {
    id: "infrastructure",
    title: "App infrastructure",
    lead: "What apps share once there are many of them: layouts, configuration, locks and an administrator's view of the installation.",
    entries: [
      { repo: "layout-management" },
      { repo: "config-management" },
      { repo: "lock-manager" },
      { repo: "admin-cockpit" },
    ],
  },
  {
    id: "frontend",
    title: "Frontend artefacts",
    lead: "Custom controls, icon fonts and CSS, delivered in a BSP of their own so the framework stays untouched.",
    entries: [
      { repo: "custom-controls" },
      { repo: "custom-controls-customer" },
    ],
  },
  {
    id: "open-source",
    title: "Open-source projects",
    lead: "UIs for other open-source projects of the ABAP community, and a fork kept for abap2UI5.",
    entries: [
      { repo: "open-source-libs" },
      { repo: "fork-abapToC" },
    ],
  },
];

export const entries: Entry[] = groups.flatMap((g) => g.entries);
