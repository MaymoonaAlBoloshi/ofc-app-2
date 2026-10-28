import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { readState, mutate } from "../lib/store.mjs";
test("server storage persists records and rejects concurrent stale writes", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "ofc2-store-"));
  process.env.OFC2_DATA_DIR = dir;
  try {
    assert.equal((await readState()).version, 0);
    const results = await Promise.allSettled([
      mutate({ action: "create", role: "Investment", name: "First" }, 0),
      mutate({ action: "create", role: "Investment", name: "Second" }, 0),
    ]);
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    assert.match(
      results.find((r) => r.status === "rejected").reason.message,
      /changed/,
    );
    const saved = await readState();
    assert.equal(saved.version, 1);
    assert.equal(saved.opportunities.length, 1);
    assert.equal(saved.events.length, 1);
  } finally {
    delete process.env.OFC2_DATA_DIR;
    await rm(dir, { recursive: true, force: true });
  }
});
