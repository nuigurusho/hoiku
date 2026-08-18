/* ============================================================
   rig.js — おえかきパペット
   子どもの絵(白い紙に描いたキャラ)を
     ・白背景を透明化 → 余白カット
     ・「うごきのタイプ」にあわせてパーツ分割
   して、ペープサート(紙人形)ふうに うごかす。

   うごきのタイプ(rig.type):
     biped(にほんあし) … くび/こし/まんなか で 頭・体・左あし・右あし
     skirt(スカート)   … くび/こし で 頭・体・スカート(下半身は割らない)
     quad(よつあし)     … おなか/まんなか で 体(頭こみ)・まえあし・うしろあし
                            え は「ひだりが あたま」で かく(よこむきの どうぶつ)
     float(ふわふわ)    … 分割なし。ぷかぷか うかんで うごく
     butterfly(ちょうちょ)… かいた え1まいを 「みぎの はね」として つかい、
                            左右はんてんした はねと あわせて ひらひら とばす
   ※ type 未設定の ふるいレコードは biped として あつかう(後方互換)。
   ============================================================ */
"use strict";

const Rig = {
  TYPES: ["biped", "skirt", "quad", "float", "butterfly"],
  DEFAULT: { type: "biped", neckY: 0.42, hipY: 0.7, centerX: 0.5, bellyY: 0.55, hingeX: 0 },

  /* レコード → 分割パーツ一式 */
  async load(rec) {
    const img = await Util.loadImage(rec.dataURL);
    const keyed = Util.keyImage(img);
    const trimmed = Util.trimCanvas(keyed);
    return this.makeParts(trimmed, rec.rig || this.DEFAULT, rec.name);
  },

  makeParts(canvas, rig, name) {
    rig = rig || this.DEFAULT;
    const W = canvas.width, H = canvas.height;
    const OV = Math.max(4, Math.round(H * 0.015)); // つなぎ目かくし用ののりしろ
    const type = this.TYPES.includes(rig.type) ? rig.type : "biped";
    const val = (v, def) => (v == null ? def : v);

    /* よつあしの え は「ひだりが あたま」で かく。ほかのタイプと おなじ
       「そのままの むき = みぎむき(facing:1)」に そろえるため、ここで 左右はんてんする。
       まんなか線も いっしょに はんてんするので、まえあし/うしろあし は
       いつも「あたまがわ = まえあし」に なる。 */
    if (type === "quad") {
      const m = Util.makeCanvas(W, H);
      const mctx = m.getContext("2d");
      mctx.translate(W, 0);
      mctx.scale(-1, 1);
      mctx.drawImage(canvas, 0, 0);
      canvas = m;
      rig = { ...rig, centerX: 1 - Util.clamp(val(rig.centerX, 0.5), 0.1, 0.9) };
    }

    const cx = Math.round(Util.clamp(val(rig.centerX, 0.5), 0.1, 0.9) * W);

    const cut = (sx, sy, sw, sh) => {
      sx = Math.round(sx); sy = Math.round(sy);
      sw = Math.max(1, Math.round(sw)); sh = Math.max(1, Math.round(sh));
      const c = Util.makeCanvas(sw, sh);
      c.getContext("2d").drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
      return { c, ox: sx, oy: sy };
    };

    /* 頭を割らないタイプ用の「上部40%」切り出し(mole が parts.head.c を使う) */
    const headCrop = () => {
      const hh = Math.max(1, Math.round(H * 0.4));
      return { ...cut(0, 0, W, hh), pivot: { x: cx, y: hh } };
    };

    const base = { W, H, cx, type, name: name || "", full: canvas };

    if (type === "skirt") {
      const neckY = Math.round(Util.clamp(val(rig.neckY, 0.42), 0.1, 0.9) * H);
      const hipY  = Math.round(Util.clamp(val(rig.hipY, 0.7), val(rig.neckY, 0.42) + 0.05, 0.95) * H);
      return {
        ...base, neckY, hipY,
        head:  { ...cut(0, 0, W, neckY + OV),            pivot: { x: cx, y: neckY } },
        torso: { ...cut(0, neckY, W, hipY - neckY + OV), pivot: { x: cx, y: hipY } },
        skirt: { ...cut(0, hipY, W, H - hipY),           pivot: { x: cx, y: hipY } },
      };
    }

    if (type === "quad") {
      const bellyY = Math.round(Util.clamp(val(rig.bellyY, 0.55), 0.2, 0.9) * H);
      return {
        ...base, bellyY,
        head:     headCrop(),
        body:     { ...cut(0, 0, W, bellyY + OV),           pivot: { x: cx, y: bellyY } },
        legBack:  { ...cut(0, bellyY, cx, H - bellyY),      pivot: { x: cx * 0.5, y: bellyY } },
        legFront: { ...cut(cx, bellyY, W - cx, H - bellyY), pivot: { x: cx + (W - cx) * 0.5, y: bellyY } },
      };
    }

    if (type === "float") {
      return {
        ...base,
        head: headCrop(),
        body: { ...cut(0, 0, W, H), pivot: { x: cx, y: H } },
      };
    }

    if (type === "butterfly") {
      /* かいた え の「つけね線(hingeX)より みぎがわ」を はね1まいとして つかい、
         それを 左右はんてん して もういっぽうの はねを つくる。 */
      const rawHinge = Math.min(W - 1, Math.round(Util.clamp(val(rig.hingeX, 0), 0, 0.6) * W));
      /* トリムの よはく(とうめいな たて列)は つめる。まんなかで すきまなく くっつくように */
      const hinge = (() => {
        const g = canvas.getContext("2d");
        const w = W - rawHinge;
        const d = g.getImageData(rawHinge, 0, w, H).data;
        for (let x = 0; x < w; x++)
          for (let y = 0; y < H; y++)
            if (d[(y * w + x) * 4 + 3] > 20) return rawHinge + x;
        return rawHinge;
      })();
      const wingW = Math.max(1, W - hinge);
      const wing = cut(hinge, 0, wingW, H);
      const sym = Util.makeCanvas(wingW * 2, H);          // 左右そろえた ちょうちょ全体
      const sctx = sym.getContext("2d");
      sctx.drawImage(wing.c, wingW, 0);                   // みぎばね(そのまま)
      sctx.save();
      sctx.translate(wingW, 0); sctx.scale(-1, 1);
      sctx.drawImage(wing.c, 0, 0);                       // ひだりばね(左右はんてん)
      sctx.restore();
      const hh = Math.max(1, Math.round(H * 0.4));
      const headC = Util.makeCanvas(wingW * 2, hh);       // mole 用の「あたま」= 上40%
      headC.getContext("2d").drawImage(sym, 0, 0, wingW * 2, hh, 0, 0, wingW * 2, hh);
      return {
        ...base, W: wingW * 2, cx: wingW, full: sym, wingW,
        wing: { c: wing.c, ox: wingW, oy: 0, pivot: { x: wingW, y: H } },
        head: { c: headC, ox: 0, oy: 0, pivot: { x: wingW, y: hh } },
        body: { c: sym, ox: 0, oy: 0, pivot: { x: wingW, y: H } },
      };
    }

    /* biped(にほんあし・現行動作 / 後方互換) */
    const neckY = Math.round(Util.clamp(val(rig.neckY, 0.42), 0.1, 0.9) * H);
    const hipY  = Math.round(Util.clamp(val(rig.hipY, 0.7), val(rig.neckY, 0.42) + 0.05, 0.95) * H);
    return {
      ...base, neckY, hipY,
      head:  { ...cut(0, 0, W, neckY + OV),            pivot: { x: cx, y: neckY } },
      torso: { ...cut(0, neckY, W, hipY - neckY + OV), pivot: { x: cx, y: hipY } },
      legL:  { ...cut(0, hipY, cx, H - hipY),          pivot: { x: cx * 0.5, y: hipY } },
      legR:  { ...cut(cx, hipY, W - cx, H - hipY),     pivot: { x: cx + (W - cx) * 0.5, y: hipY } },
    };
  },
};

