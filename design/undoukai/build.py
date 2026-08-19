# うんどうかい UI ていあん の artboard を くみたてる
import os

HEAD = """<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;700;800&amp;display=swap">
  <style>
    body {
      margin: 0;
      font-family: "Hiragino Maru Gothic ProN", "BIZ UDPGothic", "M PLUS Rounded 1c", "Yu Gothic", "Meiryo", system-ui, sans-serif;
      color: #4a3f35;
      background: #fffdf5;
    }
    a { color: #d6336c; }
    a:hover { color: #b02a54; }
    .cap { font-size: 15px; line-height: 1.65; color: #6a5c4c; }
    .tag {
      display: inline-block; font-size: 13px; font-weight: 800; letter-spacing: .04em;
      border-radius: 999px; padding: 3px 12px;
    }
    .bad { background: #ffe3ee; color: #c92a5f; }
    .good { background: #e6f7e9; color: #2f9e44; }
__EXTRA__
  </style>
</helmet>
"""

TAIL = """</x-dc>
<script data-dc-script data-props='__PROPS__'>
class Component extends DCLogic {
  renderVals() {
__VALS__
  }
}
</script>
</body>
</html>
"""

def page(extra_css, body, props='{"$preview":{"width":1280,"height":880}}', vals="    return {};"):
    return HEAD.replace("__EXTRA__", extra_css) + body + TAIL.replace("__PROPS__", props).replace("__VALS__", vals)

# ---------------------------------------------------------------
# ステージ(たまいれ)。いろ・ざひょうは js/meet.js の tmDraw そのまま
# ---------------------------------------------------------------
def figure(x, feet, team, name, dim_class=""):
    skin = "#ffd9b8"
    line = "#e8590c" if team == "red" else "#1c7ed6"
    shirt = "#ffc9de" if team == "red" else "#a5d8ff"
    nmcol = "#d6336c" if team == "red" else "#1c7ed6"
    cls = (' class="' + dim_class + '"') if dim_class else ""
    return f"""
    <div{cls} style="position:absolute;left:{x-35}px;top:{feet-110}px;width:70px">
      <svg width="70" height="110" viewBox="0 0 70 110">
        <g stroke="{line}" stroke-width="4" stroke-linecap="round" fill="none">
          <circle cx="35" cy="24" r="18" fill="{skin}"></circle>
          <circle cx="35" cy="64" r="19" fill="{shirt}"></circle>
          <path d="M17 56 L4 40 M53 56 L66 44"></path>
          <path d="M27 82 L23 106 M43 82 L47 106"></path>
        </g>
        <circle cx="29" cy="22" r="2.6" fill="#4a3f35"></circle>
        <circle cx="41" cy="22" r="2.6" fill="#4a3f35"></circle>
        <path d="M30 31 Q35 36 40 31" stroke="#4a3f35" stroke-width="2.4" fill="none" stroke-linecap="round"></path>
      </svg>
      <div style="position:absolute;left:-30px;top:112px;width:130px;text-align:center;font:800 19px sans-serif;color:{nmcol}">{name}</div>
    </div>"""

def basket(team):
    x = 320 if team == "red" else 960
    return f"""
    <svg width="140" height="310" viewBox="0 0 140 310" style="position:absolute;left:{x-70}px;top:236px">
      <rect x="62" y="0" width="16" height="292" fill="#c9a227"></rect>
      <ellipse cx="70" cy="296" rx="40" ry="12" fill="#a97f4a"></ellipse>
      <ellipse cx="70" cy="290" rx="40" ry="12" fill="#c9a06a"></ellipse>
      <path d="M8 0 H132 L112 86 H28 Z" fill="#f0d5a8" stroke="#a97f4a" stroke-width="5"></path>
      <path d="M20 30 H120 M26 58 H114" stroke="#a97f4a" stroke-width="3" opacity=".6"></path>
    </svg>"""

def ball(x, y, r, team):
    c = ("#ffd8e6,#ff6b9d 45%,#c92a5f" if team == "red" else "#d5ecff,#4dabf7 45%,#1864ab")
    return (f'<div style="position:absolute;left:{x-r}px;top:{y-r}px;width:{2*r}px;height:{2*r}px;'
            f'border-radius:50%;border:2px solid #fff;background:radial-gradient(circle at 34% 32%,{c})"></div>')

REDS  = [(170, 520, "はなちゃん"), (330, 566, "たろう"), (470, 492, "みーくん")]
BLUES = [(790, 500, "さくら"), (960, 574, "けんと"), (1120, 528, "ゆい")]
LITTER = [(120,612,11,"red"),(250,596,10,"red"),(420,624,12,"red"),(540,588,9,"red"),
          (760,608,10,"blue"),(880,628,12,"blue"),(1040,592,9,"blue"),(1180,616,11,"blue")]

def stage(act=False, glow=False):
    """act=True で 勝った側は跳ね、負けた側は拍手する。glow=True でお祝いの光を敷く。
       どちらも暗くしたりぼかしたりはしない(明るいまま)。"""
    lose = " loseact" if act else ""
    win = " winact" if act else ""
    figs = "".join(figure(x, y, "red", n, "fig" + lose) for x, y, n in REDS)
    figs += "".join(figure(x, y, "blue", n, "fig" + win) for x, y, n in BLUES)
    # js/meet.js の Meet.celebrate と同じ:勝った色のグラデ + 黄色いグロー
    glow_html = ""
    if glow:
        glow_html = (
            '<div class="anim" style="position:absolute;left:0;top:0;width:1280px;height:720px;'
            'animation-name:party;background:linear-gradient(rgba(227,240,255,.88),rgba(255,253,245,0) 62%)"></div>'
            '<div class="anim" style="position:absolute;left:340px;top:170px;width:1240px;height:1240px;'
            'margin-left:-300px;animation-name:party;background:radial-gradient(circle closest-side,'
            'rgba(255,212,59,.55) 0,rgba(255,212,59,0) 100%)"></div>')
    return f"""
  <div style="position:absolute;left:0;top:0;width:1280px;height:720px;overflow:hidden;background:linear-gradient(#a5d8ff,#e3f4ff 300px)">
    <div style="position:absolute;left:0;top:300px;width:1280px;height:420px;background:#a9dd7e"></div>
    <div style="position:absolute;left:0;top:300px;width:640px;height:420px;background:rgba(255,107,157,.16)"></div>
    <div style="position:absolute;left:640px;top:300px;width:640px;height:420px;background:rgba(77,171,247,.16)"></div>
    <div style="position:absolute;left:638px;top:300px;width:5px;height:420px;background:repeating-linear-gradient(rgba(255,255,255,.8) 0 24px,transparent 24px 42px)"></div>
    <div style="position:absolute;left:0;top:0;width:1280px;height:46px;background:repeating-linear-gradient(90deg,#ff8fab 0 80px,#fff 80px 160px)"></div>
    <div style="position:absolute;left:0;top:41px;width:1280px;height:5px;background:rgba(150,110,70,.18)"></div>
    <div style="position:absolute;left:0;top:46px;width:1280px;height:15px;background:radial-gradient(circle 15px at 15px 0,#ffd43b 0 15px,transparent 15px);background-size:30px 15px"></div>
    {"".join(ball(*b) for b in LITTER)}
    {basket("red")}{basket("blue")}
    {glow_html}
    {figs}
  </div>"""

