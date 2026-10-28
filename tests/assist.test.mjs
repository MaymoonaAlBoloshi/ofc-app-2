import { test } from "node:test";
import assert from "node:assert/strict";
import {
  aiDraft,
  suggest,
  intakeSuggestions,
  research,
} from "../lib/assist.mjs";
import { sameOrigin } from "../lib/http.mjs";
const o = {
  stage: "sg1",
  facts: {},
  requirements: {},
  revisions: {},
  documents: [
    {
      id: "evidence",
      name: "Company_Profile.txt",
      category: "Market",
      kind: "Source",
      warnings: ["Illustrative example values."],
      text: "Subject: Example company | Report\nCompany background. Example funding 1.5 million is not a proposal. Market demand requires further research.",
    },
  ],
};
test("assistance preserves missing evidence and never prefills an investment amount", () => {
  const v = intakeSuggestions(o);
  assert.equal(v.amount, "");
  assert.equal(v.investor, "Example company");
  const d = suggest(o, "market");
  assert.ok(d.text.includes("Assessment and conclusion: complete"));
  assert.deepEqual(d.sourceIds, ["evidence"]);
});
test("provider drafting has explicit source constraints, bounded context and actionable failures", async () => {
  const env = {
    SIRAAJ_API_KEY: "test-only",
    SIRAAJ_BASE_URL: "https://provider.invalid/v1",
    SIRAAJ_MODEL: "test",
  };
  let payload;
  const sections = [
    {
      id: "sourcing",
      title: "Sourcing",
      text: "Evidence needed: source not established.",
      sourceIds: ["evidence"],
    },
  ];
  const result = await aiDraft(o, env, async (url, options) => {
    payload = JSON.parse(options.body);
    assert.equal(url, "https://provider.invalid/v1/chat/completions");
    return Response.json({
      choices: [{ message: { content: JSON.stringify({ sections }) } }],
    });
  });
  assert.deepEqual(result, sections);
  assert.match(payload.messages[0].content, /untrusted data/);
  assert.match(payload.messages[1].content, /Illustrative example/);
  await assert.rejects(() => aiDraft(o, {}), /not configured/);
  await assert.rejects(
    () => aiDraft(o, env, async () => new Response("", { status: 429 })),
    /busy/,
  );
  await assert.rejects(
    () =>
      aiDraft(o, env, async () =>
        Response.json({ choices: [{ message: { content: "not JSON" } }] }),
      ),
    /unreadable draft/,
  );
});
test("research rejects private or unsupported destinations before fetching", async () => {
  for (const url of [
    "http://127.0.0.1",
    "https://localhost",
    "https://www.msx.om:8443/",
    "https://user:pass@www.msx.om/",
  ])
    await assert.rejects(() => research(url), /official sources/);
});
test("same-origin checks use the public host supplied to the local Next server", () => {
  assert.doesNotThrow(() =>
    sameOrigin(
      new Request("http://localhost:3005/api/demo", {
        headers: { host: "127.0.0.1:3005", origin: "http://127.0.0.1:3005" },
      }),
    ),
  );
  assert.throws(
    () =>
      sameOrigin(
        new Request("http://localhost:3005/api/demo", {
          headers: {
            host: "127.0.0.1:3005",
            origin: "https://untrusted.example",
          },
        }),
      ),
    /OFC app/,
  );
});