/* あるきまわるパペット */
class Puppet {
  constructor(parts, opts = {}) {
    this.parts = parts;
    this.x = opts.x || 0;          // 足もと中心のX
    this.y = opts.y || 0;          // 足もと(地面)のY
    this.h = opts.h || 160;        // 表示上の高さpx(ちょうちょは じどうで はんぶん)
    this.facing = opts.facing || 1;
    this.vx = 0;
    this.vy = 0;
    this.walking = false;
    this.phase = Math.random() * 6;
    this.t = Math.random() * 6;
    this.flap = Math.random() * 6;   // はばたき(ちょうちょ)
    this.jumpT = 0;                // ジャンプ演出(>0でエア)
    this.roll = 0;                 // からだ全体のかたむき(rad)。いぬかき・魚の ゆらゆら用
    this.kick = false;             // バタ足フォーム(あしのふりが こまかく はやくなる)
    this.perched = false;          // とまりフォーム(ちょうちょが 花に とまって はねを たたむ)
  }

  /* ちょうちょは え1まいが「はね」で、ひろげると よこ2ばいに なる。
     ほかの子と ならんだとき でかすぎるので、いつも はんぶんの 大きさで えがく */
  set h(v) { this._h = v * (this.parts.type === "butterfly" ? 0.5 : 1); }
  get h() { return this._h; }

