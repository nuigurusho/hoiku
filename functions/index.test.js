"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { _test } = require("./index");

function sample(overrides = {}) {
  return {
    schema: 1,
    game: "quiz",
    event: "start",
    day: new Date().toISOString().slice(0, 10),
    dayId: "daily_random_id_123456",
    eventId: "event_random_id_123456",
    ...overrides,
  };
}

test("許可したゲーム開始イベントを受理する", () => {
  assert.equal(_test.validatePayload(sample()), true);
});

test("複製サイトから任意のゲーム名を送れない", () => {
  assert.equal(_test.validatePayload(sample({ game: "copied-game" })), false);
});

test("開始以外は日次IDを送らなくてもよい", () => {
  const body = sample({ event: "open" });
  delete body.dayId;
  assert.equal(_test.validatePayload(body), true);
});

test("古すぎるオフラインイベントを拒否する", () => {
  assert.equal(_test.validatePayload(sample({ day: "2020-01-01" })), false);
});

test("イベント名から安全なカウンター名を作る", () => {
  assert.equal(_test.counterField("complete"), "completeCount");
});
