/* ============================================================
   meet.js — うんどうかいの きょうぎエンジン(2チームたいせん)

   「たまいれ」の ゲームと「うんどうかい」の 番組しんこうで つかう、
   あか/あお 2チームの きょうぎを 1つの canvas で じどう再生する ライブラリ。

     Meet.actors(teams)   … {red:[{rec,name,voices}], blue:[…]} を パペット化
     Meet.ui(els)         … テロップ・HUD の DOM を きょうぎエンジンに つなぐ
     Meet.run(opts)       … きょうぎを 1つ 再生(おわると けっかを Promise でかえす)
     Meet.celebrate(opts) … 勝ったチームが とびはねる おいわい画面
     Meet.stop()          … いま うごいている ものを とめる

   きょうぎ(opts.key):
     kakekko   … よこ1れつの かけっこ。じゅんいの てんすうを チームで合計
     tamaire   … 左右に わかれて かごに 玉入れ。時間内に 入った かず
     dodgeball … 左右に わかれて ドッヂボール。のこった 人数
     relay     … トラックを 1しゅうずつ リレー。さきに ゴールした チーム

   けっか: { win: "red"|"blue"|null, score: {red, blue}, label: "…" }
   ※ 単独ゲームの games/dodgeball.html・games/relay.html は それぞれの
      ページで かんけつしており、この ファイルは つかっていない。
   ============================================================ */
"use strict";

