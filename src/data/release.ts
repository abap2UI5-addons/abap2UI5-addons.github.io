/* The framework's latest release, read at build time for the foot - so the
 * number cannot go stale between deploys, and the site stays free of any
 * script. The API first (with the workflow's token, if there is one), then
 * the redirect of github.com/.../releases/latest, which has no rate limit. A
 * release is tagged twice, `1.148.0` and `1.148.0-702` for NetWeaver 7.02;
 * the foot names the version. Nothing found leaves it out; the build never
 * fails on it. One lookup per build, however many pages. */
const REPO = "abap2UI5/abap2UI5";
const versionOf = (tag: string) => /^v?(\d+\.\d+\.\d+)(?:-702)?$/.exec(tag.trim())?.[1];
let cached: Promise<string | undefined> | undefined;

async function fromApi(): Promise<string | undefined> {
  const headers: Record<string, string> = { accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers, signal: AbortSignal.timeout(8000) });
  return res.ok ? versionOf(String((await res.json()).tag_name ?? "")) : undefined;
}

async function fromRedirect(): Promise<string | undefined> {
  const res = await fetch(`https://github.com/${REPO}/releases/latest`, { redirect: "manual", signal: AbortSignal.timeout(8000) });
  const tag = /\/releases\/tag\/([^/?#]+)$/.exec(res.headers.get("location") ?? "")?.[1];
  return tag ? versionOf(decodeURIComponent(tag)) : undefined;
}

export function latestRelease(): Promise<string | undefined> {
  cached ??= (async () => {
    for (const read of [fromApi, fromRedirect]) {
      try {
        const version = await read();
        if (version) return version;
      } catch {
        /* the next source, or none */
      }
    }
    return undefined;
  })();
  return cached;
}