# ---------------------------------------------------------------
# 1. Main:いまの がめん(もんだい)
# ---------------------------------------------------------------
main_css = """
    .mark {
      position: absolute; z-index: 40;
      display: flex; align-items: center; gap: 7px;
      background: #c92a5f; color: #fff;
      font-size: 15px; font-weight: 800; line-height: 1.35;
      border-radius: 12px; padding: 7px 12px;
      box-shadow: 0 4px 12px rgba(120,40,60,.35);
    }
    .mark b { background: #fff; color: #c92a5f; border-radius: 50%; width: 22px; height: 22px; display: grid; place-items: center; flex: 0 0 auto; }
    .zone { position: absolute; z-index: 35; border: 3px dashed #c92a5f; border-radius: 10px; background: rgba(201,42,95,.10); }
"""
main_body = f"""<div style="position:relative;width:1280px;height:880px;background:#fffdf5">
{stage()}

  <!-- ===== いまの UI(css/style.css + undoukai.html の まま) ===== -->
  <!-- とくてんばん .mt-score -->
  <div style="position:absolute;left:280px;top:10px;width:720px;display:flex;gap:10px;align-items:stretch;font-weight:bold;z-index:20">
    <div style="flex:1;background:#fff;border:4px solid #ff6b9d;border-radius:18px;box-shadow:0 5px 0 #d6336c;padding:6px 10px 8px;color:#d6336c;text-align:center">
      <div style="font-size:20px">あかチーム</div>
      <div style="font-size:40px;line-height:1.1">2<small style="font-size:.45em">てん</small></div>
    </div>
    <div style="align-self:center;color:#a99;font-size:26px">VS</div>
    <div style="flex:1;background:#fff;border:4px solid #4dabf7;border-radius:18px;box-shadow:0 5px 0 #1c7ed6;padding:6px 10px 8px;color:#1c7ed6;text-align:center">
      <div style="font-size:20px">あおチーム</div>
      <div style="font-size:40px;line-height:1.1">2<small style="font-size:.45em">てん</small></div>
    </div>
  </div>
  <!-- しんこう #progLbl -->
  <div style="position:absolute;left:0;top:126px;width:1280px;text-align:center;font-weight:bold;font-size:16px;color:#8a7a68;z-index:20">だい2きょうぎ / ぜん4きょうぎ</div>
  <!-- きょうぎHUD .mt-hud -->
  <div style="position:absolute;left:0;top:152px;width:1280px;display:flex;justify-content:center;gap:10px;font-weight:bold;font-size:26px;z-index:20">
    <span style="background:#fff;border-radius:999px;padding:4px 18px;box-shadow:0 3px 0 rgba(150,110,70,.16);color:#d6336c">🔴 あかチーム 3こ</span>
    <span style="color:#8a7a68;padding:0 2px">のこり 12びょう</span>
    <span style="background:#fff;border-radius:999px;padding:4px 18px;box-shadow:0 3px 0 rgba(150,110,70,.16);color:#1c7ed6">🔵 あおチーム 5こ</span>
  </div>
  <!-- じっきょうテロップ .mt-banner -->
  <div style="position:absolute;left:0;top:658px;width:1280px;padding:9px 16px 11px;box-sizing:border-box;text-align:center;font-weight:bold;font-size:28px;line-height:1.2;color:#fff;background:linear-gradient(to top,rgba(18,12,6,.86),rgba(18,12,6,.62));border-top:5px solid #ffd43b;z-index:20">🧺 たまいれ! かごに いっぱい 入れよう!</div>
  <!-- カードが 出る ばしょ(ゴースト) .mt-over > .mt-card -->
  <div style="position:absolute;left:390px;top:232px;width:500px;background:rgba(255,255,255,.62);border:5px dashed #e8cbae;border-radius:26px;padding:18px 30px 22px;text-align:center;z-index:30">
    <div style="font-size:21px;color:#8a7a68;font-weight:bold">たまいれ の けっか</div>
    <div style="font-size:46px;font-weight:bold;color:#1c7ed6">🔵 あおチーム の かち!</div>
    <div style="font-size:20px;color:#6a5c4c;font-weight:bold">あか 3こ - あお 5こ / +2てん</div>
  </div>

  <!-- ===== もんだいの しるし ===== -->
  <div class="zone" style="left:270px;top:4px;width:740px;height:200px"></div>
  <div class="zone" style="left:380px;top:224px;width:520px;height:170px;border-style:solid"></div>
  <div class="zone" style="left:-3px;top:652px;width:1286px;height:70px"></div>
  <div class="mark" style="left:1022px;top:64px"><b>1</b>チーム名と色が2か所で重複</div>
  <div class="mark" style="left:912px;top:246px;max-width:340px"><b>2</b>カードがカゴと頭のちょうど上</div>
  <div class="mark" style="left:24px;top:594px"><b>3</b>黒帯は出しっぱなし(画面の8%)</div>
  <div class="mark" style="left:24px;top:116px"><b>4</b>一度に6つ読ませている</div>

  <div style="position:absolute;left:0;top:720px;width:1280px;height:160px;padding:16px 28px;box-sizing:border-box;background:#fffdf5;border-top:4px solid #e8cbae">
    <div style="display:flex;align-items:baseline;gap:12px">
      <span class="tag bad">現状</span>
      <div style="font-size:22px;font-weight:800">競技中に6つのことを同時に言っている</div>
    </div>
    <div class="cap" style="margin-top:8px">
      ① 総合点(2てん-2てん)と ② 競技点(3こ-5こ)は別の意味なのに見た目が似ている。チーム名と色マークはそれぞれに入っていて<b>2回ずつ</b>出る。<br>
      ③ 進行(だい2/ぜん4)は紹介カードで2秒前に言ったばかり。④ テロップは出来事がなくても出しっぱなし。⑤ 結果カードは画面中央 = カゴとキャラの頭の上に重なる。
    </div>
  </div>
</div>
"""

