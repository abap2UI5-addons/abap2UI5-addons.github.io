/*
 * The search box - the one script of this site, on the home page and on
 * /search/.
 *
 * It searches the whole family from one index: the pages of the
 * documentation, every sample of the three catalogues, every repository of
 * abap2UI5 and abap2UI5-addons, the tools, the essays, the page for decision
 * makers, the addons, the client API and the classes of the framework. The
 * docs publish that index at /docs/search-index.json (abap2UI5/docs,
 * scripts/generate-search.mjs and scripts/lib/search-family.mjs). The matcher
 * is search-engine.js beside this file, a copy of scripts/lib/search-engine.js
 * of abap2UI5/docs, as it is there - take a new copy when that one changes,
 * never edit this one.
 *
 * What a query gets, top to bottom:
 *   - the best answer, when the query NAMES something: #1234 (an issue), a
 *     class, a method, a repository, a tool - jumps( )
 *   - the hits, grouped by area, each with its actions on the right (the
 *     source of a sample, the README and issues of a repository) - actions( )
 *   - the way out: the query handed to GitHub's code, issue and discussion
 *     search - elsewhere( ). Links only: nothing is fetched from GitHub, and
 *     issues and discussions are never a day old.
 * A scope in front narrows to one area: `repo: popup`, `api: bind`,
 * `sample: table`, `doc:`, `tool:`, `insight:`, `why:`, `addon:`. An empty
 * field offers the places to go.
 *
 * The index is fetched the first time the box is used, never at load: a
 * reader who does not search pays nothing for the box. Nothing is stored.
 *
 * Keys: Ctrl K / Cmd K or "/" go to the box; Up and Down move through the
 * hits, Right and Left through the actions of the chosen one, Enter opens
 * what is chosen (the first hit if nothing is), Escape closes the list and,
 * pressed again, clears the field.
 *
 * On /search/ (data-mode="page") the results stay on the page, with more per
 * group, and the query is the address: /search/?q=popup.
 */
import { search, grouped, highlight, loadIndex, jumps, elsewhere, actions, parseScope } from './search-engine.js';

// the index the docs publish on abap2ui5.github.io (served with CORS *)
const INDEX = 'https://abap2ui5.github.io/docs/search-index.json';

const box = document.getElementById('search');
const input = document.getElementById('search-input');
const list = document.getElementById('search-results');

