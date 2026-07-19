/* ============================================================
   core.js — 共通基盤
   Util(画像処理) / Sound(効果音合成) / Store(画像ライブラリ)
   Samples(サンプル画像生成) / Pad(入力) / Ui(演出)
   ============================================================ */
"use strict";

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

  /* 白っぽい背景を透明に(紙に描いた絵の切りぬき) */
  keyImage(img, thr = 225) {
    const c = Util.makeCanvas(img.width, img.height);
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const id = ctx.getImageData(0, 0, c.width, c.height);
    const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      const bright = Math.min(r, g, b);
      if (bright > thr) {
        d[i + 3] = 0;
      } else if (bright > thr - 25) {
        d[i + 3] = Math.round(255 * (thr - bright) / 25);
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

  /* キャンバス上のポインタ位置 → 論理座標 */
  canvasPos(canvas, ev) {
    const r = canvas.getBoundingClientRect();
    const p = ev.touches ? ev.touches[0] : ev;
    return {
      x: (p.clientX - r.left) * canvas.width / r.width,
      y: (p.clientY - r.top) * canvas.height / r.height,
    };
  },
};

/* ---------------- Sound(WebAudioで合成、音源ファイル不要) ---------------- */
const Sound = {
  ctx: null,
  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  },
  beep(freq, dur = 0.12, type = "sine", vol = 0.2, when = 0, slide = 0) {
    const ctx = this.ensure();
    if (!ctx) return;
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
window.addEventListener("pointerdown", () => Sound.ensure(), { once: true });

/* ---------------- Store(IndexedDBに画像を保存) ----------------
   レコード: { id, name, cat('char'|'bg'|'pic'|'fuku'|'src'), dataURL,
               rig:{neckY,hipY,centerX}, diffSpots:[{x,y,r}],
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

  /* 1枚もなければサンプルを入れる */
  async ensureSamples() {
    const list = await this.all();
    if (list.length > 0) return list;
    const recs = Samples.makeAll();
    for (const r of recs) await this.put(r);
    return this.all();
  },
};

/* ---------------- Samples(クレヨン風サンプル画像を生成) ---------------- */
const Samples = {
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

  makeAll() {
    return [this.charA(), this.charB(), this.charC(), this.charSkirt(), this.charFloat(),
            this.bgA(), this.picA(), this.picB(), this.fukuFace()];
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

  msg(text, ms = 1300, color) {
    const d = document.createElement("div");
    d.className = "bigmsg";
    d.textContent = text;
    if (color) d.style.color = color;
    document.body.appendChild(d);
    setTimeout(() => d.classList.add("out"), ms - 300);
    setTimeout(() => d.remove(), ms);
    return d;
  },

  /* ギャラリーを描画して選択させる汎用ヘルパー */
  renderGallery(el, recs, onPick, selectedId) {
    el.innerHTML = "";
    for (const r of recs) {
      const d = document.createElement("div");
      d.className = "thumb" + (r.id === selectedId ? " selected" : "");
      d.innerHTML = `<img src="${r.dataURL}" alt=""><div class="name">${r.name || ""}</div>`;
      d.onclick = () => { Sound.tap(); onPick(r, d); };
      el.appendChild(d);
    }
  },
};

/* ---------------- Tiers(ガチンコの解放レベル & ランキング) ----------------
   ゲームを 🌈ゆるふわ / 🎵れんしゅう / 🔥ガチンコ の3層で あそぶための共通基盤。
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
      if (r.rig) meta.rig = r.rig;
      if (r.diffSpots) meta.diffSpots = r.diffSpots;
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
        id: m.id, name: m.name, cat: m.cat, created: m.created,
        dataURL: this._bytesToDataURL(m.mime, bytes),
      };
      if (m.rig) rec.rig = m.rig;
      if (m.diffSpots) rec.diffSpots = m.diffSpots;
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

/* ---------------- GameChrome(ゲーム中はヘッダーを消してフローティングもどるだけに) ----------------
   ・#playScreen / #quizScreen / #animalScreen / #drawScreen が表示されたら「ゲーム中」
   ・<body data-chrome="game"> のページ(ずっとゲーム画面のもの)は最初からゲーム中 */
const GameChrome = {
  init() {
    const bar = document.querySelector("header.bar");
    if (!bar) return;
    const back = bar.querySelector(".back");
    const f = document.createElement("a");
    f.className = "back-float";
    f.href = (back && back.getAttribute("href")) || "../index.html";
    f.textContent = "← もどる";
    document.body.appendChild(f);

    const always = document.body.dataset.chrome === "game";
    const screens = ["playScreen", "quizScreen", "animalScreen", "drawScreen"]
      .map((id) => document.getElementById(id)).filter(Boolean);
    const update = () => {
      const ingame = always || screens.some((s) => !s.classList.contains("hidden"));
      document.body.classList.toggle("ingame", ingame);
    };
    if (!always && !screens.length) return;   // 画面切りかえのないページはそのまま
    if (screens.length) {
      const mo = new MutationObserver(update);
      screens.forEach((s) => mo.observe(s, { attributes: true, attributeFilter: ["class"] }));
    }
    update();
  },
};
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => GameChrome.init());
} else {
  GameChrome.init();
}