# ---------------------------------------------------------------
# 2. Play:あたらしい プレー中
# ---------------------------------------------------------------
play_body = f"""<div style="position:relative;width:1280px;height:880px;background:#fffdf5">
{stage()}

  <!-- ===== あたらしい UI:上の おび だけ ===== -->
  <!-- しんこうドット -->
  <div style="position:absolute;left:0;top:14px;width:1280px;display:flex;justify-content:center;gap:7px;z-index:20">
    <div style="width:11px;height:11px;border-radius:50%;background:#fff;box-shadow:0 0 0 3px rgba(150,110,70,.22)"></div>
    <div style="width:11px;height:11px;border-radius:50%;background:#ffd43b;box-shadow:0 0 0 3px #e8a805"></div>
    <div style="width:11px;height:11px;border-radius:50%;background:rgba(255,255,255,.5);box-shadow:0 0 0 3px rgba(150,110,70,.16)"></div>
    <div style="width:11px;height:11px;border-radius:50%;background:rgba(255,255,255,.5);box-shadow:0 0 0 3px rgba(150,110,70,.16)"></div>
  </div>
  <!-- あかの てん -->
  <div style="position:absolute;left:36px;top:36px;display:flex;align-items:center;gap:12px;background:#ff6b9d;border:4px solid #d6336c;border-radius:22px;box-shadow:0 6px 0 #d6336c;padding:6px 22px 8px;color:#fff;z-index:20">
    <span style="font-size:17px;font-weight:800;opacity:.92">あか</span>
    <span style="font-size:52px;font-weight:800;line-height:1">3</span>
  </div>
  <!-- のこり じかん -->
  <div style="position:absolute;left:576px;top:40px;width:128px;text-align:center;background:#fff;border-radius:999px;box-shadow:0 3px 0 rgba(150,110,70,.16);padding:4px 0 6px;z-index:20">
    <div style="font-size:40px;font-weight:800;line-height:1.05;color:#4a3f35">12</div>
    <div style="font-size:12px;font-weight:800;color:#8a7a68;letter-spacing:.08em">のこり びょう</div>
  </div>
  <!-- あおの てん -->
  <div style="position:absolute;left:1064px;top:36px;display:flex;align-items:center;gap:12px;background:#4dabf7;border:4px solid #1c7ed6;border-radius:22px;box-shadow:0 6px 0 #1c7ed6;padding:6px 22px 8px;color:#fff;z-index:20">
    <span style="font-size:52px;font-weight:800;line-height:1">5</span>
    <span style="font-size:17px;font-weight:800;opacity:.92">あお</span>
  </div>

  <!-- 出来事の ときだけ 出る テロップ(2.4びょう) -->
  <div style="position:absolute;left:340px;top:642px;width:600px;text-align:center;background:rgba(255,253,245,.94);border:4px solid #4dabf7;border-radius:999px;box-shadow:0 6px 0 rgba(28,126,214,.28);padding:8px 24px 10px;font-size:26px;font-weight:800;color:#1c7ed6;z-index:20">さくら、ナイスシュート!</div>
  <div style="position:absolute;left:952px;top:648px;font-size:13px;font-weight:800;color:#8a7a68;z-index:20">2.4びょうで きえる</div>

  <div style="position:absolute;left:0;top:720px;width:1280px;height:160px;padding:16px 28px;box-sizing:border-box;background:#fffdf5;border-top:4px solid #e8cbae">
    <div style="display:flex;align-items:baseline;gap:12px">
      <span class="tag good">提案</span>
      <div style="font-size:22px;font-weight:800">プレー中に常に出るのは「2つの数字」だけ</div>
    </div>
    <div class="cap" style="margin-top:8px">
      チーム名は<b>色そのもの</b>に任せて文字をやめる(「あか」「あお」の2文字だけ残す)。<b>総合点は競技中は一切出さず、最後の総合結果で1回だけ</b>見せる。今が何競技目かは上の4つのドットだけで示す。<br>
      テロップは出来事が起きたときだけ下から出て2.4秒で消える。黒帯をやめ、丸い白フキダシ + チーム色のフチにして、地面が透けて見えるようにする。
    </div>
  </div>
</div>
"""