const Meet = (() => {
  const CW = 1280, CH = 720;
  const OTHER = { red: "blue", blue: "red" };
  const COL   = { red: "#ff6b9d", blue: "#4dabf7" };
  const COLD  = { red: "#d6336c", blue: "#1c7ed6" };
  const MARK  = { red: "🔴", blue: "🔵" };

  let rafId = 0;
  let cur = null;   // いま うごいている きょうぎ(or おいわい)

  /* ============================================================
     きょうずう:キャラを パペットに する
     ============================================================ */
  async function actors(teams) {
    const out = { red: [], blue: [] };
    for (const key of ["red", "blue"]) {
      for (const m of teams[key] || []) {
        const parts = await Rig.load(m.rec);
        out[key].push({
          rec: m.rec, name: m.name || "", voices: m.voices || null, team: key,
          puppet: new Puppet(parts, { h: 140, facing: key === "red" ? 1 : -1 }),
        });
      }
    }
    return out;
  }

  /* ---- テロップの ぶひん(キャラ名は チームの色) ---- */
  function nameNode(a) {
    const s = document.createElement("span");
    s.className = "mt-nm " + a.team;
    s.textContent = a.name || "";
    return s;
  }
  function toNodes(parts) {
    return parts.map((p) => (typeof p === "string" ? document.createTextNode(p) : nameNode(p)));
  }

  /* ---- ページの DOM を エンジンに つなぐ ---- */
  const BANNER_MS = 2400;          // テロップが 出ている ながさ
  let bannerT = 0, bannerOutT = 0;

  function ui(els) {
    return {
      /* テロップは 出来事が あった ときだけ 出して、BANNER_MS で 自分から 消える。
         まえは 出しっぱなしで、ずっと 画面の下を ふさいでいた。
         つぎの テロップが きたら すぐ 入れかわる。 */
      banner(list, team) {
        const b = els.banner;
        if (!b) return;
        clearTimeout(bannerT); clearTimeout(bannerOutT);
        if (!list) { b.classList.add("hidden"); b.classList.remove("out"); return; }
        b.className = "mt-banner" + (team ? " " + team : "");
        b.textContent = "";
        for (const n of list) b.appendChild(n);
        b.classList.remove("hidden", "out");
        b.style.animation = "none"; void b.offsetWidth; b.style.animation = "";   // アニメを 再生し直す
        bannerT = setTimeout(() => {
          b.classList.add("out");
          bannerOutT = setTimeout(() => b.classList.add("hidden"), 220);
        }, BANNER_MS);
      },
      hud(s) {
        if (els.hudRed)  els.hudRed.textContent  = s.red  || "";
        if (els.hudBlue) els.hudBlue.textContent = s.blue || "";
        if (els.hudMid)  els.hudMid.textContent  = s.mid  || "";
      },
      msg(t, ms, col) { Ui.msg(t, ms, col); },
    };
  }

  /* ============================================================
     きょうぎの 共通ランナー
     ============================================================ */
  function run(opts) {
    stop();
    const engine = ENGINES[opts.key];
    if (!engine) return Promise.resolve(null);
    const A = opts.actors;
    const M = {
      key: opts.key,
      cv: opts.cv,
      ctx: opts.cv.getContext("2d"),
      quick: !!opts.quick,
      ui: Object.assign({ banner() {}, hud() {}, msg(t, ms, c) { Ui.msg(t, ms, c); } }, opts.ui),
      names: Object.assign({ red: "あかチーム", blue: "あおチーム" }, opts.names),
      A, all: A.red.concat(A.blue),
      t: 0, result: null, endWait: 0,
      label(key) { return MARK[key] + " " + M.names[key]; },
      say(parts, team) { M.ui.banner(toNodes(parts), team || ""); },
      hush() { M.ui.banner(null); },
      finish(res, wait) {
        if (M.result) return;
        M.result = res;
        M.endWait = wait == null ? 1.8 : wait;
      },
    };

    // キャラを まっさらな じょうたいに もどす(まえの きょうぎの のこりを けす)
    for (const a of M.all) {
      const pu = a.puppet;
      pu.walking = false; pu.jumpT = 0; pu.roll = 0; pu.kick = false;
      pu.facing = a.team === "red" ? 1 : -1;
      a.fall = 0; a.emo = ""; a.rank = 0;
    }

    const token = {};
    cur = token;

    return new Promise((resolve) => {
      token.resolve = resolve;          // とちゅうで とめられたら null で かえす
      engine.init(M);
      let last = performance.now();
      (function loop(now) {
        if (cur !== token) return;                       // とめられた
        const dt = Math.min(0.04, (now - last) / 1000); last = now;
        M.t += dt;
        engine.update(M, dt);
        engine.draw(M);
        if (M.result) {
          M.endWait -= dt;
          if (M.endWait <= 0) { cur = null; rafId = 0; resolve(M.result); return; }
        }
        rafId = requestAnimationFrame(loop);
      })(last);
    });
  }

  /* いま うごいている きょうぎ(or おいわい)を とめる。
     きょうぎを とめたときは run() の Promise が null で かえる。 */
  function stop() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    const c = cur;
    cur = null;
    if (c && c.resolve) { const r = c.resolve; c.resolve = null; r(null); }
  }

  /* きょうぎが おわったあと、パペットだけ うごかしておく */
  function idleAll(M, dt) {
    for (const a of M.all) a.puppet.update(dt);
  }

  /* ---- どの きょうぎでも つかう こまかい えがきもの ---- */

  /* 紅白まく(がめんの うえ) */
  function drawCurtain(ctx, h) {
    const w = 80;
    for (let x = 0, i = 0; x < CW; x += w, i++) {
      ctx.fillStyle = i % 2 ? "#fff" : "#ff8fab";
      ctx.fillRect(x, 0, w, h);
    }
    ctx.fillStyle = "rgba(150,110,70,.18)";
    ctx.fillRect(0, h - 5, CW, 5);
    // すそを なみなみに
    ctx.fillStyle = "#ffd43b";
    for (let x = 0; x < CW; x += 30) {
      ctx.beginPath(); ctx.arc(x + 15, h, 15, 0, Math.PI); ctx.fill();
    }
  }

  /* 玉(たまいれ・ドッヂボール 共用) */
  function drawBall(ctx, x, y, r, teamKey) {
    const base = teamKey === "red" ? ["#ffd8e6", "#ff6b9d", "#c92a5f"]
               : teamKey === "blue" ? ["#d5ecff", "#4dabf7", "#1864ab"]
               : ["#ffe0b8", "#ff922b", "#e8590c"];
    ctx.save();
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.15, x, y, r);
    g.addColorStop(0, base[0]); g.addColorStop(0.45, base[1]); g.addColorStop(1, base[2]);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    ctx.lineWidth = Math.max(2, r * 0.16); ctx.strokeStyle = "#fff"; ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.75)";
    ctx.beginPath(); ctx.arc(x - r * 0.34, y - r * 0.4, r * 0.22, 0, 7); ctx.fill();
    ctx.restore();
  }

  /* うかんで きえる もじ */
  function addFloat(M, x, y, txt, col, big) {
    M.E.floats.push({ x, y, txt, col: col || "#fff", t: 0, dur: big ? 1.3 : 0.9, big: !!big });
  }
  function stepFloats(M, dt) {
    for (const f of M.E.floats) f.t += dt;
    M.E.floats = M.E.floats.filter((f) => f.t < f.dur);
  }
  function drawFloats(M) {
    const ctx = M.ctx;
    for (const f of M.E.floats) {
      const a = 1 - f.t / f.dur;
      ctx.save();
      ctx.globalAlpha = Math.min(1, a * 2);
      ctx.font = `bold ${f.big ? 58 : 32}px sans-serif`;
      ctx.textAlign = "center";
      ctx.lineWidth = f.big ? 8 : 5; ctx.strokeStyle = "#fff";
      ctx.fillStyle = f.col;
      const y = f.y - f.t * 34;
      ctx.strokeText(f.txt, f.x, y);
      ctx.fillText(f.txt, f.x, y);
      ctx.restore();
    }
    ctx.textAlign = "left";
  }

  function drumroll() {
    for (let i = 0; i < 5; i++) Sound.beep(180 + i * 6, 0.04, "square", 0.06, i * 0.05);
  }

  /* ============================================================
     1. かけっこ(よこ1れつ・じゅんいで てんすう)
     ============================================================ */
  const KK_GOAL = 2400;
  const KK_TOP = 84, KK_TOP_H = 536;   // レーンの うえの あき・ぜんたいの たかさ

  const KAKEKKO = {
    init(M) {
      // あか・あおを こうごに ならべる(となりが あいてチーム)
      const lanes = [];
      const maxLen = Math.max(M.A.red.length, M.A.blue.length);
      for (let i = 0; i < maxLen; i++) {
        if (M.A.red[i])  lanes.push(M.A.red[i]);
        if (M.A.blue[i]) lanes.push(M.A.blue[i]);
      }
      const laneH = KK_TOP_H / lanes.length;
      for (const a of lanes) {
        a.prog = 0; a.rank = 0; a.wob = Util.rand(0, 9);
        a.event = null; a.eventT = 0; a.eventCd = Util.rand(1.4, 3.4); a.emo = "";
        a.puppet.h = Util.clamp(laneH * 1.1, 42, 148);
        a.puppet.facing = 1;
      }
      M.E = {
        lanes, laneH, state: "ready", stateT: 0,
        finished: 0, lead: 0, sinceFirst: 0,
        pts: { red: 0, blue: 0 }, floats: [],
      };
      kkHud(M);
      M.say(["🏁 いちについて… よーい…"], "");
      M.ui.msg("よーい…", 1100, "#4dabf7");
      Sound.tick();
    },

    update(M, dt) {
      const E = M.E;
      stepFloats(M, dt);
      if (M.result) { idleAll(M, dt); return; }
      E.stateT += dt;

      if (E.state === "ready") {
        if (E.stateT >= 1.3) {
          E.state = "run"; E.stateT = 0;
          M.ui.msg("どん!", 900, "#ff6b9d");
          Sound.pon();
          M.say(["🏁 スタート! がんばれー!"], "");
        }
      } else if (E.state === "run") {
        E.lead = 0;
        for (const a of E.lanes) if (a.prog > E.lead) E.lead = a.prog;
        for (const a of E.lanes) if (!a.rank) kkStep(M, a, dt);
        if (E.finished) E.sinceFirst += dt;
        // ぜんいん ゴール、または 1いから しばらく たったら しめきり
        if (E.finished >= E.lanes.length || (E.finished && E.sinceFirst > 6)) kkEnd(M);
      }
      idleAll(M, dt);
    },

    draw(M) { kkDraw(M); },
  };

  function kkStep(M, a, dt) {
    const E = M.E;
    a.wob += dt;
    let v = 190 + Math.sin(a.wob * 1.7) * 70 + Math.sin(a.wob * 4.3 + 1) * 45;

    // 追い上げほせい:おくれてる子ほど はやい(ゴールが ちかづくと よわまる)
    const prog01 = E.lead / KK_GOAL;
    const strength = 0.8 * (1 - prog01 * 0.7);
    const gap = E.lead - a.prog;
    v *= 1 + Math.min(strength, (gap / KK_GOAL) * 2.4);

    if (a.event) {
      a.eventT -= dt;
      if (a.event === "sleep")   { v = 0;     a.puppet.walking = false; }
      if (a.event === "stumble") { v *= 0.12; a.puppet.walking = true;  }
      if (a.event === "boost")   { v *= 2.3;  a.puppet.walking = true;  }
      if (a.eventT <= 0) { a.event = null; a.emo = ""; a.eventCd = Util.rand(1.4, 3.4); }
    } else {
      a.puppet.walking = true;
      a.eventCd -= dt;
      if (a.eventCd <= 0 && a.prog > 140 && a.prog < KK_GOAL - 200) kkEvent(a, gap);
    }
    a.prog += Math.max(0, v) * dt;

    if (a.prog >= KK_GOAL) {
      a.prog = KK_GOAL;
      a.rank = ++E.finished;
      a.event = null; a.emo = "";
      a.puppet.walking = false;
      const pt = E.lanes.length - a.rank + 1;
      E.pts[a.team] += pt;
      const medal = ["", "🥇", "🥈", "🥉"][a.rank] || `${a.rank}い`;
      M.say([medal + " ", a, ` ゴール! ${pt}てん!`], a.team);
      addFloat(M, 1150, KK_TOP + M.E.laneH * (M.E.lanes.indexOf(a) + 1) - 60, `+${pt}`, COLD[a.team], a.rank === 1);
      if (a.rank === 1) { Sound.fanfare(); Sound.playVoice(a.voices, ["joy"]); }
      else Sound.good();
      kkHud(M);
    }
  }

  function kkEvent(a, gap) {
    const leading  = gap < KK_GOAL * 0.05;
    const trailing = gap > KK_GOAL * 0.13;
    const roll = Math.random();
    let ev;
    if (leading && roll < 0.55)       ev = "sleep";     // 先頭は ゆだんして いねむり
    else if (trailing && roll < 0.65) ev = "boost";     // 後ろの子は スパート
    else if (roll < 0.30)             ev = "stumble";
    else if (roll < 0.60)             ev = "sleep";
    else                              ev = "boost";
    a.event = ev;
    if (ev === "sleep")   { a.eventT = Util.rand(1.0, 2.2); a.emo = "💤"; if (leading)  Sound.beep(320, 0.55, "sine", 0.06, 0, -170); }
    if (ev === "boost")   { a.eventT = Util.rand(0.9, 1.7); a.emo = "💨"; if (trailing) Sound.beep(440, 0.16, "square", 0.07, 0, 260); }
    if (ev === "stumble") { a.eventT = Util.rand(0.5, 1.0); a.emo = "💫"; }
  }

  function kkEnd(M) {
    const E = M.E;
    // まだ はしってる子は そこまでの すすみぐあいで じゅんい
    const rest = E.lanes.filter((a) => !a.rank).sort((x, y) => y.prog - x.prog);
    for (const a of rest) {
      a.rank = ++E.finished;
      E.pts[a.team] += E.lanes.length - a.rank + 1;
      a.puppet.walking = false;
      a.event = null; a.emo = "";
    }
    kkHud(M);
    const p = E.pts;
    let win = p.red === p.blue ? null : (p.red > p.blue ? "red" : "blue");
    if (!win) {                                   // どうてんは 1いの チームの かち
      const first = E.lanes.find((a) => a.rank === 1);
      win = first ? first.team : null;
    }
    E.state = "over";
    M.say([`🏁 かけっこ しゅうりょう! ${MARK.red}${p.red}てん - ${MARK.blue}${p.blue}てん`], win || "");
    Sound.fanfare();
    M.finish({ win, score: { red: p.red, blue: p.blue }, label: `${p.red}てん - ${p.blue}てん` }, 2.4);
  }

  function kkHud(M) {
    const p = M.E.pts;
    M.ui.hud({
      red:  `${MARK.red} ${M.names.red} ${p.red}てん`,
      blue: `${MARK.blue} ${M.names.blue} ${p.blue}てん`,
      mid:  "かけっこ",
      n:    { red: p.red, blue: p.blue },
      unit: { red: "てん", blue: "てん" },
    });
  }

  function kkDraw(M) {
    const ctx = M.ctx, E = M.E;
    ctx.clearRect(0, 0, CW, CH);
    const sky = ctx.createLinearGradient(0, 0, 0, CH);
    sky.addColorStop(0, "#a5d8ff"); sky.addColorStop(1, "#e7f5ff");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, CW, CH);
    drawCurtain(ctx, 46);

    const laneH = E.laneH;
    E.lanes.forEach((a, i) => {
      const laneY = KK_TOP + laneH * (i + 1);    // 足もとのY
      const top = laneY - laneH + 14;
      const h = laneH - 6;
      ctx.fillStyle = a.team === "red" ? (i % 2 ? "#ffd2e3" : "#ffdfec") : (i % 2 ? "#cbe7ff" : "#dbefff");
      ctx.fillRect(0, top, CW, h);
      ctx.fillStyle = "rgba(255,255,255,.5)";
      ctx.fillRect(0, top, CW, 3);
      // ゴールライン
      for (let k = 0; k < 6; k++) {
        ctx.fillStyle = k % 2 ? "#fff" : "#4a3f35";
        ctx.fillRect(1190, top + h / 6 * k, 16, h / 6 + 0.5);
      }
      // はしる子
      const pu = a.puppet;
      pu.x = 80 + (a.prog / KK_GOAL) * 1100;
      pu.y = laneY;
      pu.facing = 1;
      pu.draw(ctx);
      // なまえ
      ctx.font = `bold ${Util.clamp(laneH * 0.34, 13, 24)}px sans-serif`;
      ctx.textAlign = "left";
      ctx.fillStyle = COLD[a.team];
      ctx.fillText(a.name, 14, top + Math.min(26, h * 0.6));
      // メダル・ハプニング
      ctx.textAlign = "center";
      if (a.rank) {
        const medal = ["", "🥇", "🥈", "🥉"][a.rank] || `${a.rank}い`;
        ctx.font = "40px serif";
        ctx.fillText(medal, pu.x, laneY - pu.h - 8);
      } else if (a.emo) {
        ctx.font = "36px serif";
        ctx.fillText(a.emo, pu.x, laneY - pu.h - 8);
      }
    });
    drawFloats(M);
    ctx.textAlign = "left";
  }

  /* ============================================================
     2. たまいれ(左=あか・右=あお。かごに 入った かず で しょうぶ)
     ============================================================ */
  const TM_BASE_Y = 520;                        // ポールの ねもと
  const TM_BASKET_Y = 236;                      // かごの 口の たかさ
  const TM_POLE = { red: 320, blue: 960 };
  const TM_XR = { red: [90, 560], blue: [720, 1190] };
  const TM_YR = [478, 596];

  const TAMAIRE = {
    init(M) {
      const per = Math.max(M.A.red.length, M.A.blue.length);
      const hBase = Util.clamp(148 - per * 5, 74, 130);
      for (const key of ["red", "blue"]) {
        for (const a of M.A[key]) {
          a.puppet.h = hBase;
          a.puppet.x = Util.rand(TM_XR[key][0], TM_XR[key][1]);
          a.puppet.y = Util.rand(TM_YR[0], TM_YR[1]);
          a.tx = a.puppet.x; a.ty = a.puppet.y;
          a.wander = Util.rand(0.2, 1.2);
          a.throwCd = Util.rand(0.4, 2.2);
          a.wind = 0;
          a.skill = Util.rand(-0.08, 0.10);      // 子ごとの とくいふとくい
        }
      }
      // じめんに ちらばった 玉(かざり)
      const litter = [];
      for (const key of ["red", "blue"]) {
        for (let i = 0; i < 14; i++) {
          litter.push({ key, x: Util.rand(TM_XR[key][0], TM_XR[key][1]), y: Util.rand(TM_YR[0], 630), r: Util.rand(9, 13) });
        }
      }
      M.E = {
        state: "ready", stateT: 0,
        time: M.quick ? 24 : 32,
        score: { red: 0, blue: 0 },
        balls: [], floats: [], litter,
        wob: { red: 0, blue: 0 },                // かごの ゆれ
        cnt: { red: 0, blue: 0 }, cntT: 0, cntStep: 0.3,
        base: 0,                                 // なげる かんかく(下で じかんから きめる)
      };
      // ぜんぶで 20〜25かい くらい なげる ペースに する(かぞえやすい かず に なるように)
      M.E.base = Util.clamp(per * M.E.time / 26, 1.5, 10);
      for (const a of M.all) a.throwCd = Util.rand(0.4, M.E.base);
      tmHud(M);
      M.say(["🧺 たまいれ! かごに いっぱい 入れよう!"], "");
      M.ui.msg("よーい…", 1000, "#4dabf7");
      Sound.tick();
    },

    update(M, dt) {
      const E = M.E;
      E.stateT += dt;
      stepFloats(M, dt);
      for (const key of ["red", "blue"]) E.wob[key] = Math.max(0, E.wob[key] - dt * 3);

      if (E.state === "ready") {
        if (E.stateT >= 1.2) {
          E.state = "play"; E.stateT = 0;
          M.ui.msg("スタート!", 900, "#ff6b9d");
          Sound.pon();
        }
      } else if (E.state === "play") {
        E.time -= dt;
        if (E.time <= 0) {
          E.time = 0;
          E.state = "count"; E.stateT = 0;
          E.cntStep = Math.max(E.score.red, E.score.blue) > 12 ? 0.17 : 0.3;
          E.balls.length = 0;
          M.say(["⏰ そこまで! かぞえましょう!"], "");
          M.ui.msg("そこまで!", 1100, "#e8590c");
          Sound.beep(300, 0.5, "sine", 0.12, 0, -120);
          for (const a of M.all) { a.puppet.walking = false; a.wind = 0; }
        } else {
          for (const a of M.all) tmStepChar(M, a, dt);
        }
        tmHud(M);
      } else if (E.state === "count") {
        // 1こずつ かぞえる(ドキドキ)
        E.cntT += dt;
        while (E.cntT >= E.cntStep && (E.cnt.red < E.score.red || E.cnt.blue < E.score.blue)) {
          E.cntT -= E.cntStep;
          let n = 0;
          for (const key of ["red", "blue"]) {
            if (E.cnt[key] < E.score[key]) { E.cnt[key]++; E.wob[key] = 1; n = Math.max(n, E.cnt[key]); }
          }
          Sound.beep(520 + Math.min(n, 20) * 24, 0.09, "triangle", 0.16);
        }
        tmHud(M);
        if (E.cnt.red >= E.score.red && E.cnt.blue >= E.score.blue && E.stateT > 1.2) tmEnd(M);
      }

      tmStepBalls(M, dt);
      idleAll(M, dt);
    },

    draw(M) { tmDraw(M); },
  };

  /* キャラ1人ぶんの うごき:うろうろ → かまえる → なげる */
  function tmStepChar(M, a, dt) {
    const pu = a.puppet;
    const pole = TM_POLE[a.team];

    if (a.wind > 0) {                       // かまえてる
      a.wind -= dt;
      pu.walking = false;
      pu.facing = Math.sign(pole - pu.x) || 1;
      if (a.wind <= 0) tmThrow(M, a);
      return;
    }

    a.throwCd -= dt;
    if (a.throwCd <= 0) { a.wind = 0.32; pu.jumpT = 0.4; return; }   // ぴょんと かまえる

    // うろうろ あるく
    a.wander -= dt;
    if (a.wander <= 0) {
      a.wander = Util.rand(0.7, 1.8);
      const xr = TM_XR[a.team];
      a.tx = Util.clamp(pu.x + Util.rand(-150, 150), xr[0], xr[1]);
      a.ty = Util.clamp(pu.y + Util.rand(-45, 45), TM_YR[0], TM_YR[1]);
    }
    const dx = a.tx - pu.x, dy = a.ty - pu.y;
    const d = Math.hypot(dx, dy);
    if (d > 4) {
      const step = Math.min(d, 105 * dt);
      pu.x += dx / d * step; pu.y += dy / d * step;
      pu.walking = true;
      if (Math.abs(dx) > 2) pu.facing = Math.sign(dx);
    } else {
      pu.walking = false;
      pu.facing = Math.sign(pole - pu.x) || 1;
    }
  }

  function tmThrow(M, a) {
    const E = M.E;
    const pu = a.puppet;
    const pole = TM_POLE[a.team];
    // せっせんに なるよう、まけてる チームは すこし 入りやすく
    const behind = E.score[a.team] < E.score[OTHER[a.team]] ? 0.12 : 0;
    const far = Math.min(1, Math.abs(pu.x - pole) / 400);
    const p = Util.clamp(0.5 + behind + a.skill - far * 0.18, 0.15, 0.85);
    const isIn = Math.random() < p;
    const fx = pu.x + pu.facing * pu.h * 0.22, fy = pu.y - pu.h * 0.95;
    const tx = isIn ? pole + Util.rand(-18, 18) : pole + (Math.random() < 0.5 ? -1 : 1) * Util.rand(70, 150);
    const ty = isIn ? TM_BASKET_Y + 16 : TM_BASE_Y + Util.rand(10, 60);
    E.balls.push({ team: a.team, in: isIn, fx, fy, tx, ty, t: 0, dur: Util.rand(0.72, 0.9), r: 15 });
    a.throwCd = Util.rand(E.base * 0.7, E.base * 1.5);
    Sound.beep(600, 0.1, "square", 0.07, 0, 200);
  }

  function tmStepBalls(M, dt) {
    const E = M.E;
    for (const b of E.balls) {
      b.t += dt;
      const s = Util.clamp(b.t / b.dur, 0, 1);
      const peak = (b.fy - TM_BASKET_Y) * 0.55 + 90;
      b.x = b.fx + (b.tx - b.fx) * s;
      b.y = b.fy + (b.ty - b.fy) * s - Math.sin(Math.PI * s) * peak;
      if (s >= 1 && !b.done) {
        b.done = true;
        if (b.in) {
          E.score[b.team]++;
          E.wob[b.team] = 1;
          Sound.pon();
          addFloat(M, TM_POLE[b.team] + 70, TM_BASKET_Y - 34, "+1", COLD[b.team], false);
        } else {
          Sound.beep(180, 0.14, "square", 0.07);
          addFloat(M, b.x, b.y - 20, "💨", "#fff", false);
        }
      }
    }
    E.balls = E.balls.filter((b) => !b.done);
  }

  function tmEnd(M) {
    const E = M.E;
    const s = E.score;
    const win = s.red === s.blue ? null : (s.red > s.blue ? "red" : "blue");
    E.state = "over";
    if (win) {
      M.say([`🧺 ${MARK[win]} ${M.names[win]} ${s[win]}こ! かち!`], win);
      Sound.fanfare();
    } else {
      M.say([`🧺 ${s.red}こ ずつで ひきわけ!`], "");
      Sound.good();
    }
    M.finish({ win, score: { red: s.red, blue: s.blue }, label: `${s.red}こ - ${s.blue}こ` }, 2.4);
  }

  function tmHud(M) {
    const E = M.E;
    /* かぞえて いる あいだは、かごの 中の 玉と おなじ「かぞえた かず」を 出す */
    const counting = E.state === "count" || E.state === "over";
    const v = counting ? E.cnt : E.score;
    M.ui.hud({
      red:  `${MARK.red} ${M.names.red} ${v.red}こ`,
      blue: `${MARK.blue} ${M.names.blue} ${v.blue}こ`,
      mid:  E.state === "play" ? `のこり ${Math.ceil(E.time)}びょう` : "たまいれ",
      n:    { red: v.red, blue: v.blue },
      unit: { red: "こ", blue: "こ" },
      sec:  E.state === "play" ? Math.ceil(E.time) : null,
    });
  }

  function tmDraw(M) {
    const ctx = M.ctx, E = M.E;
    ctx.clearRect(0, 0, CW, CH);
    // そら と じめん
    const sky = ctx.createLinearGradient(0, 0, 0, 300);
    sky.addColorStop(0, "#a5d8ff"); sky.addColorStop(1, "#e3f4ff");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, CW, 300);
    ctx.fillStyle = "#a9dd7e"; ctx.fillRect(0, 300, CW, CH - 300);
    // じんちの 色わけ
    ctx.fillStyle = "rgba(255,107,157,.16)"; ctx.fillRect(0, 300, CW / 2, CH - 300);
    ctx.fillStyle = "rgba(77,171,247,.16)";  ctx.fillRect(CW / 2, 300, CW / 2, CH - 300);
    ctx.save();
    ctx.setLineDash([24, 18]); ctx.lineWidth = 5; ctx.strokeStyle = "rgba(255,255,255,.8)";
    ctx.beginPath(); ctx.moveTo(CW / 2, 300); ctx.lineTo(CW / 2, CH); ctx.stroke();
    ctx.restore();
    drawCurtain(ctx, 46);

    // じめんの 玉(かざり)
    for (const l of E.litter) drawBall(ctx, l.x, l.y, l.r, l.key);

    // かご
    for (const key of ["red", "blue"]) tmDrawBasket(M, key);

    // キャラ(おく=Yが小さい ものから)
    const order = M.all.slice().sort((a, b) => a.puppet.y - b.puppet.y);
    for (const a of order) {
      const pu = a.puppet;
      pu.draw(ctx);
      ctx.font = "bold 19px sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = COLD[a.team];
      ctx.fillText(a.name, pu.x, pu.y + 22);
    }

    // とんでる 玉
    for (const b of E.balls) drawBall(ctx, b.x, b.y, b.r, b.team);

    drawFloats(M);
    ctx.textAlign = "left";
  }

  function tmDrawBasket(M, key) {
    const ctx = M.ctx, E = M.E;
    const x = TM_POLE[key];
    const wob = Math.sin(E.wob[key] * 18) * E.wob[key] * 5;
    // ポール
    ctx.fillStyle = "#c9a227";
    ctx.fillRect(x - 8, TM_BASKET_Y, 16, TM_BASE_Y - TM_BASKET_Y);
    ctx.fillStyle = "rgba(255,255,255,.35)";
    ctx.fillRect(x - 8, TM_BASKET_Y, 5, TM_BASE_Y - TM_BASKET_Y);
    // ポールの だい
    ctx.fillStyle = "#a97f4a";
    ctx.beginPath(); ctx.ellipse(x, TM_BASE_Y + 8, 40, 12, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#c9a06a";
    ctx.beginPath(); ctx.ellipse(x, TM_BASE_Y + 4, 40, 12, 0, 0, 7); ctx.fill();

    ctx.save();
    ctx.translate(x + wob, TM_BASKET_Y);
    // かご(上が ひろい だいけい)
    ctx.beginPath();
    ctx.moveTo(-62, 0); ctx.lineTo(62, 0); ctx.lineTo(42, 86); ctx.lineTo(-42, 86); ctx.closePath();
    ctx.fillStyle = "#f0d5a8"; ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = "#a97f4a"; ctx.stroke();
    // あみめ
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-62, 0); ctx.lineTo(62, 0); ctx.lineTo(42, 86); ctx.lineTo(-42, 86); ctx.closePath();
    ctx.clip();
    ctx.strokeStyle = "rgba(169,127,74,.45)"; ctx.lineWidth = 3;
    for (let i = -70; i < 70; i += 16) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 12, 90); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-i, 0); ctx.lineTo(-i - 12, 90); ctx.stroke();
    }
    for (let y = 16; y < 86; y += 22) {
      ctx.beginPath(); ctx.moveTo(-62, y); ctx.lineTo(62, y); ctx.stroke();
    }
    ctx.restore();
    // 入った 玉(かぞえちゅうは かぞえた ぶんだけ)
    const shown = E.state === "count" || E.state === "over" ? E.cnt[key] : E.score[key];
    const n = Math.min(shown, 24);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-62, 0); ctx.lineTo(62, 0); ctx.lineTo(42, 86); ctx.lineTo(-42, 86); ctx.closePath();
    ctx.clip();                                   // かごから はみ出さないように
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / 5), col = i % 5;
      drawBall(ctx, -36 + col * 18 + (row % 2) * 8, 34 + row * 12, 11, key);   // 口の すぐ下から つみあがる
    }
    ctx.restore();
    // 口の ふち
    ctx.beginPath(); ctx.ellipse(0, 0, 62, 13, 0, 0, 7);
    ctx.fillStyle = "#d9b382"; ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = "#a97f4a"; ctx.stroke();
    /* かごの 上に かずは 出さない。
       おなじ すうじが 上の チップにも 出ていて 2かしょに なるため。
       入った しゅんかんは「+1」の うきもじ、たまった かずは かごの 中の 玉で わかる。 */
    ctx.restore();
    ctx.textAlign = "left";
  }

  /* ============================================================
     3. ドッヂボール(左=あか内野・右=あお内野)
     ============================================================ */
  const DB_YMIN = 190, DB_YMAX = 640;
  const DB_LINE = 640;
  const DB_RED_X = [190, 545], DB_BLUE_X = [735, 1090];
  const DB_LSTRIP = 76, DB_RSTRIP = 1204;
  const DB_WIND = 0.5, DB_FLY = 0.5, DB_RESOLVE = 1.0, DB_INTRO = 1.2;

  const DODGEBALL = {
    init(M) {
      const per = Math.max(M.A.red.length, M.A.blue.length);
      const hBase = Util.clamp(152 - per * 7, 76, 150);
      for (const a of M.all) {
        a.zone = "inner"; a.outState = null; a.outT = 0; a.fall = 0;
        a.hBase = hBase; a.puppet.h = hBase;
        a.tx = 640; a.ty = 400; a.homeX = 640; a.homeY = 400;
        a.wander = Util.rand(0, 1); a.hopCd = Util.rand(0, 1);
      }
      M.E = {
        hBase, floats: [],
        ballTeam: Math.random() < 0.5 ? "red" : "blue",
        phase: "intro", phaseT: 0, matchT: 0,
        thrower: null, target: null, outcome: null,
        ballX: 640, ballY: 400, ballFromX: 640, ballFromY: 400, ballToX: 640, ballToY: 400,
        throwGap: 1.0,
      };
      dbLayout(M, "red", true);
      dbLayout(M, "blue", true);
      for (const a of M.all) { a.puppet.x = a.tx; a.puppet.y = a.ty; a.puppet.facing = dbFacing(a); }
      M.E.ballX = M.E.ballTeam === "red" ? DB_RED_X[1] : DB_BLUE_X[0];
      M.E.ballY = (DB_YMIN + DB_YMAX) / 2;
      dbHud(M);
      M.say(["🏐 ドッヂボール しあい かいし!"], "");
      M.ui.msg("しあい かいし!", 1200, "#ff922b");
      Sound.fanfare();
    },

    update(M, dt) {
      const E = M.E;
      stepFloats(M, dt);
      if (M.result) { dbMove(M, dt); return; }

      E.phaseT += dt;
      if (E.phase !== "intro") E.matchT += dt;

      if (E.phase === "intro") {
        if (E.phaseT >= DB_INTRO) dbStartThrow(M);
      } else if (E.phase === "wind") {
        if (E.phaseT >= DB_WIND) dbLaunch(M);
      } else if (E.phase === "fly") {
        if (E.phaseT >= DB_FLY) dbResolve(M);
      } else if (E.phase === "resolve") {
        if (E.phaseT >= DB_RESOLVE) {
          M.hush();
          if (dbCount(M, "red") === 0 || dbCount(M, "blue") === 0) { dbEnd(M); return; }
          const total = dbCount(M, "red") + dbCount(M, "blue");
          E.throwGap = Util.clamp(0.25 + total * 0.045, 0.3, 0.85);
          dbLayout(M, "red"); dbLayout(M, "blue");
          E.phase = "gap"; E.phaseT = 0;
        }
      } else if (E.phase === "gap") {
        if (E.phaseT >= E.throwGap) dbStartThrow(M);
      }

      // ボールの いち
      if (E.phase === "fly") {
        const s = Util.clamp(E.phaseT / DB_FLY, 0, 1);
        E.ballX = E.ballFromX + (E.ballToX - E.ballFromX) * s;
        E.ballY = E.ballFromY + (E.ballToY - E.ballFromY) * s - Math.sin(Math.PI * s) * 90;
      } else if (E.phase === "wind" && E.thrower) {
        const t = E.thrower;
        E.ballX += (t.puppet.x - E.ballX) * Math.min(1, dt * 10);
        E.ballY += ((t.puppet.y - t.puppet.h * 0.6) - E.ballY) * Math.min(1, dt * 10);
      } else {
        E.ballX += (E.ballToX - E.ballX) * Math.min(1, dt * 6);
        E.ballY += (E.ballToY - E.ballY) * Math.min(1, dt * 6);
      }

      dbMove(M, dt);
    },

    draw(M) { dbDraw(M); },
  };

  function dbInner(M, team) { return M.A[team].filter((a) => a.zone === "inner"); }
  function dbCount(M, team) { return dbInner(M, team).length; }
  function dbFacing(a) { return a.team === "red" ? 1 : -1; }
  function dbXB(team) { return team === "red" ? DB_RED_X : DB_BLUE_X; }

  function dbSetHome(a, x, y, snap) {
    a.homeX = x; a.homeY = y;
    if (a.outState !== "fall" && a.outState !== "up") { a.tx = x; a.ty = y; }
    if (snap) { a.puppet.x = x; a.puppet.y = y; }
  }

  function dbLayout(M, team, snap) {
    const inner = dbInner(M, team);
    const xb = dbXB(team);
    const N = inner.length;
    const cols = Math.min(N, N <= 4 ? 2 : 3) || 1;
    const rows = Math.ceil(N / cols);
    inner.forEach((a, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x = cols === 1 ? (xb[0] + xb[1]) / 2 : xb[0] + (xb[1] - xb[0]) * col / (cols - 1);
      const y = rows === 1 ? (DB_YMIN + DB_YMAX) / 2 : DB_YMIN + (DB_YMAX - DB_YMIN) * row / (rows - 1);
      dbSetHome(a, x, y, snap);
    });
    // アウトの子は じぶんの がわの はしに たて1れつ
    const gone = M.A[team].filter((a) => a.zone === "gone");
    const gx = team === "red" ? DB_LSTRIP : DB_RSTRIP;
    gone.forEach((a, i) => {
      const span = Math.max(1, gone.length - 1);
      const y = gone.length === 1 ? 410 : DB_YMIN + (DB_YMAX - DB_YMIN) * i / span;
      dbSetHome(a, gx, y, snap);
    });
  }

  function dbHud(M) {
    M.ui.hud({
      red:  `${MARK.red} ${M.names.red} のこり ${dbCount(M, "red")}にん`,
      blue: `${MARK.blue} ${M.names.blue} のこり ${dbCount(M, "blue")}にん`,
      mid:  "ドッヂボール",
      n:    { red: dbCount(M, "red"), blue: dbCount(M, "blue") },
      unit: { red: "にん", blue: "にん" },
    });
  }

  function dbStartThrow(M) {
    const E = M.E;
    const attackers = dbInner(M, E.ballTeam);
    const defTeam = OTHER[E.ballTeam];
    const defenders = dbInner(M, defTeam);
    if (!attackers.length || !defenders.length) { dbEnd(M); return; }

    const thrower = Util.choice(attackers);
    const target = Util.choice(defenders);
    let hit = 0.55, dodge = 0.30;
    if (defenders.length === 1) { hit = 0.34; dodge = 0.40; }        // さいごの1人は ねばる
    const rush = M.quick ? 45 : 95;
    if (E.matchT > rush) { hit = 0.82; dodge = 0.12; }               // ながびいたら 決着を いそぐ
    const roll = Math.random();
    E.outcome = roll < hit ? "hit" : roll < hit + dodge ? "dodge" : "catch";
    E.thrower = thrower; E.target = target;
    E.phase = "wind"; E.phaseT = 0;

    const dir = Math.sign(target.puppet.x - thrower.puppet.x) || 1;
    thrower.tx = Util.clamp(thrower.homeX + dir * 46, 46, CW - 46);
    thrower.ty = Util.clamp((thrower.homeY + target.puppet.y) / 2, DB_YMIN, DB_YMAX);
  }

  function dbLaunch(M) {
    const E = M.E, t = E.thrower, g = E.target;
    E.ballFromX = t.puppet.x; E.ballFromY = t.puppet.y - t.puppet.h * 0.6;
    E.ballToX = g.puppet.x;   E.ballToY = g.puppet.y - g.puppet.h * 0.5;
    E.phase = "fly"; E.phaseT = 0;
    Sound.beep(520, 0.16, "square", 0.10, 0, 220);
  }

  function dbResolve(M) {
    const E = M.E, t = E.thrower, g = E.target;
    if (E.outcome === "hit") {
      g.zone = "gone"; g.outState = "fall"; g.outT = 0; g.fall = 0;
      dbLayout(M, g.team);
      M.say([t, " が あてた! ", g, " アウト!"], g.team);
      Sound.bad();
      Sound.playVoice(g.voices, ["fail", "ouch"]);
    } else if (E.outcome === "catch") {
      g.puppet.hop();
      M.say([g, " ナイスキャッチ!"], g.team);
      Sound.pon(); Sound.good();
      Sound.playVoice(g.voices, ["joy"]);
    } else {
      g.ty = Util.clamp(g.homeY + (Math.random() < 0.5 ? -95 : 95), DB_YMIN, DB_YMAX);
      g.puppet.hop();
      M.say([g, " ひらり! よけた!"], g.team);
      Sound.beep(760, 0.18, "square", 0.10, 0, 320);
    }
    E.ballTeam = g.team;                       // つぎに なげるのは まもっていた チーム
    E.ballToX = g.puppet.x; E.ballToY = g.puppet.y - g.puppet.h * 0.5;
    dbHud(M);
    E.phase = "resolve"; E.phaseT = 0;
  }

  function dbMove(M, dt) {
    const E = M.E;
    for (const a of M.all) {
      const pu = a.puppet;
      const knocked = a.outState && a.outState !== "settled";
      if (knocked) {
        a.outT += dt;
        if (a.outState === "fall") {
          a.fall = Util.clamp(a.outT / 0.22, 0, 1);
          if (a.outT >= 0.6) { a.outState = "up"; a.outT = 0; }
        } else if (a.outState === "up") {
          a.fall = 1 - Util.clamp(a.outT / 0.3, 0, 1);
          if (a.outT >= 0.32) {
            a.outState = "leave"; a.outT = 0; a.fall = 0;
            pu.h = a.hBase * 0.6;
            a.tx = a.homeX; a.ty = a.homeY;
          }
        }
        if (a.outState === "fall" || a.outState === "up") { pu.walking = false; pu.update(dt); continue; }
      } else if (!M.result && a.zone === "inner" && a !== E.thrower && (E.phase === "gap" || E.phase === "intro")) {
        a.wander -= dt;
        if (a.wander <= 0) {
          a.wander = Util.rand(0.5, 1.3);
          const xb = dbXB(a.team);
          a.tx = Util.clamp(a.homeX + Util.rand(-35, 35), xb[0] - 6, xb[1] + 6);
          a.ty = Util.clamp(a.homeY + Util.rand(-40, 40), DB_YMIN, DB_YMAX);
        }
      }

      const dx = a.tx - pu.x, dy = a.ty - pu.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 3) {
        const sp = knocked ? 320 : (a === E.thrower ? 240 : 120);
        const step = Math.min(dist, sp * dt);
        pu.x += dx / dist * step; pu.y += dy / dist * step;
        pu.walking = true;
        if (Math.abs(dx) > 2) pu.facing = Math.sign(dx);
      } else {
        pu.walking = false;
        if (a.outState === "leave") a.outState = "settled";
        if (!knocked) pu.facing = dbFacing(a);
      }
      // かちが きまったら みんなで とびはねる
      if (M.result && a.zone === "inner") {
        a.hopCd -= dt;
        if (a.hopCd <= 0 && pu.jumpT <= 0) { pu.jumpT = 0.5; a.hopCd = Util.rand(0.1, 0.5); }
      }
      pu.update(dt);
    }
  }

  function dbEnd(M) {
    const E = M.E;
    const r = dbCount(M, "red"), b = dbCount(M, "blue");
    const win = r === b ? null : (r > b ? "red" : "blue");
    M.hush();
    if (win) {
      M.say([`🏐 ${MARK[win]} ${M.names[win]} の かち! のこり ${Math.max(r, b)}にん!`], win);
      Sound.fanfare();
      const withVoice = dbInner(M, win).filter((a) => a.voices);
      if (withVoice.length) Sound.playVoice(Util.choice(withVoice).voices, ["joy"]);
    } else {
      M.say(["🏐 ぜんいん アウト! ひきわけ!"], "");
      Sound.good();
    }
    E.phase = "over";
    M.finish({ win, score: { red: r, blue: b }, label: `のこり ${r}にん - ${b}にん` }, 2.4);
  }

  function dbDraw(M) {
    const ctx = M.ctx, E = M.E;
    ctx.clearRect(0, 0, CW, CH);
    ctx.fillStyle = "#fbf7ee"; ctx.fillRect(0, 0, CW, CH);
    ctx.fillStyle = "rgba(255,107,157,.12)"; ctx.fillRect(0, 0, DB_LINE, CH);
    ctx.fillStyle = "rgba(77,171,247,.12)";  ctx.fillRect(DB_LINE, 0, CW - DB_LINE, CH);
    const SW = 150;
    ctx.fillStyle = "rgba(150,130,110,.10)";
    ctx.fillRect(0, 0, SW, CH); ctx.fillRect(CW - SW, 0, SW, CH);
    ctx.save();
    ctx.setLineDash([26, 20]); ctx.lineWidth = 5; ctx.strokeStyle = "rgba(120,90,60,.35)";
    ctx.beginPath(); ctx.moveTo(DB_LINE, 30); ctx.lineTo(DB_LINE, CH - 30); ctx.stroke();
    ctx.restore();
    drawCurtain(ctx, 40);

    const order = M.all.slice().sort((a, b) => a.puppet.y - b.puppet.y);
    for (const a of order) {
      const pu = a.puppet;
      ctx.save();
      if (a.zone === "gone" && a.outState === "settled") ctx.globalAlpha = 0.45;
      if (!M.result && E.thrower === a && E.phase === "wind") {
        ctx.save();
        ctx.fillStyle = "rgba(255,212,59,.45)";
        ctx.beginPath(); ctx.arc(pu.x, pu.y - pu.h * 0.5, pu.h * 0.62, 0, 7); ctx.fill();
        ctx.restore();
      }
      if (a.fall > 0) {
        const dir = a.team === "red" ? -1 : 1;
        ctx.save();
        ctx.translate(pu.x, pu.y);
        ctx.rotate(a.fall * 1.45 * dir);
        ctx.translate(-pu.x, -pu.y);
        pu.draw(ctx);
        ctx.restore();
      } else {
        pu.draw(ctx);
      }
      ctx.font = "bold 20px sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = COLD[a.team];
      ctx.fillText(a.name, pu.x, pu.y + 22);
      ctx.restore();
    }

    if (E.phase !== "over") {
      const r = (E.phase === "fly" ? 30 : 25) * (0.42 + 0.58 * Math.min(1, E.hBase / 120));
      drawBall(ctx, E.ballX, E.ballY, r, "");
    }
    drawFloats(M);
    ctx.textAlign = "left";
  }

  /* ============================================================
     4. リレー(トラックがた・1しゅうずつ バトンタッチ)
     ============================================================ */
  const RL_CY = 388, RL_R = 215;
  const RL_X1 = 400, RL_X2 = 880;
  const RL_STR = RL_X2 - RL_X1;
  const RL_CURVE = Math.PI * RL_R;
  const RL_LAP = 2 * RL_STR + 2 * RL_CURVE;
  const RL_LINEX = 560;
  const RL_S0 = RL_LINEX - RL_X1;
  const RL_HTRK = 52;
  const RL_LANE = { red: -28, blue: 28 };
  const RL_EMO = { drop: "💦", stumble: "💫", slow: "🐢", boost: "💨" };

  function rlPos(t, off) {
    let s = (RL_S0 + (((t % 1) + 1) % 1) * RL_LAP) % RL_LAP;
    if (s < RL_STR) return { x: RL_X1 + s, y: RL_CY + RL_R + off };                 // 下の直線(→)
    s -= RL_STR;
    if (s < RL_CURVE) {                                                             // 右カーブ(↑)
      const a = Math.PI / 2 - (s / RL_CURVE) * Math.PI;
      return { x: RL_X2 + (RL_R + off) * Math.cos(a), y: RL_CY + (RL_R + off) * Math.sin(a) };
    }
    s -= RL_CURVE;
    if (s < RL_STR) return { x: RL_X2 - s, y: RL_CY - RL_R - off };                 // 上の直線(←)
    s -= RL_STR;
    const a = Math.PI * 1.5 - (s / RL_CURVE) * Math.PI;                             // 左カーブ(↓)
    return { x: RL_X1 + (RL_R + off) * Math.cos(a), y: RL_CY + (RL_R + off) * Math.sin(a) };
  }
  function rlDepth(y) { return 0.72 + 0.28 * Util.clamp((y - 140) / (660 - 140), 0, 1); }

  const RELAY = {
    init(M) {
      const per = Math.max(M.A.red.length, M.A.blue.length);
      const hBase = Util.clamp(148 - per * 5, 96, 138);
      const T = {};
      for (const key of ["red", "blue"]) {
        for (const a of M.A[key]) {
          a.puppet.h = hBase; a.hBase = hBase;
          a.state = "idle"; a.tx = 640; a.ty = 470; a.fall = 0;
          a.wob = Util.rand(0, 9); a.prevX = 0;
          a.spd = Util.rand(300, 380);
          a.hopCd = Util.rand(1.5, 4);
        }
        T[key] = {
          key, off: RL_LANE[key], members: M.A[key],
          leg: 0, pathP: 0, runT: 0, slots: [],
          ev: null, calledNext: false,
          done: false, finT: 0, rank: 0,
          baton: { state: "held" },
        };
      }
      const crowd = [];
      for (let i = 0, x = 76; x < 1210; i++, x += 44) {
        crowd.push({ x: x + (i % 2) * 10, y: i % 2 ? 92 : 50,
                     r: Util.rand(13, 17), ph: Util.rand(0, 9),
                     col: Util.choice(["#ff8fab", "#74c0fc", "#8ce99a", "#ffd43b", "#b197fc", "#ffa94d"]) });
      }
      M.E = {
        T, LEGS: per, hBase, crowd, floats: [],
        phase: "count", stateT: 0, raceT: 0, countStep: 0,
        evCd: 0, finished: 0, winTeam: null, winWait: 0,
        leader: null, pendLeader: null, pendT: 0,
      };

      for (const key of ["red", "blue"]) rlBench(M, T[key], true);
      for (const key of ["red", "blue"]) {
        const t = T[key];
        const first = t.members[0];
        const p = rlPos(0, t.off);
        first.state = "run";
        first.puppet.x = first.prevX = p.x; first.puppet.y = p.y;
        first.puppet.facing = 1;
        rlStartLeg(M, t);
      }
      rlHud(M);
      M.say(["🏃 リレー! いちについて…"], "");
    },

    update(M, dt) {
      const E = M.E;
      stepFloats(M, dt);
      E.stateT += dt;

      if (M.result) {
        for (const a of M.all) {
          a.hopCd -= dt;
          if (a.hopCd <= 0 && a.puppet.jumpT <= 0) { a.puppet.jumpT = 0.5; a.hopCd = Util.rand(0.1, 0.5); }
          a.puppet.walking = false;
          a.puppet.update(dt);
        }
        return;
      }

      if (E.phase === "count") {
        const steps = [[0.1, "いちに ついて…", "#4a3f35"], [1.3, "よーい…", "#4dabf7"], [2.4, "どん!", "#ff6b9d"]];
        while (E.countStep < steps.length && E.stateT >= steps[E.countStep][0]) {
          const [, msg, col] = steps[E.countStep];
          M.ui.msg(msg, E.countStep === 2 ? 900 : 1100, col);
          if (E.countStep === 1) Sound.tick();
          if (E.countStep === 2) { Sound.pon(); E.phase = "run"; }
          E.countStep++;
        }
      } else if (E.phase === "run") {
        E.raceT += dt;
        E.evCd -= dt;
        rlStep(M, E.T.red, dt);
        rlStep(M, E.T.blue, dt);
        rlLeadWatch(M, dt);
        if (E.winTeam) {
          E.winWait += dt;
          const bothDone = E.T.red.done && E.T.blue.done;
          if (bothDone || E.winWait > 5) {
            for (const key of ["red", "blue"]) {
              const t = E.T[key];
              if (!t.done) {
                t.done = true; t.rank = ++E.finished;
                const c = rlRunner(t);
                c.state = "idle"; c.fall = 0; c.tx = c.spotX; c.ty = c.spotY;
              }
            }
            rlHud(M);
            rlEnd(M);
          }
        }
      }

      // はしってない子:ベンチで あるく・とびはねる
      for (const a of M.all) {
        const pu = a.puppet;
        if (a.state !== "run") {
          const dx = a.tx - pu.x, dy = a.ty - pu.y;
          const d = Math.hypot(dx, dy);
          if (d > 4) {
            const step = Math.min(d, 175 * dt);
            pu.x += dx / d * step; pu.y += dy / d * step;
            pu.walking = true;
            if (Math.abs(dx) > 2) pu.facing = Math.sign(dx);
          } else {
            pu.walking = false;
            const t = M.E.T[a.team];
            if (!t.done) {
              const run = rlRunner(t);
              if (run !== a) pu.facing = Math.sign(run.puppet.x - pu.x) || pu.facing;
            }
            a.hopCd -= dt;
            if (a.hopCd <= 0) {
              if (E.phase === "run" && pu.jumpT <= 0) pu.jumpT = 0.45;
              a.hopCd = Util.rand(2.2, 5.5);
            }
          }
        }
        pu.h = a.hBase * rlDepth(pu.y);
        pu.update(dt);
      }
    },

    draw(M) { rlDraw(M); },
  };

  function rlBench(M, t, snap) {
    t.members.forEach((a, i) => {
      const row = Math.floor(i / 5), col = i % 5;
      const y = 468 + row * 54;
      const x = t.key === "red" ? 320 + col * 55 : 960 - col * 55;
      a.spotX = x; a.spotY = y;
      if (a.state !== "run") { a.tx = x; a.ty = y; }
      if (snap) { a.puppet.x = x; a.puppet.y = y; a.puppet.facing = t.key === "red" ? 1 : -1; }
    });
  }
  function rlRunner(t) { return t.members[t.leg % t.members.length]; }
  function rlOther(M, t) { return M.E.T[OTHER[t.key]]; }
  function rlProg(M, t) { return t.done ? M.E.LEGS : t.leg + t.pathP; }

  function rlStartLeg(M, t) {
    t.pathP = Math.max(0, t.pathP - 1);
    t.runT = 0;
    t.calledNext = false;
    t.ev = null;
    const lastLeg = t.leg === M.E.LEGS - 1;
    t.slots = lastLeg
      ? (Math.random() < 0.75 ? [Util.rand(0.15, 0.4)] : [])
      : [Util.rand(0.15, 0.45)].concat(Math.random() < 0.55 ? [Util.rand(0.52, 0.8)] : []);
    t.slots.sort((a, b) => a - b);
  }

  function rlHud(M) {
    const E = M.E;
    const state = (t) => (t.done ? `ゴール! ${t.rank}い` : `${Math.min(t.leg + 1, E.LEGS)}/${E.LEGS}にんめ`);
    const num  = (t) => (t.done ? t.rank : Math.min(t.leg + 1, E.LEGS));
    const unit = (t) => (t.done ? "い" : "にんめ");
    M.ui.hud({
      red:  `${MARK.red} ${M.names.red} ${state(E.T.red)}`,
      blue: `${MARK.blue} ${M.names.blue} ${state(E.T.blue)}`,
      mid:  M._lead || "リレー",
      n:    { red: num(E.T.red), blue: num(E.T.blue) },
      unit: { red: unit(E.T.red), blue: unit(E.T.blue) },
    });
  }

  function rlPickEvent(M, t) {
    const lead = rlProg(M, t) - rlProg(M, rlOther(M, t));
    let w;
    if (lead > 0.1)       w = { drop: 0.34, stumble: 0.30, slow: 0.26, boost: 0.10 };
    else if (lead < -0.1) w = { drop: 0.14, stumble: 0.14, slow: 0.12, boost: 0.60 };
    else                  w = { drop: 0.24, stumble: 0.24, slow: 0.20, boost: 0.32 };
    let roll = Math.random() * (w.drop + w.stumble + w.slow + w.boost);
    for (const k of ["drop", "stumble", "slow", "boost"]) {
      if (roll < w[k]) return k;
      roll -= w[k];
    }
    return "boost";
  }

  function rlStartEvent(M, t) {
    const c = rlRunner(t);
    const type = rlPickEvent(M, t);
    M.E.evCd = 1.3;

    if (type === "drop") {
      const fwd = Math.random() < 0.75;
      const dp = fwd ? Util.rand(0.018, 0.032) : -Util.rand(0.010, 0.020);
      const batonP = Util.clamp(t.pathP + dp, 0.02, 0.95);
      const from = rlPos(t.pathP, t.off);
      const to = rlPos(batonP, t.off);
      t.ev = { type, phase: "shock", t: 0, batonP, emo: "💦" };
      t.baton = { state: "fly", t: 0, dur: 0.5,
                  fx: from.x + c.puppet.facing * 14, fy: from.y - c.puppet.h * 0.42,
                  tx: to.x, ty: to.y - 4 };
      c.puppet.hop();
      Sound.bad();
      Sound.playVoice(c.voices, ["ouch"]);
      M.say(["たいへん! ", c, " バトンを おとした!"], t.key);
    } else if (type === "stumble") {
      t.ev = { type, phase: "fall", t: 0, emo: "💫" };
      Sound.beep(150, 0.2, "square", 0.14);
      Sound.beep(110, 0.25, "sawtooth", 0.10, 0.08);
      Sound.playVoice(c.voices, ["ouch"]);
      M.say([c, " ころんじゃった! がんばれ!"], t.key);
    } else if (type === "slow") {
      t.ev = { type, t: 0, dur: Util.rand(1.3, 2.1), emo: "🐢" };
      Sound.beep(340, 0.5, "sine", 0.06, 0, -150);
      M.say([c, " ちょっと マイペース…"], t.key);
    } else {
      t.ev = { type: "boost", t: 0, dur: Util.rand(0.9, 1.5), emo: "💨" };
      Sound.beep(440, 0.16, "square", 0.08, 0, 260);
      M.say([c, " ものすごい スピード!"], t.key);
    }
  }

  /* おくれてる チームが はやくなる せっせん ほせい */
  function rlRubber(M, t) {
    const gap = rlProg(M, rlOther(M, t)) - rlProg(M, t);
    const race01 = Math.max(rlProg(M, t), rlProg(M, rlOther(M, t))) / M.E.LEGS;
    let k = 0.6 * (1 - 0.7 * race01);
    if (t.leg === M.E.LEGS - 1 && t.pathP > 0.78) k *= Math.max(0, 1 - (t.pathP - 0.78) / 0.22);
    if (gap > 0) return 1 + Math.min(1.1, gap * 2.6) * k;
    return 1 + Math.max(-0.5, gap * 2.6) * k * 0.45;
  }

  function rlStep(M, t, dt) {
    if (t.done) return;
    const c = rlRunner(t);
    t.runT += dt;
    c.wob += dt;

    let v = c.spd * (1 + 0.12 * Math.sin(c.wob * 1.9) + 0.08 * Math.sin(c.wob * 4.3 + 1));
    v *= rlRubber(M, t);
    v *= Math.min(1, t.runT / 0.5);

    let dp = 0;
    const ev = t.ev;
    if (ev) {
      ev.t += dt;
      if (ev.type === "slow") {
        dp = v * 0.42 * dt / RL_LAP;
        if (ev.t >= ev.dur) t.ev = null;
      } else if (ev.type === "boost") {
        dp = v * 1.85 * dt / RL_LAP;
        if (ev.t >= ev.dur) t.ev = null;
      } else if (ev.type === "stumble") {
        if (ev.phase === "fall") {
          c.fall = Util.clamp(ev.t / 0.3, 0, 1);
          if (ev.t >= 0.62) { ev.phase = "up"; ev.t = 0; }
        } else {
          c.fall = 1 - Util.clamp(ev.t / 0.35, 0, 1);
          if (ev.t >= 0.38) {
            c.fall = 0;
            t.ev = { type: "boost", t: 0, dur: 1.0, emo: "💨" };   // なきの ダッシュ
          }
        }
      } else if (ev.type === "drop") {
        const b = t.baton;
        if (b.state === "fly") {
          b.t += dt;
          if (b.t >= b.dur) { b.state = "ground"; b.t = 0; }
        }
        if (ev.phase === "shock") {
          if (ev.t >= 0.42) ev.phase = "goto";
        } else if (ev.phase === "goto") {
          const dir = Math.sign(ev.batonP - t.pathP) || 1;
          const step = 250 * dt / RL_LAP;
          if (Math.abs(ev.batonP - t.pathP) <= step) { t.pathP = ev.batonP; ev.phase = "pick"; ev.t = 0; }
          else dp = dir * step;
        } else if (ev.phase === "pick") {
          if (ev.t >= 0.4) {
            t.baton = { state: "held" };
            t.ev = { type: "boost", t: 0, dur: 0.9, emo: "💨" };
          }
        }
      }
    } else {
      dp = v * dt / RL_LAP;
      while (t.slots.length && t.pathP > t.slots[0]) {
        t.slots.shift();
        if (!t.ev && M.E.evCd <= 0 && t.pathP < 0.85 && !M.E.winTeam) { rlStartEvent(M, t); break; }
      }
    }

    t.pathP += dp;

    // つぎの子は ラインの てまえまで あるいて いく
    if (!t.calledNext && t.pathP > 0.52 && t.leg + 1 < M.E.LEGS) {
      t.calledNext = true;
      const nx = t.members[(t.leg + 1) % t.members.length];
      if (nx.state !== "run") {
        const p = rlPos(0, t.off);
        nx.tx = p.x - 34; nx.ty = p.y;
      }
    }

    if (t.pathP >= 1) { rlHandoff(M, t); return; }

    const p = rlPos(t.pathP, t.off);
    const pu = c.puppet;
    const dx = p.x - c.prevX;
    if (Math.abs(dx) > 0.6) pu.facing = Math.sign(dx);
    c.prevX = p.x;
    pu.x = p.x; pu.y = p.y;
    pu.walking = !(ev && (ev.type === "stumble" || (ev.type === "drop" && ev.phase !== "goto")));
  }

  function rlHandoff(M, t) {
    const E = M.E;
    const c = rlRunner(t);
    t.leg++;
    const linePos = rlPos(0, t.off);

    if (t.leg >= E.LEGS) {                 // アンカーが ゴール!
      t.done = true;
      t.rank = ++E.finished;
      t.finT = E.raceT;
      t.baton = { state: "held" };
      c.state = "idle"; c.fall = 0; c.tx = c.spotX; c.ty = c.spotY;
      if (t.rank === 1) {
        E.winTeam = t;
        E.winWait = 0;
        addFloat(M, linePos.x, linePos.y - 130, "ゴール!!", COL[t.key], true);
        M.say([`🏁 ${MARK[t.key]} ${M.names[t.key]} ゴール!!`], t.key);
        Sound.good(); Sound.pon();
        rlCheer(t);
      } else {
        addFloat(M, linePos.x, linePos.y - 110, "ゴール!", COL[t.key], false);
        M.say([`${MARK[t.key]} ${M.names[t.key]} も ゴール!`], t.key);
        Sound.good();
      }
      rlHud(M);
      return;
    }

    Sound.pon();
    addFloat(M, linePos.x, linePos.y - 100, "タッチ!", "#fff", false);
    c.state = "idle"; c.fall = 0; c.tx = c.spotX; c.ty = c.spotY;
    const nx = t.members[t.leg % t.members.length];
    nx.state = "run";
    nx.prevX = nx.puppet.x;
    rlStartLeg(M, t);
    if (t.leg === E.LEGS - 1) M.say(["さいごは アンカー ", nx, "!"], t.key);
    else M.say([c, " → ", nx, " バトンタッチ!"], t.key);
    rlHud(M);
  }

  function rlCheer(t) {
    for (const a of t.members) if (a.state !== "run") a.hopCd = Util.rand(0, 0.3);
  }

  function rlLeadWatch(M, dt) {
    const E = M.E;
    const r = rlProg(M, E.T.red), b = rlProg(M, E.T.blue);
    const diff = r - b;
    const lead = E.winTeam ? "リレー"
      : Math.abs(diff) < 0.05 ? "せっせん!"
      : diff > 0 ? `${M.names.red}が リード!` : `${M.names.blue}が リード!`;
    if (lead !== M._lead) { M._lead = lead; rlHud(M); }

    if (Math.abs(diff) < 0.015 || E.winTeam) return;
    const cur2 = diff > 0 ? "red" : "blue";
    if (cur2 === E.leader) { E.pendLeader = null; return; }
    if (E.pendLeader !== cur2) { E.pendLeader = cur2; E.pendT = 0; return; }
    E.pendT += dt;
    if (E.pendT < 0.45) return;
    const firstTime = E.leader === null;
    E.leader = cur2;
    E.pendLeader = null;
    if (!firstTime && E.raceT > 2.5) {
      M.say([`🔥 ぎゃくてん! ${MARK[cur2]} ${M.names[cur2]} が まえに でた!`], cur2);
      Sound.good();
      rlCheer(E.T[cur2]);
    }
  }

  function rlEnd(M) {
    const E = M.E;
    const win = E.winTeam ? E.winTeam.key : null;
    E.phase = "over";
    M.hush();
    if (win) {
      M.say([`🏃 ${MARK[win]} ${M.names[win]} の かち!`], win);
      Sound.fanfare();
      const withVoice = E.T[win].members.filter((a) => a.voices);
      if (withVoice.length) Sound.playVoice(Util.choice(withVoice).voices, ["joy"]);
    }
    const sec = (t) => Math.round(t.finT * 10) / 10;
    M.finish({
      win,
      score: { red: E.T.red.rank === 1 ? 1 : 0, blue: E.T.blue.rank === 1 ? 1 : 0 },
      label: `${sec(E.T.red)}びょう - ${sec(E.T.blue)}びょう`,
    }, 2.4);
  }

  function rlStadium(ctx, r) {
    ctx.beginPath();
    ctx.arc(RL_X1, RL_CY, r, Math.PI / 2, Math.PI * 1.5);
    ctx.arc(RL_X2, RL_CY, r, -Math.PI / 2, Math.PI / 2);
    ctx.closePath();
  }

  function rlFlower(ctx, x, y) {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.fillStyle = "#f783ac";
      ctx.beginPath(); ctx.arc(x + Math.cos(a) * 9, y + Math.sin(a) * 9, 7, 0, 7); ctx.fill();
    }
    ctx.fillStyle = "#fff59d";
    ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.fill();
  }

  function rlBaton(ctx, x, y, ang, key) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.fillStyle = COLD[key];
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-19, -6, 38, 12, 6) : ctx.rect(-19, -6, 38, 12);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillRect(-5, -6, 10, 12);
    ctx.lineWidth = 2; ctx.strokeStyle = "rgba(74,63,53,.55)";
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-19, -6, 38, 12, 6) : ctx.rect(-19, -6, 38, 12);
    ctx.stroke();
    ctx.restore();
  }

  function rlDraw(M) {
    const ctx = M.ctx, E = M.E;
    ctx.clearRect(0, 0, CW, CH);
    // そら と かんきゃくせき
    const sky = ctx.createLinearGradient(0, 0, 0, 130);
    sky.addColorStop(0, "#a5d8ff"); sky.addColorStop(1, "#d3ecff");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, CW, 130);
    ctx.fillStyle = "#f7e6c8"; ctx.fillRect(0, 16, CW, 102);
    ctx.fillStyle = "rgba(150,110,70,.16)"; ctx.fillRect(0, 112, CW, 6);
    const amp = E.winTeam ? 5 : 2.6;
    for (const s of E.crowd) {
      const bob = Math.abs(Math.sin(M.t * 3 + s.ph)) * amp;
      ctx.fillStyle = s.col;
      ctx.beginPath(); ctx.arc(s.x, s.y - bob, s.r, 0, 7); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.5)";
      ctx.beginPath(); ctx.arc(s.x - s.r * 0.3, s.y - bob - s.r * 0.3, s.r * 0.3, 0, 7); ctx.fill();
    }

    // しばふ と トラック
    ctx.fillStyle = "#a9dd7e"; ctx.fillRect(0, 118, CW, CH - 118);
    rlStadium(ctx, RL_R + RL_HTRK); ctx.fillStyle = "#e8a86c"; ctx.fill();
    rlStadium(ctx, RL_R - RL_HTRK); ctx.fillStyle = "#96d06c"; ctx.fill();
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 4;
    rlStadium(ctx, RL_R + RL_HTRK); ctx.stroke();
    rlStadium(ctx, RL_R - RL_HTRK); ctx.stroke();
    ctx.setLineDash([22, 18]); ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = 3;
    rlStadium(ctx, RL_R); ctx.stroke();
    ctx.restore();

    // スタート/ゴールライン
    const gy0 = RL_CY + RL_R - RL_HTRK, gy1 = RL_CY + RL_R + RL_HTRK;
    const cellH = (gy1 - gy0) / 8;
    for (let k = 0; k < 8; k++) {
      for (let c2 = 0; c2 < 2; c2++) {
        ctx.fillStyle = (k + c2) % 2 ? "#4a3f35" : "#fff";
        ctx.fillRect(RL_LINEX - 10 + c2 * 10, gy0 + cellH * k, 10, cellH + 0.5);
      }
    }
    ctx.font = "26px serif"; ctx.textAlign = "center";
    ctx.fillText("🏁", RL_LINEX, gy0 - 10);

    rlFlower(ctx, 470, 330); rlFlower(ctx, 640, 300); rlFlower(ctx, 810, 330);
    rlFlower(ctx, 415, 400); rlFlower(ctx, 865, 400);

    // じめんに おちた バトン
    for (const key of ["red", "blue"]) {
      const t = E.T[key], b = t.baton;
      if (b.state === "ground") {
        const p = rlPos(t.ev ? t.ev.batonP : t.pathP, t.off);
        const bounce = b.t < 0.3 ? Math.abs(Math.sin((b.t / 0.3) * Math.PI)) * 10 : 0;
        b.t += 0.016;
        rlBaton(ctx, p.x, p.y - 5 - bounce, 0.35, key);
      }
    }

    // キャラ
    const order = M.all.slice().sort((a, b) => a.puppet.y - b.puppet.y);
    for (const a of order) rlDrawRunner(M, a);

    // とんでる バトン
    for (const key of ["red", "blue"]) {
      const b = E.T[key].baton;
      if (b.state === "fly") {
        const s = Util.clamp(b.t / b.dur, 0, 1);
        const x = b.fx + (b.tx - b.fx) * s;
        const y = b.fy + (b.ty - b.fy) * s - Math.sin(Math.PI * s) * 62;
        rlBaton(ctx, x, y, b.t * 12, key);
      }
    }

    drawFloats(M);
    ctx.textAlign = "left";
  }

  function rlDrawRunner(M, a) {
    const ctx = M.ctx;
    const pu = a.puppet;
    const t = M.E.T[a.team];
    const running = a.state === "run" && !t.done;
    ctx.save();

    if (running && t.ev && t.ev.type === "boost") {
      ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 3; ctx.lineCap = "round";
      for (let k = 0; k < 3; k++) {
        const ly = pu.y - pu.h * (0.3 + k * 0.18);
        ctx.beginPath();
        ctx.moveTo(pu.x - pu.facing * (pu.h * 0.45 + k * 8), ly);
        ctx.lineTo(pu.x - pu.facing * (pu.h * 0.72 + k * 8), ly);
        ctx.stroke();
      }
    }

    if (a.fall > 0) {
      ctx.save();
      ctx.translate(pu.x, pu.y);
      ctx.rotate(a.fall * 1.4 * pu.facing);
      ctx.translate(-pu.x, -pu.y);
      pu.draw(ctx);
      ctx.restore();
    } else {
      pu.draw(ctx);
    }

    if (running && t.baton.state === "held" && a.fall === 0) {
      const waggle = Math.sin(pu.phase * 1.1) * 0.18;
      rlBaton(ctx, pu.x + pu.facing * pu.h * 0.17, pu.y - pu.h * 0.42, -0.55 * pu.facing + waggle, a.team);
    }

    if (running && t.ev && t.ev.emo) {
      ctx.font = "36px serif"; ctx.textAlign = "center";
      ctx.fillText(t.ev.emo, pu.x, pu.y - pu.h - 14);
    }

    ctx.font = `bold ${running ? 20 : 15}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillStyle = COLD[a.team];
    ctx.fillText(a.name, pu.x, pu.y + (running ? 22 : 18));
    ctx.restore();
  }

  /* ============================================================
     おいわい画面(勝ったチームが とびはねる)
     ============================================================ */
  function placeRow(list, cy, h, maxCols) {
    const n = list.length;
    if (!n) return;
    const cols = Math.min(maxCols, n);
    list.forEach((a, i) => {
      const row = Math.floor(i / cols);
      const inRow = Math.min(cols, n - row * cols);
      const idx = i - row * cols;
      const gap = inRow > 1 ? Math.min(200, 1120 / (inRow - 1)) : 0;
      a.puppet.h = h;
      a.puppet.x = 640 - gap * (inRow - 1) / 2 + idx * gap;
      a.puppet.y = cy + row * (h * 0.95 + 12);
      a.puppet.facing = 1;
      a.puppet.jumpT = 0;
      a.fall = 0;
      a.hopCd = Util.rand(0, 0.5);
    });
  }

  /* opts: {cv, members, teamKey, trophy}
     members は「がめんに 出す 人 ぜんぶ」。teamKey が かった チーム。
     かった チームは とびはねる。まけた チームは くらくせず、
     その場で からだを ゆらして はくしゅ(まけた子の えも ちゃんと 見せる)。
     teamKey が null(どうてん)なら みんな とびはねる。 */
  function celebrate(opts) {
    stop();
    const cv = opts.cv;
    const ctx = cv.getContext("2d");
    const list = opts.members.slice();
    const rows = list.length > 6 ? 2 : 1;
    // うえには カードが かさなるので、みんなは 下のほうに 大きく ならべる
    const h = rows > 1 ? Util.clamp(240 - list.length * 8, 96, 168)
                       : Util.clamp(300 - list.length * 20, 140, 240);
    placeRow(list, rows > 1 ? 360 : 520, h, Math.ceil(list.length / rows));

    const token = {};
    cur = token;
    let last = performance.now();
    (function loop(now) {
      if (cur !== token) return;
      const dt = Math.min(0.04, (now - last) / 1000); last = now;
      for (const a of list) {
        a.puppet.walking = false;
        if (!opts.teamKey || a.team === opts.teamKey) {
          a.hopCd -= dt;
          if (a.hopCd <= 0 && a.puppet.jumpT <= 0) { a.puppet.jumpT = 0.5; a.hopCd = Util.rand(0.05, 0.35); }
        } else {
          // はくしゅ:とばずに、からだを ゆらす
          a.puppet.jumpT = 0;
          a.puppet.roll = Math.sin(a.puppet.t * 7) * 0.11;
        }
        a.puppet.update(dt);
      }
      const g = ctx.createLinearGradient(0, 0, 0, CH);
      g.addColorStop(0, opts.teamKey === "red" ? "#ffe3ee" : opts.teamKey === "blue" ? "#e3f0ff" : "#fff3d6");
      g.addColorStop(1, "#fffdf5");
      ctx.fillStyle = g; ctx.fillRect(0, 0, CW, CH);
      drawCurtain(ctx, 46);
      // トロフィー(みんなの うしろ・ひかりごしに)
      const glow = ctx.createRadialGradient(640, 420, 20, 640, 420, 250);
      glow.addColorStop(0, "rgba(255,212,59,.55)");
      glow.addColorStop(1, "rgba(255,212,59,0)");
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(640, 420, 250, 0, 7); ctx.fill();
      ctx.font = "130px serif"; ctx.textAlign = "center";
      ctx.fillText("🏆", 640, 470);
      const order = list.slice().sort((a, b) => a.puppet.y - b.puppet.y);
      for (const a of order) {
        a.puppet.draw(ctx);
        ctx.textAlign = "center";
        // まけた チームには はくしゅを つける(くらくする かわりに、うごきで ちがいを 出す)
        if (opts.teamKey && a.team !== opts.teamKey) {
          ctx.font = `${Math.round(a.puppet.h * 0.34)}px serif`;
          ctx.fillText("👏", a.puppet.x, a.puppet.y - a.puppet.h - 6);
        }
        ctx.font = "bold 24px sans-serif";
        ctx.fillStyle = COLD[a.team];
        ctx.fillText(a.name, a.puppet.x, a.puppet.y + 26);
      }
      ctx.textAlign = "left";
      rafId = requestAnimationFrame(loop);
    })(last);
  }

  const ENGINES = { kakekko: KAKEKKO, tamaire: TAMAIRE, dodgeball: DODGEBALL, relay: RELAY };

  return { actors, ui, run, stop, celebrate, drumroll, nameNode, MARK, COL, COLD };
})();
