// Run with `npm test`. Node's own test runner, so no new dependency: it reads the TypeScript module directly.
import assert from "node:assert/strict";
import { test } from "node:test";
import { STAGE_COPY, stageCopy } from "./types.ts";

test("every known stage keeps its own words", () => {
  for (const stage of Object.keys(STAGE_COPY)) assert.equal(stageCopy(stage), STAGE_COPY[stage]);
});

test("an unknown or missing stage gets neutral words instead of nothing", () => {
  // "constructor" and "toString" would be found on a plain object's prototype by a bare STAGE_COPY[stage].
  for (const stage of ["SOMETHING_NEW", "", null, undefined, "constructor", "toString", "ready"]) {
    const copy = stageCopy(stage);
    assert.equal(copy.label, "Status unavailable", String(stage));
    assert.equal(copy.tone, "default");
    assert.ok(copy.text.length > 0);
  }
});
