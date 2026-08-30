"use strict";

/* pwa-build.jsはデプロイ時にコミットIDと公開ファイル一覧から自動生成される。 */
importScripts("./pwa-build.js");

const BUILD = self.HOIKU_PWA_BUILD || "local";
const CACHE_PREFIX = "hoiku-pwa-";
const CACHE_NAME = CACHE_PREFIX + BUILD;
const PRECACHE_URLS = Array.isArray(self.HOIKU_PWA_ASSETS) ? self.HOIKU_PWA_ASSETS : ["./", "./index.html"];

self.addEventListener("install", (event) => {
  /* 全ファイルの保存が成功した版だけを待機状態にする。失敗時は現在の版を残す。 */
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => {
      if (key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME) return caches.delete(key);
      return Promise.resolve(false);
    }));
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

async function fromNetwork(request) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3500);
  try {
    return await fetch(request, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fromCache(request) {
  const cache = await caches.open(CACHE_NAME);
  return cache.match(request, { ignoreSearch: true });
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    /* オンライン時は常にサーバーを優先し、古いキャッシュを表示し続けない。 */
    try {
      const response = await fromNetwork(request);
      if (response && response.ok) return response;
    } catch (_) {
      // オフライン・通信不調時は、インストール時に完成した同じ版のキャッシュへ戻る。
    }
    const cached = await fromCache(request);
    if (cached) return cached;
    if (request.mode === "navigate") {
      const cache = await caches.open(CACHE_NAME);
      const home = await cache.match("./index.html", { ignoreSearch: true });
      if (home) return home;
    }
    return new Response("オフライン用データが見つかりません", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  })());
});
