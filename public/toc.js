// The menu of the overview: names the group the reader is in on the folded
// menu, marks it in the list, and closes the list after a jump, on Escape
// and on a click elsewhere. The menu works without it - it is a <details>
// with plain anchors. The one script of the site: loaded from this origin,
// no inline code, so the Content-Security-Policy (script-src 'self') allows it.
(() => {
  const menu = document.querySelector(".toc details");
  if (!menu) return;
  const label = menu.querySelector(".toc-current");
  const links = [...menu.querySelectorAll("a[href^='#']")];
  const sections = links.map((a) => document.getElementById(a.hash.slice(1))).filter(Boolean);
  let ticking = false;
  // a group jumped to stays current until the reader scrolls away from it,
  // even near the end of the page, where it cannot reach the top
  let pinned = null, pinnedAt = null;
  const mark = () => {
    ticking = false;
    if (pinned && pinnedAt !== null && Math.abs(window.scrollY - pinnedAt) > 40) pinned = null;
    const line = window.innerHeight * 0.3;
    let current = sections[0];
    for (const s of sections) if (s.getBoundingClientRect().top <= line) current = s;
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) current = sections[sections.length - 1];
    if (pinned) current = pinned;
    for (const a of links) {
      const on = a.hash.slice(1) === current.id;
      if (on) { a.setAttribute("aria-current", "true"); label.textContent = a.firstChild.textContent; }
      else a.removeAttribute("aria-current");
    }
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(mark); } }, { passive: true });
  addEventListener("resize", mark);
  for (const a of links) a.addEventListener("click", () => {
    menu.open = false;
    pinned = document.getElementById(a.hash.slice(1));
    pinnedAt = null;
    // the jump lands after this handler; remember where it landed
    setTimeout(() => { pinnedAt = window.scrollY; mark(); }, 120);
  });
  addEventListener("hashchange", () => { if (pinned) { pinnedAt = window.scrollY; mark(); } });
  addEventListener("keydown", (e) => { if (e.key === "Escape") menu.open = false; });
  addEventListener("click", (e) => { if (menu.open && !menu.contains(e.target)) menu.open = false; });
  mark();
})();
