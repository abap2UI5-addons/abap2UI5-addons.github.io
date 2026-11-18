// The addresses that moved when their repositories were renamed (2026-11-17).
// GitHub Pages does not redirect a project site whose repository was renamed,
// and an addon page of this site lives at the repository's name: the old path
// is gone, and every request under it reaches the 404 page of this site - the
// organisation's root site answers for every path no project site claims.
// That page loads this script, which sends the reader to the same page under
// the new address, with the rest of the path, the query and the fragment.
// A path that matches nothing stays on the 404 page.
//
// A site that moves again, or a new rename, is one more line here.
export const MOVED = [
  ["/office-addin", "/embed-excel"],
  ["/embed-control", "/embed-ui5-control"],
];

// The new address of a path, or null: "/embed-control/x" moves,
// "/embed-controls" does not.
export function movedTo(pathname) {
  for (const [from, to] of MOVED) {
    if (pathname === from || pathname.startsWith(from + "/")) {
      return to + (pathname.slice(from.length) || "/");
    }
  }
  return null;
}

if (typeof location !== "undefined") {
  const target = movedTo(location.pathname);
  if (target) location.replace(target + location.search + location.hash);
}
