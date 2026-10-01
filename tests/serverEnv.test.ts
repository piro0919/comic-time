import assert from "node:assert/strict";
import { test } from "node:test";
import { readServerEnv } from "../src/app/serverEnv.ts";

const full = {
  BETTER_AUTH_SECRET: "secret",
  DATABASE_URL: "postgres://localhost/db",
  GOOGLE_CLIENT_ID: "id",
  GOOGLE_CLIENT_SECRET: "client-secret",
};

test("揃っていればそのまま返し、BETTER_AUTH_URL は無くてもよい", () => {
  const env = readServerEnv(full);

  assert.equal(env.DATABASE_URL, full.DATABASE_URL);
  assert.equal(env.BETTER_AUTH_URL, undefined);
});

test("足りない名前と空の名前を全部挙げて止まる", () => {
  assert.throws(
    () =>
      readServerEnv({ ...full, DATABASE_URL: "", GOOGLE_CLIENT_ID: undefined }),
    /DATABASE_URL, GOOGLE_CLIENT_ID/,
  );
});
