/* ============================================================
   rig.js — おえかきパペット
   子どもの絵(白い紙に描いたキャラ)を
     ・白背景を透明化 → 余白カット
     ・くび/こし/たてのラインで 頭・体・左あし・右あし に分割
   して、ペープサート(紙人形)ふうに歩かせる。
   ============================================================ */
"use strict";

const Rig = {
  DEFAULT: { neckY: 0.42, hipY: 0.7, centerX: 0.5 },

  /* レコード → 分割パーツ一式 */
  async load(rec) {
    const img = await Util.loadImage(rec.dataURL);
    const keyed = Util.keyImage(img);
    const trimmed = Util.trimCanvas(keyed);
    return this.makeParts(trimmed, rec.rig || this.DEFAULT, rec.name);
  },

  makeParts(canvas, rig, name) {
    const W = canvas.width, H = canvas.height;
    const neckY = Math.round(Util.clamp(rig.neckY, 0.1, 0.9) * H);
    const hipY  = Math.round(Util.clamp(rig.hipY, rig.neckY + 0.05, 0.95) * H);
    const cx    = Math.round(Util.clamp(rig.centerX, 0.1, 0.9) * W);
    const OV = Math.max(4, Math.round(H * 0.015)); // つなぎ目かくし用ののりしろ

    const cut = (sx, sy, sw, sh) => {
      sw = Math.max(1, sw); sh = Math.max(1, sh);
      const c = Util.makeCanvas(sw, sh);
      c.getContext("2d").drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
      return { c, ox: sx, oy: sy };
    };

    return {
      W, H, cx, neckY, hipY, name: name || "",
      full: canvas,
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
    const walkBob = this.walking ? Math.abs(Math.sin(this.phase)) * this.h * 0.035 : Math.sin(this.t * 2.2) * this.h * 0.012;
    const swing = this.walking ? Math.sin(this.phase) * 0.5 : 0;
    const rock = this.walking ? Math.sin(this.phase) * 0.06 : Math.sin(this.t * 2.2) * 0.02;
    const inAir = airY > 0.5 || this.jumpT > 0;
    const legPose = inAir ? 0.35 : swing;

    ctx.save();
    ctx.translate(this.x, this.y - airY - hopLift);
    ctx.scale(s * this.facing, s);
    ctx.translate(-p.cx, -p.H);

    const part = (pt, ang) => {
      ctx.save();
      ctx.translate(pt.pivot.x, pt.pivot.y);
      ctx.rotate(ang);
      ctx.drawImage(pt.c, pt.ox - pt.pivot.x, pt.oy - pt.pivot.y);
      ctx.restore();
    };

    part(p.legL, legPose);
    part(p.legR, -legPose);
    ctx.translate(0, -walkBob / s);
    part(p.torso, rock);
    part(p.head, -rock * 1.4);
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