# ---------------------------------------------------------------
# 3. Rule:がめんの ルール(セーフエリア)
# ---------------------------------------------------------------
rule_css = """
    .zoneline { position: absolute; left: 0; width: 1280px; border-top: 3px dashed #4a3f35; opacity: .55; }
    .zlabel { position: absolute; font-size: 15px; font-weight: 800; background: #fffdf5; border: 3px solid #e8cbae; border-radius: 999px; padding: 4px 14px; }
    .rulecard { background: #fff; border: 4px solid #e8cbae; border-radius: 20px; box-shadow: 0 6px 0 #e8cbae; padding: 14px 18px 16px; }
    .rulecard h3 { margin: 0 0 6px; font-size: 19px; }
    .rulecard p { margin: 0; font-size: 14.5px; line-height: 1.6; color: #6a5c4c; }
"""
rule_body = f"""<div style="position:relative;width:1280px;height:880px;background:#fffdf5">
  <div style="position:absolute;left:0;top:0;width:1280px;height:720px;overflow:hidden">
    <div style="opacity:.5">{stage()}</div>
    <div style="position:absolute;left:0;top:0;width:1280px;height:104px;background:rgba(255,212,59,.30)"></div>
    <div style="position:absolute;left:0;top:104px;width:1280px;height:526px;background:rgba(81,207,102,.16)"></div>
    <div style="position:absolute;left:0;top:630px;width:1280px;height:90px;background:rgba(77,171,247,.24)"></div>
    <div class="zoneline" style="top:104px"></div>
    <div class="zoneline" style="top:630px"></div>
    <div class="zlabel" style="left:28px;top:34px">0-104px:UI帯(スコアだけ)</div>
    <div class="zlabel" style="left:28px;top:340px;border-color:#2f9e44;color:#2f9e44">104-630px:キャラの場所 / 何も置かない</div>
    <div class="zlabel" style="left:28px;top:658px;border-color:#1c7ed6;color:#1c7ed6">630-720px:テロップ帯(出来事のときだけ)</div>
    <div style="position:absolute;left:832px;top:120px;width:420px;background:rgba(255,255,255,.9);border:4px dashed #2f9e44;border-radius:24px;padding:12px 18px 14px;text-align:center">
      <div style="font-size:15px;font-weight:800;color:#2f9e44">カードを出すときはここ(上1/3)</div>
      <div style="font-size:13px;color:#6a5c4c;margin-top:4px;line-height:1.5">キャラは必ず下半分に残す。<br>中央には出さない。</div>
    </div>
  </div>

  <div style="position:absolute;left:0;top:720px;width:1280px;height:160px;padding:14px 24px;box-sizing:border-box;background:#fffdf5;border-top:4px solid #e8cbae;display:flex;gap:14px">
    <div class="rulecard" style="flex:1">
      <h3>1. 常に出すのは1種類だけ</h3>
      <p>「今の競技の点数」だけを常設。<b>総合点は最後の総合結果で1回だけ</b>。競技名・順番・説明は、それを見せる場面でしか出さない。</p>
    </div>
    <div class="rulecard" style="flex:1">
      <h3>2. キャラの帯には何も置かない</h3>
      <p>y=104-630 はキャラとカゴの場所。文字・カード・ボタンをここに置かない。重ねるなら上1/3か下の帯。</p>
    </div>
    <div class="rulecard" style="flex:1">
      <h3>3. 切り替わる前に一度消す</h3>
      <p>次を出す前に0.3秒だけ全部消してステージだけにする。この「間」が競技の区切りになり、次の表示が新しい情報だと伝わる。</p>
    </div>
    <div class="rulecard" style="flex:1">
      <h3>4. 同じことを2回言わない</h3>
      <p>チーム名は色で、点数は数字で。マーク(🔴🔵)と名前と色の3重ねをやめて1つにする。</p>
    </div>
  </div>
</div>
"""

# ---------------------------------------------------------------
# 4. Flow:じかんの ながれ
# ---------------------------------------------------------------
flow_css = """
    .fr { position: absolute; width: 280px; }
    .mini { position: relative; width: 280px; height: 158px; border-radius: 12px; overflow: hidden; border: 4px solid #e8cbae; background: linear-gradient(#a5d8ff,#e3f4ff 66px); }
    .mini .gr { position: absolute; left: 0; top: 66px; width: 280px; height: 92px; background: #a9dd7e; }
    .mini .ch { position: absolute; bottom: 18px; width: 14px; height: 26px; border-radius: 7px; }
    .fr h4 { margin: 10px 0 4px; font-size: 17px; }
    .fr p { margin: 0; font-size: 13px; line-height: 1.55; color: #6a5c4c; }
    .cnt { display: inline-block; margin-top: 8px; font-size: 12.5px; font-weight: 800; border-radius: 999px; padding: 3px 10px; background: #e6f7e9; color: #2f9e44; }
    .cnt.hi { background: #ffe3ee; color: #c92a5f; }
    .rail { position: absolute; left: 40px; top: 470px; width: 1840px; height: 6px; border-radius: 3px; background: #e8cbae; }
    .tick { position: absolute; top: -7px; width: 20px; height: 20px; border-radius: 50%; background: #fffdf5; border: 5px solid #ff6b9d; }
    .tlab { position: absolute; top: 24px; font-size: 13px; font-weight: 800; color: #8a7a68; transform: translateX(-50%); }
"""
def mini(chars_red, chars_blue, extra=""):
    ch = ""
    for i, x in enumerate(chars_red):
        ch += f'<div class="ch" style="left:{x}px;background:#ff8fab;border:2px solid #d6336c"></div>'
    for x in chars_blue:
        ch += f'<div class="ch" style="left:{x}px;background:#74c0fc;border:2px solid #1c7ed6"></div>'
    return f'<div class="mini"><div class="gr"></div>{ch}{extra}</div>'

