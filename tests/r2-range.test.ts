import assert from "node:assert/strict";
import test from "node:test";
import { resolveObjectRange } from "../worker/range.ts";

test("R2 byte ranges support explicit, open-ended, and suffix requests", () => {
  assert.deepEqual(resolveObjectRange({ offset: 100, length: 250 }, 1_000), { offset: 100, length: 250 });
  assert.deepEqual(resolveObjectRange({ offset: 600 }, 1_000), { offset: 600, length: 400 });
  assert.deepEqual(resolveObjectRange({ length: 200 }, 1_000), { offset: 0, length: 200 });
  assert.deepEqual(resolveObjectRange({ suffix: 128 }, 1_000), { offset: 872, length: 128 });
});

test("R2 byte ranges are clamped to the object boundaries", () => {
  assert.deepEqual(resolveObjectRange({ offset: 900, length: 500 }, 1_000), { offset: 900, length: 100 });
  assert.deepEqual(resolveObjectRange({ suffix: 2_000 }, 1_000), { offset: 0, length: 1_000 });
});
