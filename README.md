# abap2UI5-addons.github.io

The addons of abap2UI5 at <https://abap2ui5-addons.github.io/>: an overview
of every repository of [abap2UI5-addons](https://github.com/abap2UI5-addons)
and one page per addon, all the same shape - what it does, what it needs,
how it is installed, how it is used, where to read more.

```bash
npm ci
npm run dev      # http://localhost:4321/
npm run check    # build + test, what CI runs
```

A new addon is one line in `src/data/catalog.ts` and one file in
`src/data/addons/<repo>.json`. See `AGENTS.md` for the rules.