FRAMES = [
    (40, "0.0s", "紹介", "競技名とアイコンだけ。スコアも進行もまだ出さない。",
     mini([46,74,102],[170,198,226],
          '<div style="position:absolute;left:52px;top:34px;width:176px;background:rgba(255,255,255,.95);border:3px solid #e8cbae;border-radius:12px;padding:6px 8px;text-align:center"><div style="font-size:10px;color:#8a7a68;font-weight:800">だい2きょうぎ</div><div style="font-size:20px;font-weight:800">たまいれ</div></div>'),
     "出るもの 1つ", False),
    (360, "1.2s", "カードがスコアになる", "カードがすっと上に吸い込まれ、そのままスコア帯に変わる。目が上についていく。",
     mini([46,74,102],[170,198,226],
          '<div style="position:absolute;left:88px;top:10px;width:104px;height:30px;background:rgba(255,255,255,.95);border:3px solid #e8cbae;border-radius:10px;opacity:.55;transform:scale(.8)"></div>'
          '<div style="position:absolute;left:8px;top:8px;width:44px;height:22px;border-radius:8px;background:#ff6b9d"></div>'
          '<div style="position:absolute;left:228px;top:8px;width:44px;height:22px;border-radius:8px;background:#4dabf7"></div>'),
     "出るもの 1つ", False),
    (680, "1.8s", "スタート", "中央に1語だけ0.6秒。ここで目をステージに戻す。",
     mini([46,74,102],[170,198,226],
          '<div style="position:absolute;left:0;top:52px;width:280px;text-align:center;font-size:30px;font-weight:800;color:#d6336c;-webkit-text-stroke:4px #fff;paint-order:stroke fill">スタート!</div>'
          '<div style="position:absolute;left:8px;top:8px;width:44px;height:22px;border-radius:8px;background:#ff6b9d"></div>'
          '<div style="position:absolute;left:228px;top:8px;width:44px;height:22px;border-radius:8px;background:#4dabf7"></div>'),
     "出るもの 2つ", False),
    (1000, "プレー中", "遊んでいるあいだ", "スコア2つと時間だけ。出来事があったときだけテロップが2.4秒。",
     mini([46,74,102],[170,198,226],
          '<div style="position:absolute;left:8px;top:8px;width:44px;height:22px;border-radius:8px;background:#ff6b9d"></div>'
          '<div style="position:absolute;left:118px;top:8px;width:44px;height:20px;border-radius:8px;background:#fff;border:2px solid #e8cbae"></div>'
          '<div style="position:absolute;left:228px;top:8px;width:44px;height:22px;border-radius:8px;background:#4dabf7"></div>'
          '<div style="position:absolute;left:60px;bottom:6px;width:160px;height:20px;border-radius:999px;background:rgba(255,253,245,.95);border:2px solid #4dabf7"></div>'),
     "出るもの 2-3つ", False),
    (1320, "0.3s", "区切り(間)", "決まった瞬間に白フラッシュ。そのあと0.3秒だけ全部消してステージだけにする。ここが競技の切れ目になる。",
     mini([46,74,102],[170,198,226],
          '<div style="position:absolute;left:0;top:0;width:280px;height:158px;background:rgba(255,255,255,.55)"></div>'
          '<div style="position:absolute;left:0;top:64px;width:280px;text-align:center;font-size:13px;font-weight:800;color:#8a7a68">UI が ぜんぶ 消える</div>'),
     "出るもの 0", False),
    (1640, "お祝い", "決まったあと", "勝った側は跳ねて紙吹雪、負けた側は拍手。どちらも明るいまま、勝った側だけ派手にする。",
     mini([46,74,102],[170,198,226],
          '<div style="position:absolute;left:0;top:0;width:280px;height:158px;background:radial-gradient(circle at 70% 62%,rgba(255,212,59,.5) 0,rgba(255,212,59,0) 58%),linear-gradient(rgba(227,240,255,.8),rgba(255,253,245,0) 60%)"></div>'
          '<div style="position:absolute;left:12px;top:14px;width:8px;height:12px;background:#ff6b9d;border-radius:2px"></div>'
          '<div style="position:absolute;left:80px;top:6px;width:8px;height:12px;background:#ffd43b;border-radius:2px"></div>'
          '<div style="position:absolute;left:150px;top:20px;width:8px;height:12px;background:#4dabf7;border-radius:2px"></div>'
          '<div style="position:absolute;left:220px;top:8px;width:8px;height:12px;background:#51cf66;border-radius:2px"></div>'
          '<div style="position:absolute;left:44px;top:44px;width:192px;background:rgba(255,255,255,.96);border:3px solid #4dabf7;border-radius:12px;padding:6px;text-align:center"><div style="font-size:17px;font-weight:800;color:#1c7ed6">あおチーム の かち!</div></div>'),
     "出るもの 1つ", True),
]
frames_html = ""
for x, t, ttl, desc, m, cnt, hi in FRAMES:
    frames_html += f"""
  <div class="fr" style="left:{x}px;top:96px">
    {m}
    <h4>{t} — {ttl}</h4>
    <p>{desc}</p>
    <span class="cnt{' hi' if hi else ''}">{cnt}</span>
  </div>"""

flow_body = f"""<div style="position:relative;width:1960px;height:620px;background:#fffdf5;padding:0">
  <div style="position:absolute;left:40px;top:26px">
    <span class="tag good">提案</span>
    <span style="font-size:24px;font-weight:800;margin-left:12px">時間で分ける — 同時に読ませるのは最大2つ</span>
  </div>
{frames_html}
  <div class="rail"></div>
  <div class="tick" style="left:132px"></div><div class="tlab" style="left:142px">0.0</div>
  <div class="tick" style="left:452px"></div><div class="tlab" style="left:462px">1.2</div>
  <div class="tick" style="left:772px"></div><div class="tlab" style="left:782px">1.8</div>
  <div class="tick" style="left:1092px;border-color:#51cf66"></div><div class="tlab" style="left:1102px">2.4 - 終わりまで</div>
  <div class="tick" style="left:1412px;border-color:#8a7a68"></div><div class="tlab" style="left:1422px">決着 → 間</div>
  <div class="tick" style="left:1732px;border-color:#ffd43b"></div><div class="tlab" style="left:1742px">お祝い</div>
  <div class="cap" style="position:absolute;left:40px;top:534px;width:1880px">
    今はこの5つの場面すべてで同じUIが出しっぱなしになっている。<b>出す・消すのタイミングをずらすだけで、読ませる量は6つ → 最大2つに減る。</b>減らした分を、決着の瞬間にすべて使う。総合点はここには出さず、全競技が終わった最後に1回だけ見せる。
  </div>
</div>
"""

