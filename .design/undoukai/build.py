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

def stage(dim=False):
    dimr = " dimred" if dim else ""
    dimb = " dimblue" if dim else ""
    figs = "".join(figure(x, y, "red", n, "fig" + dimr) for x, y, n in REDS)
    figs += "".join(figure(x, y, "blue", n, "fig" + dimb) for x, y, n in BLUES)
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
  <div class="mark" style="left:1022px;top:64px"><b>1</b>チーム名と 色が 2かしょで だぶる</div>
  <div class="mark" style="left:912px;top:246px;max-width:340px"><b>2</b>カードが かごと あたまの ちょうど うえ</div>
  <div class="mark" style="left:24px;top:594px"><b>3</b>黒おびは 出っぱなし(がめんの 8%)</div>
  <div class="mark" style="left:24px;top:116px"><b>4</b>いちどに 6つ 読ませている</div>

  <div style="position:absolute;left:0;top:720px;width:1280px;height:160px;padding:16px 28px;box-sizing:border-box;background:#fffdf5;border-top:4px solid #e8cbae">
    <div style="display:flex;align-items:baseline;gap:12px">
      <span class="tag bad">いま</span>
      <div style="font-size:22px;font-weight:800">きょうぎ中に 6つの ことを 同時に 言っている</div>
    </div>
    <div class="cap" style="margin-top:8px">
      ① そうごう点(2てん-2てん)と ② きょうぎ点(3こ-5こ)が べつの 意味なのに 見た目が にている。チーム名・色マークは それぞれに 入っていて <b>2かい ずつ</b> 出る。<br>
      ③ しんこう(だい2/ぜん4)は しょうかいカードで 2びょう前に 言ったばかり。④ テロップは 出来事が なくても 出っぱなし。⑤ けっかカードは がめんの まんなか=かごと キャラの あたまの 上に かぶる。
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
      <span class="tag good">ていあん</span>
      <div style="font-size:22px;font-weight:800">プレー中に つねに 出るのは「2つの すうじ」だけ</div>
    </div>
    <div class="cap" style="margin-top:8px">
      チーム名は <b>色そのもの</b>に まかせて 文字を やめる(「あか」「あお」の 2文字だけ のこす)。そうごう点は きょうぎ中は 出さず、<b>上の 4つの ドット</b>で 「いま 何きょうぎ目か」だけ しめす。<br>
      テロップは 出来事が おきた ときだけ 下から 出て 2.4びょうで きえる。黒おびを やめ、まるい 白ふきだし + チーム色のふちに して、じめんが すけて 見えるように する。
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
    <div class="zlabel" style="left:28px;top:34px">0-104px:UIおび(スコアだけ)</div>
    <div class="zlabel" style="left:28px;top:340px;border-color:#2f9e44;color:#2f9e44">104-630px:キャラの ばしょ / なにも おかない</div>
    <div class="zlabel" style="left:28px;top:658px;border-color:#1c7ed6;color:#1c7ed6">630-720px:テロップおび(出来事の ときだけ)</div>
    <div style="position:absolute;left:832px;top:120px;width:420px;background:rgba(255,255,255,.9);border:4px dashed #2f9e44;border-radius:24px;padding:12px 18px 14px;text-align:center">
      <div style="font-size:15px;font-weight:800;color:#2f9e44">カードを 出す ときは ここ(上1/3)</div>
      <div style="font-size:13px;color:#6a5c4c;margin-top:4px;line-height:1.5">キャラは かならず 下半分に のこす。<br>まんなかに 出さない。</div>
    </div>
  </div>

  <div style="position:absolute;left:0;top:720px;width:1280px;height:160px;padding:14px 24px;box-sizing:border-box;background:#fffdf5;border-top:4px solid #e8cbae;display:flex;gap:14px">
    <div class="rulecard" style="flex:1">
      <h3>1. つねに 出すのは 1しゅるいだけ</h3>
      <p>「いまの きょうぎの てんすう」だけを 常設。そうごう点・きょうぎ名・じゅんばん・せつめいは、それを 見せる 場面でしか 出さない。</p>
    </div>
    <div class="rulecard" style="flex:1">
      <h3>2. キャラの おびには 何も おかない</h3>
      <p>y=104-630 は キャラと かごの 場所。文字・カード・ボタンを ここに 置かない。かさねるなら 上1/3 か 下の おび。</p>
    </div>
    <div class="rulecard" style="flex:1">
      <h3>3. 同じことを 2かい 言わない</h3>
      <p>チーム名は 色で。てんすうは 数字で。マーク(🔴🔵)と 名前と 色の 3かさねを やめて 1つに する。</p>
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
    .rail { position: absolute; left: 40px; top: 470px; width: 1520px; height: 6px; border-radius: 3px; background: #e8cbae; }
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
    (40, "0.0s", "しょうかい", "きょうぎ名と アイコンだけ。スコアも しんこうも まだ 出さない。",
     mini([46,74,102],[170,198,226],
          '<div style="position:absolute;left:52px;top:34px;width:176px;background:rgba(255,255,255,.95);border:3px solid #e8cbae;border-radius:12px;padding:6px 8px;text-align:center"><div style="font-size:10px;color:#8a7a68;font-weight:800">だい2きょうぎ</div><div style="font-size:20px;font-weight:800">たまいれ</div></div>'),
     "出るもの 1つ", False),
    (360, "1.2s", "カードが スコアに なる", "カードが しゅっと 上に すいこまれて、そのまま スコアおびに かわる。目が 上に ついていく。",
     mini([46,74,102],[170,198,226],
          '<div style="position:absolute;left:88px;top:10px;width:104px;height:30px;background:rgba(255,255,255,.95);border:3px solid #e8cbae;border-radius:10px;opacity:.55;transform:scale(.8)"></div>'
          '<div style="position:absolute;left:8px;top:8px;width:44px;height:22px;border-radius:8px;background:#ff6b9d"></div>'
          '<div style="position:absolute;left:228px;top:8px;width:44px;height:22px;border-radius:8px;background:#4dabf7"></div>'),
     "出るもの 1つ", False),
    (680, "1.8s", "スタート!", "まんなかに 1ことだけ 0.6びょう。ここで 目を ステージに もどす。",
     mini([46,74,102],[170,198,226],
          '<div style="position:absolute;left:0;top:52px;width:280px;text-align:center;font-size:30px;font-weight:800;color:#d6336c;-webkit-text-stroke:4px #fff;paint-order:stroke fill">スタート!</div>'
          '<div style="position:absolute;left:8px;top:8px;width:44px;height:22px;border-radius:8px;background:#ff6b9d"></div>'
          '<div style="position:absolute;left:228px;top:8px;width:44px;height:22px;border-radius:8px;background:#4dabf7"></div>'),
     "出るもの 2つ", False),
    (1000, "プレー中", "あそんでいる あいだ", "スコア2つと じかんだけ。出来事が あった ときだけ テロップが 2.4びょう。",
     mini([46,74,102],[170,198,226],
          '<div style="position:absolute;left:8px;top:8px;width:44px;height:22px;border-radius:8px;background:#ff6b9d"></div>'
          '<div style="position:absolute;left:118px;top:8px;width:44px;height:20px;border-radius:8px;background:#fff;border:2px solid #e8cbae"></div>'
          '<div style="position:absolute;left:228px;top:8px;width:44px;height:22px;border-radius:8px;background:#4dabf7"></div>'
          '<div style="position:absolute;left:60px;bottom:6px;width:160px;height:20px;border-radius:999px;background:rgba(255,253,245,.95);border:2px solid #4dabf7"></div>'),
     "出るもの 2-3つ", False),
    (1320, "決着", "きまった しゅんかん", "白フラッシュ → まけた側を うすく → かちカードが 上1/3に せり上がる。ここで 一気に もりあげる。",
     mini([],[170,198,226],
          '<div style="position:absolute;left:0;top:0;width:280px;height:158px;background:radial-gradient(circle at 70% 60%,rgba(255,255,255,0) 30%,rgba(20,12,6,.45) 100%)"></div>'
          '<div style="position:absolute;left:40px;top:8px;width:26px;height:26px;border-radius:8px;background:#ff8fab;opacity:.3"></div>'
          '<div style="position:absolute;left:44px;top:34px;width:192px;background:rgba(255,255,255,.96);border:3px solid #4dabf7;border-radius:12px;padding:6px;text-align:center"><div style="font-size:17px;font-weight:800;color:#1c7ed6">あおチーム の かち!</div></div>'),
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

flow_body = f"""<div style="position:relative;width:1600px;height:620px;background:#fffdf5;padding:0">
  <div style="position:absolute;left:40px;top:26px">
    <span class="tag good">ていあん</span>
    <span style="font-size:24px;font-weight:800;margin-left:12px">じかんで わける — 同時に 読ませるのは 最大2つ</span>
  </div>
{frames_html}
  <div class="rail"></div>
  <div class="tick" style="left:132px"></div><div class="tlab" style="left:142px">0.0</div>
  <div class="tick" style="left:452px"></div><div class="tlab" style="left:462px">1.2</div>
  <div class="tick" style="left:772px"></div><div class="tlab" style="left:782px">1.8</div>
  <div class="tick" style="left:1092px;border-color:#51cf66"></div><div class="tlab" style="left:1102px">2.4 - おわりまで</div>
  <div class="tick" style="left:1412px;border-color:#ffd43b"></div><div class="tlab" style="left:1422px">きまった しゅんかん</div>
  <div class="cap" style="position:absolute;left:40px;top:534px;width:1520px">
    いまは この 5つの 場面 ぜんぶで 同じ UI が 出っぱなしに なっている。<b>出す・消す の タイミングを ずらすだけで、読ませる 量は 6つ → 最大2つに 減る。</b>減らした ぶん、決着の しゅんかんに 全部を つかえる。
  </div>
</div>
"""

# ---------------------------------------------------------------
# 5. Motion:決着の うごき(じどう再生)
# ---------------------------------------------------------------
motion_css = """
    .stagewrap { position: absolute; left: 0; top: 0; width: 1280px; height: 720px; overflow: hidden; }
    .fig { animation: none; }
    .dimred { animation: dimout var(--t) linear infinite; }
    .anim { animation-duration: var(--t); animation-timing-function: linear; animation-iteration-count: infinite; }
    @keyframes dimout {
      0%, 40% { opacity: 1; filter: none; }
      46%, 88% { opacity: .28; filter: grayscale(.7); }
      96%, 100% { opacity: 1; filter: none; }
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
      14%, 34% { opacity: 1; transform: translateY(0); }
      38%, 100% { opacity: 0; transform: translateY(72px); }
    }
    @keyframes flash {
      0%, 39% { opacity: 0; }
      41% { opacity: .92; }
      46%, 100% { opacity: 0; }
    }
    @keyframes spot {
      0%, 42% { opacity: 0; }
      50%, 88% { opacity: 1; }
      96%, 100% { opacity: 0; }
    }
    @keyframes card {
      0%, 50% { opacity: 0; transform: translateY(70px) scale(.92); }
      55% { opacity: 1; transform: translateY(-10px) scale(1.03); }
      58%, 88% { opacity: 1; transform: translateY(0) scale(1); }
      94%, 100% { opacity: 0; transform: translateY(70px) scale(.92); }
    }
    @keyframes timer0 { 0%, 36% { opacity: 1; } 38%, 92% { opacity: 0; } 98%, 100% { opacity: 1; } }
    @keyframes conf1 { 0%, 54% { opacity: 0; transform: translateY(-40px) rotate(0deg); } 57% { opacity: 1; } 84%, 100% { opacity: 0; transform: translateY(560px) rotate(420deg); } }
    @keyframes conf2 { 0%, 56% { opacity: 0; transform: translateY(-40px) rotate(0deg); } 59% { opacity: 1; } 88%, 100% { opacity: 0; transform: translateY(600px) rotate(-380deg); } }
    @keyframes conf3 { 0%, 58% { opacity: 0; transform: translateY(-40px) rotate(0deg); } 61% { opacity: 1; } 90%, 100% { opacity: 0; transform: translateY(520px) rotate(300deg); } }
    @keyframes beat {
      0%, 8% { background: #fff; }
      10%, 22% { background: #ffd43b; }
      26%, 100% { background: #fff; }
    }
"""
CONF = [(120,"#ff6b9d","conf1"),(240,"#ffd43b","conf2"),(360,"#4dabf7","conf3"),(480,"#51cf66","conf1"),
        (600,"#ff922b","conf2"),(720,"#9775fa","conf3"),(840,"#ff6b9d","conf1"),(960,"#ffd43b","conf2"),
        (1080,"#4dabf7","conf3"),(1180,"#51cf66","conf1")]
conf_html = "".join(
    f'<div class="anim" style="position:absolute;left:{x}px;top:-40px;width:14px;height:20px;border-radius:3px;background:{c};animation-name:{k};z-index:60"></div>'
    for x, c, k in CONF)

motion_body = f"""<div style="position:relative;width:1280px;height:880px;background:#fffdf5;--t:{{{{dur}}}}">
  <div class="stagewrap">
{stage(dim=True)}
    <!-- スポットライト:まけた側を くらく -->
    <div class="anim" style="position:absolute;left:0;top:0;width:1280px;height:720px;animation-name:spot;background:radial-gradient(circle 420px at 960px 470px,rgba(0,0,0,0) 40%,rgba(24,14,6,.52) 100%);z-index:25"></div>
    <!-- 白フラッシュ -->
    <div class="anim" style="position:absolute;left:0;top:0;width:1280px;height:720px;animation-name:flash;background:#fff;z-index:55"></div>
{conf_html}

    <!-- スコア(あか) -->
    <div class="anim dimred" style="position:absolute;left:36px;top:36px;display:flex;align-items:center;gap:12px;background:#ff6b9d;border:4px solid #d6336c;border-radius:22px;box-shadow:0 6px 0 #d6336c;padding:6px 22px 8px;color:#fff;z-index:30">
      <span style="font-size:17px;font-weight:800;opacity:.92">あか</span>
      <span style="font-size:52px;font-weight:800;line-height:1">5</span>
    </div>
    <!-- のこり じかん -->
    <div class="anim" style="position:absolute;left:576px;top:40px;width:128px;text-align:center;background:#fff;border-radius:999px;box-shadow:0 3px 0 rgba(150,110,70,.16);padding:4px 0 6px;animation-name:timer0;z-index:30">
      <div style="font-size:40px;font-weight:800;line-height:1.05;color:#4a3f35">3</div>
      <div style="font-size:12px;font-weight:800;color:#8a7a68;letter-spacing:.08em">のこり びょう</div>
    </div>
    <!-- スコア(あお)+ ポップ と リング -->
    <div style="position:absolute;left:1064px;top:36px;z-index:30">
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
    <!-- かちカード(上1/3) -->
    <div class="anim" style="position:absolute;left:340px;top:120px;width:600px;box-sizing:border-box;background:rgba(255,255,255,.96);border:5px solid #4dabf7;border-radius:26px;box-shadow:0 8px 0 #1c7ed6;padding:16px 30px 20px;text-align:center;animation-name:card;z-index:58">
      <div style="font-size:21px;font-weight:800;color:#8a7a68">たまいれ</div>
      <div style="font-size:50px;font-weight:800;color:#1c7ed6;line-height:1.15">あおチーム の かち!</div>
      <div style="font-size:22px;font-weight:800;color:#6a5c4c">3 - 6</div>
    </div>
  </div>

  <div style="position:absolute;left:0;top:720px;width:1280px;height:160px;padding:16px 28px;box-sizing:border-box;background:#fffdf5;border-top:4px solid #e8cbae">
    <div style="display:flex;align-items:baseline;gap:12px">
      <span class="tag good">うごき</span>
      <div style="font-size:22px;font-weight:800">目を つれていく 4つの うごき(じどう再生)</div>
    </div>
    <div class="cap" style="margin-top:8px">
      <b>1. ポップ+リング</b>(0.9s) 入った 瞬間に すうじが はねて、チーム色の わが ひろがる。どっちが 入れたか 一目で わかる。 /
      <b>2. テロップ</b>(1.0-2.6s) 下から 出て 下へ 消える。目が ステージへ もどる。<br>
      <b>3. 白フラッシュ</b>(3.0s) 0.2びょうだけ。ここで 場面が かわる ことを からだで わからせる。 /
      <b>4. スポット+せり上がり</b>(3.3s-) まけた側を うすく して、かちカードが 下から せり上がる。まんなかは あけて キャラを 見せたまま。
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
parts_body = """<div style="position:relative;width:1280px;height:900px;background:#fffdf5;padding:26px 28px;box-sizing:border-box">
  <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:16px">
    <span class="tag good">ぶひん</span>
    <span style="font-size:24px;font-weight:800">つかう ぶひんは 5つだけ</span>
  </div>
  <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px">
    <div class="pcard">
      <h3>スコアチップ</h3>
      <div class="demo">
        <div style="display:flex;align-items:center;gap:12px;background:#ff6b9d;border:4px solid #d6336c;border-radius:22px;box-shadow:0 6px 0 #d6336c;padding:6px 22px 8px;color:#fff">
          <span style="font-size:17px;font-weight:800">あか</span><span style="font-size:52px;font-weight:800;line-height:1">3</span>
        </div>
      </div>
      <p class="spec"><b>いち</b> 左上 36,36 / 右上 1064,36<br><b>色</b> チーム色ベタ + 濃い色の ふち(既存の .btn と 同じ 立体)<br><b>やめる</b> 🔴🔵マーク・フルのチーム名</p>
    </div>
    <div class="pcard">
      <h3>のこり じかん</h3>
      <div class="demo">
        <div style="width:128px;text-align:center;background:#fff;border-radius:999px;box-shadow:0 3px 0 rgba(150,110,70,.16);padding:4px 0 6px">
          <div style="font-size:40px;font-weight:800;line-height:1.05">12</div>
          <div style="font-size:12px;font-weight:800;color:#8a7a68;letter-spacing:.08em">のこり びょう</div>
        </div>
      </div>
      <p class="spec"><b>いち</b> 上ちゅうおう 576,40<br><b>10びょうを きったら</b> 数字を #d6336c に して 1びょうごとに 1.12ばい ふくらむ<br><b>ないとき</b> 出さない(かけっこ・リレー)</p>
    </div>
    <div class="pcard">
      <h3>しんこうドット</h3>
      <div class="demo">
        <div style="display:flex;gap:7px">
          <div style="width:11px;height:11px;border-radius:50%;background:#fff;box-shadow:0 0 0 3px rgba(150,110,70,.22)"></div>
          <div style="width:11px;height:11px;border-radius:50%;background:#ffd43b;box-shadow:0 0 0 3px #e8a805"></div>
          <div style="width:11px;height:11px;border-radius:50%;background:rgba(255,255,255,.5);box-shadow:0 0 0 3px rgba(150,110,70,.16)"></div>
          <div style="width:11px;height:11px;border-radius:50%;background:rgba(255,255,255,.5);box-shadow:0 0 0 3px rgba(150,110,70,.16)"></div>
        </div>
      </div>
      <p class="spec"><b>かわり</b> 「だい2きょうぎ / ぜん4きょうぎ」の 文字を なくす<br><b>すんだ きょうぎ</b> は 白、いまは 黄、これから は うすい<br><b>おきかえ先</b> undoukai.html の #progLbl</p>
    </div>
    <div class="pcard">
      <h3>テロップ(2.4びょう)</h3>
      <div class="demo">
        <div style="text-align:center;background:rgba(255,253,245,.94);border:4px solid #4dabf7;border-radius:999px;box-shadow:0 6px 0 rgba(28,126,214,.28);padding:8px 24px 10px;font-size:22px;font-weight:800;color:#1c7ed6">さくら、ナイスシュート!</div>
      </div>
      <p class="spec"><b>いち</b> 下から 72px せり上がり、y=642<br><b>ふち</b> しゃべった チームの 色<br><b>きえかた</b> 2.4びょう後に 下へ / つぎが 来たら すぐ 入れかえ<br><b>やめる</b> 黒おび(.mt-banner の 出っぱなし)</p>
    </div>
    <div class="pcard">
      <h3>かちカード</h3>
      <div class="demo" style="min-height:120px">
        <div style="width:300px;background:rgba(255,255,255,.96);border:4px solid #4dabf7;border-radius:20px;box-shadow:0 6px 0 #1c7ed6;padding:8px 14px 12px;text-align:center">
          <div style="font-size:14px;font-weight:800;color:#8a7a68">たまいれ</div>
          <div style="font-size:28px;font-weight:800;color:#1c7ed6">あおチーム の かち!</div>
          <div style="font-size:15px;font-weight:800;color:#6a5c4c">3 - 6</div>
        </div>
      </div>
      <p class="spec"><b>いち</b> 上1/3(y=120)。まんなかに 出さない<br><b>中身</b> きょうぎ名・かち・すうじ の 3つだけ(せつめい文は 入れない)<br><b>出かた</b> 下から せり上がり + 3%の いきすぎ</p>
    </div>
    <div class="pcard" style="background:#fff9e8;border-color:#ffd43b;box-shadow:0 6px 0 #e8a805">
      <h3>とる もの</h3>
      <p class="spec" style="margin-top:6px">
        <b>.mt-score</b>(そうごう点)… きょうぎ中は 出さない。きょうぎと きょうぎの あいだ だけ、大きく 1回。<br>
        <b>#progLbl</b> … ドットに おきかえ。<br>
        <b>.mt-hud</b> の チーム名 … スコアチップに 統合。<br>
        <b>.mt-banner</b> の 黒おび … まるい テロップに。<br>
        <b>けっかカードの sub</b>(「あか3こ-あお5こ / +2てん」)… 数字だけ のこす。
      </p>
    </div>
  </div>
  <div class="cap" style="position:absolute;left:28px;bottom:22px;width:1224px">
    ぜんぶ 既存の トークンの まま:チーム色 #ff6b9d / #4dabf7、ふちは 濃い色 #d6336c / #1c7ed6、立体は box-shadow 0 6px 0、まるみ 22px、フォントは そのまま。<b>あたらしい 色や フォントは 1つも ふやしていない。</b>
  </div>
</div>
"""

FILES = {
    "Main.dc.html": page(main_css, main_body),
    "Play.dc.html": page("", play_body),
    "Rule.dc.html": page(rule_css, rule_body),
    "Flow.dc.html": page(flow_css, flow_body, props='{"$preview":{"width":1600,"height":620}}'),
    "Motion.dc.html": page(motion_css, motion_body,
        props='{"speed":{"editor":"range","default":1,"min":0.5,"max":2,"step":0.25,"unit":"x","section":"うごき"},"$preview":{"width":1280,"height":880}}',
        vals="    const sp = this.props.speed ?? 1;\n    return { dur: (7.5 / sp).toFixed(2) + 's' };"),
    "Parts.dc.html": page(parts_css, parts_body, props='{"$preview":{"width":1280,"height":900}}'),
}
for name, text in FILES.items():
    open(name, "w").write(text)
    print(name, len(text))