  get scale() { return this.h / this.parts.H; }
  get w() { return this.parts.W * this.scale; }
  /* ちょうちょは 地面に つかず、すこし うかんで とぶ */
  get lift() { return this.parts.type === "butterfly" ? this.h * 0.35 : 0; }

  update(dt) {
    this.t += dt;
    if (this.walking) this.phase += dt * (this.kick ? 26 : 11);
    this.flap += dt * (this.perched ? 2.4 : this.jumpT > 0 ? 24 : this.walking ? 14 : 9);
    if (this.jumpT > 0) this.jumpT = Math.max(0, this.jumpT - dt);
  }

  hop() { this.jumpT = 0.45; Sound.jump(); }

  /* yは足もと基準。airY を渡すとその分うきあがる(ジャンプ物理は各ゲーム側) */
  draw(ctx, airY = 0) {
    const p = this.parts;
    const s = this.scale;
    const hopLift = this.jumpT > 0 ? Math.sin((1 - this.jumpT / 0.45) * Math.PI) * this.h * 0.28 : 0;

    ctx.save();
    ctx.translate(this.x, this.y - airY - hopLift - this.lift);
    if (this.roll) {                       // からだの まんなかを 中心に かたむける
      ctx.translate(0, -this.h / 2);
      ctx.rotate(this.roll);
      ctx.translate(0, this.h / 2);
    }
    ctx.scale(s * this.facing, s);
    ctx.translate(-p.cx, -p.H);

    const part = (pt, ang) => {
      if (!pt) return;
      ctx.save();
      ctx.translate(pt.pivot.x, pt.pivot.y);
      ctx.rotate(ang || 0);
      ctx.drawImage(pt.c, pt.ox - pt.pivot.x, pt.oy - pt.pivot.y);
      ctx.restore();
    };

    switch (p.type) {
      case "skirt": this._drawSkirt(ctx, part, s, airY); break;
      case "quad":  this._drawQuad(ctx, part, s, airY); break;
      case "float": this._drawFloat(ctx, part, s, airY); break;
      case "butterfly": this._drawButterfly(ctx, part, s, airY); break;
      default:      this._drawBiped(ctx, part, s, airY);
    }
    ctx.restore();
  }

  /* --- にほんあし(現行動作) --- */
  _drawBiped(ctx, part, s, airY) {
    const p = this.parts;
    const walkBob = this.kick ? 0
      : this.walking ? Math.abs(Math.sin(this.phase)) * this.h * 0.035 : Math.sin(this.t * 2.2) * this.h * 0.012;
    const swing = this.walking ? Math.sin(this.phase) * (this.kick ? 0.22 : 0.5) : 0;
    const rock = this.kick ? 0
      : this.walking ? Math.sin(this.phase) * 0.06 : Math.sin(this.t * 2.2) * 0.02;
    const inAir = airY > 0.5 || this.jumpT > 0;
    const legPose = inAir ? 0.35 : swing;

    part(p.legL, legPose);
    part(p.legR, -legPose);
    ctx.translate(0, -walkBob / s);
    part(p.torso, rock);
    part(p.head, -rock * 1.4);
  }

  /* --- スカート(下半身ふりこ+ぴょこぴょこ) --- */
  _drawSkirt(ctx, part, s) {
    const p = this.parts;
    // こし中心のふりこ(±6°ていど)
    const swing = this.walking ? Math.sin(this.phase) * (this.kick ? 0.06 : 0.11) : Math.sin(this.t * 1.6) * 0.05;
    // 小さくぴょこぴょこ弾む(バタ足のときは はねない)
    const bob = this.kick ? 0
      : this.walking ? Math.abs(Math.sin(this.phase)) * this.h * 0.05 : Math.sin(this.t * 2.0) * this.h * 0.012;
    const rock = this.walking ? Math.sin(this.phase) * 0.03 : Math.sin(this.t * 2.0) * 0.015;

    ctx.translate(0, -bob / s);
    part(p.skirt, swing);
    part(p.torso, rock);
    part(p.head, -rock * 1.4);
  }