# ---------------------------------------------------------------
# 5. Motion:決着の うごき(じどう再生)
# ---------------------------------------------------------------
motion_css = """
    .stagewrap { position: absolute; left: 0; top: 0; width: 1280px; height: 720px; overflow: hidden; }
    .anim { animation-duration: var(--t); animation-timing-function: linear; animation-iteration-count: infinite; }
    .fig { animation-duration: var(--t); animation-timing-function: ease-in-out; animation-iteration-count: infinite; }
    /* 勝った側:とびはねる。負けた側:はくしゅして おじぎ。どちらも 明るいまま */
    .winact { animation-name: winjump; }
    .loseact { animation-name: loseclap; }
    @keyframes winjump {
      0%, 46% { transform: translateY(0); }
      49% { transform: translateY(-30px); }
      52% { transform: translateY(0); }
      55% { transform: translateY(-24px); }
      58% { transform: translateY(0); }
      61% { transform: translateY(-28px); }
      64% { transform: translateY(0); }
      67% { transform: translateY(-20px); }
      70% { transform: translateY(0); }
      73% { transform: translateY(-26px); }
      76%, 100% { transform: translateY(0); }
    }
    @keyframes loseclap {
      0%, 46% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(5px) rotate(-5deg); }
      54% { transform: translateY(0) rotate(0deg); }
      58% { transform: translateY(5px) rotate(5deg); }
      62% { transform: translateY(0) rotate(0deg); }
      66% { transform: translateY(5px) rotate(-5deg); }
      70%, 100% { transform: translateY(0) rotate(0deg); }
    }
    @keyframes party {
      0%, 44% { opacity: 0; }
      48%, 88% { opacity: 1; }
      95%, 100% { opacity: 0; }
    }
    /* 区切り:つぎが 出る まえに UI を ぜんぶ 消して 0.3びょうの 間 をつくる */
    @keyframes untilbreak {
      0%, 40% { opacity: 1; }
      41%, 94% { opacity: 0; }
      98%, 100% { opacity: 1; }
    }
    @keyframes bluepop {
      0%, 10% { transform: scale(1); }
      13% { transform: scale(1.34); }
      17%, 100% { transform: scale(1); }
    }
    @keyframes ring {
      0%, 10% { opacity: 0; transform: scale(.4); }
      11% { opacity: .9; }
      22%, 100% { opacity: 0; transform: scale(2.4); }
    }
    @keyframes swap5 { 0%, 10.5% { opacity: 1; } 11%, 100% { opacity: 0; } }
    @keyframes swap6 { 0%, 10.5% { opacity: 0; } 11%, 100% { opacity: 1; } }
    @keyframes plusone {
      0%, 10% { opacity: 0; transform: translateY(0); }
      12% { opacity: 1; }
      24%, 100% { opacity: 0; transform: translateY(-58px); }
    }
    @keyframes telop {
      0%, 11% { opacity: 0; transform: translateY(72px); }
      14%, 33% { opacity: 1; transform: translateY(0); }
      37%, 100% { opacity: 0; transform: translateY(72px); }
    }
    @keyframes flash {
      0%, 37% { opacity: 0; }
      39% { opacity: .92; }
      44%, 100% { opacity: 0; }
    }
    @keyframes card {
      0%, 50% { opacity: 0; transform: translateY(70px) scale(.92); }
      55% { opacity: 1; transform: translateY(-10px) scale(1.03); }
      58%, 88% { opacity: 1; transform: translateY(0) scale(1); }
      94%, 100% { opacity: 0; transform: translateY(70px) scale(.92); }
    }
    @keyframes bubble {
      0%, 56% { opacity: 0; transform: translateY(20px) scale(.9); }
      60%, 86% { opacity: 1; transform: translateY(0) scale(1); }
      92%, 100% { opacity: 0; transform: translateY(20px) scale(.9); }
    }
    @keyframes timer0 { 0%, 36% { opacity: 1; } 38%, 94% { opacity: 0; } 98%, 100% { opacity: 1; } }
    @keyframes conf1 { 0%, 46% { opacity: 0; transform: translateY(-40px) rotate(0deg); } 49% { opacity: 1; } 84%, 100% { opacity: 0; transform: translateY(560px) rotate(420deg); } }
    @keyframes conf2 { 0%, 49% { opacity: 0; transform: translateY(-40px) rotate(0deg); } 52% { opacity: 1; } 88%, 100% { opacity: 0; transform: translateY(600px) rotate(-380deg); } }
    @keyframes conf3 { 0%, 52% { opacity: 0; transform: translateY(-40px) rotate(0deg); } 55% { opacity: 1; } 90%, 100% { opacity: 0; transform: translateY(520px) rotate(300deg); } }
    @keyframes conf4 { 0%, 55% { opacity: 0; transform: translateY(-40px) rotate(0deg); } 58% { opacity: 1; } 92%, 100% { opacity: 0; transform: translateY(580px) rotate(-460deg); } }
"""
CONF = [(70,"#ff6b9d","conf1"),(150,"#ffd43b","conf3"),(230,"#4dabf7","conf2"),(310,"#51cf66","conf4"),
        (390,"#ff922b","conf1"),(470,"#9775fa","conf3"),(560,"#ff6b9d","conf2"),(640,"#ffd43b","conf4"),
        (720,"#4dabf7","conf1"),(800,"#51cf66","conf3"),(880,"#ff922b","conf2"),(950,"#4dabf7","conf4"),
        (1020,"#9775fa","conf1"),(1090,"#ffd43b","conf3"),(1160,"#4dabf7","conf2"),(1230,"#ff6b9d","conf4")]
conf_html = "".join(
    f'<div class="anim" style="position:absolute;left:{x}px;top:-40px;width:14px;height:20px;border-radius:3px;background:{c};animation-name:{k};z-index:60"></div>'
    for x, c, k in CONF)

