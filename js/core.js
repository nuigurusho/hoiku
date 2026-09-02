/* ============================================================
   core.js — 共通基盤
   Util(画像処理) / Sound(効果音合成) / Store(画像ライブラリ)
   Samples(サンプル画像生成) / Pad(入力) / Ui(演出)
   ============================================================ */
"use strict";

/* core.js から見たアプリと内蔵画像の場所。ゲーム配下から読んでも同じURLになる */
const CORE_APP_ROOT = document.currentScript
  ? new URL("../", document.currentScript.src)
  : new URL("./", document.baseURI);
const CORE_ASSET_ROOT = new URL("assets/", CORE_APP_ROOT);

/* ---------------- Util ---------------- */
const Util = {
  clamp(v, a, b) { return v < a ? a : v > b ? b : v; },
  rand(a, b) { return a + Math.random() * (b - a); },
  randInt(a, b) { return Math.floor(this.rand(a, b + 1)); },
  choice(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  loadImage(src) {
    return new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = rej;
      im.src = src;
    });
  },

  makeCanvas(w, h) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    return c;
  },

  /* 絵の中心を軸に回転する。キャンバスの大きさは変えず、空いた所は白で埋める。 */
  rotateCanvas(source, degrees, fill = "#fff") {
    const out = Util.makeCanvas(source.width, source.height);
    const ctx = out.getContext("2d");
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.translate(out.width / 2, out.height / 2);
    ctx.rotate((Number(degrees) || 0) * Math.PI / 180);
    ctx.drawImage(source, -source.width / 2, -source.height / 2);
    return out;
  },

  /* 回転後も、筆跡や関節位置が絵と一緒に動くように正規化座標を変換する。 */
  rotatePoint(x, y, degrees, width, height) {
    const rad = (Number(degrees) || 0) * Math.PI / 180;
    const cos = Math.cos(rad), sin = Math.sin(rad);
    const dx = (Number(x) - 0.5) * width;
    const dy = (Number(y) - 0.5) * height;
    return {
      x: Util.clamp((dx * cos - dy * sin) / width + 0.5, 0, 1),
      y: Util.clamp((dx * sin + dy * cos) / height + 0.5, 0, 1),
    };
  },

  /* ファイル → 縮小データURL(長辺 max px) */
  fileToDataURL(file, max = 1000) {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = async () => {
        try {
          const img = await Util.loadImage(fr.result);
          const sc = Math.min(1, max / Math.max(img.width, img.height));
          const c = Util.makeCanvas(Math.round(img.width * sc), Math.round(img.height * sc));
          const ctx = c.getContext("2d");
          // 透過PNGはJPEG化で黒くなるので、先に白でぬっておく(白は切りぬきで消える)
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, c.width, c.height);
          ctx.drawImage(img, 0, 0, c.width, c.height);
          res(c.toDataURL("image/jpeg", 0.88));
        } catch (e) { rej(e); }
      };
      fr.onerror = rej;
      fr.readAsDataURL(file);
    });
  },

  /* Blob → dataURL(録音した音声の保存などに使う) */
  blobToDataURL(blob) {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result);
      fr.onerror = rej;
      fr.readAsDataURL(blob);
    });
  },

  /* キャラクターの白背景を抜く設定。
     cutout未設定の古い絵は、見た目を変えないため従来方式(legacy)で扱う。 */
  cutoutSettings(cutout) {
    return {
      mode: cutout && cutout.mode === "edge" ? "edge" : "legacy",
      threshold: Util.clamp(Number(cutout && cutout.threshold) || 225, 170, 250),
      gap: Util.clamp(Number(cutout && cutout.gap) || 0, 0, 8),
      strokes: Array.isArray(cutout && cutout.strokes) ? cutout.strokes.slice(0, 800) : [],
    };
  },

  /* 白っぽい背景を透明に(紙に描いた絵の切りぬき)。
     edgeは「外周から届く白だけ」を抜き、輪郭の内側にある白い体・服を残す。 */
  keyImage(img, options = 225) {
    const cfg = typeof options === "number"
      ? { mode: "legacy", threshold: options, gap: 0, strokes: [] }
      : Util.cutoutSettings(options);
    const thr = cfg.threshold;
    const c = Util.makeCanvas(img.width, img.height);
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const id = ctx.getImageData(0, 0, c.width, c.height);
    const d = id.data;
    const w = c.width, h = c.height, n = w * h;
    const originalAlpha = cfg.strokes.length ? Uint8Array.from({ length: n }, (_, i) => d[i * 4 + 3]) : null;

    if (cfg.mode === "legacy") {
      for (let i = 0; i < d.length; i += 4) {
        const bright = Math.min(d[i], d[i + 1], d[i + 2]);
        if (bright > thr) d[i + 3] = 0;
        else if (bright > thr - 25) d[i + 3] = Math.round(255 * (thr - bright) / 25);
      }
    } else {
      const wall = new Uint8Array(n);
      const soft = 25;
      for (let i = 0; i < n; i++) {
        const p = i * 4;
        const bright = Math.min(d[p], d[p + 1], d[p + 2]);
        if (d[p + 3] > 20 && bright <= thr - soft) wall[i] = 1;
      }

      // 輪郭の判定だけを少し太らせ、小さな線の切れ目から背景が体内へ漏れるのを防ぐ。
      if (cfg.gap > 0) {
        const r = Math.round(cfg.gap);
        const dist = new Int8Array(n).fill(-1);
        const growQ = new Int32Array(n);
        let gh = 0, gt = 0;
        for (let i = 0; i < n; i++) if (wall[i]) { dist[i] = 0; growQ[gt++] = i; }
        while (gh < gt) {
          const i = growQ[gh++], x = i % w, nd = dist[i] + 1;
          if (nd > r) continue;
          const grow = (j) => {
            if (dist[j] >= 0) return;
            dist[j] = nd; wall[j] = 1; growQ[gt++] = j;
          };
          if (x > 0) grow(i - 1);
          if (x < w - 1) grow(i + 1);
          if (i >= w) grow(i - w);
          if (i + w < n) grow(i + w);
        }
      }

      const outside = new Uint8Array(n);
      const q = new Int32Array(n);
      let qh = 0, qt = 0;
      const seed = (i) => {
        if (!outside[i] && !wall[i]) { outside[i] = 1; q[qt++] = i; }
      };
      for (let x = 0; x < w; x++) { seed(x); seed((h - 1) * w + x); }
      for (let y = 0; y < h; y++) { seed(y * w); seed(y * w + w - 1); }
      while (qh < qt) {
        const i = q[qh++], x = i % w;
        if (x > 0) seed(i - 1);
        if (x < w - 1) seed(i + 1);
        if (i >= w) seed(i - w);
        if (i + w < n) seed(i + w);
      }

      for (let i = 0; i < n; i++) {
        if (!outside[i]) continue;
        const p = i * 4;
        const bright = Math.min(d[p], d[p + 1], d[p + 2]);
        if (bright > thr) d[p + 3] = 0;
        else if (bright > thr - soft) d[p + 3] = Math.round(255 * (thr - bright) / soft);
      }
    }

    // 高度な設定の「残す／消す」筆。元画像に対する正規化座標なので縮小してもずれない。
    for (const s of cfg.strokes) {
      const cx = Util.clamp(Number(s.x) || 0, 0, 1) * w;
      const cy = Util.clamp(Number(s.y) || 0, 0, 1) * h;
      const rr = Util.clamp(Number(s.r) || 0.02, 0.002, 0.2) * Math.max(w, h);
      const x0 = Math.max(0, Math.floor(cx - rr)), x1 = Math.min(w - 1, Math.ceil(cx + rr));
      const y0 = Math.max(0, Math.floor(cy - rr)), y1 = Math.min(h - 1, Math.ceil(cy + rr));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        if ((x - cx) * (x - cx) + (y - cy) * (y - cy) > rr * rr) continue;
        const i = y * w + x;
        d[i * 4 + 3] = s.keep ? originalAlpha[i] : 0;
      }
    }
    ctx.putImageData(id, 0, 0);
    return c;
  },

  /* 線画をベタぬりのかげにする:
     外側から届かない透明部分(輪郭の内側)を不透明にした
     アルファだけのキャンバスを返す。線を仮想的にふくらませて
     外側判定をするので、輪郭が多少とぎれていても袋になる。
     ふくらませる量は、内側がちゃんと埋まるまで自動で広げる */
  solidShadow(cv) {
    const w = cv.width, h = cv.height, n = w * h;
    const d = cv.getContext("2d").getImageData(0, 0, w, h).data;
    const drawn = new Uint8Array(n);
    let drawnCount = 0;
    for (let i = 0; i < n; i++) {
      if (d[i * 4 + 3] > 20) { drawn[i] = 1; drawnCount++; }
    }
    if (!drawnCount) return Util.makeCanvas(w, h);

    const q = new Int32Array(n);

    // 各ピクセルの「線からの距離」(4近傍BFS)
    const dist = new Int32Array(n).fill(-1);
    let qh = 0, qt = 0;
    for (let i = 0; i < n; i++) if (drawn[i]) { dist[i] = 0; q[qt++] = i; }
    while (qh < qt) {
      const i = q[qh++], x = i % w, nd = dist[i] + 1;
      if (x > 0 && dist[i - 1] < 0) { dist[i - 1] = nd; q[qt++] = i - 1; }
      if (x < w - 1 && dist[i + 1] < 0) { dist[i + 1] = nd; q[qt++] = i + 1; }
      if (i >= w && dist[i - w] < 0) { dist[i - w] = nd; q[qt++] = i - w; }
      if (i + w < n && dist[i + w] < 0) { dist[i + w] = nd; q[qt++] = i + w; }
    }

    // 「線からrpx以内」を壁とみなして、ふちから外側を流しこむ
    const flood = (r) => {
      const outside = new Uint8Array(n);
      qh = 0; qt = 0;
      const seed = (i) => { if (!outside[i] && dist[i] > r) { outside[i] = 1; q[qt++] = i; } };
      for (let x = 0; x < w; x++) { seed(x); seed((h - 1) * w + x); }
      for (let y = 0; y < h; y++) { seed(y * w); seed(y * w + w - 1); }
      while (qh < qt) {
        const i = q[qh++], x = i % w;
        if (x > 0) seed(i - 1);
        if (x < w - 1) seed(i + 1);
        if (i >= w) seed(i - w);
        if (i + w < n) seed(i + w);
      }
      return outside;
    };

    // すきま許容量rを、内側がちゃんと埋まるまで広げていく
    let r = Math.max(2, Math.round(Math.max(w, h) / 150));
    const maxR = Math.max(r, Math.round(Math.max(w, h) / 10));
    let outside = flood(r);
    for (;;) {
      let interior = 0;
      for (let i = 0; i < n; i++) if (!outside[i] && dist[i] > r) interior++;
      if (interior > drawnCount || r >= maxR) break;
      r = Math.min(maxR, r * 2);
      outside = flood(r);
    }

    // ふくらませた分だけ外側を押しもどす(元の線は削らない)
    const depth = new Int32Array(n).fill(-1);
    qh = 0; qt = 0;
    for (let i = 0; i < n; i++) if (outside[i]) { depth[i] = 0; q[qt++] = i; }
    while (qh < qt) {
      const i = q[qh++];
      if (depth[i] >= r) continue;
      const x = i % w, nd = depth[i] + 1;
      const push = (j) => { if (depth[j] < 0 && !drawn[j]) { depth[j] = nd; outside[j] = 1; q[qt++] = j; } };
      if (x > 0) push(i - 1);
      if (x < w - 1) push(i + 1);
      if (i >= w) push(i - w);
      if (i + w < n) push(i + w);
    }

    const out = Util.makeCanvas(w, h);
    const octx = out.getContext("2d");
    const oid = octx.createImageData(w, h);
    for (let i = 0; i < n; i++) {
      if (!outside[i] || drawn[i]) oid.data[i * 4 + 3] = 255;
    }
    octx.putImageData(oid, 0, 0);
    return out;
  },

  /* 透明部分を切りつめて中身だけにする */
  trimCanvas(cv, pad = 6) {
    const ctx = cv.getContext("2d");
    const { width: w, height: h } = cv;
    const d = ctx.getImageData(0, 0, w, h).data;
    let minX = w, minY = h, maxX = -1, maxY = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (d[(y * w + x) * 4 + 3] > 20) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0) return cv; // 全部透明ならそのまま
    minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
    maxX = Math.min(w - 1, maxX + pad); maxY = Math.min(h - 1, maxY + pad);
    const out = Util.makeCanvas(maxX - minX + 1, maxY - minY + 1);
    out.getContext("2d").drawImage(cv, -minX, -minY);
    return out;
  },

  /* ちょうちょ(はねを1まいだけ かいた え)を 左右そろえた すがたに する。
     いちらん・キャラえらびの サムネで つかう。 */
  async symCanvas(rec) {
    const img = await this.loadImage(rec.dataURL);
    const t = this.trimCanvas(this.keyImage(img, rec.cutout));
    const hx = (rec.rig && rec.rig.hingeX) || 0;
    const hinge = Math.min(t.width - 1, Math.round(this.clamp(hx, 0, 0.6) * t.width));
    const wingW = Math.max(1, t.width - hinge);
    const c = this.makeCanvas(wingW * 2, t.height);
    const ctx = c.getContext("2d");
    ctx.drawImage(t, hinge, 0, wingW, t.height, wingW, 0, wingW, t.height);
    ctx.save();
    ctx.translate(wingW, 0); ctx.scale(-1, 1);
    ctx.drawImage(t, hinge, 0, wingW, t.height, 0, 0, wingW, t.height);
    ctx.restore();
    return c;
  },

  /* 絵文字を大きくキャンバスに描く */
  emojiCanvas(emoji, size = 200) {
    const c = Util.makeCanvas(size, size);
    const ctx = c.getContext("2d");
    ctx.font = `${Math.floor(size * 0.8)}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(emoji, size / 2, size / 2 + size * 0.05);
    return c;
  },

  /* キャンバス上のポインタ位置 → 論理座標
     はこの ひりつが 絵と ちがう ときは、object-fit: contain で まんなかに
     おさまっている ぶんを のぞいて かぞえる(はこ = 絵 なら いままでと おなじ) */
  canvasPos(canvas, ev) {
    const r = canvas.getBoundingClientRect();
    const p = ev.touches ? ev.touches[0] : ev;
    const sc = Math.min(r.width / canvas.width, r.height / canvas.height) || 1;
    const left = r.left + (r.width - canvas.width * sc) / 2;
    const top  = r.top  + (r.height - canvas.height * sc) / 2;
    return { x: (p.clientX - left) / sc, y: (p.clientY - top) / sc };
  },
};

/* ---------------- Sound(WebAudioで合成、音源ファイル不要) ---------------- */
const Sound = {
  ctx: null,
  _resuming: null,
  _blocked: false,
  /* はやおくり(「けっかへ」)の あいだは 音を 出さない。
     何十びょうぶんの 音が いっぺんに 鳴ってしまうため。 */
  muted: false,
  mute(on) { this.muted = !!on; },

  /* WebKitでは、同じ停止中のAudioContextへresume()を続けて呼ぶと
     音声デバイス開始の失敗が連続することがある。再開処理は必ず1本にまとめ、
     失敗後は自動再試行せず、次のタップで新しいContextを作り直す。 */
  _discard(ctx) {
    if (this.ctx !== ctx) return;
    this.ctx = null;
    this._blocked = true;
    try {
      const closing = ctx.close();
      if (closing && closing.catch) closing.catch(() => {});
    } catch (e) { /* すでに使えないContextならそのまま捨てる */ }
  },

  ensure(fromGesture = false) {
    if (this.muted) return null;
    if (this.ctx && this.ctx.state === "closed") this.ctx = null;
    if (this._blocked && !fromGesture) return null;
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try {
        this.ctx = new AC();
        this._blocked = false;
      } catch (e) {
        this._blocked = true;
        return null;
      }
    }
    const ctx = this.ctx;
    if ((ctx.state === "suspended" || ctx.state === "interrupted") && !this._resuming) {
      try {
        const resumed = ctx.resume();
        this._resuming = Promise.resolve(resumed)
          .then(() => { if (this.ctx === ctx) this._blocked = false; })
          .catch(() => this._discard(ctx))
          .finally(() => { this._resuming = null; });
      } catch (e) {
        this._discard(ctx);
        return null;
      }
    }
    return ctx;
  },

  unlock() {
    this._blocked = false;
    this.ensure(true);
  },
  beep(freq, dur = 0.12, type = "sine", vol = 0.2, when = 0, slide = 0) {
    const ctx = this.ensure();
    if (!ctx) return;
    try {
      const t = ctx.currentTime + when;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.linearRampToValueAtTime(freq + slide, t + dur);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
    } catch (e) {
      this._discard(ctx);
    }
  },
  tap()  { this.beep(660, 0.07, "square", 0.12); },
  pop()  { this.beep(500, 0.12, "sine", 0.25, 0, 500); },
  good() { [523, 659, 784].forEach((f, i) => this.beep(f, 0.14, "triangle", 0.22, i * 0.09)); },
  bad()  { this.beep(200, 0.25, "sawtooth", 0.15); this.beep(150, 0.3, "sawtooth", 0.12, 0.12); },
  jump() { this.beep(300, 0.18, "square", 0.15, 0, 400); },
  tick() { this.beep(880, 0.05, "square", 0.1); },
  pon()  { this.beep(880, 0.2, "triangle", 0.3); this.beep(1320, 0.25, "triangle", 0.2, 0.02); },
  step() { this.beep(Util.rand(180, 240), 0.05, "triangle", 0.1); },
  fanfare() {
    const mel = [
      [523, 0.0], [523, 0.12], [523, 0.24], [659, 0.36],
      [784, 0.6], [659, 0.78], [784, 0.94],
    ];
    mel.forEach(([f, w]) => this.beep(f, 0.22, "triangle", 0.25, w));
    [1047, 1319, 1568].forEach((f, i) => this.beep(f, 0.5, "sine", 0.15, 1.2 + i * 0.03));
  },
  laugh() { [700, 600, 700, 600, 750].forEach((f, i) => this.beep(f, 0.09, "square", 0.12, i * 0.1)); },

  /* キャラの声(admin.htmlで録音した dataURL)を鳴らす。
     voices={joy,greet,ouch,fail} のうち keys にあって登録ずみのものから
     ランダムに1つ再生する。鳴らせたら true、登録がなければ false を返すので、
     呼び出し側は false のとき従来の効果音にフォールバックできる。 */
  _voiceAudio: null,   // 再生中のキャラの声(連打でかぶらないように)
  playVoice(voices, keys) {
    if (this.muted) return false;
    if (!voices) return false;
    const avail = keys.filter((k) => voices[k]);
    if (!avail.length) return false;
    try {
      if (this._voiceAudio) { try { this._voiceAudio.pause(); } catch (e) {} }
      const a = new Audio(voices[Util.choice(avail)]);
      this._voiceAudio = a;
      a.play().catch(() => {});
      return true;
    } catch (e) { return false; }
  },
};
window.addEventListener("pointerdown", () => Sound.unlock(), { passive: true });

/* ---------------- Store(IndexedDBに画像を保存) ----------------
   レコード: { id, name, author, cat('char'|'bg'|'pic'|'fuku'|'src'), dataURL, hidden, cutout,
               rig:{neckY,hipY,centerX}, diffSpots:[{x,y,r}],
               diffVariants:[{dataURL,spots:[{x,y,r}]}],
               fukuParts:[{kind,x,y,w,h}],
               voices:{joy,greet,ouch,fail}(dataURL・キャラの声), created } */
const Store = {
  db: null,
  _mem: null, // IndexedDBが使えない環境用

  init() {
    if (this.db || this._mem) return Promise.resolve();
    return new Promise((res) => {
      let req;
      try { req = indexedDB.open("hoikuGamePack", 1); }
      catch (e) { this._mem = []; return res(); }
      req.onupgradeneeded = () => {
        req.result.createObjectStore("images", { keyPath: "id" });
      };
      req.onsuccess = () => { this.db = req.result; res(); };
      req.onerror = () => { this._mem = []; res(); };
    });
  },

  _tx(mode) { return this.db.transaction("images", mode).objectStore("images"); },

  async all(cat) {
    await this.init();
    let list;
    if (this._mem) list = this._mem.slice();
    else list = await new Promise((res) => {
      const rq = this._tx("readonly").getAll();
      rq.onsuccess = () => res(rq.result || []);
      rq.onerror = () => res([]);
    });
    list.sort((a, b) => a.created - b.created);
    return cat ? list.filter((r) => r.cat === cat) : list;
  },

  /* ゲーム・鑑賞画面では、管理画面で非表示にした素材を候補から外す。 */
  async forGame(cat) {
    const list = await this.ensureSamples();
    return list.filter((r) => r.hidden !== true && (!cat || r.cat === cat));
  },

  async get(id) {
    await this.init();
    if (this._mem) return this._mem.find((r) => r.id === id);
    return new Promise((res) => {
      const rq = this._tx("readonly").get(id);
      rq.onsuccess = () => res(rq.result);
      rq.onerror = () => res(undefined);
    });
  },

  async put(rec) {
    await this.init();
    if (!rec.id) rec.id = "img_" + Date.now() + "_" + Math.floor(Math.random() * 1e6);
    if (!rec.created) rec.created = Date.now();
    if (this._mem) {
      const i = this._mem.findIndex((r) => r.id === rec.id);
      if (i >= 0) this._mem[i] = rec; else this._mem.push(rec);
      return rec;
    }
    return new Promise((res, rej) => {
      const rq = this._tx("readwrite").put(rec);
      rq.onsuccess = () => res(rec);
      rq.onerror = () => rej(rq.error);
    });
  },

  async remove(id) {
    await this.init();
    if (this._mem) {
      this._mem = this._mem.filter((r) => r.id !== id);
      return;
    }
    return new Promise((res) => {
      const rq = this._tx("readwrite").delete(id);
      rq.onsuccess = () => res();
      rq.onerror = () => res();
    });
  },

  async clear() {
    await this.init();
    if (this._mem) { this._mem = []; return; }
    return new Promise((res) => {
      const rq = this._tx("readwrite").clear();
      rq.onsuccess = () => res();
      rq.onerror = () => res();
    });
  },

  /* 初回は全サンプル、更新時は新しい内蔵サンプルだけを重複なく追加する */
  async ensureSamples() {
    const list = await this.all();
    if (list.length === 0) {
      const recs = await Samples.makeAll();
      for (const r of recs) await this.put(r);
      return this.all();
    }

    for (const def of Samples.ASSET_SAMPLES) {
      const existing = list.find((r) => r.id === def.id || r.sampleKey === def.id);
      if (existing && (!def.sampleRevision || existing.sampleRevision === def.sampleRevision)) continue;
      const rec = await Samples.assetRecord(def);
      // 公開済みの内蔵サンプルを直したときは、端末内の古い画像も同じIDで更新する
      if (existing) {
        rec.id = existing.id;
        rec.created = existing.created;
        rec.sampleKey = def.id;
        if (existing.hidden) rec.hidden = true;
        await this.put(rec);
        continue;
      }
      const legacy = def.replaceLegacy && list.find((r) =>
        r.name === def.replaceLegacy.name &&
        !r.diffVariants &&
        r.diffSpots && r.diffSpots.length === def.replaceLegacy.spots &&
        Math.abs(r.diffSpots[0].x - def.replaceLegacy.firstX) < 0.001);
      if (legacy) {
        rec.id = legacy.id;
        rec.created = legacy.created;
        rec.sampleKey = def.id;
        if (legacy.hidden) rec.hidden = true;
      }
      await this.put(rec);
    }
    return this.all();
  },
};

/* ---------------- Samples(クレヨン風サンプル画像を生成) ---------------- */
const Samples = {
  /* 画像生成で作った内蔵サンプル。固定IDで既存端末にも1回だけ追加する */
  ASSET_SAMPLES: [
    {
      id: "sample-bg-crayon-hills-v1", name: "おかの せかい", cat: "bg",
      path: "backgrounds/world-land.jpg",
    },
    {
      id: "sample-pic-house-official-v1", name: "おうちのえ", cat: "pic",
      path: "samples/diff-house-base.jpg",
      replaceLegacy: { name: "おうちのえ", spots: 5, firstX: 0.88 },
      diffVariants: [
        { path: "samples/diff-house-v1.jpg", spots: [{ x: 0.325, y: 0.14, r: 0.055 }, { x: 0.685, y: 0.215, r: 0.045 }, { x: 0.858, y: 0.79, r: 0.060 }] },
        { path: "samples/diff-house-v2.jpg", spots: [{ x: 0.48, y: 0.25, r: 0.060 }, { x: 0.85, y: 0.33, r: 0.045 }, { x: 0.14, y: 0.86, r: 0.070 }] },
        { path: "samples/diff-house-v3.jpg", spots: [{ x: 0.54, y: 0.13, r: 0.090 }, { x: 0.85, y: 0.65, r: 0.075 }, { x: 0.11, y: 0.68, r: 0.050 }] },
        { path: "samples/diff-house-v4.jpg", spots: [{ x: 0.555, y: 0.405, r: 0.070 }, { x: 0.84, y: 0.83, r: 0.090 }, { x: 0.53, y: 0.875, r: 0.040 }] },
        { path: "samples/diff-house-v5.jpg", spots: [{ x: 0.72, y: 0.17, r: 0.055 }, { x: 0.14, y: 0.82, r: 0.055 }, { x: 0.64, y: 0.46, r: 0.045 }] },
      ],
    },
    {
      id: "sample-pic-fruit-orchard-official-v1", name: "くだものだいしゅうごう", cat: "pic",
      path: "samples/diff-fruit-base.jpg",
      replaceLegacy: { name: "くだものだいしゅうごう", spots: 5, firstX: 0.16 },
      diffVariants: [
        { path: "samples/diff-fruit-v1.jpg", spots: [{ x: 0.16, y: 0.52, r: 0.060 }, { x: 0.66, y: 0.11, r: 0.055 }, { x: 0.76, y: 0.88, r: 0.070 }] },
        { path: "samples/diff-fruit-v2.jpg", spots: [{ x: 0.22, y: 0.79, r: 0.055 }, { x: 0.45, y: 0.08, r: 0.065 }, { x: 0.73, y: 0.81, r: 0.070 }] },
        { path: "samples/diff-fruit-v3.jpg", spots: [{ x: 0.50, y: 0.49, r: 0.055 }, { x: 0.75, y: 0.85, r: 0.100 }, { x: 0.75, y: 0.06, r: 0.090 }] },
        { path: "samples/diff-fruit-v4.jpg", spots: [{ x: 0.67, y: 0.77, r: 0.055 }, { x: 0.32, y: 0.91, r: 0.080 }, { x: 0.54, y: 0.84, r: 0.045 }] },
        { path: "samples/diff-fruit-v5.jpg", spots: [{ x: 0.20, y: 0.27, r: 0.055 }, { x: 0.68, y: 0.49, r: 0.080 }, { x: 0.73, y: 0.89, r: 0.065 }] },
      ],
    },
    {
      id: "sample-pic-insects-garden-official-v1", name: "むしの おにわ", cat: "pic",
      sampleRevision: 2,
      path: "samples/diff-insects-garden-base.jpg",
      diffVariants: [
        { path: "samples/diff-insects-garden-v1.jpg", spots: [
          { x: 0.085, y: 0.270, r: 0.100 }, { x: 0.290, y: 0.310, r: 0.105 },
          { x: 0.630, y: 0.150, r: 0.095 }, { x: 0.510, y: 0.460, r: 0.130 },
          { x: 0.760, y: 0.785, r: 0.115 },
        ] },
      ],
    },
    {
      id: "sample-pic-insects-twilight-official-v1", name: "よるの むしのもり", cat: "pic",
      sampleRevision: 2,
      path: "samples/diff-insects-twilight-base.jpg",
      diffVariants: [
        { path: "samples/diff-insects-twilight-v1.jpg", spots: [
          { x: 0.790, y: 0.130, r: 0.090 }, { x: 0.800, y: 0.405, r: 0.125 },
          { x: 0.670, y: 0.615, r: 0.080 }, { x: 0.850, y: 0.660, r: 0.140 },
          { x: 0.410, y: 0.910, r: 0.075 },
        ] },
      ],
    },
    {
      id: "sample-pic-princess-garden-official-v1", name: "おしろの プリンセス", cat: "pic",
      sampleRevision: 3,
      path: "samples/diff-princess-garden-base.jpg",
      diffVariants: [
        { path: "samples/diff-princess-garden-v1.jpg", spots: [
          { x: 0.360, y: 0.545, r: 0.055 }, { x: 0.135, y: 0.850, r: 0.135 },
          { x: 0.900, y: 0.820, r: 0.175 }, { x: 0.930, y: 0.155, r: 0.105 },
          { x: 0.300, y: 0.340, r: 0.050 },
        ] },
      ],
    },
    {
      id: "sample-pic-sea-creatures-official-v1", name: "うみの いきもの", cat: "pic",
      sampleRevision: 2,
      path: "samples/diff-sea-creatures-base.jpg",
      diffVariants: [
        { path: "samples/diff-sea-creatures-v1.jpg", spots: [
          { x: 0.650, y: 0.230, r: 0.140 }, { x: 0.220, y: 0.100, r: 0.075 },
          { x: 0.870, y: 0.310, r: 0.135 }, { x: 0.490, y: 0.565, r: 0.165 },
          { x: 0.630, y: 0.850, r: 0.135 },
        ] },
      ],
    },
    {
      id: "sample-pic-crayon-picnic-v1", name: "ピクニックこうえん", cat: "pic",
      path: "samples/diff-picnic.jpg",
      diffSpots: [
        { x: 0.19, y: 0.20, r: 0.075 }, { x: 0.84, y: 0.16, r: 0.075 },
        { x: 0.50, y: 0.60, r: 0.085 }, { x: 0.17, y: 0.83, r: 0.075 },
        { x: 0.83, y: 0.82, r: 0.080 },
      ],
    },
    {
      id: "sample-pic-crayon-playroom-v1", name: "おもちゃの おへや", cat: "pic",
      path: "samples/diff-playroom.jpg",
      diffSpots: [
        { x: 0.50, y: 0.14, r: 0.065 }, { x: 0.19, y: 0.29, r: 0.085 },
        { x: 0.82, y: 0.52, r: 0.085 }, { x: 0.20, y: 0.81, r: 0.075 },
        { x: 0.78, y: 0.82, r: 0.080 },
      ],
    },
    {
      id: "sample-fuku-crayon-smile-v1", name: "にこにこ おかお", cat: "fuku",
      path: "samples/fuku-smile.png",
      fukuParts: [
        { kind: "め", x: 0.274, y: 0.466, w: 0.128, h: 0.145 },
        { kind: "め", x: 0.616, y: 0.466, w: 0.128, h: 0.145 },
        { kind: "まゆげ", x: 0.235, y: 0.338, w: 0.190, h: 0.085 },
        { kind: "まゆげ", x: 0.595, y: 0.338, w: 0.190, h: 0.085 },
        { kind: "はな", x: 0.430, y: 0.590, w: 0.140, h: 0.115 },
        { kind: "くち", x: 0.335, y: 0.695, w: 0.330, h: 0.170 },
      ],
    },
    {
      id: "sample-fuku-crayon-pigtails-v1", name: "おさげの おかお", cat: "fuku",
      path: "samples/fuku-pigtails.png",
      fukuParts: [
        { kind: "め", x: 0.270, y: 0.433, w: 0.145, h: 0.125 },
        { kind: "め", x: 0.606, y: 0.433, w: 0.145, h: 0.125 },
        { kind: "まゆげ", x: 0.235, y: 0.312, w: 0.215, h: 0.090 },
        { kind: "まゆげ", x: 0.560, y: 0.312, w: 0.215, h: 0.090 },
        { kind: "はな", x: 0.430, y: 0.540, w: 0.145, h: 0.115 },
        { kind: "くち", x: 0.365, y: 0.675, w: 0.270, h: 0.165 },
      ],
    },
  ],

  async _assetDataURL(path) {
    const res = await fetch(new URL(path, CORE_ASSET_ROOT));
    if (!res.ok) throw new Error(`内蔵画像を読み込めません: ${path}`);
    return Util.blobToDataURL(await res.blob());
  },

  async assetRecord(def) {
    const { path, diffVariants, replaceLegacy, ...meta } = def;
    const rec = { ...meta, dataURL: await this._assetDataURL(path) };
    if (diffVariants) {
      rec.diffVariants = await Promise.all(diffVariants.map(async (v) => ({
        dataURL: await this._assetDataURL(v.path),
        spots: (v.spots || []).map((s) => ({ ...s })),
      })));
    }
    return rec;
  },

  /* 手ぶれ風の線 */
  _line(ctx, x1, y1, x2, y2, seg = 6) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    for (let i = 1; i <= seg; i++) {
      const t = i / seg;
      ctx.lineTo(
        x1 + (x2 - x1) * t + Util.rand(-3, 3),
        y1 + (y2 - y1) * t + Util.rand(-3, 3)
      );
    }
    ctx.stroke();
  },
  _circle(ctx, cx, cy, r, fill) {
    ctx.beginPath();
    const n = 26;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rr = r + Util.rand(-r * 0.05, r * 0.05);
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    ctx.stroke();
  },
  _face(ctx, cx, cy, r) {
    ctx.fillStyle = "#4a3f35";
    ctx.beginPath(); ctx.arc(cx - r * 0.38, cy - r * 0.1, r * 0.09, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + r * 0.38, cy - r * 0.1, r * 0.09, 0, 7); ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.18, r * 0.42, 0.25 * Math.PI, 0.75 * Math.PI);
    ctx.stroke();
  },

  /* キャラ1: にこちゃん(まるい頭・ぼう人間ふう) */
  charA() {
    const c = Util.makeCanvas(420, 560);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, 420, 560);
    ctx.lineWidth = 9; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.strokeStyle = "#e8590c";
    this._circle(ctx, 210, 130, 95, "#ffd8a8");           // 頭
    this._face(ctx, 210, 130, 95);
    ctx.strokeStyle = "#1971c2";
    this._circle(ctx, 210, 300, 78, "#a5d8ff");           // 体
    this._line(ctx, 145, 265, 60, 330);                   // 左うで
    this._line(ctx, 275, 265, 360, 330);                  // 右うで
    ctx.strokeStyle = "#e8590c";
    this._line(ctx, 180, 372, 160, 500);                  // 左あし
    this._line(ctx, 240, 372, 260, 500);                  // 右あし
    this._line(ctx, 160, 500, 130, 505);                  // くつ
    this._line(ctx, 260, 500, 290, 505);
    return { name: "にこちゃん", cat: "char", dataURL: c.toDataURL("image/png"),
             rig: { neckY: 0.42, hipY: 0.68, centerX: 0.5 } };
  },

  /* キャラ2: くまごろう(みみつき) */
  charB() {
    const c = Util.makeCanvas(420, 560);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, 420, 560);
    ctx.lineWidth = 9; ctx.lineCap = "round";
    ctx.strokeStyle = "#795c34";
    this._circle(ctx, 150, 65, 34, "#d9a066");            // みみ
    this._circle(ctx, 270, 65, 34, "#d9a066");
    this._circle(ctx, 210, 145, 92, "#d9a066");           // 頭
    ctx.fillStyle = "#4a3f35";
    ctx.beginPath(); ctx.arc(175, 135, 9, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(245, 135, 9, 0, 7); ctx.fill();
    this._circle(ctx, 210, 172, 20, "#f6e5cb");           // はな周り
    ctx.beginPath(); ctx.arc(210, 167, 7, 0, 7); ctx.fillStyle = "#4a3f35"; ctx.fill();
    this._circle(ctx, 210, 315, 85, "#b98a4f");           // 体
    this._line(ctx, 140, 280, 70, 350);                   // うで
    this._line(ctx, 280, 280, 350, 350);
    this._line(ctx, 180, 392, 170, 510);                  // あし
    this._line(ctx, 240, 392, 250, 510);
    return { name: "くまごろう", cat: "char", dataURL: c.toDataURL("image/png"),
             rig: { neckY: 0.43, hipY: 0.7, centerX: 0.5 } };
  },

  /* キャラ3: ぴょんこ(うさぎみみ) */
  charC() {
    const c = Util.makeCanvas(420, 580);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, 420, 580);
    ctx.lineWidth = 9; ctx.lineCap = "round";
    ctx.strokeStyle = "#d6336c";
    ctx.beginPath(); ctx.ellipse(165, 70, 26, 62, -0.15, 0, 7); ctx.fillStyle = "#ffdeeb"; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(255, 70, 26, 62, 0.15, 0, 7); ctx.fill(); ctx.stroke();
    this._circle(ctx, 210, 195, 85, "#ffdeeb");           // 頭
    this._face(ctx, 210, 195, 85);
    ctx.strokeStyle = "#ae3ec9";
    this._circle(ctx, 210, 350, 72, "#eebefa");           // 体
    this._line(ctx, 150, 320, 80, 380);
    this._line(ctx, 270, 320, 340, 380);
    ctx.strokeStyle = "#d6336c";
    this._line(ctx, 185, 415, 175, 530);
    this._line(ctx, 235, 415, 245, 530);
    return { name: "ぴょんこ", cat: "char", dataURL: c.toDataURL("image/png"),
             rig: { neckY: 0.48, hipY: 0.72, centerX: 0.5 } };
  },

  /* キャラ4: スカートのこ(type:'skirt' / 下半身は割らない) */
  charSkirt() {
    const c = Util.makeCanvas(420, 560);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, 420, 560);
    ctx.lineWidth = 9; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.strokeStyle = "#a5682a";                          // かみのけ
    this._circle(ctx, 210, 100, 90, "#c8863c");
    ctx.strokeStyle = "#e8a87c";                          // 頭
    this._circle(ctx, 210, 132, 76, "#ffe0b3");
    this._face(ctx, 210, 132, 76);
    ctx.strokeStyle = "#f06595";                          // うわぎ
    this._circle(ctx, 210, 250, 58, "#ffc9de");
    this._line(ctx, 158, 236, 96, 300);                   // うで
    this._line(ctx, 262, 236, 324, 300);
    ctx.strokeStyle = "#e64980"; ctx.fillStyle = "#ff8cc0"; // スカート(三角)
    ctx.beginPath();
    ctx.moveTo(210, 300); ctx.lineTo(118, 502); ctx.lineTo(302, 502);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "#8a5a2b";                          // あし
    this._line(ctx, 182, 502, 180, 534);
    this._line(ctx, 238, 502, 240, 534);
    ctx.strokeStyle = "#495057";                          // くつ
    this._line(ctx, 180, 534, 158, 540);
    this._line(ctx, 240, 534, 262, 540);
    return { name: "スカートのこ", cat: "char", dataURL: c.toDataURL("image/png"),
             rig: { type: "skirt", neckY: 0.37, hipY: 0.55, centerX: 0.5 } };
  },

  /* キャラ5: おばけちゃん(type:'float' / 人外・分割なし) */
  charFloat() {
    const c = Util.makeCanvas(400, 460);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, 400, 460);
    ctx.lineWidth = 9; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.strokeStyle = "#adb5bd"; ctx.fillStyle = "#f1f3f5";
    ctx.beginPath();                                      // ぷにっとしたおばけ
    ctx.moveTo(72, 300);
    ctx.quadraticCurveTo(72, 82, 200, 82);
    ctx.quadraticCurveTo(328, 82, 328, 300);
    const n = 6;                                          // すそのなみなみ
    for (let i = 0; i <= n; i++) {
      const x = 328 - (328 - 72) * (i / n);
      const y = i % 2 === 0 ? 340 : 300;
      ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#343a40";                            // め
    ctx.beginPath(); ctx.ellipse(162, 168, 15, 21, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(238, 168, 15, 21, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#ffc9c9";                            // ほっぺ
    ctx.beginPath(); ctx.arc(132, 210, 14, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(268, 210, 14, 0, 7); ctx.fill();
    ctx.fillStyle = "#868e96";                            // くち
    ctx.beginPath(); ctx.arc(200, 220, 24, 0.1 * Math.PI, 0.9 * Math.PI); ctx.fill();
    return { name: "おばけちゃん", cat: "char", dataURL: c.toDataURL("image/png"),
             rig: { type: "float" } };
  },

  /* キャラ6: ちょうちょ(type:'butterfly' / はねを1まいだけ かいた え) */
  charButterfly() {
    const c = Util.makeCanvas(380, 470);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, 380, 470);
    ctx.lineWidth = 9; ctx.lineCap = "round"; ctx.lineJoin = "round";

    /* はねの つけね(左はし x=0)に からだの はんぶんを おく。
       この え1まいが 左右はんてん されて 1ぴきの ちょうちょに なる。 */
    ctx.strokeStyle = "#e8590c"; ctx.fillStyle = "#ffa94d";
    ctx.beginPath();                                      // うえの はね
    ctx.moveTo(22, 150);
    ctx.bezierCurveTo(110, 40, 330, 45, 332, 155);
    ctx.bezierCurveTo(334, 235, 150, 252, 22, 245);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#ffc078";
    ctx.beginPath();                                      // したの はね
    ctx.moveTo(22, 258);
    ctx.bezierCurveTo(150, 258, 278, 306, 254, 378);
    ctx.bezierCurveTo(232, 434, 96, 412, 22, 356);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    ctx.fillStyle = "#fff3bf";                            // はねの もよう
    ctx.beginPath(); ctx.arc(168, 128, 30, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(258, 178, 18, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(128, 330, 22, 0, 7); ctx.fill(); ctx.stroke();

    ctx.strokeStyle = "#5f3dc4"; ctx.fillStyle = "#7950f2";
    ctx.beginPath();                                      // からだ(はんぶん)
    ctx.ellipse(0, 262, 32, 152, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath();                                      // あたま(はんぶん)
    ctx.arc(0, 104, 38, 0, 7); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "#5f3dc4"; ctx.lineWidth = 7;
    ctx.beginPath();                                      // しょっかく
    ctx.moveTo(14, 74);
    ctx.quadraticCurveTo(72, 26, 104, 40);
    ctx.stroke();
    ctx.fillStyle = "#5f3dc4";
    ctx.beginPath(); ctx.arc(106, 40, 11, 0, 7); ctx.fill();
    ctx.fillStyle = "#fff";                               // め
    ctx.beginPath(); ctx.arc(20, 100, 13, 0, 7); ctx.fill();
    ctx.fillStyle = "#343a40";
    ctx.beginPath(); ctx.arc(23, 100, 7, 0, 7); ctx.fill();

    return { name: "ちょうちょ", cat: "char", dataURL: c.toDataURL("image/png"),
             rig: { type: "butterfly", hingeX: 0 } };
  },

  /* 背景: おそらとおやま */
  bgA() {
    const c = Util.makeCanvas(1280, 720);
    const ctx = c.getContext("2d");
    const sky = ctx.createLinearGradient(0, 0, 0, 720);
    sky.addColorStop(0, "#a5d8ff"); sky.addColorStop(1, "#e7f5ff");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, 1280, 720);
    ctx.fillStyle = "#ffd43b";                            // たいよう
    ctx.beginPath(); ctx.arc(1120, 110, 70, 0, 7); ctx.fill();
    ctx.strokeStyle = "#ffd43b"; ctx.lineWidth = 8; ctx.lineCap = "round";
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      this._line(ctx, 1120 + Math.cos(a) * 90, 110 + Math.sin(a) * 90,
                 1120 + Math.cos(a) * 120, 110 + Math.sin(a) * 120, 2);
    }
    ctx.fillStyle = "#fff";                               // くも
    for (const [cx, cy] of [[250, 120], [600, 80], [900, 160]]) {
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(cx + i * 45 - 60, cy + (i % 2) * 12, 38, 0, 7);
        ctx.fill();
      }
    }
    ctx.fillStyle = "#96d06c";                            // おか
    ctx.beginPath(); ctx.moveTo(0, 720);
    ctx.quadraticCurveTo(320, 480, 640, 620);
    ctx.quadraticCurveTo(960, 740, 1280, 560);
    ctx.lineTo(1280, 720); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#74b855";
    ctx.fillRect(0, 640, 1280, 80);
    for (const [fx, fy, col] of [[150, 660, "#ff8787"], [420, 680, "#ffd43b"], [760, 670, "#f783ac"], [1050, 690, "#ffa94d"]]) {
      ctx.fillStyle = col;                                // はな
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath(); ctx.arc(fx + Math.cos(a) * 12, fy + Math.sin(a) * 12, 9, 0, 7); ctx.fill();
      }
      ctx.fillStyle = "#fff59d";
      ctx.beginPath(); ctx.arc(fx, fy, 7, 0, 7); ctx.fill();
    }
    return { name: "おそらとおやま", cat: "bg", dataURL: c.toDataURL("image/jpeg", 0.9) };
  },

  /* しゃしん・え 1: おうちのえ(パズル・まちがいさがし用) */
  picA() {
    const c = Util.makeCanvas(1000, 700);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fffbe6"; ctx.fillRect(0, 0, 1000, 700);
    ctx.lineWidth = 10; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.fillStyle = "#a5d8ff"; ctx.fillRect(0, 0, 1000, 430);      // そら
    ctx.fillStyle = "#96d06c"; ctx.fillRect(0, 430, 1000, 270);    // じめん
    ctx.strokeStyle = "#e03131";                                   // やね
    ctx.fillStyle = "#ffa8a8";
    ctx.beginPath(); ctx.moveTo(300, 300); ctx.lineTo(500, 150); ctx.lineTo(700, 300);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "#e8590c"; ctx.fillStyle = "#ffe8cc";        // かべ
    ctx.strokeRect(340, 300, 320, 220); ctx.fillRect(340, 300, 320, 220);
    ctx.strokeRect(340, 300, 320, 220);
    ctx.fillStyle = "#74c0fc"; ctx.strokeStyle = "#1971c2";        // まど
    ctx.fillRect(380, 340, 80, 80); ctx.strokeRect(380, 340, 80, 80);
    ctx.fillStyle = "#b08968"; ctx.strokeStyle = "#7f5539";        // ドア
    ctx.fillRect(540, 400, 80, 120); ctx.strokeRect(540, 400, 80, 120);
    ctx.strokeStyle = "#5c940d"; ctx.fillStyle = "#8ce99a";        // き
    this._circle(ctx, 150, 300, 80, "#8ce99a");
    ctx.strokeStyle = "#7f5539"; this._line(ctx, 150, 380, 150, 520);
    ctx.fillStyle = "#ffd43b";                                     // たいよう
    ctx.beginPath(); ctx.arc(880, 100, 60, 0, 7); ctx.fill();
    ctx.fillStyle = "#f783ac";                                     // はな
    for (const fx of [300, 750, 880]) {
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath(); ctx.arc(fx + Math.cos(a) * 14, 600 + Math.sin(a) * 14, 10, 0, 7); ctx.fill();
      }
    }
    ctx.fillStyle = "#fff";                                        // くも
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(180 + i * 50, 100 + (i % 2) * 14, 36, 0, 7); ctx.fill(); }
    return { name: "おうちのえ", cat: "pic", dataURL: c.toDataURL("image/jpeg", 0.9),
             diffSpots: [
               { x: 0.88, y: 0.14, r: 0.075 },  // たいよう
               { x: 0.42, y: 0.54, r: 0.055 },  // まど
               { x: 0.3, y: 0.86, r: 0.045 },   // はな
               { x: 0.15, y: 0.43, r: 0.09 },   // き
               { x: 0.58, y: 0.66, r: 0.05 },   // ドア
             ] };
  },

  /* しゃしん・え 2: くだものだいしゅうごう */
  picB() {
    const c = Util.makeCanvas(1000, 700);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff4e6"; ctx.fillRect(0, 0, 1000, 700);
    const fruits = ["🍎", "🍌", "🍇", "🍊", "🍓", "🍉", "🍑", "🍍", "🥝", "🍒", "🍈", "🍋"];
    ctx.font = "110px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    fruits.forEach((f, i) => {
      const x = 160 + (i % 4) * 230 + Util.rand(-15, 15);
      const y = 140 + Math.floor(i / 4) * 210 + Util.rand(-10, 10);
      ctx.fillText(f, x, y);
    });
    return { name: "くだものだいしゅうごう", cat: "pic", dataURL: c.toDataURL("image/jpeg", 0.9),
             diffSpots: [
               { x: 0.16, y: 0.2, r: 0.07 },
               { x: 0.85, y: 0.2, r: 0.07 },
               { x: 0.39, y: 0.5, r: 0.07 },
               { x: 0.62, y: 0.8, r: 0.07 },
               { x: 0.16, y: 0.8, r: 0.07 },
             ] };
  },

  /* ふくわらいパーツ: サンプル顔(白い紙のクレヨン画ふう・パーツ設定ずみ) */
  fukuFace() {
    const W = 480, H = 560;
    const c = Util.makeCanvas(W, H);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H);           // 白い紙
    ctx.lineWidth = 8; ctx.lineCap = "round"; ctx.lineJoin = "round";

    // かおの輪かく(ぬらずに 線だけ = 紙の切りぬきで中は とうめいになる)
    ctx.strokeStyle = "#c8871e";
    this._circle(ctx, 240, 300, 192);
    // かみのけ
    ctx.strokeStyle = "#7f5539";
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(240 + i * 30, 300 - 186);
      ctx.quadraticCurveTo(240 + i * 34, 300 - 250, 240 + i * 46, 300 - 238);
      ctx.stroke();
    }

    // め(中心 165/315, y=255)
    for (const cx of [165, 315]) {
      ctx.strokeStyle = "#4a3f35"; ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.ellipse(cx, 255, 34, 26, 0, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#4a3f35";
      ctx.beginPath(); ctx.arc(cx, 255, 12, 0, 7); ctx.fill();
    }
    // まゆげ(y=200)
    ctx.strokeStyle = "#7f5539";
    for (const cx of [165, 315]) {
      ctx.beginPath();
      ctx.moveTo(cx - 44, 205); ctx.quadraticCurveTo(cx, 182, cx + 44, 205);
      ctx.stroke();
    }
    // はな(中心 240/300)
    ctx.strokeStyle = "#e8590c"; ctx.fillStyle = "#ffc9a3";
    ctx.beginPath(); ctx.ellipse(240, 300, 22, 34, 0, 0, 7); ctx.fill(); ctx.stroke();
    // くち(中心 240/390)
    ctx.strokeStyle = "#c92a2a"; ctx.fillStyle = "#ff8787";
    ctx.beginPath();
    ctx.moveTo(165, 372); ctx.quadraticCurveTo(240, 440, 315, 372);
    ctx.quadraticCurveTo(240, 400, 165, 372);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // ほっぺ
    ctx.fillStyle = "#ffc9c9";
    ctx.beginPath(); ctx.arc(120, 330, 20, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(360, 330, 20, 0, 7); ctx.fill();

    return { name: "サンプルの おかお", cat: "fuku", dataURL: c.toDataURL("image/png"),
             fukuParts: [
               { kind: "め",     x: 0.250, y: 0.393, w: 0.188, h: 0.125 },
               { kind: "め",     x: 0.562, y: 0.393, w: 0.188, h: 0.125 },
               { kind: "まゆげ", x: 0.240, y: 0.330, w: 0.208, h: 0.071 },
               { kind: "まゆげ", x: 0.552, y: 0.330, w: 0.208, h: 0.071 },
               { kind: "はな",   x: 0.437, y: 0.455, w: 0.126, h: 0.161 },
               { kind: "くち",   x: 0.333, y: 0.625, w: 0.334, h: 0.161 },
             ] };
  },

  async makeAll() {
    const assets = await Promise.all(this.ASSET_SAMPLES.map((def) => this.assetRecord(def)));
    return [this.charA(), this.charB(), this.charC(), this.charSkirt(), this.charFloat(),
            this.charButterfly(), this.fukuFace(), ...assets];
  },
};

/* ---------------- Pad(キーボード+ゲームパッド入力) ---------------- */
const Pad = {
  keys: {},
  _init: false,
  init() {
    if (this._init) return;
    this._init = true;
    window.addEventListener("keydown", (e) => {
      this.keys[e.code] = true;
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(e.code)) e.preventDefault();
    });
    window.addEventListener("keyup", (e) => { this.keys[e.code] = false; });
  },
  read() {
    this.init();
    const k = this.keys;
    const st = {
      left:  !!(k.ArrowLeft || k.KeyA),
      right: !!(k.ArrowRight || k.KeyD),
      up:    !!(k.ArrowUp || k.KeyW),
      down:  !!(k.ArrowDown || k.KeyS),
      a:     !!(k.Space || k.Enter || k.KeyZ),
    };
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const gp of pads) {
      if (!gp) continue;
      const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
      if (ax < -0.4 || (gp.buttons[14] && gp.buttons[14].pressed)) st.left = true;
      if (ax > 0.4 || (gp.buttons[15] && gp.buttons[15].pressed)) st.right = true;
      if (ay < -0.4 || (gp.buttons[12] && gp.buttons[12].pressed)) st.up = true;
      if (ay > 0.4 || (gp.buttons[13] && gp.buttons[13].pressed)) st.down = true;
      for (const bi of [0, 1, 2, 3]) {
        if (gp.buttons[bi] && gp.buttons[bi].pressed) st.a = true;
      }
      break;
    }
    return st;
  },
};

/* ---------------- Ui(紙ふぶき・メッセージ) ---------------- */
const Ui = {
  confetti(dur = 2500, count = 140) {
    const c = document.createElement("canvas");
    c.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:200";
    c.width = innerWidth; c.height = innerHeight;
    document.body.appendChild(c);
    const ctx = c.getContext("2d");
    const cols = ["#ff6b9d", "#4dabf7", "#51cf66", "#ffd43b", "#9775fa", "#ff922b"];
    const ps = [];
    for (let i = 0; i < count; i++) {
      ps.push({
        x: Util.rand(0, c.width), y: Util.rand(-c.height, 0),
        vx: Util.rand(-60, 60), vy: Util.rand(150, 420),
        s: Util.rand(7, 15), rot: Util.rand(0, 7), vr: Util.rand(-6, 6),
        col: Util.choice(cols),
      });
    }
    const t0 = performance.now();
    let last = t0;
    (function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      ctx.clearRect(0, 0, c.width, c.height);
      for (const p of ps) {
        p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.col;
        ctx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * 0.66);
        ctx.restore();
      }
      if (now - t0 < dur) requestAnimationFrame(frame);
      else c.remove();
    })(t0);
  },

  /* sub をわたすと、2行目に さりげなく 小さめの文字を そえる */
  msg(text, ms = 1300, color, sub) {
    const d = document.createElement("div");
    d.className = "bigmsg";
    d.textContent = text;
    if (color) d.style.color = color;
    if (sub) {
      const s = document.createElement("div");
      s.className = "bigmsg-sub";
      s.textContent = sub;
      d.appendChild(s);
    }
    document.body.appendChild(d);
    setTimeout(() => d.classList.add("out"), ms - 300);
    setTimeout(() => d.remove(), ms);
    return d;
  },

  /* ---- ちいさな ダイアログ 3つ(モーダル) ---- */
  _modal(inner) {
    const wrap = document.createElement("div");
    wrap.className = "modal";
    wrap.innerHTML = `<div class="panel" style="text-align:left">${inner}</div>`;
    document.body.appendChild(wrap);
    return wrap;
  },

  /* せつめいを だすだけ(html は じぶんで かいた ものだけ わたすこと) */
  info(title, html) {
    const wrap = this._modal(`<h2>${title}</h2>${html}
      <div class="row"><button class="btn gray" type="button">とじる</button></div>`);
    wrap.querySelector("button").onclick = () => { Sound.tap(); wrap.remove(); };
    return wrap;
  },

  /* ラジオボタンで 1つ えらぶ。えらんだ value を Promise でかえす(やめるは null) */
  choose(opts) {
    return new Promise((resolve) => {
      const name = "ch" + Math.random().toString(36).slice(2);
      const list = (opts.options || []).map((o) => `
        <label class="radio-row"><input type="radio" name="${name}" value="${o.value}"${
          o.value === opts.current ? " checked" : ""}> <span>${o.label}</span></label>`).join("");
      const wrap = this._modal(`<h2>${opts.title || "えらんでください"}</h2>
        ${opts.note ? `<p class="note">${opts.note}</p>` : ""}
        <div class="radio-list">${list}</div>
        <div class="row">
          <button class="btn gray" type="button" data-x="0">やめる</button>
          <button class="btn green" type="button" data-x="1">決定</button>
        </div>`);
      const close = (v) => { wrap.remove(); resolve(v); };
      wrap.querySelector('[data-x="0"]').onclick = () => { Sound.tap(); close(null); };
      wrap.querySelector('[data-x="1"]').onclick = () => {
        const el = wrap.querySelector(`input[name="${name}"]:checked`);
        Sound.tap();
        close(el ? el.value : null);
      };
    });
  },

  /* たてに ならんだ ボタンから 1つ えらぶ(おした しゅんかんに けってい) */
  menu(opts) {
    return new Promise((resolve) => {
      const items = opts.items || [];
      const btns = items.map((it, i) => `
        <button class="btn big ${it.color || "blue"}" type="button" data-i="${i}"
                style="width:100%">${it.label}</button>`).join("");
      const wrap = this._modal(`<h2>${opts.title || "えらんでください"}</h2>
        ${opts.note ? `<p class="note">${opts.note}</p>` : ""}
        <div class="menu-list">${btns}</div>
        <div class="row"><button class="btn gray" type="button" data-x="0">やめる</button></div>`);
      const close = (v) => { wrap.remove(); resolve(v); };
      wrap.querySelectorAll("[data-i]").forEach((b) => {
        b.onclick = () => { Sound.tap(); close(items[+b.dataset.i].value); };
      });
      wrap.querySelector('[data-x="0"]').onclick = () => { Sound.tap(); close(null); };
    });
  },

  /* ギャラリーを描画して選択させる汎用ヘルパー */
  renderGallery(el, recs, onPick, selectedId) {
    el.innerHTML = "";
    for (const r of recs) {
      const d = document.createElement("div");
      d.className = "thumb" + (r.id === selectedId ? " selected" : "");
      d.innerHTML = `<img src="${r.dataURL}" alt=""><div class="name">${r.name || ""}</div>`;
      Ui.thumbFix(d.querySelector("img"), r);
      d.onclick = () => { Sound.tap(); onPick(r, d); };
      el.appendChild(d);
    }
  },

  /* ちょうちょは はねを1まい かいた えなので、サムネだけ 左右そろえて みせる */
  thumbFix(imgEl, rec) {
    if (!imgEl || !rec || !rec.rig || rec.rig.type !== "butterfly") return;
    Util.symCanvas(rec)
      .then((c) => { imgEl.src = c.toDataURL("image/png"); })
      .catch(() => {});
  },
};

/* ---------------- Picker(キャラえらび せんよう がめん) ----------------
   あそびかたを えらんだ あと、キャラや えが ひつような ときだけ ひらく。
   さきに キャラを えらばせないので、ちいさい子でも まよいにくい。
     Picker.one({title, note, records, selectedId})   … タッチした しゅんかんに けってい
     Picker.many({title, note, records, preselect, min, max, confirmLabel})
                                                     … なんこか えらんで「けってい!」
   えらんだ record(one) / recordの配列(many)を Promise でかえす。
   「← もどる」を おしたときは null(= あそびかた えらびに もどる)。 */
const Picker = {
  one(opts) { return this._open(Object.assign({}, opts, { multi: false })); },
  many(opts) { return this._open(Object.assign({}, opts, { multi: true })); },

  _open(opts) {
    const recs = opts.records || [];
    return new Promise((resolve) => {
      const wrap = document.createElement("div");
      wrap.className = "picker";
      const panel = document.createElement("div");
      panel.className = "panel";
      wrap.appendChild(panel);

      const h = document.createElement("h2");
      h.textContent = opts.title || "えらんでね";
      panel.appendChild(h);

      if (opts.note) {
        const p = document.createElement("p");
        p.className = "note";
        p.textContent = opts.note;
        panel.appendChild(p);
      }

      const gal = document.createElement("div");
      gal.className = "gallery";
      panel.appendChild(gal);

      const row = document.createElement("div");
      row.className = "row";
      panel.appendChild(row);

      const close = (val) => { wrap.remove(); resolve(val); };

      const back = document.createElement("button");
      back.className = "btn gray";
      back.type = "button";
      back.textContent = "← もどる";
      back.onclick = () => { Sound.tap(); close(null); };
      row.appendChild(back);

      if (!recs.length) {
        gal.innerHTML = '<p class="note">えが ないよ。「とりこみ」で とりこんでね</p>';
      } else if (opts.multi) {
        const max = opts.max || Infinity;
        const sel = new Set((opts.preselect || []).slice(0, max));
        const ok = document.createElement("button");
        ok.className = "btn big pink";
        ok.type = "button";
        ok.textContent = opts.confirmLabel || "けってい!";
        row.appendChild(ok);

        /* タッチで えらぶ / はずす */
        Ui.renderGallery(gal, recs, (r, el) => {
          if (sel.has(r.id)) {
            sel.delete(r.id);
          } else if (sel.size >= max) {
            Sound.bad();
            Ui.msg(opts.maxMessage || `${max}つまで えらべるよ`, 1500, "#4dabf7");
            return;
          } else {
            sel.add(r.id);
          }
          el.classList.toggle("selected", sel.has(r.id));
        });
        [...gal.children].forEach((el, i) => el.classList.toggle("selected", sel.has(recs[i].id)));

        const min = opts.min || 1;
        ok.onclick = () => {
          const picked = recs.filter((r) => sel.has(r.id));
          if (picked.length < min) {
            Sound.bad();
            Ui.msg(`${min}つ いじょう えらんでね`, 1500, "#4dabf7");
            return;
          }
          Sound.tap();
          close(picked);
        };
      } else {
        Ui.renderGallery(gal, recs, (r) => close(r), opts.selectedId);
      }

      document.body.appendChild(wrap);
    });
  },
};

/* ---------------- ActorTouch(キャラを押したときだけ名前を見せる) ----------------
   競技中は絵を主役にし、名前は足もとの小さな札として一時表示する。 */
const ActorTouch = {
  DURATION: 1.7,

  show(actor, opts) {
    if (!actor || !actor.puppet) return false;
    opts = opts || {};
    actor.nameT = opts.duration || this.DURATION;
    if (opts.hop !== false) actor.puppet.hop();
    if (opts.voice !== false && !Sound.playVoice(actor.voices, ["joy", "greet", "ouch"])) Sound.pop();
    return true;
  },

  hit(list, canvas, e, opts) {
    const p = Util.canvasPos(canvas, e);
    const ordered = (list || []).slice().sort((a, b) => (b.puppet.y || 0) - (a.puppet.y || 0));
    const actor = ordered.find((a) => {
      const box = a.puppet.bbox();
      return p.x >= box.x && p.x <= box.x + box.w && p.y >= box.y && p.y <= box.y + box.h;
    });
    return actor && this.show(actor, opts) ? actor : null;
  },

  tick(actor, dt) {
    if (actor && actor.nameT > 0) actor.nameT = Math.max(0, actor.nameT - dt);
  },

  drawName(ctx, actor, opts) {
    if (!actor || !actor.name || !(actor.nameT > 0)) return;
    opts = opts || {};
    const pu = actor.puppet;
    const fontSize = opts.fontSize || 20;
    const y = opts.y == null ? pu.y + 22 : opts.y;
    const color = opts.color || "#4a3f35";
    const edge = opts.edge || "#d8c8aa";
    const alpha = Math.min(1, actor.nameT / 0.28);
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const w = Math.min(240, ctx.measureText(actor.name).width + 22);
    const h = fontSize + 13;
    ctx.fillStyle = "rgba(255,253,245,.95)";
    ctx.strokeStyle = edge;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(pu.x - w / 2, y - h / 2, w, h, h / 2);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = color;
    ctx.fillText(actor.name, pu.x, y + 1);
    ctx.restore();
  },
};

/* ---------------- Tiers(ガチンコの解放レベル & ランキング) ----------------
   ゲームを 🌈ゆるふわ / 🔥ガチンコ の2層で あそぶための共通基盤。
   ガチンコは「かんたん→ふつう→むずかしい」を クリアで順に解放し、
   段階ごとに TOP5 ランキングを のこす。
   localStorageキー:
     tier_unlock_<game>       解放レベル(1〜3)
     tier_rank_<game>_<lv>    その段階の TOP5 [{name,score}]
   タイム系(みじかいほど よい)は addRank/rankHtml に lowerIsBetter を わたす。 */
const Tiers = {
  _uKey(game) { return "tier_unlock_" + game; },
  _rKey(game, lv) { return "tier_rank_" + game + "_" + lv; },

  /* 解放レベル(デフォルト1) */
  unlock(game) {
    const v = parseInt(localStorage.getItem(this._uKey(game)), 10);
    return v >= 1 ? v : 1;
  },

  /* いまより 大きいレベルだけ 保存する */
  setUnlock(game, lv) {
    const cur = this.unlock(game);
    const next = Math.max(cur, lv | 0);
    if (next > cur) localStorage.setItem(this._uKey(game), String(next));
    return next;
  },

  /* その段階の ランキング配列 [{name,score}] */
  rank(game, lv) {
    try {
      const a = JSON.parse(localStorage.getItem(this._rKey(game, lv)) || "[]");
      return Array.isArray(a) ? a : [];
    } catch (e) { return []; }
  },

  /* スコアを 入れて TOP5 を保存(lowerIsBetter=タイム系はみじかい順) */
  addRank(game, lv, name, score, opts) {
    opts = opts || {};
    if (score == null || !isFinite(score)) return this.rank(game, lv);
    const list = this.rank(game, lv);
    list.push({ name: name || "?", score });
    list.sort((a, b) => opts.lowerIsBetter ? a.score - b.score : b.score - a.score);
    const top = list.slice(0, 5);
    localStorage.setItem(this._rKey(game, lv), JSON.stringify(top));
    return top;
  },

  /* 選択画面用の ランキングHTML(labels=段階名の配列, opts.unit=たんい) */
  rankHtml(game, labels, opts) {
    opts = opts || {};
    const unit = opts.unit || "";
    const parts = [];
    for (let lv = 1; lv <= labels.length; lv++) {
      const r = this.rank(game, lv);
      if (r.length) {
        parts.push(`【${labels[lv - 1]}】` +
          r.slice(0, 3).map((e, i) => `${i + 1}い ${e.name} ${e.score}${unit}`).join(" / "));
      }
    }
    return parts.length ? "🏆 ランキング<br>" + parts.join("<br>") : "";
  },

  /* ランキングを、難易度タブと横スワイプで切り替える大きな表彰台にする。 */
  bindRankButton(button, game, labels, opts) {
    if (!button || button.dataset.rankBound) return;
    button.dataset.rankBound = "1";
    button.addEventListener("click", async () => {
      Sound.tap();
      await this.openRankDialog(game, labels, opts);
    });
  },

  async openRankDialog(game, labels, opts) {
    opts = opts || {};
    const unit = opts.unit || "";
    const records = await Store.all().catch(() => []);
    const characters = new Map();
    records.forEach((rec) => {
      if (rec.cat === "char" && rec.name && !characters.has(rec.name)) characters.set(rec.name, rec);
    });
    let active = 0;
    let downX = 0;
    let downY = 0;
    let rankGeneration = 0;
    let rankActors = [];
    let lastFrame = performance.now();

    const modal = document.createElement("div");
    modal.className = "modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "ランキング");

    const panel = document.createElement("div");
    panel.className = "panel rank-dialog";
    const head = document.createElement("div");
    head.className = "rank-head";
    const title = document.createElement("h2");
    title.textContent = "🏆 ランキング";
    const close = document.createElement("button");
    close.className = "rank-close";
    close.type = "button";
    close.textContent = "×";
    close.setAttribute("aria-label", "とじる");
    head.append(title, close);

    const tabs = document.createElement("div");
    tabs.className = "rank-tabs";
    tabs.setAttribute("role", "tablist");
    const body = document.createElement("div");
    body.className = "rank-body";
    const dots = document.createElement("div");
    dots.className = "rank-swipe-dots";
    dots.setAttribute("aria-hidden", "true");

    labels.forEach((label, i) => {
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "rank-tab";
      tab.textContent = label;
      tab.setAttribute("role", "tab");
      tab.onclick = () => { Sound.tap(); show(i); };
      tabs.appendChild(tab);
      dots.appendChild(document.createElement("i"));
    });

    const mountPuppet = async (canvas, rec, player, generation) => {
      if (typeof Rig === "undefined" || typeof Puppet === "undefined") return;
      try {
        const parts = await Rig.load(rec);
        if (generation !== rankGeneration || !canvas.isConnected) return;
        const puppet = new Puppet(parts, {
          x: canvas.width / 2,
          y: canvas.height - 4,
          h: parts.type === "butterfly" ? 260 : 145,
        });
        puppet.walking = false;
        const actor = { canvas, puppet, voices: rec.voices || null, reactT: 0, baseFacing: puppet.facing };
        player._rankActor = actor;
        rankActors.push(actor);
      } catch (_) { /* 読みこめない絵は静止画のまま使う */ }
    };

    const makePlace = (place, entry, generation) => {
      const el = document.createElement("div");
      el.className = `rank-place p${place}` + (entry ? "" : " empty");
      const player = document.createElement(entry ? "button" : "div");
      player.className = "rank-player";
      if (entry) player.type = "button";
      const rec = entry ? characters.get(entry.name) : null;
      const canMove = rec && typeof Rig !== "undefined" && typeof Puppet !== "undefined";
      const avatar = canMove ? document.createElement("canvas") : rec ? document.createElement("img") : document.createElement("span");
      avatar.className = rec ? "rank-avatar" : "rank-avatar rank-avatar-fallback";
      if (rec) {
        if (canMove) {
          avatar.width = 180; avatar.height = 160;
          mountPuppet(avatar, rec, player, generation);
        } else {
          avatar.src = rec.dataURL;
          avatar.alt = "";
          Ui.thumbFix(avatar, rec);
        }
      } else {
        avatar.textContent = entry ? "⭐" : "？";
      }
      const name = document.createElement("strong");
      name.className = "rank-name";
      name.textContent = entry ? entry.name : "—";
      const score = document.createElement("span");
      score.className = "rank-score";
      score.textContent = entry ? `${entry.score}${unit}` : "";
      player.append(name, avatar, score);
      if (entry) {
        player.setAttribute("aria-label", `${place}い ${entry.name} ${entry.score}${unit}。さわると うごく`);
        player.setAttribute("aria-expanded", "false");
        let nameTimer = 0;
        player.addEventListener("click", () => {
          clearTimeout(nameTimer);
          player.classList.add("show-name", "react");
          player.setAttribute("aria-expanded", "true");
          const actor = player._rankActor;
          if (actor) {
            actor.reactT = 0.75;
            actor.puppet.facing *= -1;
            actor.puppet.hop();
            if (!Sound.playVoice(actor.voices, ["joy", "greet", "ouch"])) Sound.pop();
          } else {
            Sound.pop();
          }
          setTimeout(() => player.classList.remove("react"), 760);
          nameTimer = setTimeout(() => {
            player.classList.remove("show-name");
            player.setAttribute("aria-expanded", "false");
          }, 1700);
        });
      }
      const step = document.createElement("div");
      step.className = "rank-step";
      step.textContent = String(place);
      el.append(player, step);
      return el;
    };

    const show = (index) => {
      active = Math.max(0, Math.min(labels.length - 1, index));
      [...tabs.children].forEach((tab, i) => {
        tab.classList.toggle("active", i === active);
        tab.setAttribute("aria-selected", i === active ? "true" : "false");
      });
      [...dots.children].forEach((dot, i) => dot.classList.toggle("active", i === active));
      body.replaceChildren();
      rankActors = [];
      const generation = ++rankGeneration;
      const list = this.rank(game, active + 1);
      const podium = document.createElement("div");
      podium.className = "rank-podium";
      podium.append(makePlace(2, list[1], generation), makePlace(1, list[0], generation), makePlace(3, list[2], generation));
      body.append(podium);
      if (list.length > 3) {
        const rest = document.createElement("div");
        rest.className = "rank-rest";
        list.slice(3, 5).forEach((entry, i) => {
          const row = document.createElement("div");
          row.className = "rank-rest-row";
          const num = document.createElement("span");
          num.className = "num";
          num.textContent = `${i + 4}`;
          const name = document.createElement("span");
          name.textContent = entry.name;
          const score = document.createElement("span");
          score.textContent = `${entry.score}${unit}`;
          row.append(num, name, score);
          rest.appendChild(row);
        });
        body.appendChild(rest);
      }
    };

    body.addEventListener("pointerdown", (e) => { downX = e.clientX; downY = e.clientY; });
    body.addEventListener("pointerup", (e) => {
      const dx = e.clientX - downX;
      const dy = e.clientY - downY;
      if (Math.abs(dx) < 55 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      show(active + (dx < 0 ? 1 : -1));
      Sound.tap();
    });

    const animateRanks = (now) => {
      if (!modal.isConnected) return;
      const dt = Math.min(0.04, (now - lastFrame) / 1000); lastFrame = now;
      for (const actor of rankActors) {
        const { canvas, puppet } = actor;
        if (!canvas.isConnected) continue;
        if (actor.reactT > 0) {
          actor.reactT = Math.max(0, actor.reactT - dt);
          puppet.walking = true;
          puppet.roll = Math.sin(actor.reactT * 22) * 0.09;
        } else {
          puppet.walking = false;
          puppet.roll *= 0.72;
        }
        puppet.update(dt);
        const cctx = canvas.getContext("2d");
        cctx.clearRect(0, 0, canvas.width, canvas.height);
        puppet.draw(cctx);
      }
      requestAnimationFrame(animateRanks);
    };

    const shut = () => { rankGeneration++; rankActors = []; modal.remove(); };
    close.onclick = () => { Sound.tap(); shut(); };
    modal.addEventListener("pointerdown", (e) => { if (e.target === modal) shut(); });
    panel.append(head, tabs, body, dots);
    modal.appendChild(panel);
    document.body.appendChild(modal);
    show(0);
    requestAnimationFrame(animateRanks);
    close.focus();
  },
};

/* ---------------- CustomQuiz(この端末だけのオリジナルクイズ) ----------------
   管理画面で作った問題を localStorage に保存し、クイズに合流させる。
   端末の外に出ないので、園の名前などの固有名詞を入れても公開されない。 */
const CustomQuiz = {
  KEY: "customQuiz",
  all() {
    try {
      const a = JSON.parse(localStorage.getItem(this.KEY) || "[]");
      return Array.isArray(a) ? a : [];
    } catch (e) { return []; }
  },
  save(list) { localStorage.setItem(this.KEY, JSON.stringify(list)); },
  add(q) { const l = this.all(); l.push(q); this.save(l); return l; },
  remove(i) { const l = this.all(); l.splice(i, 1); this.save(l); return l; },
};

/* ---------------- Backup(設定まるごと zip でエクスポート/インポート) ----------------
   IndexedDBの画像ぜんぶ(名前・カテゴリ・うごきせってい・まちがいスポット)と
   localStorage(オリジナルクイズ・解放レベル・ランキング等)を、1つのzipにまとめる。
   外部ライブラリなし・オフラインで動くように、zipの作成/解析を自前で実装している。
   画像バイナリはそのまま格納(STORE方式)。JPEG/PNGはすでに圧縮ずみなので再圧縮しない。 */
const Backup = {
  MAGIC: "hoiku-game-pack",

  /* --- CRC32(zip必須) --- */
  _crcTable: null,
  _crc32(bytes) {
    if (!this._crcTable) {
      const t = new Uint32Array(256);
      for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        t[n] = c >>> 0;
      }
      this._crcTable = t;
    }
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) {
      crc = (crc >>> 8) ^ this._crcTable[(crc ^ bytes[i]) & 0xFF];
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  },

  /* --- zip作成(STORE方式・無圧縮)。files=[{name, data:Uint8Array}] → Blob --- */
  _makeZip(files) {
    const enc = new TextEncoder();
    const now = new Date();
    const dosTime = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xFFFF;
    const dosDate = ((((now.getFullYear() - 1980) & 0x7F) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xFFFF;
    const local = [];
    const central = [];
    let offset = 0;
    for (const f of files) {
      const nameBytes = enc.encode(f.name);
      const data = f.data;
      const crc = this._crc32(data);
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true);
      lh.setUint16(4, 20, true);       // version needed
      lh.setUint16(6, 0x0800, true);   // flags: UTF-8 filename
      lh.setUint16(8, 0, true);        // method: store
      lh.setUint16(10, dosTime, true);
      lh.setUint16(12, dosDate, true);
      lh.setUint32(14, crc, true);
      lh.setUint32(18, data.length, true);
      lh.setUint32(22, data.length, true);
      lh.setUint16(26, nameBytes.length, true);
      lh.setUint16(28, 0, true);       // extra length
      local.push(new Uint8Array(lh.buffer), nameBytes, data);

      const cd = new DataView(new ArrayBuffer(46));
      cd.setUint32(0, 0x02014b50, true);
      cd.setUint16(4, 20, true);        // version made by
      cd.setUint16(6, 20, true);        // version needed
      cd.setUint16(8, 0x0800, true);
      cd.setUint16(10, 0, true);
      cd.setUint16(12, dosTime, true);
      cd.setUint16(14, dosDate, true);
      cd.setUint32(16, crc, true);
      cd.setUint32(20, data.length, true);
      cd.setUint32(24, data.length, true);
      cd.setUint16(28, nameBytes.length, true);
      cd.setUint16(30, 0, true);        // extra
      cd.setUint16(32, 0, true);        // comment
      cd.setUint16(34, 0, true);        // disk number
      cd.setUint16(36, 0, true);        // internal attrs
      cd.setUint32(38, 0, true);        // external attrs
      cd.setUint32(42, offset, true);   // local header offset
      central.push(new Uint8Array(cd.buffer), nameBytes);
      offset += 30 + nameBytes.length + data.length;
    }
    const cdStart = offset;
    let cdSize = 0;
    for (const c of central) cdSize += c.length;
    const eo = new DataView(new ArrayBuffer(22));
    eo.setUint32(0, 0x06054b50, true);
    eo.setUint16(4, 0, true);
    eo.setUint16(6, 0, true);
    eo.setUint16(8, files.length, true);
    eo.setUint16(10, files.length, true);
    eo.setUint32(12, cdSize, true);
    eo.setUint32(16, cdStart, true);
    eo.setUint16(20, 0, true);
    return new Blob([...local, ...central, new Uint8Array(eo.buffer)], { type: "application/zip" });
  },

  async _inflateRaw(bytes) {
    if (typeof DecompressionStream === "undefined") {
      throw new Error("この圧縮形式の zip は開けません(圧縮なしで作り直してください)");
    }
    const ds = new DecompressionStream("deflate-raw");
    const stream = new Blob([bytes]).stream().pipeThrough(ds);
    return new Uint8Array(await new Response(stream).arrayBuffer());
  },

  /* --- zip読み込み。中央ディレクトリを見て STORE/deflate に対応 → [{name, data}] --- */
  async _readZip(buf) {
    const dv = new DataView(buf);
    const bytes = new Uint8Array(buf);
    if (buf.byteLength < 22) throw new Error("zip ファイルではありません");
    let eocd = -1;
    for (let i = buf.byteLength - 22; i >= 0; i--) {
      if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error("zip ファイルではありません");
    const count = dv.getUint16(eocd + 10, true);
    let ptr = dv.getUint32(eocd + 16, true);
    const dec = new TextDecoder();
    const out = [];
    for (let i = 0; i < count; i++) {
      if (ptr + 46 > buf.byteLength || dv.getUint32(ptr, true) !== 0x02014b50) break;
      const method = dv.getUint16(ptr + 10, true);
      const compSize = dv.getUint32(ptr + 20, true);
      const nameLen = dv.getUint16(ptr + 28, true);
      const extraLen = dv.getUint16(ptr + 30, true);
      const commentLen = dv.getUint16(ptr + 32, true);
      const localOff = dv.getUint32(ptr + 42, true);
      const name = dec.decode(bytes.subarray(ptr + 46, ptr + 46 + nameLen));
      const lNameLen = dv.getUint16(localOff + 26, true);
      const lExtraLen = dv.getUint16(localOff + 28, true);
      const dataStart = localOff + 30 + lNameLen + lExtraLen;
      const comp = bytes.subarray(dataStart, dataStart + compSize);
      let data;
      if (method === 0) data = comp;
      else if (method === 8) data = await this._inflateRaw(comp);
      else throw new Error("対応していない圧縮形式です(method=" + method + ")");
      out.push({ name, data });
      ptr += 46 + nameLen + extraLen + commentLen;
    }
    return out;
  },

  /* --- dataURL ⇄ バイナリ --- */
  _dataURLtoBytes(url) {
    const comma = url.indexOf(",");
    const mime = (url.slice(5, comma).split(";")[0]) || "application/octet-stream";
    const bin = atob(url.slice(comma + 1));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return { mime, bytes };
  },
  _bytesToDataURL(mime, bytes) {
    let bin = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return "data:" + (mime || "image/jpeg") + ";base64," + btoa(bin);
  },

  /* すべての設定を集めて Blob(zip) を返す */
  async exportZip() {
    const images = await Store.all();
    const files = [];
    const manifestImages = [];
    images.forEach((r, i) => {
      const { mime, bytes } = this._dataURLtoBytes(r.dataURL);
      const ext = mime.indexOf("png") >= 0 ? "png" : (mime.indexOf("jpeg") >= 0 || mime.indexOf("jpg") >= 0) ? "jpg" : "bin";
      const file = "images/" + String(i).padStart(4, "0") + "." + ext;
      files.push({ name: file, data: bytes });
      const meta = { file, mime, id: r.id, name: r.name, cat: r.cat, created: r.created };
      if (r.author) meta.author = r.author;
      if (r.hidden) meta.hidden = true;
      if (r.cutout) meta.cutout = r.cutout;
      if (r.sampleKey) meta.sampleKey = r.sampleKey;
      if (r.rig) meta.rig = r.rig;
      if (r.diffSpots) meta.diffSpots = r.diffSpots;
      if (r.diffVariants) {
        meta.diffVariants = [];
        r.diffVariants.forEach((v, vi) => {
          if (!v.dataURL) return;
          const vd = this._dataURLtoBytes(v.dataURL);
          const vext = vd.mime.indexOf("png") >= 0 ? "png" : "jpg";
          const vfile = "diffs/" + String(i).padStart(4, "0") + "_" + String(vi).padStart(2, "0") + "." + vext;
          files.push({ name: vfile, data: vd.bytes });
          meta.diffVariants.push({ file: vfile, mime: vd.mime, spots: v.spots || [] });
        });
      }
      if (r.fukuParts) meta.fukuParts = r.fukuParts;
      // キャラの声(joy/greet/ouch/fail)も別ファイルとして同梱する
      if (r.voices) {
        const vmeta = {};
        for (const key of Object.keys(r.voices)) {
          const url = r.voices[key];
          if (!url) continue;
          const v = this._dataURLtoBytes(url);
          const vext = v.mime.indexOf("mp4") >= 0 ? "mp4"
            : v.mime.indexOf("ogg") >= 0 ? "ogg"
            : v.mime.indexOf("wav") >= 0 ? "wav"
            : v.mime.indexOf("mpeg") >= 0 ? "mp3" : "webm";
          const vfile = "voices/" + String(i).padStart(4, "0") + "_" + key + "." + vext;
          files.push({ name: vfile, data: v.bytes });
          vmeta[key] = { file: vfile, mime: v.mime };
        }
        if (Object.keys(vmeta).length) meta.voices = vmeta;
      }
      manifestImages.push(meta);
    });
    const ls = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      ls[k] = localStorage.getItem(k);
    }
    const manifest = {
      app: this.MAGIC,
      version: 1,
      exportedAt: new Date().toISOString(),
      images: manifestImages,
      localStorage: ls,
    };
    files.unshift({ name: "manifest.json", data: new TextEncoder().encode(JSON.stringify(manifest, null, 2)) });
    return this._makeZip(files);
  },

  /* zip を読み込んで復元。opts.replace=true で現状を消してから入れる(既定=置きかえ) */
  async importZip(fileOrBuf, opts) {
    opts = opts || {};
    const replace = opts.replace !== false;
    const buf = fileOrBuf instanceof ArrayBuffer ? fileOrBuf : await fileOrBuf.arrayBuffer();
    const entries = await this._readZip(buf);
    const map = {};
    for (const e of entries) map[e.name] = e.data;
    const mfBytes = map["manifest.json"];
    if (!mfBytes) throw new Error("この zip には設定データがありません(manifest.json が見つかりません)");
    let manifest;
    try { manifest = JSON.parse(new TextDecoder().decode(mfBytes)); }
    catch (e) { throw new Error("設定データが壊れています"); }
    if (manifest.app !== this.MAGIC) throw new Error("このアプリの設定 zip ではありません");

    if (replace) {
      await Store.clear();
      localStorage.clear();
    }
    const ls = manifest.localStorage || {};
    for (const k of Object.keys(ls)) localStorage.setItem(k, ls[k]);

    let n = 0;
    for (const m of (manifest.images || [])) {
      const bytes = map[m.file];
      if (!bytes) continue;
      const rec = {
        id: m.id, name: m.name, author: m.author || "", cat: m.cat, created: m.created,
        dataURL: this._bytesToDataURL(m.mime, bytes),
      };
      if (m.hidden) rec.hidden = true;
      if (m.sampleKey) rec.sampleKey = m.sampleKey;
      if (m.cutout) rec.cutout = m.cutout;
      if (m.rig) rec.rig = m.rig;
      if (m.diffSpots) rec.diffSpots = m.diffSpots;
      if (m.diffVariants) {
        rec.diffVariants = m.diffVariants.map((v) => ({
          dataURL: map[v.file] ? this._bytesToDataURL(v.mime, map[v.file]) : "",
          spots: v.spots || [],
        })).filter((v) => v.dataURL);
      }
      if (m.fukuParts) rec.fukuParts = m.fukuParts;
      if (m.voices) {
        rec.voices = {};
        for (const key of Object.keys(m.voices)) {
          const vm = m.voices[key];
          const vb = map[vm.file];
          if (vb) rec.voices[key] = this._bytesToDataURL(vm.mime, vb);
        }
      }
      await Store.put(rec);
      n++;
    }
    return { images: n, keys: Object.keys(ls).length };
  },

  /* Blob をダウンロードさせる */
  download(blob, filename) {
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  },
};

/* ---------------- Entry(トップページからの ちょくつう) ----------------
   ・?mode=xxx  … その あそびかたの ボタンを じどうで おす
                  (キャラえらびが ひつような ゲームは えらび がめんが でる)
   ・?tier=gachi … ゆるふわの みだしと「みるだけ(オート)」を かくして、
                   れんしゅう と なんいどだけの がめんに する
   がめんの HTML には data-tier="yuru" を、みだしと オートのボタンの行に つける。 */
const Entry = {
  init() {
    const q = new URLSearchParams(location.search);

    if (q.get("tier") === "gachi") {
      document.querySelectorAll('[data-tier="yuru"]').forEach((el) => el.classList.add("hidden"));
    }

    const mode = q.get("mode");
    if (!mode) return;
    const btn = document.querySelector(`[data-mode="${mode.replace(/[^\w-]/g, "")}"]`);
    if (!btn) return;
    /* え の よみこみが おわってから おす(ゲームがわの したくを まつ)。
       とちゅうの えらぶ画面は 見せていないので、「もどる」は トップページへ */
    Nav.direct = true;
    Promise.resolve(Store.ensureSamples()).then(() => {
      setTimeout(() => btn.click(), 80);
    });
  },
};

/* ---------------- BgFx(主役をじゃましない背景の小さな動き) ---------------- */
const BgFx = {
  cloud(ctx, x, y, size, alpha = 0.2) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(x, y, size * 0.55, size * 0.2, 0, 0, Math.PI * 2);
    ctx.ellipse(x - size * 0.22, y - size * 0.08, size * 0.24, size * 0.2, 0, 0, Math.PI * 2);
    ctx.ellipse(x + size * 0.12, y - size * 0.13, size * 0.3, size * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },

  clouds(ctx, seconds, width, items) {
    for (const item of items) {
      const margin = item.size;
      const x = ((item.x + seconds * item.speed + margin) % (width + margin * 2)) - margin;
      this.cloud(ctx, x, item.y, item.size, item.alpha);
    }
  },
};

/* ---------------- Guide(おえかきの「あたり」) ----------------
   なにを かくか(にんげん・どうぶつ…)に あわせて、うすい 点線で
   「だいたい この へんに この 大きさで」を 見せる しくみ。

   ・KINDS の 1つが「おえかきで えらべる 1こ」。かみの ひりつ(cv)と
     ほぞんする カテゴリ(cat)・うごきのタイプ(type)も ここに まとめてある
   ・あたりの ばしょは Rig.DEFAULT(くび 0.42 / こし 0.70 / まんなか 0.5 /
     おなか 0.55)に そろえてある。あたりに そって かけば、
     「うごきせってい」を さわらなくても そのまま きれいに うごく
   ・えがくのは べつの canvas(すけた 上のそう)で、ほぞんする えには 入らない

   つかいかた: Guide.draw(ctx, w, h, "human")           … あたりを えがく
               Guide.draw(ctx, w, h, "human", {labels:false})  … 文字なし(サムネ用) */
const Guide = {
  COLOR: "#5f92da",

  KINDS: {
    human: {
      label: "にんげん", emoji: "🧍", cat: "char", type: "biped", cv: [820, 1040],
      hint: "あたま・からだ・あし を まっすぐ 大きく",
      draw(g) {
        g.faint(() => g.line(0.5, 0.05, 0.5, 0.97));     // まんなかの 線
        g.circle(0.5, 0.24, 0.18);                        // あたま
        g.faint(() => g.line(0.18, 0.438, 0.82, 0.438));  // くび
        g.line(0.5, 0.44, 0.5, 0.69);                     // せなか
        g.line(0.5, 0.50, 0.19, 0.66);                    // うで
        g.line(0.5, 0.50, 0.81, 0.66);
        g.faint(() => g.line(0.18, 0.69, 0.82, 0.69));    // こし
        g.line(0.5, 0.69, 0.35, 0.955);                   // あし
        g.line(0.5, 0.69, 0.65, 0.955);
        g.label("あたま", 0.5, 0.24);
        g.label("て", 0.13, 0.665);
        g.label("あし", 0.25, 0.87);
      },
    },

    skirt: {
      label: "スカート", emoji: "👗", cat: "char", type: "skirt", cv: [820, 1040],
      hint: "",
      draw(g) {
        g.faint(() => g.line(0.5, 0.05, 0.5, 0.97));
        g.circle(0.5, 0.24, 0.18);
        g.faint(() => g.line(0.18, 0.438, 0.82, 0.438));
        g.poly([[0.34, 0.44], [0.66, 0.44], [0.70, 0.69], [0.30, 0.69]], true);   // からだ
        g.line(0.36, 0.50, 0.19, 0.66);
        g.line(0.64, 0.50, 0.81, 0.66);
        g.faint(() => g.line(0.18, 0.69, 0.82, 0.69));    // こし(ここから スカート)
        g.poly([[0.30, 0.69], [0.70, 0.69], [0.86, 0.95], [0.14, 0.95]], true);
        g.label("あたま", 0.5, 0.24);
        g.label("スカート", 0.5, 0.84);
      },
    },

    animal: {
      label: "どうぶつ", emoji: "🐕", cat: "char", type: "quad", cv: [1100, 820],
      hint: "",
      draw(g) {
        g.faint(() => g.line(0.5, 0.10, 0.5, 0.95));      // まえあし/うしろあし の さかいめ
        g.oval(0.55, 0.38, 0.30, 0.20);                   // からだ
        g.circle(0.20, 0.30, 0.15);                       // あたま(ひだり)
        g.line(0.28, 0.38, 0.34, 0.40);                   // くび
        g.faint(() => g.line(0.10, 0.56, 0.92, 0.56));    // おなかの 線
        g.line(0.30, 0.55, 0.28, 0.90);                   // まえあし
        g.line(0.42, 0.55, 0.44, 0.90);
        g.line(0.66, 0.55, 0.64, 0.90);                   // うしろあし
        g.line(0.78, 0.55, 0.80, 0.90);
        g.line(0.85, 0.30, 0.95, 0.18);                   // しっぽ
        g.arrowLeft(0.20, 0.075, 0.12);
        g.label("あたまは こっち", 0.36, 0.075, { align: "left" });
        g.label("あし 4ほん", 0.53, 0.78);
      },
    },

    fly: {
      label: "ちょうちょ", emoji: "🦋", cat: "char", type: "butterfly", cv: [780, 900],
      hint: "",
      draw(g) {
        g.line(0.07, 0.06, 0.07, 0.94);                   // からだ(まんなかの 線)
        g.curve([[0.07, 0.10], [0.55, 0.00], [0.98, 0.18], [0.52, 0.50]]);   // うわばね
        g.line(0.52, 0.50, 0.07, 0.50);
        g.curve([[0.07, 0.52], [0.50, 0.55], [0.80, 0.75], [0.38, 0.92]]);   // したばね
        g.curve([[0.38, 0.92], [0.22, 0.96], [0.10, 0.90], [0.07, 0.80]]);
        g.faint(() => { g.line(0.07, 0.10, 0.30, 0.03); });                  // しょっかく
        g.label("からだ", 0.11, 0.06, { align: "left" });
        g.label("はねは 1まいだけ", 0.52, 0.24);
      },
    },

    float: {
      label: "ふわふわ", emoji: "👻", cat: "char", type: "float", cv: [820, 1040],
      hint: "",
      draw(g) {
        g.faint(() => g.line(0.5, 0.08, 0.5, 0.95));
        g.circle(0.5, 0.50, 0.34);                        // まるい からだ
        g.faint(() => { g.circle(0.40, 0.44, 0.035); g.circle(0.60, 0.44, 0.035); });   // め
        g.label("まる〜く", 0.5, 0.06, { baseline: "top" });
      },
    },

    face: {
      label: "かお", emoji: "😀", cat: "fuku", cv: [900, 1000],
      hint: "",
      draw(g) {
        g.oval(0.5, 0.50, 0.38, 0.42);                    // かおの りんかく
        g.faint(() => {
          g.oval(0.36, 0.42, 0.09, 0.06);                 // め
          g.oval(0.64, 0.42, 0.09, 0.06);
          g.oval(0.5, 0.58, 0.05, 0.05);                  // はな
          g.oval(0.5, 0.73, 0.13, 0.06);                  // くち
        });
        g.label("かお ぜんぶ", 0.5, 0.16);
        g.label("め・はな・くち", 0.5, 0.88);
      },
    },

    bg: {
      label: "はいけい", emoji: "🏞️", cat: "bg", cv: [1200, 760],
      hint: "",
      draw(g) {
        g.line(0.03, 0.66, 0.97, 0.66);                   // ちへいせん
        g.faint(() => { g.circle(0.84, 0.20, 0.10); g.oval(0.24, 0.22, 0.13, 0.07); });  // おひさま・くも
        g.label("そら", 0.5, 0.30);
        g.label("じめん", 0.5, 0.83);
      },
    },
  },

  /* えらべる じゅんばん(おえかきの えらび がめんで つかう) */
  ORDER: ["human", "skirt", "animal", "fly", "float", "face", "bg"],
  CHAR_ORDER: ["human", "skirt", "animal", "fly", "float"],

  get(kind) { return this.KINDS[kind] || null; },

  /* ctx に あたりを えがく(w・h は canvas の 大きさ) */
  draw(ctx, w, h, kind, opts) {
    const k = this.KINDS[kind];
    if (!k) return false;
    const showLabels = !opts || opts.labels !== false;
    const u = Math.min(w, h);
    const X = (v) => v * w, Y = (v) => v * h;
    const dash = [Math.max(4, u * 0.03), Math.max(3, u * 0.026)];

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = this.COLOR;
    ctx.fillStyle = this.COLOR;
    ctx.lineWidth = Math.max(2, u * 0.011);
    ctx.setLineDash(dash);

    const g = {
      /* うすく えがく(おまけの 線) */
      faint(fn) {
        ctx.save();
        ctx.globalAlpha = 0.45;
        ctx.lineWidth = Math.max(1.5, u * 0.007);
        fn();
        ctx.restore();
      },
      line(x1, y1, x2, y2) {
        ctx.beginPath();
        ctx.moveTo(X(x1), Y(y1));
        ctx.lineTo(X(x2), Y(y2));
        ctx.stroke();
      },
      circle(cx, cy, r) {
        ctx.beginPath();
        ctx.arc(X(cx), Y(cy), r * h, 0, 7);
        ctx.stroke();
      },
      oval(cx, cy, rx, ry) {
        ctx.beginPath();
        ctx.ellipse(X(cx), Y(cy), rx * w, ry * h, 0, 0, 7);
        ctx.stroke();
      },
      poly(pts, close) {
        ctx.beginPath();
        pts.forEach((p, i) => (i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1]))));
        if (close) ctx.closePath();
        ctx.stroke();
      },
      /* [はじめ, ひかえ1, ひかえ2, おわり] の カーブ */
      curve(p) {
        ctx.beginPath();
        ctx.moveTo(X(p[0][0]), Y(p[0][1]));
        ctx.bezierCurveTo(X(p[1][0]), Y(p[1][1]), X(p[2][0]), Y(p[2][1]), X(p[3][0]), Y(p[3][1]));
        ctx.stroke();
      },
      /* ひだりむきの やじるし(どうぶつの「あたまは こっち」) */
      arrowLeft(x, y, len) {
        ctx.save();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(X(x + len), Y(y));
        ctx.lineTo(X(x), Y(y));
        ctx.moveTo(X(x + len * 0.3), Y(y - 0.03));
        ctx.lineTo(X(x), Y(y));
        ctx.lineTo(X(x + len * 0.3), Y(y + 0.03));
        ctx.stroke();
        ctx.restore();
      },
      label(str, x, y, o) {
        if (!showLabels) return;
        o = o || {};
        const size = Math.max(13, u * (o.size || 0.045));
        ctx.save();
        ctx.setLineDash([]);
        ctx.font = `bold ${size}px sans-serif`;
        ctx.textAlign = o.align || "center";
        ctx.textBaseline = o.baseline || "middle";
        ctx.lineWidth = size * 0.3;
        ctx.strokeStyle = "rgba(255,255,255,.92)";
        ctx.strokeText(str, X(x), Y(y));
        ctx.fillStyle = Guide.COLOR;
        ctx.fillText(str, X(x), Y(y));
        ctx.restore();
      },
    };

    k.draw(g);
    ctx.restore();
    return true;
  },
};

/* ---------------- Rotate(よこむきに してね の おしらせ) ----------------
   iPad・スマホの Safari は ページから がめんを まわせない。たてむきの ときに
   「よこむきに すると 大きく 見えるよ」と ひとこと だけ 出す。

   ぜんがめんを ふさぐ まく には しない こと。まくを 出すと そのあいだ
   左うえの もどるボタンが おせなく なり、「ボタンが きかない」ことになる。
   ・うえに ちいさく うかべる(おび)
   ・6びょうで 自分から 消える
   ・どこを さわっても 消える
   ・かさなっても 上の ボタンは おせるように z-index は 58(もどる=60より下) */
const Rotate = {
  el: null,
  SHOW_MS: 6000,

  ask() {
    if (this.el || innerWidth > innerHeight) return;   // もう よこむきなら 出さない
    const d = document.createElement("div");
    d.className = "rotate-hint";
    d.innerHTML =
      '<span class="mark">\u{1F4F1}</span>'
      + '<span class="txt">よこむきに すると 大きく 見えるよ</span>';
    const b = document.createElement("button");
    b.type = "button";
    b.className = "x";
    b.setAttribute("aria-label", "とじる");
    b.textContent = "\u2715";
    d.appendChild(b);
    d.onclick = () => this.close();
    document.body.appendChild(d);
    this.el = d;
    this._timer = setTimeout(() => this.close(), this.SHOW_MS);
    this._watch = () => { if (innerWidth > innerHeight) this.close(); };
    addEventListener("resize", this._watch);
    addEventListener("orientationchange", this._watch);
  },

  close() {
    if (!this.el) return;
    clearTimeout(this._timer);
    removeEventListener("resize", this._watch);
    removeEventListener("orientationchange", this._watch);
    this.el.remove();
    this.el = null;
  },
};

/* ---------------- Fullscreen(ぜんがめん ボタン) ----------------
   みぎうえに ちいさく うかべる。ページを いどうすると ぜんがめんは
   かいじょされるので、core.js を よむ ページ ぜんぶに つける。
   ・.settings-bar が あるページ(メニュー)は その なかに ならべる
   ・それ以外は みぎうえに フローティング
   ・ぜんがめんが つかえない ブラウザ(iPhone の Safari など)では ボタンを ださない
   <body data-fullscreen="off"> にすると そのページだけ ボタンなし。 */
const Fullscreen = {
  ICON_ON:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  ICON_OFF: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>',

  supported() { return !!(document.fullscreenEnabled || document.webkitFullscreenEnabled); },
  isOn() { return !!(document.fullscreenElement || document.webkitFullscreenElement); },

  /* クリックした そのばで よぶこと(await をはさむと ブラウザに ことわられる) */
  toggle() {
    try {
      if (this.isOn()) {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        if (exit) exit.call(document);
        this.unlock();
      } else {
        const el = document.documentElement;
        const req = el.requestFullscreen || el.webkitRequestFullscreen;
        const r = req && req.call(el);
        if (r && r.then) r.then(() => this.landscape(), () => this.landscape());
        else this.landscape();
      }
    } catch (e) { /* ことわられても なにも おきないだけ */ }
  },

  /* よこむきに する。できない ブラウザ(iPad の Safari など)では
     「よこむきに してね」の おしらせを 出す */
  landscape() {
    const so = screen.orientation;
    let p = null;
    try { if (so && so.lock) p = so.lock("landscape"); } catch (e) { p = null; }
    if (p && p.then) p.then(() => Rotate.close(), () => Rotate.ask());
    else Rotate.ask();
  },

  unlock() {
    try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); }
    catch (e) { /* きにしない */ }
    Rotate.close();
  },

  init() {
    if (!this.supported() || document.body.dataset.fullscreen === "off") return;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "fs-btn";
    const bar = document.querySelector(".settings-bar");
    if (bar) bar.insertBefore(b, bar.firstChild);   // せっていボタンの ひだりに ならべる
    else { b.classList.add("float"); document.body.appendChild(b); }

    const paint = () => {
      const on = this.isOn();
      b.innerHTML = on ? this.ICON_OFF : this.ICON_ON;
      b.title = on ? "ぜんがめんを やめる" : "ぜんがめんに する";
      b.setAttribute("aria-label", b.title);
    };
    b.onclick = () => { Sound.tap(); this.toggle(); };
    document.addEventListener("fullscreenchange", paint);
    document.addEventListener("webkitfullscreenchange", paint);
    paint();
  },
};

/* ---------------- Nav(がめんを 1つずつ もどる) ----------------
   ゲームの中は 「えらぶ → (チームわけ) → あそぶ」のように すすんでいく。
   「← もどる」と スマホの バックキーは、その 1つ まえの がめんに もどす。
   いちばん まえの がめんで もどると、はじめて トップページへ もどる。

   ・ゲームの ループを とめる しまつが いるページは Nav.onLeave(fn) を よんでおく */
const Nav = {
  /* おく(あそび中)から 手前(えらぶ)の じゅん */
  ALL: ["endScreen", "playScreen", "quizScreen", "animalScreen", "drawScreen",
        "teamScreen", "readyScreen", "makeScreen", "setupScreen",
        "selectScreen", "startScreen", "modeScreen"],
  /* 「もどる」で もどれる がめん(あそび中・おわりの がめんには もどらない) */
  RETURN: ["teamScreen", "readyScreen", "makeScreen", "setupScreen",
           "selectScreen", "startScreen", "modeScreen"],

  stack: [], cur: null, _leave: null,
  /* トップの「みる」などから ?mode= で 直行してきたか。
     直行のときは とちゅうの えらぶ画面を 見せずに、そのまま トップページへ もどす */
  direct: false,

  /* ゲームがわの しまつ(ループ停止・ボタンの かたづけ など) */
  onLeave(fn) { this._leave = fn; },

  _el(id) { return document.getElementById(id); },

  _shown() {
    for (const id of this.ALL) {
      const el = this._el(id);
      if (el && !el.classList.contains("hidden")) return id;
    }
    return null;
  },

  /* いま出ている がめんを 見て、通ってきた みちを おぼえておく */
  sync() {
    const now = this._shown();
    if (!now || now === this.cur) return;
    const i = this.stack.indexOf(now);
    if (i >= 0) this.stack.length = i;                                   // もどった
    else if (this.cur && this.RETURN.includes(this.cur)) this.stack.push(this.cur);
    this.cur = now;
  },

  /* えらぶ まど(モーダル)が 出ていたら とじる。
     ※ かならず 出ている ものだけを ひろう。editors.js は つかっていない ときも
        .modal.hidden を ページに いれておくので、hidden を のぞかないと
        「もどる」が いつも モーダルを とじたつもりに なり、がめんが うごかなく なる */
  _closeOverlay() {
    const ov = document.querySelector(".picker:not(.hidden), .modal:not(.hidden)");
    if (!ov) return false;
    const cancel = ov.querySelector('[data-x="0"]') || ov.querySelector(".btn.gray");
    if (cancel) cancel.click(); else ov.remove();
    return true;
  },

  /* 1つ まえの がめんへ。もどれないときは false(→ トップページへ) */
  back() {
    if (this._closeOverlay()) return true;
    if (this.direct) return false;          // 直行してきたので トップページへ
    if (!this.stack.length) return false;
    const prev = this.stack[this.stack.length - 1];
    Sound.tap();
    if (this._leave) this._leave();
    for (const id of this.ALL) {
      const el = this._el(id);
      if (el) el.classList.toggle("hidden", id !== prev);
    }
    this.sync();
    return true;
  },

  init() {
    if (!this.ALL.some((id) => this._el(id))) return;   // がめん切りかえの ないページ

    const mo = new MutationObserver(() => this.sync());
    for (const id of this.ALL) {
      const el = this._el(id);
      if (el) mo.observe(el, { attributes: true, attributeFilter: ["class"] });
    }
    this.sync();

    /* スマホの バックキー(ブラウザの もどる)も おなじ うごきに する。
       りれきを 1つ よぶんに つくっておき、おされたら つかった ぶんを つくりなおす。
       もう もどれる がめんが ないときだけ、ほんとうに まえのページへ 出る。 */
    history.pushState({ hoiku: 1 }, "");
    addEventListener("popstate", () => {
      if (this.back()) history.pushState({ hoiku: 1 }, "");
      else history.go(-1);
    });
  },
};

/* ---------------- GameChrome(ゲーム中はヘッダーを消してフローティングもどるだけに) ----------------
   ・#playScreen / #quizScreen / #animalScreen / #drawScreen が表示されたら「ゲーム中」
   ・<body data-chrome="game"> のページ(ずっとゲーム画面のもの)は最初からゲーム中 */
const GameChrome = {
  BACK_ICON: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',

  init() {
    const bar = document.querySelector("header.bar");
    if (!bar) return;
    const back = bar.querySelector(".back");
    const from = new URLSearchParams(location.search).get("from");
    const backPages = {
      view: "view.html",
      "play-solo": "play-list.html?type=solo",
      "play-duo": "play-list.html?type=duo",
      "play-multi": "play-list.html?type=multi",
      "play-games": "play-list.html?type=games",
    };
    let backHref = (back && back.getAttribute("href")) || "../index.html";
    if (backPages[from]) {
      backHref = (location.pathname.includes("/games/") ? "../" : "") + backPages[from];
      if (back) back.href = backHref;
    }
    const f = document.createElement("a");
    f.className = "back-float";
    f.href = backHref;
    f.innerHTML = this.BACK_ICON;                 /* 文字なし・アイコンだけ */
    f.title = "もどる";
    f.setAttribute("aria-label", "もどる");
    document.body.appendChild(f);

    /* 「もどる」は まず 1つ まえの がめんへ。もどれないときだけ トップページへ */
    const step = (e) => { if (Nav.back()) e.preventDefault(); };
    f.addEventListener("click", step);
    if (back) back.addEventListener("click", step);

    /* iPad で click が とどかない ことが あった ときの ほけん。
       touchend の あと 350ms たっても click が こなければ、自分で もどす。
       ・click が きた ときは なにも しない(いつもの みちすじの まま。
         ページ独自の click しょり… 例:games/sakasa.html… も こわさない)
       ・ゆびが うごいた とき(スワイプ)は はんのうしない */
    for (const el of [f, back]) {
      if (!el) continue;
      let sx = 0, sy = 0;
      el.addEventListener("click", () => { el._clickAt = Date.now(); });
      el.addEventListener("touchstart", (e) => {
        const t = e.changedTouches[0];
        sx = t.clientX; sy = t.clientY;
      }, { passive: true });
      el.addEventListener("touchend", (e) => {
        const t = e.changedTouches[0];
        if (Math.abs(t.clientX - sx) > 16 || Math.abs(t.clientY - sy) > 16) return;
        setTimeout(() => {
          if (Date.now() - (el._clickAt || 0) < 700) return;      // click が きていた
          if (Nav.back()) return;
          const href = el.getAttribute("href");
          if (href) location.href = href;
        }, 350);
      }, { passive: true });
    }

    const always = document.body.dataset.chrome === "game";
    const screens = ["playScreen", "quizScreen", "animalScreen", "drawScreen"]
      .map((id) => document.getElementById(id)).filter(Boolean);
    const update = () => {
      const ingame = always || screens.some((s) => !s.classList.contains("hidden"));
      document.body.classList.toggle("ingame", ingame);
      Stage.update();
    };
    if (!always && !screens.length) return;   // 画面切りかえのないページはそのまま
    if (screens.length) {
      const mo = new MutationObserver(update);
      screens.forEach((s) => mo.observe(s, { attributes: true, attributeFilter: ["class"] }));
    }
    update();
  },
};

/* ---------------- Stage(あそび中は ステージを がめん いっぱいに) ----------------
   ・ステージ(canvas.stage)の ある がめんで あそんでいる あいだだけ はたらく
   ・canvas の おやばこ(.fit-box)を 絵と おなじ ひりつの おおきさに して、
     canvas は そのなかを 100% で うめる
     → 絵が つぶれない・あそぶ ばしょが いちばん 大きい・タッチの ばしょも ずれない
   ・ステージ いがいの もの(HUD・ボタン・ヒント)は うえ/したに うかせて かさねる
     → がめんが スクロールしない
   ふだん(ステージの ない がめん)は なにも しない。 */
const Stage = {
  /* うかせる はこを つくる。ならびは いままでどおり(ステージの まえ→うえ、あと→した) */
  _lift(container, stageChild) {
    if (container.dataset.fitReady) return;
    container.dataset.fitReady = "1";
    const kids = Array.from(container.children);
    const at = kids.indexOf(stageChild);
    const top = document.createElement("div");
    const bottom = document.createElement("div");
    top.className = "fit-top";
    bottom.className = "fit-bottom";
    container.insertBefore(top, stageChild);
    container.insertBefore(bottom, stageChild.nextSibling);
    kids.forEach((k, i) => {
      if (k === stageChild) return;
      if (/Screen$/.test(k.id || "")) return;        // ほかの がめんは うごかさない
      (i < at ? top : bottom).appendChild(k);
    });
  },

  /* class を つけかえる のは 「まだ ついていない とき」だけ。
     MutationObserver は おなじ あたいでも 「かわった」と おしえて くるので、
     なにも かんがえずに つけると 見はり → つけなおし の むげんループに なる */
  _mark(el, cls, on) {
    if (!el) return;
    if (on === false) { if (el.classList.contains(cls)) el.classList.remove(cls); return; }
    if (!el.classList.contains(cls)) el.classList.add(cls);
  },

  /* ステージの まわりを ととのえる(1回だけ) */
  _prepare(cv) {
    const box = cv.parentElement;
    if (!box || box === document.body) return null;
    this._mark(box, "fit-box", true);
    const container = box.parentElement;
    if (!container) return null;
    if (container.tagName !== "MAIN") this._mark(container, "fit-fill", true);
    this._lift(container, box);
    return box;
  },

  /* いま 見えている ステージだけを、あいている ばしょに ぴったり おさめる */
  fit() {
    const on = document.body.classList.contains("fitstage");
    for (const cv of document.querySelectorAll("canvas.stage")) {
      const box = cv.parentElement;
      if (!box) continue;
      if (!on || !cv.getClientRects().length) { box.style.width = ""; box.style.height = ""; continue; }
      const area = box.parentElement && box.parentElement.getBoundingClientRect();
      if (!area || !area.width || !area.height) continue;
      const ar = cv.width / cv.height;
      const w = Math.min(area.width, area.height * ar);
      /* まるめすぎると ほんの すこし ひりつが ずれるので 小数のまま */
      box.style.width = w.toFixed(2) + "px";
      box.style.height = (w / ar).toFixed(2) + "px";
    }
  },

  update() {
    const ingame = document.body.classList.contains("ingame");
    let live = null;
    for (const cv of document.querySelectorAll("canvas.stage")) {
      if (cv.getClientRects().length) { live = cv; break; }
    }
    const on = !!(ingame && live);
    if (on) this._prepare(live);
    this._mark(document.body, "fitstage", on);
    this._mark(document.documentElement, "fitstage", on);
    this.fit();
  },

  init() {
    if (!document.querySelector("canvas.stage")) return;
    const again = () => this.update();
    addEventListener("resize", again);
    addEventListener("orientationchange", again);
    document.addEventListener("fullscreenchange", again);
    document.addEventListener("webkitfullscreenchange", again);
    if (window.visualViewport) visualViewport.addEventListener("resize", again);
    addEventListener("load", again);
    this.update();
  },
};

/* ---------------- PWA(完全オフライン + 利用者が選べる安全な更新) ---------------- */
const Pwa = {
  registration: null,
  waiting: null,
  reloadForUpdate: false,

  supported() {
    return "serviceWorker" in navigator && location.protocol !== "file:";
  },

  setStatus(text, tone = "") {
    const el = document.getElementById("pwaStatus");
    if (!el) return;
    el.textContent = text;
    el.dataset.tone = tone;
  },

  mountBanner() {
    if (document.getElementById("pwaUpdateBar")) return;
    const bar = document.createElement("aside");
    bar.id = "pwaUpdateBar";
    bar.className = "pwa-update-bar hidden";
    bar.setAttribute("aria-live", "polite");
    bar.innerHTML = `
      <div><b>新しいバージョンがあります</b><span>ゲームが終わってから更新してください。</span></div>
      <button class="btn green" type="button" data-pwa-apply>最新版に更新</button>
      <button class="btn gray" type="button" data-pwa-later>あとで</button>`;
    document.body.appendChild(bar);
    bar.querySelector("[data-pwa-apply]").onclick = () => this.applyUpdate();
    bar.querySelector("[data-pwa-later]").onclick = () => bar.classList.add("hidden");
  },

  showUpdate(worker) {
    this.waiting = worker;
    this.setStatus("最新版を準備しました。「最新版に更新」を押すと切り替わります。", "update");
    const bar = document.getElementById("pwaUpdateBar");
    if (bar) bar.classList.remove("hidden");
  },

  watch(worker) {
    if (!worker) return;
    worker.addEventListener("statechange", () => {
      if (worker.state !== "installed") return;
      if (navigator.serviceWorker.controller) this.showUpdate(worker);
      else this.setStatus("オフラインで使う準備ができました。", "ready");
    });
  },

  async check() {
    if (!this.registration) {
      this.setStatus("このブラウザではオフライン版を利用できません。", "error");
      return;
    }
    if (!navigator.onLine) {
      this.setStatus("オフラインで使用中です。更新確認には通信が必要です。", "offline");
      return;
    }
    const btn = document.getElementById("pwaCheckBtn");
    if (btn) btn.disabled = true;
    this.setStatus("最新版を確認しています…");
    try {
      await this.registration.update();
      if (this.registration.waiting) this.showUpdate(this.registration.waiting);
      else if (this.registration.installing) this.setStatus("最新版をオフライン用に保存しています…");
      else this.setStatus("最新版です。オフラインでも使えます。", "ready");
    } catch (_) {
      this.setStatus("更新を確認できませんでした。通信を確認して、もう一度押してください。", "error");
    } finally {
      if (btn) btn.disabled = false;
    }
  },

  applyUpdate() {
    const worker = this.waiting || (this.registration && this.registration.waiting);
    if (!worker) {
      this.check();
      return;
    }
    this.reloadForUpdate = true;
    this.setStatus("最新版へ切り替えています…");
    worker.postMessage({ type: "SKIP_WAITING" });
  },

  async init() {
    this.mountBanner();
    const checkBtn = document.getElementById("pwaCheckBtn");
    if (checkBtn) checkBtn.onclick = () => this.check();
    if (!this.supported()) {
      this.setStatus("ホーム画面版に対応したブラウザで開いてください。", "error");
      return;
    }

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (this.reloadForUpdate) location.reload();
      else this.setStatus("オフラインで使う準備ができました。", "ready");
    });

    try {
      this.registration = await navigator.serviceWorker.register(new URL("sw.js", CORE_APP_ROOT), {
        scope: CORE_APP_ROOT.href,
        updateViaCache: "none",
      });
      if (this.registration.waiting) this.showUpdate(this.registration.waiting);
      this.watch(this.registration.installing);
      this.registration.addEventListener("updatefound", () => {
        this.setStatus("最新版をオフライン用に保存しています…");
        this.watch(this.registration.installing);
      });
      if (navigator.serviceWorker.controller && !this.registration.waiting) {
        this.setStatus(navigator.onLine ? "最新版です。オフラインでも使えます。" : "オフラインで使用中です。", "ready");
      }
      this.registration.update().catch(() => {});
      setInterval(() => this.registration.update().catch(() => {}), 30 * 60 * 1000);
    } catch (_) {
      this.setStatus("オフライン版を準備できませんでした。通信を確認して再読み込みしてください。", "error");
    }

    addEventListener("online", () => this.check());
    addEventListener("offline", () => this.setStatus("オフラインで使用中です。", "offline"));
  },
};

function initChrome() { Nav.init(); GameChrome.init(); Stage.init(); Fullscreen.init(); Entry.init(); Pwa.init(); }
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initChrome);
} else {
  initChrome();
}
