"use strict";

const { createHash } = require("node:crypto");
const { initializeApp } = require("firebase-admin/app");
const { FieldValue, Timestamp, getFirestore } = require("firebase-admin/firestore");
const { onRequest } = require("firebase-functions/v2/https");

initializeApp();

const ALLOWED_ORIGIN = "https://nuigurusho.github.io";
const ALLOWED_GAMES = new Set([
  "adventure", "diff", "dodgeball", "draw", "fukuwarai", "janken", "memory",
  "mole", "puzzle", "quiz", "race", "relay", "rope", "sakasa", "silhouette",
  "tamaire", "undoukai", "voice", "world",
]);
const ALLOWED_EVENTS = new Set(["open", "start", "complete"]);
const ID_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parsePayload(req) {
  const raw = Buffer.isBuffer(req.rawBody)
    ? req.rawBody.toString("utf8")
    : typeof req.body === "string"
      ? req.body
      : JSON.stringify(req.body || {});
  if (Buffer.byteLength(raw, "utf8") > 1024) throw new Error("payload-too-large");
  return JSON.parse(raw);
}

function validDay(day) {
  if (!DAY_PATTERN.test(day)) return false;
  const value = Date.parse(`${day}T00:00:00Z`);
  if (!Number.isFinite(value)) return false;
  const ageDays = (Date.now() - value) / 86400000;
  return ageDays >= -2 && ageDays <= 35;
}

function validatePayload(body) {
  if (!body || body.schema !== 1) return false;
  if (!ALLOWED_GAMES.has(body.game) || !ALLOWED_EVENTS.has(body.event)) return false;
  if (!validDay(body.day) || !ID_PATTERN.test(body.eventId || "")) return false;
  if (body.event === "start" && !ID_PATTERN.test(body.dayId || "")) return false;
  return true;
}

function counterField(event) {
  return `${event}Count`;
}

exports.collectGameEvent = onRequest({
  region: "asia-northeast1",
  memory: "256MiB",
  timeoutSeconds: 10,
  minInstances: 0,
  maxInstances: 1,
  concurrency: 20,
}, async (req, res) => {
  res.set("Vary", "Origin");
  if (req.get("origin") !== ALLOWED_ORIGIN) {
    res.status(403).end();
    return;
  }
  res.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  let body;
  try {
    body = parsePayload(req);
  } catch (_) {
    res.status(400).end();
    return;
  }
  if (!validatePayload(body)) {
    res.status(400).end();
    return;
  }

  const db = getFirestore();
  const dailyRef = db.collection("analyticsDaily").doc(`${body.day}_${body.game}`);
  const eventRef = db.collection("analyticsEvents").doc(`${body.day}_${body.eventId}`);
  const playerHash = body.event === "start"
    ? createHash("sha256").update(`${body.day}:${body.game}:${body.dayId}`).digest("hex")
    : null;
  const playerRef = playerHash ? dailyRef.collection("players").doc(playerHash) : null;

  try {
    await db.runTransaction(async (tx) => {
      const refs = playerRef ? [eventRef, playerRef] : [eventRef];
      const snapshots = await tx.getAll(...refs);
      if (snapshots[0].exists) return;

      const expiresAt = Timestamp.fromMillis(Date.now() + 35 * 86400000);
      tx.create(eventRef, {
        day: body.day,
        game: body.game,
        event: body.event,
        createdAt: FieldValue.serverTimestamp(),
        expiresAt,
      });

      const update = {
        day: body.day,
        game: body.game,
        [counterField(body.event)]: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (playerRef && !snapshots[1].exists) {
        tx.create(playerRef, { createdAt: FieldValue.serverTimestamp(), expiresAt });
        update.uniquePlayers = FieldValue.increment(1);
      }
      tx.set(dailyRef, update, { merge: true });
    });
    res.status(204).end();
  } catch (error) {
    console.error("collectGameEvent failed", error && error.message);
    res.status(500).end();
  }
});

exports._test = { parsePayload, validDay, validatePayload, counterField };
