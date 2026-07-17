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
     float(ふわふわ)    … 分割なし。ぷかぷか うかんで うごく
   ※ type 未設定の ふるいレコードは biped として あつかう(後方互換)。
   ============================================================ */
"use strict";

const Rig = {
  TYPES: ["biped", "skirt", "quad", "float"],
  DEFAULT: { type: "biped", neckY: 0.42, hipY: 0.7, centerX: 0.5, bellyY: 0.55 },

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
    this.h = opts.h || 160;        // 表示上の高さpx
    this.facing = opts.facing || 1;
    this.vx = 0;
    this.vy = 0;
    this.walking = false;
    this.phase = Math.random() * 6;
    this.t = Math.random() * 6;
    this.jumpT = 0;                // ジャンプ演出(>0でエア)
  }

  get scale() { return this.h / this.parts.H; }
  get w() { return this.parts.W * this.scale; }

  update(dt) {
    this.t += dt;
    if (this.walking) this.phase += dt * 11;
    if (this.jumpT > 0) this.jumpT = Math.max(0, this.jumpT - dt);
  }

  hop() { this.jumpT = 0.45; Sound.jump(); }

  /* yは足もと基準。airY を渡すとその分うきあがる(ジャンプ物理は各ゲーム側) */
  draw(ctx, airY = 0) {
    const p = this.parts;
    const s = this.scale;
    const hopLift = this.jumpT > 0 ? Math.sin((1 - this.jumpT / 0.45) * Math.PI) * this.h * 0.28 : 0;

    ctx.save();
    ctx.translate(this.x, this.y - airY - hopLift);
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
      default:      this._drawBiped(ctx, part, s, airY);
    }
    ctx.restore();
  }

  /* --- にほんあし(現行動作) --- */
  _drawBiped(ctx, part, s, airY) {
    const p = this.parts;
    const walkBob = this.walking ? Math.abs(Math.sin(this.phase)) * this.h * 0.035 : Math.sin(this.t * 2.2) * this.h * 0.012;
    const swing = this.walking ? Math.sin(this.phase) * 0.5 : 0;
    const rock = this.walking ? Math.sin(this.phase) * 0.06 : Math.sin(this.t * 2.2) * 0.02;
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
    const swing = this.walking ? Math.sin(this.phase) * 0.11 : Math.sin(this.t * 1.6) * 0.05;
    // 小さくぴょこぴょこ弾む
    const bob = this.walking ? Math.abs(Math.sin(this.phase)) * this.h * 0.05 : Math.sin(this.t * 2.0) * this.h * 0.012;
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
    const swing = this.walking ? Math.sin(this.phase) * 0.45 : Math.sin(this.t * 2.0) * 0.08;
    const pose = inAir ? 0.3 : swing;
    const bob = this.walking ? Math.abs(Math.sin(this.phase * 2)) * this.h * 0.02 : 0;
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

  /* あたり判定用のざっくり矩形(足もと基準) */
  bbox(airY = 0) {
    return {
      x: this.x - this.w / 2,
      y: this.y - airY - this.h,
      w: this.w,
      h: this.h,
    };
  }
}
