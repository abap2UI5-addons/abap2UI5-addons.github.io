// The search of the overview: a text field and a few switches narrow the
// tiles; groups left empty disappear, the count says how many are shown.
// Without this script the form stays hidden and every tile is shown. A file
// of this origin, no inline code, so the Content-Security-Policy allows it.
(() => {
  const form = document.querySelector(".finder");
  if (!form) return;
  const q = form.querySelector(".finder-q");
  const shown = form.querySelector(".finder-shown");
  const empty = form.querySelector(".finder-empty");
  const items = [...document.querySelectorAll(".group li[data-kind]")];
  const groups = [...document.querySelectorAll(".group")];
  const toc = [...document.querySelectorAll(".toc-list a")];
  form.hidden = false;

  const apply = () => {
    const words = q.value.toLowerCase().split(/\s+/).filter(Boolean);
    const kinds = new Set([...form.querySelectorAll("input[name=kind]:checked")].map((i) => i.value));
    const cloud = form.elements.cloud.checked, nw702 = form.elements.nw702.checked, nobeta = form.elements.nobeta.checked;
    let n = 0;
    for (const li of items) {
      const d = li.dataset;
      const ok = kinds.has(d.kind) && (!cloud || d.cloud) && (!nw702 || d.nw702) && (!nobeta || !d.beta)
        && words.every((w) => d.words.includes(w));
      li.hidden = !ok;
      if (ok) n++;
    }
    for (const g of groups) {
      const visible = g.querySelectorAll("li[data-kind]:not([hidden])").length;
      g.hidden = visible === 0;
      const link = toc.find((a) => a.hash === "#" + g.id);
      if (link) { link.hidden = visible === 0; link.lastElementChild.textContent = visible; }
    }
    shown.textContent = n;
    empty.hidden = n > 0;
  };
  form.addEventListener("input", apply);
  form.addEventListener("submit", (e) => e.preventDefault());
  form.addEventListener("reset", () => setTimeout(apply, 0));
  apply();
})();