motion_body = f"""<div style="position:relative;width:1280px;height:880px;background:#fffdf5;--t:{{{{dur}}}}">
  <div class="stagewrap">
{stage(act=True, glow=True)}
    <!-- 白フラッシュ(決まった しゅんかん) -->
    <div class="anim" style="position:absolute;left:0;top:0;width:1280px;height:720px;animation-name:flash;background:#fff;z-index:55"></div>
{conf_html}

    <!-- スコア(あか):区切りで 消える -->
    <div class="anim" style="position:absolute;left:36px;top:36px;display:flex;align-items:center;gap:12px;background:#ff6b9d;border:4px solid #d6336c;border-radius:22px;box-shadow:0 6px 0 #d6336c;padding:6px 22px 8px;color:#fff;animation-name:untilbreak;z-index:30">
      <span style="font-size:17px;font-weight:800;opacity:.92">あか</span>
      <span style="font-size:52px;font-weight:800;line-height:1">5</span>
    </div>
    <!-- のこり じかん -->
    <div class="anim" style="position:absolute;left:576px;top:40px;width:128px;text-align:center;background:#fff;border-radius:999px;box-shadow:0 3px 0 rgba(150,110,70,.16);padding:4px 0 6px;animation-name:timer0;z-index:30">
      <div style="font-size:40px;font-weight:800;line-height:1.05;color:#4a3f35">3</div>
      <div style="font-size:12px;font-weight:800;color:#8a7a68;letter-spacing:.08em">のこり びょう</div>
    </div>
    <!-- スコア(あお):ポップ と リング。区切りで 消える -->
    <div class="anim" style="position:absolute;left:1064px;top:36px;animation-name:untilbreak;z-index:30">
      <div class="anim" style="position:absolute;left:-16px;top:-16px;width:220px;height:96px;border-radius:999px;border:6px solid #4dabf7;animation-name:ring"></div>
      <div class="anim" style="display:flex;align-items:center;gap:12px;background:#4dabf7;border:4px solid #1c7ed6;border-radius:22px;box-shadow:0 6px 0 #1c7ed6;padding:6px 22px 8px;color:#fff;animation-name:bluepop;transform-origin:50% 50%">
        <span style="position:relative;width:34px;height:52px;display:inline-block">
          <span class="anim" style="position:absolute;left:0;top:0;font-size:52px;font-weight:800;line-height:1;animation-name:swap5">5</span>
          <span class="anim" style="position:absolute;left:0;top:0;font-size:52px;font-weight:800;line-height:1;animation-name:swap6">6</span>
        </span>
        <span style="font-size:17px;font-weight:800;opacity:.92">あお</span>
      </div>
    </div>
    <!-- +1 の フロート(かごの よこ) -->
    <div class="anim" style="position:absolute;left:1030px;top:204px;font-size:44px;font-weight:800;color:#1c7ed6;-webkit-text-stroke:5px #fff;paint-order:stroke fill;animation-name:plusone;z-index:30">+1</div>
    <!-- テロップ -->
    <div class="anim" style="position:absolute;left:340px;top:642px;width:600px;text-align:center;background:rgba(255,253,245,.94);border:4px solid #4dabf7;border-radius:999px;box-shadow:0 6px 0 rgba(28,126,214,.28);padding:8px 24px 10px;font-size:26px;font-weight:800;color:#1c7ed6;animation-name:telop;z-index:30">さくら、ナイスシュート!</div>
    <!-- 勝ったチームの カード(上1/3) -->
    <div class="anim" style="position:absolute;left:340px;top:120px;width:600px;box-sizing:border-box;background:rgba(255,255,255,.96);border:5px solid #4dabf7;border-radius:26px;box-shadow:0 8px 0 #1c7ed6;padding:16px 30px 20px;text-align:center;animation-name:card;z-index:58">
      <div style="font-size:21px;font-weight:800;color:#8a7a68">たまいれ</div>
      <div style="font-size:50px;font-weight:800;color:#1c7ed6;line-height:1.15">あおチーム の かち!</div>
      <div style="font-size:22px;font-weight:800;color:#6a5c4c">3 - 6</div>
    </div>
    <!-- 負けたチームにも ひとこと(暗くしない・ちゃんと 見せる) -->
    <div class="anim" style="position:absolute;left:56px;top:612px;width:330px;text-align:center;background:rgba(255,253,245,.96);border:4px solid #ff6b9d;border-radius:999px;box-shadow:0 6px 0 rgba(214,51,108,.28);padding:6px 18px 8px;font-size:23px;font-weight:800;color:#d6336c;animation-name:bubble;z-index:58">よく がんばった!</div>
  </div>

  <div style="position:absolute;left:0;top:720px;width:1280px;height:160px;padding:16px 28px;box-sizing:border-box;background:#fffdf5;border-top:4px solid #e8cbae">
    <div style="display:flex;align-items:baseline;gap:12px">
      <span class="tag good">動き</span>
      <div style="font-size:22px;font-weight:800">目を連れていく5つの動き(自動再生・速度も変えられます)</div>
    </div>
    <div class="cap" style="margin-top:8px">
      <b>1. ポップ+リング</b>(0.9s) 入った瞬間に数字が跳ね、チーム色の輪が広がる。どちらが入れたか一目で分かる。 /
      <b>2. テロップ</b>(1.0-2.5s) 下から出て下へ消える。目がステージへ戻る。<br>
      <b>3. 白フラッシュ → 間</b>(2.9s) 0.2秒光ったあと、<b>UIを全部消して0.3秒の間</b>を作る。これが競技の区切りになる。 /
      <b>4. お祝い</b>(3.4s-) 勝った側は跳ねて紙吹雪と光。<b>5. 負けた側も暗くしない</b> — 拍手のしぐさと「よく がんばった!」を出す。差は明るさではなく派手さでつける。
    </div>
  </div>
</div>
"""

