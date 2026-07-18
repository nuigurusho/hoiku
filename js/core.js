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
};
window.addEventListener("pointerdown", () => Sound.ensure(), { once: true });

/* ---------------- Store(IndexedDBに画像を保存) ----------------
   レコード: { id, name, cat('char'|'bg'|'pic'), dataURL,
               rig:{neckY,hipY,centerX}, diffSpots:[{x,y,r}], created } */
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

  makeAll() {
    return [this.charA(), this.charB(), this.charC(), this.charSkirt(), this.charFloat(),
            this.bgA(), this.picA(), this.picB()];
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
