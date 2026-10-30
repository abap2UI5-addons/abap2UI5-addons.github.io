// Marks the section of the overview the reader is in. The menu works without
// it - its entries are plain anchors - this only moves the marker as the page
// scrolls. The one script of the site: loaded from this origin, no inline
// code, so the Content-Security-Policy (script-src 'self') allows it.
(() => {
  const links = [...document.querySelectorAll(".toc a[href^='#']")];
  const sections = links.map((a) => document.getElementById(a.hash.slice(1))).filter(Boolean);
  if (!sections.length) return;
  let ticking = false;
  const mark = () => {
    ticking = false;
    const line = window.innerHeight * 0.3;
    let current = sections[0];
    for (const s of sections) if (s.getBoundingClientRect().top <= line) current = s;
    // at the very bottom the last section is current, however short it is
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) current = sections[sections.length - 1];
    for (const a of links) {
      if (a.hash.slice(1) === current.id) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    }
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(mark); } }, { passive: true });
  addEventListener("resize", mark);
  mark();
})();
