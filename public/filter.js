// The search box of the overview: it narrows the tiles to the ones whose
// data-search holds every word typed (title, tagline, repository, summary,
// features), hides a group with none left, and says so when nothing matches.
// Nothing is fetched; the query is the address (?q=), so a filtered view can
// be linked. Ctrl/Cmd+K or / focuses the box, Escape clears it.
const box = document.getElementById('search');
const input = document.getElementById('search-input');
const none = document.getElementById('search-none');
const noneLink = none.querySelector('a');
const tiles = [...document.querySelectorAll('.tiles li[data-search]')];
const groups = [...document.querySelectorAll('section.group')].filter((g) => g.querySelector('li[data-search]'));

function apply() {
  const q = input.value.trim().toLowerCase();
  const words = q.split(/\s+/).filter(Boolean);
  let shown = 0;
  for (const li of tiles) {
    const hit = words.every((w) => li.dataset.search.includes(w));
    li.hidden = !hit;
    if (hit) shown += 1;
  }
  for (const g of groups) g.hidden = !g.querySelector('li[data-search]:not([hidden])');
  none.hidden = shown > 0;
  noneLink.href = `https://abap2ui5.github.io/search/?q=${encodeURIComponent(input.value.trim())}`;
  history.replaceState(null, '', q ? `?q=${encodeURIComponent(input.value.trim())}` : location.pathname);
}

input.addEventListener('input', apply);
input.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { input.value = ''; apply(); input.blur(); }
});
document.addEventListener('keydown', (e) => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName ?? '');
  if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') || (e.key === '/' && !typing)) {
    e.preventDefault();
    input.focus();
    input.select();
  }
});

box.hidden = false;
input.value = new URLSearchParams(location.search).get('q') || '';
if (input.value) apply();