if (box && input && list) {
  const page = box.dataset.mode === 'page';
  const LIMIT = page ? 400 : 80;
  const PER_GROUP = page ? 12 : 4;

  box.hidden = false;
  const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const key = box.querySelector('.search-key');
  if (key && mac) key.textContent = '⌘ K';

  let entries = null;
  let failed = false;
  /* one row per hit: its main link and its actions */
  let rows = [];
  let active = -1;
  let action = -1;

  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  const link = (cls, href, text) => {
    const a = el('a', cls, text);
    a.href = href;
    return a;
  };

  /* The parts of `text` the query matched, in <mark> - built as nodes, so no
   * title in the index is ever read as markup. */
  const marked = (text, query) => {
    const f = document.createDocumentFragment();
    for (const [part, hit] of highlight(text, query)) f.append(hit ? el('mark', null, part) : document.createTextNode(part));
    return f;
  };

  const open = (yes) => {
    if (page) yes = true;
    list.hidden = !yes;
    input.setAttribute('aria-expanded', String(yes));
    if (!yes) select(-1);
  };

  const select = (i, a = -1) => {
    const was = rows[active];
    if (was) {
      was.main.removeAttribute('aria-selected');
      was.row.classList.remove('is-active');
      for (const x of was.actions) x.classList.remove('is-active');
    }
    active = i;
    action = a;
    const now = rows[active];
    if (now) {
      now.main.setAttribute('aria-selected', 'true');
      now.row.classList.add('is-active');
      if (now.actions[action]) now.actions[action].classList.add('is-active');
      now.row.scrollIntoView({ block: 'nearest' });
      input.setAttribute('aria-activedescendant', now.main.id);
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  };

  const note = (text, more) => {
    const p = el('p', 'search-note', text);
    if (more) p.append(' ', link(null, more.href, more.text));
    return p;
  };

  const section = (label, extra) => {
    const head = el('div', 'search-group');
    head.setAttribute('role', 'presentation');
    head.append(el('span', null, label));
    if (extra) head.append(el('span', 'search-count', extra));
    return head;
  };

  /* One hit: the main link (the option the arrows move through) and its
   * actions beside it. `item` is an entry of the index or a place outside it
   * ({ title, text, url }). */
  const addRow = (item, query, { heading = null, best = false } = {}) => {
    const entry = item.entry || null;
    const row = el('div', best ? 'search-row is-best' : 'search-row');
    row.setAttribute('role', 'presentation');
    const main = el('a', 'search-hit');
    main.id = `search-hit-${rows.length}`;
    main.setAttribute('role', 'option');
    main.tabIndex = -1;

    let url;
    let title;
    let sub;
    if (entry) {
      url = heading && !entry.url.includes('#') ? `${entry.url}#${heading.anchor}` : entry.url;
      title = entry.title;
      if (heading) sub = `${entry.group} › ${heading.text}`;
      else if (entry.area === 'samples' || (entry.area === 'api' && entry.group === 'Framework source')) sub = entry.code;
      else sub = entry.text || entry.group;
      if (best) sub = `${entry.group} · ${sub}`;
    } else {
      url = item.url;
      title = item.title;
      sub = item.text;
      main.classList.add('is-out');
    }
    main.href = url;
    const t = el('span', 'search-title');
    t.append(marked(title, query));
    main.append(t);
    if (sub) main.append(el('span', 'search-sub', sub));
    row.append(main);

    const acts = entry ? actions(entry, query).map((x) => link('search-action', x.url, x.label)) : [];
    if (acts.length) {
      const bar = el('span', 'search-actions');
      for (const a of acts) {
        a.tabIndex = -1;
        bar.append(a);
      }
      row.append(bar);
    }

    const i = rows.length;
    row.addEventListener('mousemove', () => { if (active !== i) select(i); });
    rows.push({ row, main, actions: acts });
    list.append(row);
  };

  const footer = (query) => {
    const out = el('div', 'search-out');
    out.append(el('span', 'search-out-label', `“${query}” on GitHub:`));
    for (const e of elsewhere(query)) out.append(link('search-out-link', e.url, e.label));
    if (!page) out.append(link('search-all', `https://abap2ui5.github.io/search/?q=${encodeURIComponent(input.value.trim())}`, 'All results →'));
    list.append(out);
  };

  const startHere = () => {
    const tools = (entries || []).filter((e) => e.area === 'tools');
    if (tools.length) {
      list.append(section('Go to'));
      for (const e of tools.slice(0, page ? tools.length : 6)) addRow({ entry: e }, '');
    }
    list.append(note('Try #123 for an issue, a class name, or a scope: repo: · api: · sample: · doc: · addon:'));
  };

  const render = () => {
    const query = input.value.trim();
    rows = [];
    active = -1;
    action = -1;
    input.removeAttribute('aria-activedescendant');
    list.replaceChildren();

    if (failed) {
      list.append(note('The search is not available right now.', { text: 'Search the documentation instead.', href: 'https://abap2ui5.github.io/docs/' }));
      open(true);
      return;
    }
    if (!entries) {
      list.append(note('Loading…'));
      open(true);
      return;
    }
    if (!query) {
      startHere();
      open(document.activeElement === input || page);
      return;
    }

    const words = parseScope(query).query;
    const best = jumps(entries, query);
    const hits = search(entries, query, { limit: LIMIT });

    if (best.length) {
      list.append(section('Best answer'));
      for (const j of best) addRow(j, words, { best: true });
    }
    if (hits.relaxedTo) list.append(note(`Nothing for “${words}” - showing “${hits.relaxedTo}”.`));
    const shown = hits.relaxedTo || words;
    const taken = new Set(best.map((j) => (j.entry ? j.entry.url : j.url)));

    for (const group of grouped(hits, { perGroup: PER_GROUP })) {
      const rest = group.hits.filter((h) => !taken.has(h.entry.url) || h.heading);
      if (!rest.length) continue;
      list.append(section(group.label, group.total > group.hits.length ? `${group.hits.length} of ${group.total}` : null));
      for (const { entry, heading } of rest) addRow({ entry }, shown, { heading });
    }
    if (!best.length && !hits.length) list.append(note(`Nothing found for “${words || query}” here.`));
    if (words.trim()) footer(words.trim());
    open(true);
  };

  const ensureIndex = () => {
    if (entries || failed) return;
    loadIndex(INDEX).then(
      (index) => { entries = index.entries || []; render(); },
      () => { failed = true; render(); },
    );
  };

  /* the page: the query is its address */
  const remember = () => {
    if (!page) return;
    const q = input.value.trim();
    history.replaceState(null, '', q ? `?q=${encodeURIComponent(q)}` : location.pathname);
    document.title = q ? `${q} — Search — abap2UI5` : 'Search — abap2UI5';
  };

  input.addEventListener('focus', () => { ensureIndex(); render(); });
  input.addEventListener('input', () => { ensureIndex(); remember(); render(); });

  input.addEventListener('keydown', (e) => {
    const row = rows[active];
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!rows.length) return;
      e.preventDefault();
      if (list.hidden) open(true);
      const step = e.key === 'ArrowDown' ? 1 : -1;
      select((active + step + rows.length) % rows.length);
    } else if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && row) {
      /* the arrows move the caret until a hit is chosen; after that they walk
       * its actions - Left from the first action is back on the hit */
      e.preventDefault();
      const next = e.key === 'ArrowRight' ? Math.min(action + 1, row.actions.length - 1) : Math.max(action - 1, -1);
      select(active, next);
    } else if (e.key === 'Enter') {
      const target = row ? (row.actions[action] || row.main) : rows[0]?.main;
      if (!target) return;
      e.preventDefault();
      if (e.metaKey || e.ctrlKey) window.open(target.href, '_blank', 'noopener');
      else target.click();
    } else if (e.key === 'Escape') {
      if (!page && !list.hidden) { e.preventDefault(); open(false); } else if (input.value) { e.preventDefault(); input.value = ''; remember(); render(); }
    }
  });

  document.addEventListener('keydown', (e) => {
    const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName));
    if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      input.focus();
      input.select();
    } else if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      input.focus();
    }
  });

  if (!page) {
    /* A press on a result keeps the focus in the field: Safari does not focus
     * a link it is clicked on, so the list would close under the pointer
     * before the click arrived. */
    list.addEventListener('pointerdown', (e) => e.preventDefault());
    document.addEventListener('pointerdown', (e) => {
      if (!box.contains(e.target)) open(false);
    });
    box.addEventListener('focusout', (e) => {
      if (!box.contains(e.relatedTarget)) open(false);
    });
  } else {
    input.value = new URLSearchParams(location.search).get('q') || '';
    document.title = input.value ? `${input.value} — Search — abap2UI5` : document.title;
    ensureIndex();
    render();
    input.focus();
  }
}
