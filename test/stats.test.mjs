// scripts/stats.mjs: the stars of every repository, however many pages the
// API needs for them. No network - fetch is handed in.
import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchRepos, collectStats, PER_PAGE, MAX_PAGES } from "../scripts/stats.mjs";

const serve = (count) => {
  const asked = [];
  const fetchFn = async (url) => {
    asked.push(url);
    const page = Number(new URL(url).searchParams.get("page"));
    const from = (page - 1) * PER_PAGE;
    const rows = Array.from({ length: Math.max(0, Math.min(PER_PAGE, count - from)) }, (_, i) => ({ name: `r${from + i}`, stargazers_count: from + i, pushed_at: "2026-11-27T00:00:00Z" }));
    return { ok: true, status: 200, json: async () => rows };
  };
  return { fetchFn, asked };
};

test("the pages are walked until one comes back short", async () => {
  const { fetchFn, asked } = serve(230);
  const repos = await fetchRepos("abap2UI5", fetchFn);
  assert.equal(repos.length, 230);
  assert.equal(asked.length, 3);
  assert.match(asked[2], /[?&]page=3(&|$)/);
});

test("a page of exactly 100 asks for the next, and the walk stops at five pages", async () => {
  assert.equal((await fetchRepos("o", serve(100).fetchFn)).length, 100);
  const many = serve(10000);
  assert.equal((await fetchRepos("o", many.fetchFn)).length, PER_PAGE * MAX_PAGES);
  assert.equal(many.asked.length, MAX_PAGES);
});

test("the 101st repository has its stars, keyed by organization", async () => {
  const stats = await collectStats(["abap2UI5-addons"], serve(101).fetchFn);
  assert.deepEqual(stats["abap2UI5-addons/r100"], { stars: 100, pushed: "2026-11-27T00:00:00Z" });
});

test("a failed page is an error, which the script turns into no stars", async () => {
  await assert.rejects(fetchRepos("o", async () => ({ ok: false, status: 403 })), /o: HTTP 403/);
});