  /* --- よつあし(前後の あし が逆位相) --- */
  _drawQuad(ctx, part, s, airY) {
    const p = this.parts;
    const inAir = airY > 0.5 || this.jumpT > 0;
    const swing = this.walking ? Math.sin(this.phase) * (this.kick ? 0.2 : 0.45) : Math.sin(this.t * 2.0) * 0.08;
    const pose = inAir ? 0.3 : swing;
    const bob = this.kick ? 0 : this.walking ? Math.abs(Math.sin(this.phase * 2)) * this.h * 0.02 : 0;
    const bodyRock = this.walking ? Math.sin(this.phase) * 0.02 : Math.sin(this.t * 1.8) * 0.01;

    ctx.translate(0, -bob / s);
    part(p.legBack, -pose);   // うしろあし(体のうしろ)
    part(p.body, bodyRock);   // 体+頭
    part(p.legFront, pose);   // まえあし(体のまえ)
  }

  /* --- ふわふわ(ぷかぷか+ゆらゆら+スクワッシュ&ストレッチ) --- */
  _drawFloat(ctx, part, s) {
    const p = this.parts;
    const bob = Math.sin(this.t * 2.0) * this.h * 0.045;   // ぷかぷか
    const tilt = Math.sin(this.t * 1.3) * 0.07;            // ゆらゆら(±4°ていど)
    const sq = this.jumpT > 0 ? Math.sin((1 - this.jumpT / 0.45) * Math.PI) : 0;
    const sy = 1 + sq * 0.16;   // ジャンプ中は たてに のびる
    const sx = 1 - sq * 0.12;   // よこは ちぢむ

    ctx.translate(0, -bob / s);
    ctx.save();
    ctx.translate(p.cx, p.H);   // 足もと中心で かたむき・のびちぢみ
    ctx.rotate(tilt);
    ctx.scale(sx, sy);
    ctx.translate(-p.cx, -p.H);
    part(p.body, 0);
    ctx.restore();
  }

  /* --- ちょうちょ(1まいの はねを 左右はんてんして ひらひら) ---
     とんでいるとき … はねを 大きく ひらいたり とじたり
     とまっているとき … はねを パタリと たたんだまま、ときどき 小さく ひらく */
  _drawButterfly(ctx, part, s) {
    const p = this.parts;
    if (!p.wing) { part(p.body, 0); return; }
    const wave = Math.sin(this.flap);
    let open, bob, tilt;
    if (this.perched) {
      const pulse = Math.max(0, wave);               // はんぶんの あいだは とじたまま
      const burst = Math.max(0, Math.sin(this.t * 0.5));  // ひらくのは ときどき まとめて
      open = 0.14 + 0.40 * pulse * pulse * burst;    // たたんだ → 小さく ひらく
      bob = 0;                                       // はばたきの たてゆれは なし
      tilt = Math.sin(this.t * 0.9) * 0.04;          // 花の うえで そよぐ ていど
    } else {
      open = 0.32 + 0.68 * (wave * 0.5 + 0.5);       // はねの ひらきぐあい(よこ幅)
      bob = wave * this.h * 0.035;                   // はばたきに あわせた たてゆれ
      tilt = Math.sin(this.t * 1.4) * 0.09;          // ふわりと かたむく
    }

    ctx.translate(0, -bob / s);
    ctx.save();
    ctx.translate(p.cx, p.H * 0.5);
    ctx.rotate(tilt);
    ctx.translate(-p.cx, -p.H * 0.5);
    for (const dir of [-1, 1]) {          // おくの はね → てまえの はね の じゅんに
      ctx.save();
      ctx.globalAlpha = dir < 0 ? 0.92 : 1;
      ctx.translate(p.cx, 0);
      ctx.scale(dir * open, 1);
      ctx.drawImage(p.wing.c, 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }

  /* あたり判定用のざっくり矩形(足もと基準・かたむきこみ) */
  bbox(airY = 0) {
    const cy = this.y - airY - this.lift - this.h / 2;   // からだの まんなか
    const c = Math.abs(Math.cos(this.roll)), sn = Math.abs(Math.sin(this.roll));
    const w = this.w * c + this.h * sn;
    const h = this.h * c + this.w * sn;
    return { x: this.x - w / 2, y: cy - h / 2, w, h };
  }
}
