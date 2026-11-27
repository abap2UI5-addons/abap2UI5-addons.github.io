/* The catalogue as an agent reads it: one record per addon, in catalogue
 * order, a pure projection of catalog.ts and addons/<repo>.json. The two
 * endpoints built from it - src/pages/addons.json.ts for a program,
 * src/pages/llms.txt.ts for a model - say the same thing, because they read
 * it here and nowhere else. */
import { groups, orgOf } from "./catalog";
import { addon } from "./addons";

export function records(root: string) {
  return groups.flatMap((g) =>
    g.entries.map((e) => {
      const a = addon(e.repo);
      const org = orgOf(e);
      return {
        repo: a.repo,
        org,
        github: `https://github.com/${org}/${a.repo}`,
        // its own site, or its page here
        site: e.site ?? `${root}${a.repo}/`,
        group: g.id,
        title: a.title,
        tagline: a.tagline,
        summary: a.summary,
        // null: not verified, which is not the same as "none"
        useWhen: a.useWhen ?? null,
        entryPoints: a.entryPoints ?? [],
        dependsOn: a.dependsOn ?? null,
        requirements: a.requirements,
        install: a.install,
        usage: a.usage,
        cloud: a.cloud === true,
        nw702: a.nw702 === true,
        // HEAD is the default branch, whatever it is called (main, standard)
        readme: `https://raw.githubusercontent.com/${org}/${a.repo}/HEAD/README.md`,
      };
    }),
  );
}
export type AgentRecord = ReturnType<typeof records>[number];