# ---------------------------------------------------------------
# 6. Parts:ぶひん
# ---------------------------------------------------------------
parts_css = """
    .pcard { background: #fff; border: 4px solid #e8cbae; border-radius: 20px; box-shadow: 0 6px 0 #e8cbae; padding: 16px 18px 18px; }
    .pcard h3 { margin: 0 0 4px; font-size: 18px; }
    .pcard .spec { margin: 10px 0 0; font-size: 13px; line-height: 1.65; color: #6a5c4c; }
    .pcard .spec b { color: #4a3f35; }
    .demo { display: flex; align-items: center; justify-content: center; min-height: 96px; border-radius: 14px; background: linear-gradient(#a5d8ff,#a9dd7e); margin-top: 10px; }
"""
parts_body = """<div style="position:relative;width:1280px;height:1000px;background:#fffdf5;padding:26px 28px;box-sizing:border-box">
  <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:16px">
    <span class="tag good">部品</span>
    <span style="font-size:24px;font-weight:800">使う部品は6つだけ</span>
  </div>
  <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px">
    <div class="pcard">
      <h3>スコアチップ</h3>
      <div class="demo">
        <div style="display:flex;align-items:center;gap:12px;background:#ff6b9d;border:4px solid #d6336c;border-radius:22px;box-shadow:0 6px 0 #d6336c;padding:6px 22px 8px;color:#fff">
          <span style="font-size:17px;font-weight:800">あか</span><span style="font-size:52px;font-weight:800;line-height:1">3</span>
        </div>
      </div>
      <p class="spec"><b>位置</b> 左上 36,36 / 右上 1064,36<br><b>色</b> チーム色ベタ + 濃い色のフチ(既存の .btn と同じ立体)<br><b>やめる</b> 🔴🔵マーク・フルのチーム名</p>
    </div>
    <div class="pcard">
      <h3>残り時間</h3>
      <div class="demo">
        <div style="width:128px;text-align:center;background:#fff;border-radius:999px;box-shadow:0 3px 0 rgba(150,110,70,.16);padding:4px 0 6px">
          <div style="font-size:40px;font-weight:800;line-height:1.05">12</div>
          <div style="font-size:12px;font-weight:800;color:#8a7a68;letter-spacing:.08em">のこり びょう</div>
        </div>
      </div>
      <p class="spec"><b>位置</b> 上中央 576,40<br><b>10秒を切ったら</b> 数字を #d6336c にして1秒ごとに1.12倍ふくらむ<br><b>無いとき</b> 出さない(かけっこ・リレー)</p>
    </div>
    <div class="pcard">
      <h3>進行ドット</h3>
      <div class="demo">
        <div style="display:flex;gap:7px">
          <div style="width:11px;height:11px;border-radius:50%;background:#fff;box-shadow:0 0 0 3px rgba(150,110,70,.22)"></div>
          <div style="width:11px;height:11px;border-radius:50%;background:#ffd43b;box-shadow:0 0 0 3px #e8a805"></div>
          <div style="width:11px;height:11px;border-radius:50%;background:rgba(255,255,255,.5);box-shadow:0 0 0 3px rgba(150,110,70,.16)"></div>
          <div style="width:11px;height:11px;border-radius:50%;background:rgba(255,255,255,.5);box-shadow:0 0 0 3px rgba(150,110,70,.16)"></div>
        </div>
      </div>
      <p class="spec"><b>代わり</b>「だい2きょうぎ / ぜん4きょうぎ」の文字をなくす<br><b>済んだ競技</b>は白、今は黄、これからは薄い<br><b>置き換え先</b> undoukai.html の #progLbl</p>
    </div>
    <div class="pcard">
      <h3>テロップ(2.4秒)</h3>
      <div class="demo">
        <div style="text-align:center;background:rgba(255,253,245,.94);border:4px solid #4dabf7;border-radius:999px;box-shadow:0 6px 0 rgba(28,126,214,.28);padding:8px 24px 10px;font-size:22px;font-weight:800;color:#1c7ed6">さくら、ナイスシュート!</div>
      </div>
      <p class="spec"><b>位置</b> 下から72px せり上がり、y=642<br><b>フチ</b> しゃべったチームの色<br><b>消え方</b> 2.4秒後に下へ / 次が来たらすぐ入れ替え<br><b>やめる</b> 黒帯(.mt-banner の出しっぱなし)</p>
    </div>
    <div class="pcard">
      <h3>区切りの間(0.3秒)</h3>
      <div class="demo" style="background:linear-gradient(#a5d8ff,#a9dd7e);position:relative">
        <div style="position:absolute;inset:0;background:rgba(255,255,255,.5);border-radius:14px"></div>
        <div style="position:relative;font-size:15px;font-weight:800;color:#6a5c4c">UI が ぜんぶ 消える</div>
      </div>
      <p class="spec"><b>いつ</b> 決着の白フラッシュの直後、次の表示が出る前<br><b>長さ</b> 0.3秒<br><b>消すもの</b> スコアチップ・時間・テロップ(ステージだけ残す)<br><b>ねらい</b> ここが競技の切れ目だと体で分かる</p>
    </div>
    <div class="pcard">
      <h3>勝ちカード</h3>
      <div class="demo" style="min-height:120px">
        <div style="width:300px;background:rgba(255,255,255,.96);border:4px solid #4dabf7;border-radius:20px;box-shadow:0 6px 0 #1c7ed6;padding:8px 14px 12px;text-align:center">
          <div style="font-size:14px;font-weight:800;color:#8a7a68">たまいれ</div>
          <div style="font-size:28px;font-weight:800;color:#1c7ed6">あおチーム の かち!</div>
          <div style="font-size:15px;font-weight:800;color:#6a5c4c">3 - 6</div>
        </div>
      </div>
      <p class="spec"><b>位置</b> 上1/3(y=120)。中央には出さない<br><b>中身</b> 競技名・勝ち・数字の3つだけ<br><b>出方</b> 下からせり上がり + 3%の行き過ぎ</p>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:16px">
    <div class="pcard" style="background:#f3fbf4;border-color:#51cf66;box-shadow:0 6px 0 #2f9e44">
      <h3>勝ち負けの見せ方(暗くしない)</h3>
      <p class="spec" style="margin-top:6px">
        <b>やめる</b> 負けた側を暗くする・ぼかす・グレーにする。画面が暗くなり、負けた子の絵が見えなくなる。<br>
        <b>勝った側</b> キャラが跳ねる / 紙吹雪 / チーム色の光(js/meet.js の Meet.celebrate と同じグラデ) / 勝ちカード。<br>
        <b>負けた側</b> 明るいまま。拍手のしぐさ(上下に揺れる)と「よく がんばった!」のフキダシ。<br>
        差は<b>明るさではなく派手さ</b>でつける。どちらの絵もちゃんと見えている状態を保つ。
      </p>
    </div>
    <div class="pcard" style="background:#fff9e8;border-color:#ffd43b;box-shadow:0 6px 0 #e8a805">
      <h3>取るもの</h3>
      <p class="spec" style="margin-top:6px">
        <b>.mt-score</b>(総合点)… 競技中は出さない。<b>全競技が終わった最後の総合結果で1回だけ</b>大きく見せる。<br>
        <b>#progLbl</b> … 進行ドットに置き換え。<br>
        <b>.mt-hud</b> のチーム名 … スコアチップに統合。<br>
        <b>.mt-banner</b> の黒帯 … 丸いテロップに。<br>
        <b>結果カードの sub</b>(「あか3こ-あお5こ / +2てん」)… 数字だけ残す。
      </p>
    </div>
  </div>

  <div class="cap" style="position:absolute;left:28px;bottom:20px;width:1224px">
    すべて既存のトークンのまま。チーム色 #ff6b9d / #4dabf7、フチは濃い色 #d6336c / #1c7ed6、立体は box-shadow 0 6px 0、丸み 22px、フォントもそのまま。<b>新しい色やフォントは1つも増やしていない。</b>
  </div>
</div>
"""

FILES = {
    "Main.dc.html": page(main_css, main_body),
    "Play.dc.html": page("", play_body),
    "Rule.dc.html": page(rule_css, rule_body),
    "Flow.dc.html": page(flow_css, flow_body, props='{"$preview":{"width":1960,"height":620}}'),
    "Motion.dc.html": page(motion_css, motion_body,
        props='{"speed":{"editor":"range","default":1,"min":0.5,"max":2,"step":0.25,"unit":"x","section":"うごき"},"$preview":{"width":1280,"height":880}}',
        vals="    const sp = this.props.speed ?? 1;\n    return { dur: (7.5 / sp).toFixed(2) + 's' };"),
    "Parts.dc.html": page(parts_css, parts_body, props='{"$preview":{"width":1280,"height":1000}}'),
}
for name, text in FILES.items():
    open(name, "w").write(text)
    print(name, len(text))
