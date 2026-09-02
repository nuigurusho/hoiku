"use strict";
/* ============================================================
   editors.js — 絵を さわる ための エディタ ぐんを まとめたもの
   「とりこみ(admin)」と「つくる(create)」の りょうほうから つかう。
     Editors.openRig(rec)        うごきせってい
     Editors.openSpot(rec)       まちがいスポット
     Editors.openFuku(rec)       ふくわらいパーツ
     Editors.openVoice(rec)      キャラの こえ
     Editors.openCrop(pages, name, {cat})  きりだし(catで 保存先を かためる)
     Editors.chooseFiles(cat)    ファイルを えらんで とりこむ
     Editors.chooseCamera(cat)   カメラで とって きりだす
     Editors.cropRecord(rec,cat) すでにある えから きりだす
     Editors.initQuiz()          クイズ作成UI(ページに あれば)
     Editors.mountLists(defs,opt) つくる画面の いちらん(1行=1まいの え + 編集ボタン)
     Editors.onChange            なにか かわったら よばれる(いちらんの さいびょうが用)
   ============================================================ */
(function () {
const $ = (id) => document.getElementById(id);
const changed = () => Editors.onChange ? Editors.onChange() : undefined;

/* モーダルと かくれた ファイル入力を ページに いれておく */
document.body.insertAdjacentHTML("beforeend", `
<!-- うごきせってい(リグ編集)モーダル -->
<div class="modal editor-modal hidden" id="rigModal" role="dialog" aria-modal="true" aria-label="うごき">
  <div class="panel rig-panel">
    <div class="rig-workspace">
      <div class="rig-preview-wrap">
        <p><b id="rigPvLabel">歩きプレビュー</b></p>
        <canvas id="rigPreview" width="240" height="320"></canvas>
      </div>
      <section class="rig-visual" aria-label="キャラクターの動き調整">
        <div class="rig-types" id="rigTypes" aria-label="動きのタイプ">
          <button class="btn purple" data-type="biped">🧍にんげん</button>
          <button class="btn pink" data-type="skirt">👗スカート</button>
          <button class="btn orange" data-type="quad">🐕どうぶつ</button>
          <button class="btn blue" data-type="float">👻ふわふわ</button>
          <button class="btn yellow" data-type="butterfly">🦋ちょうちょ</button>
        </div>
        <div class="rig-flex"><canvas id="rigCanvas" class="edit-canvas" width="380" height="480"></canvas></div>
      </section>
      <aside class="rig-side">
        <section class="advanced-settings" id="rigAdvanced">
          <div class="advanced-title">高度な設定</div>
          <div class="rig-advanced-scroll">
            <div class="advanced-block">
              <h3>絵のかたむき</h3>
              <div class="advanced-sliders">
                <label>↻ 回転 <output id="rigRotateOut">0°</output><input id="rigRotate" type="range" min="-30" max="30" step="1" value="0"></label>
              </div>
            </div>
            <div class="advanced-block trim-block">
              <button class="btn blue" type="button" id="rigTrimWhitespace">余白をカット</button>
              <span class="note">絵のまわりの空白だけを詰めます</span>
            </div>
            <div class="advanced-block">
              <h3>白い体を残して背景を抜く</h3>
              <p class="note">輪郭が薄いときだけ白の判定と隙間補正を調整します。</p>
              <div class="cutout-mode" id="cutoutModes">
                <label class="radio-row"><input type="radio" name="cutoutMode" value="edge"> <span><b>外側の白だけ抜く</b><small>白い顔・服・体を残す</small></span></label>
                <label class="radio-row"><input type="radio" name="cutoutMode" value="legacy"> <span><b>白をすべて抜く</b><small>これまでと同じ方式</small></span></label>
              </div>
              <div class="advanced-sliders">
                <label>白の判定 <output id="cutoutThresholdOut"></output><input id="cutoutThreshold" type="range" min="170" max="250" step="1"></label>
                <label>輪郭の隙間を閉じる <output id="cutoutGapOut"></output><input id="cutoutGap" type="range" min="0" max="8" step="1"></label>
              </div>
              <canvas id="cutoutCanvas" class="edit-canvas cutout-canvas" width="520" height="420"></canvas>
              <div class="cutout-tools">
                <button class="btn green active" type="button" id="cutoutKeep">白を残す筆</button>
                <button class="btn gray" type="button" id="cutoutErase">背景を消す筆</button>
                <label>筆の太さ <input id="cutoutBrush" type="range" min="6" max="54" step="2" value="24"></label>
                <button class="btn yellow" type="button" id="cutoutReset">筆をリセット</button>
              </div>
            </div>
            <div class="advanced-block" id="armAdvancedBlock">
              <h3>腕も動かす</h3>
              <label class="toggle-row"><input id="rigArmsEnabled" type="checkbox"> <span>左右の腕を肩から動かす</span></label>
              <div class="advanced-sliders">
                <label>手の下まで <output id="rigArmBottomOut"></output><input id="rigArmBottom" type="range" min="45" max="100" step="1" disabled></label>
              </div>
            </div>
            <div class="advanced-block" id="legAdvancedBlock">
              <h3>足の付け根</h3>
              <p class="note">左右の足が回る位置を合わせます。中央の絵にある丸もドラッグできます。</p>
              <div class="advanced-sliders">
                <label>左足 <output id="rigLegLeftOut"></output><input id="rigLegLeft" type="range" min="5" max="95" step="1"></label>
                <label>右足 <output id="rigLegRightOut"></output><input id="rigLegRight" type="range" min="5" max="95" step="1"></label>
              </div>
            </div>
          </div>
        </section>
      </aside>
    </div>
    <div class="row rig-actions">
      <button class="btn orange" type="button" id="rigFlip">↔ 左右はんてん</button>
      <button class="btn green" id="rigSave">✔ 保存する</button>
      <button class="btn gray" id="rigCancel">キャンセル</button>
    </div>
  </div>
</div>

<!-- まちがいスポット編集モーダル -->
<div class="modal editor-modal hidden" id="spotModal">
  <div class="panel editor-panel spot-panel">
    <h2>差分画像と まちがいスポット</h2>
    <p class="note">右の絵で違う場所をタップします。画像ごとに最大8個まで設定できます。</p>
    <div id="spotVariants" style="display:flex;gap:8px;overflow-x:auto;margin:8px 0"></div>
    <div class="row">
      <button class="btn blue" id="spotAdd">＋ 差分画像を追加</button>
      <button class="btn gray hidden" id="spotRemove">この差分を外す</button>
      <input id="spotFiles" type="file" accept="image/*" multiple hidden>
      <input id="spotCamera" type="file" accept="image/*" capture="environment" hidden>
    </div>
    <div style="display:flex;gap:12px;justify-content:center;align-items:flex-start;flex-wrap:wrap">
      <div><p style="text-align:center;margin:4px"><b>もとの絵</b></p><canvas id="spotBaseCanvas" class="edit-canvas" width="520" height="360"></canvas></div>
      <div><p style="text-align:center;margin:4px"><b id="spotDiffLabel">差分の絵</b></p><canvas id="spotCanvas" class="edit-canvas" width="520" height="360"></canvas></div>
    </div>
    <div class="row">
      <button class="btn green" id="spotSave">✔ 保存する</button>
      <button class="btn gray" id="spotCancel">キャンセル</button>
    </div>
  </div>
</div>

<!-- ふくわらいパーツ編集モーダル -->
<div class="modal editor-modal hidden" id="fukuModal">
  <div class="panel editor-panel fuku-panel">
    <h2>パーツ設定</h2>
    <p class="note">
      下のボタンで種類を選んで、絵の上をドラッグして目・鼻・口を囲みます(最大8個)。
      囲んだ枠をタップすると種類が変わり、「そのほか」の次で消せます。
    </p>
    <div class="rig-types" id="fukuKinds">
      <button class="btn blue"   data-kind="め">め</button>
      <button class="btn green"  data-kind="まゆげ">まゆげ</button>
      <button class="btn orange" data-kind="はな">はな</button>
      <button class="btn pink"   data-kind="くち">くち</button>
      <button class="btn purple" data-kind="そのほか">そのほか</button>
    </div>
    <canvas id="fukuCanvas" class="edit-canvas" width="640" height="440"></canvas>
    <div class="row">
      <button class="btn green" id="fukuSave">✔ 保存する</button>
      <button class="btn gray" id="fukuCancel">キャンセル</button>
    </div>
  </div>
</div>

<!-- キャラの こえ 登録モーダル -->
<div class="modal editor-modal hidden" id="voiceModal">
  <div class="panel editor-panel voice-panel">
    <h2>🎤 こえの とうろく</h2>
    <p class="note">
      キャラの こえを 4しゅるい ろくおんできます(さいちょう10びょう)。
      「みんなの せかい」で タッチしたときや、じゃんけん・レースの かちまけで つかわれます。<br>
      マイクは <b>localhost か https</b> で ひらいたときだけ つかえます。
      こえは この たんまつの なか(IndexedDB)にだけ ほぞんされ、公開サイトには のりません。
    </p>
    <div id="voiceRows"></div>
    <div class="row">
      <button class="btn gray" id="voiceClose">とじる</button>
    </div>
  </div>
</div>

<!-- きりだし(トリミング)モーダル -->
<div class="modal editor-modal hidden" id="cropModal">
  <div class="panel editor-panel crop-panel">
    <h2 id="cropTitle">✂ 切り出して取り込む</h2>
    <p class="note">ドラッグで囲んで「切り出して保存」。1枚から何回でも切り出せます。</p>
    <div class="crop-destination"><span>取り込み先</span><strong id="cropDestination"></strong></div>
    <p style="margin:4px 0" id="cropCatRow">
      <label class="radio"><input type="radio" name="cropCat" value="char" checked> 🧍 キャラ</label>
      <label class="radio"><input type="radio" name="cropCat" value="bg"> 🏞️ ステージ</label>
      <label class="radio"><input type="radio" name="cropCat" value="pic"> 🖼️ イラスト</label>
      <label class="radio"><input type="radio" name="cropCat" value="fuku"> 😀 キャラクターの顔</label>
    </p>
    <canvas id="cropCanvas" class="edit-canvas" width="660" height="460"></canvas>
    <div class="row">
      <button class="btn yellow" id="cropRotate">↻ 回転</button>
      <button class="btn green" id="cropSave">✂ 切り出して保存</button>
      <button class="btn blue" id="cropWhole">□ ページ全体を保存</button>
      <button class="btn purple hidden" id="cropNext">次のページ ▶</button>
      <button class="btn gray" id="cropClose">閉じる</button>
    </div>
  </div>
</div>
<!-- 切り出したキャラクターの作品情報 -->
<div class="modal hidden" id="cropMetaModal">
  <div class="panel" style="width:min(560px, 94vw)">
    <h2>名前設定</h2>
    <div class="import-meta" style="grid-template-columns:1fr;text-align:left">
      <label><span>作品名</span><input id="cropWorkName" type="text" maxlength="40" placeholder="例: にじいろちゃん"></label>
      <label><span>作者名 <small>（任意）</small></span><input id="cropAuthor" type="text" maxlength="40" placeholder="例: さくらぐみ"></label>
    </div>
    <div class="row">
      <button class="btn green" id="cropMetaSave">✔ 保存する</button>
      <button class="btn gray" id="cropMetaBack">もどる</button>
    </div>
  </div>
</div>
<input type="file" id="edFileInput" accept="image/*,.pdf,application/pdf" multiple hidden>
<input type="file" id="edCameraInput" accept="image/*" capture="environment" hidden>
`);

/* ---------- とりこみ ---------- */
async function importFiles(files, cat, meta) {
  if (!files.length) return;
  meta = meta || {};
  // PDFが1ファイルなら従来どおり切り出し画面へ。
  // 複数PDFはモーダルが上書きされないよう、全ページを元素材へ一括保存する。
  const pdfs = files.filter((f) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name || ""));
  files = files.filter((f) => !pdfs.includes(f));
  if (pdfs.length === 1) {
    try {
      const f = pdfs[0];
      const pages = await pdfToCanvases(f);
      openCrop(pages, meta.name || (f.name || "スキャン").replace(/\.pdf$/i, ""), {
        cat,
        author: meta.author || "",
      });
    } catch (e) {
      const f = pdfs[0];
      alert("PDFの読み込みに失敗しました: " + (f.name || "") + "\n" + ((e && e.message) || ""));
    }
  } else if (pdfs.length > 1) {
    await importPdfPagesAsSources(pdfs);
  }
  if (!files.length) return;
  const existing = await Store.all(cat);
  let n = existing.length;
  let ok = 0;
  const fails = [];
  for (const f of files) {
    try {
      const maxDim = { char: 900, src: 1600 }[cat] || 1100;   // 元素材は切り出し前提で高画質のまま保持
      const dataURL = await Util.fileToDataURL(f, maxDim);
      const base = { char: "キャラ", bg: "ステージ", pic: "イラスト", fuku: "ふくわらい", src: "もとそざい" }[cat];
      n++;
      const numberedName = meta.name && files.length > 1 ? `${meta.name} ${ok + 1}` : meta.name;
      const rec = { name: numberedName || `${base}${n}`, cat, dataURL };
      if ((cat === "char" || cat === "bg") && meta.author) rec.author = meta.author;
      if (cat === "char") {
        rec.rig = { ...Rig.DEFAULT };
        rec.cutout = { mode: "edge", threshold: 225, gap: 1, strokes: [] };
      }
      await Store.put(rec);
      ok++;
    } catch (e) {
      fails.push(`${f.name || "?"}(${(e && (e.message || e.name)) || "読み込みエラー"})`);
    }
  }
  await changed();
  if (ok > 0) {
    Sound.good();
    Ui.msg(`${ok}枚 取り込みました`, 1600, "#51cf66");
  }
  if (fails.length) {
    alert("取り込みに失敗しました:\n" + fails.join("\n") +
      "\n\n画像ファイル(JPG/PNGなど)か確認してください。iPhoneのHEICは「設定→カメラ→フォーマット→互換性優先」にすると確実です。");
  }
}

async function importPdfPagesAsSources(pdfs) {
  let ok = 0;
  const fails = [];
  Ui.msg("PDFを読み込んでいます…", 1600, "#4dabf7");
  for (const f of pdfs) {
    try {
      const pages = await pdfToCanvases(f);
      const baseName = (f.name || "スキャン").replace(/\.pdf$/i, "");
      for (let i = 0; i < pages.length; i++) {
        await Store.put({
          name: `${baseName} ${i + 1}ページ`,
          cat: "src",
          dataURL: pages[i].toDataURL("image/jpeg", 0.9),
        });
        ok++;
      }
    } catch (e) {
      fails.push(`${f.name || "?"}(${(e && (e.message || e.name)) || "読み込みエラー"})`);
    }
  }
  await changed();
  if (ok > 0) {
    Sound.good();
    Ui.msg(`${pdfs.length}個のPDFから ${ok}ページを もとそざいへ とりこみました`, 2200, "#51cf66");
  }
  if (fails.length) {
    alert("PDFの読み込みに失敗しました:\n" + fails.join("\n"));
  }
}
// 予期しないエラーも見えるようにしておく(「何も起きない」の調査用)
window.addEventListener("unhandledrejection", (e) => {
  alert("エラーが発生しました: " + (e.reason && (e.reason.message || e.reason) || "不明"));
});
/* ---------- PDF → ページ画像 ---------- */
async function pdfToCanvases(file) {
  if (!window.pdfjsLib) throw new Error("PDF機能を読み込めませんでした(通信環境を確認してください)");
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const pages = [];
  const maxPages = Math.min(pdf.numPages, 20);
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const vp1 = page.getViewport({ scale: 1 });
    const scale = Math.min(3, 1600 / Math.max(vp1.width, vp1.height));
    const vp = page.getViewport({ scale });
    const c = Util.makeCanvas(Math.round(vp.width), Math.round(vp.height));
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
    pages.push(c);
  }
  return pages;
}


/* ---------- きりだし(トリミング)エディタ ----------
   pages: 元画像のcanvas配列(PDFは複数ページ、画像は1枚) */
const cropEd = { forceCat: null, pages: [], idx: 0, baseName: "", author: "", rect: null, drag: null, sc: 1, saved: 0, pendingRec: null };
const CROP_CAT_LABELS = {
  src: "✂️ トリミング用のもとそざい",
  char: "🧍 キャラクターの全身",
  fuku: "😀 キャラクターの顔",
  bg: "🏞️ はいけい",
};

function cropCategory() {
  return cropEd.forceCat || document.querySelector('input[name="cropCat"]:checked').value;
}

function syncCropDestination() {
  $("cropDestination").textContent = CROP_CAT_LABELS[cropCategory()] || "";
}

document.querySelectorAll('input[name="cropCat"]').forEach((input) =>
  input.addEventListener("change", syncCropDestination));

function openCrop(pages, baseName, opts) {
  opts = opts || {};
  cropEd.forceCat = opts.cat || null;      // つくる画面などから カテゴリを かためる
  $("cropCatRow").classList.toggle("hidden", !!cropEd.forceCat);
  cropEd.pages = pages;
  cropEd.idx = 0;
  cropEd.baseName = baseName || "切り出し";
  cropEd.author = (opts.author || "").trim();
  cropEd.saved = 0;
  cropEd.pendingRec = null;
  $("cropModal").classList.remove("hidden");
  syncCropDestination();
  showCropPage();
}

function showCropPage() {
  const src = cropEd.pages[cropEd.idx];
  const cv = $("cropCanvas");
  const maxW = Math.min(680, innerWidth - 70);
  cropEd.sc = Math.min(maxW / src.width, 480 / src.height, 1);
  cv.width = Math.round(src.width * cropEd.sc);
  cv.height = Math.round(src.height * cropEd.sc);
  cropEd.rect = null;
  $("cropTitle").textContent = cropEd.pages.length > 1
    ? `✂ 切り出して取り込む(${cropEd.idx + 1} / ${cropEd.pages.length}ページ)`
    : "✂ 切り出して取り込む";
  $("cropNext").classList.toggle("hidden", cropEd.idx >= cropEd.pages.length - 1);
  drawCrop();
}

function drawCrop() {
  const src = cropEd.pages[cropEd.idx];
  const cv = $("cropCanvas"), ctx = cv.getContext("2d");
  ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.drawImage(src, 0, 0, cv.width, cv.height);
  if (cropEd.rect) {
    const { x, y, w, h } = cropEd.rect;
    ctx.fillStyle = "rgba(0,0,0,.35)";           // そとがわを くらく
    ctx.fillRect(0, 0, cv.width, y);
    ctx.fillRect(0, y + h, cv.width, cv.height - y - h);
    ctx.fillRect(0, y, x, h);
    ctx.fillRect(x + w, y, cv.width - x - w, h);
    ctx.strokeStyle = "#ff6b9d";
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 7]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);
  }
}

(() => {
  const cv = $("cropCanvas");
  cv.addEventListener("pointerdown", (e) => {
    const p = Util.canvasPos(cv, e);
    cropEd.drag = { x0: p.x, y0: p.y };
    cropEd.rect = { x: p.x, y: p.y, w: 0, h: 0 };
    cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener("pointermove", (e) => {
    if (!cropEd.drag) return;
    const p = Util.canvasPos(cv, e);
    const x0 = cropEd.drag.x0, y0 = cropEd.drag.y0;
    cropEd.rect = {
      x: Math.max(0, Math.min(x0, p.x)),
      y: Math.max(0, Math.min(y0, p.y)),
      w: Math.abs(p.x - x0),
      h: Math.abs(p.y - y0),
    };
    drawCrop();
  });
  cv.addEventListener("pointerup", () => { cropEd.drag = null; });
})();

function nextCropName() {
  return cropEd.saved === 0 ? cropEd.baseName : `${cropEd.baseName} ${cropEd.saved + 1}`;
}

function returnToCrop() {
  cropEd.pendingRec = null;
  $("cropMetaModal").classList.add("hidden");
  $("cropModal").classList.remove("hidden");
  drawCrop();
}

async function finishCropSave(rec) {
  await Store.put(rec);
  cropEd.saved++;
  cropEd.rect = null;
  returnToCrop();
  Sound.good();
  Ui.msg("保存しました", 1100, "#51cf66");
  await changed();
}

function openCropMeta(rec) {
  cropEd.pendingRec = rec;
  $("cropModal").classList.add("hidden");
  $("cropWorkName").value = rec.name || "";
  $("cropAuthor").value = rec.author || "";
  $("cropMetaSave").textContent = rec.cat === "char" ? "✔ つぎへ" : "✔ 保存する";
  $("cropMetaModal").classList.remove("hidden");
  $("cropWorkName").focus();
  $("cropWorkName").select();
}

async function saveCropRegion(rect) {
  const src = cropEd.pages[cropEd.idx];
  const cat = cropCategory();
  const sx = rect.x / cropEd.sc, sy = rect.y / cropEd.sc;
  const sw = rect.w / cropEd.sc, sh = rect.h / cropEd.sc;
  const max = cat === "src" ? 1600 : cat === "char" || cat === "fuku" ? 900 : 1100;
  const outSc = Math.min(1, max / Math.max(sw, sh));
  const out = Util.makeCanvas(Math.max(1, Math.round(sw * outSc)), Math.max(1, Math.round(sh * outSc)));
  const ctx = out.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(src, sx, sy, sw, sh, 0, 0, out.width, out.height);
  const rec = {
    name: nextCropName(),
    cat,
    dataURL: out.toDataURL("image/jpeg", 0.88),
  };
  if ((cat === "char" || cat === "bg") && cropEd.author) rec.author = cropEd.author;
  if (cat === "char") {
    rec.rig = { ...Rig.DEFAULT };
    rec.cutout = { mode: "edge", threshold: 225, gap: 1, strokes: [] };
  }
  openCropMeta(rec);
}

$("cropSave").onclick = () => {
  if (!cropEd.rect || cropEd.rect.w < 12 || cropEd.rect.h < 12) {
    Ui.msg("ドラッグで囲んでください", 1300, "#4dabf7");
    return;
  }
  saveCropRegion(cropEd.rect);
};
$("cropWhole").onclick = () => {
  const cv = $("cropCanvas");
  saveCropRegion({ x: 0, y: 0, w: cv.width, h: cv.height });
};
$("cropRotate").onclick = () => {
  Sound.tap();
  const src = cropEd.pages[cropEd.idx];
  const r = Util.makeCanvas(src.height, src.width);   // 90°回転で たてよこ入れかえ
  const ctx = r.getContext("2d");
  ctx.translate(r.width / 2, r.height / 2);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(src, -src.width / 2, -src.height / 2);
  cropEd.pages[cropEd.idx] = r;
  showCropPage();
};
$("cropNext").onclick = () => { Sound.tap(); cropEd.idx++; showCropPage(); };
$("cropClose").onclick = () => $("cropModal").classList.add("hidden");

$("cropMetaSave").onclick = async () => {
  const rec = cropEd.pendingRec;
  if (!rec) return;
  const name = $("cropWorkName").value.trim();
  if (!name) {
    Ui.msg("作品名を入力してください", 1300, "#4dabf7");
    $("cropWorkName").focus();
    return;
  }
  rec.name = name;
  rec.author = $("cropAuthor").value.trim();
  if (rec.cat !== "char") {
    cropEd.pendingRec = null;
    await finishCropSave(rec);
    return;
  }
  $("cropMetaModal").classList.add("hidden");
  try {
    await openRig(rec, {
      afterSave: () => finishCropSave(rec),
      afterCancel: () => openCropMeta(rec),
    });
  } catch (e) {
    rigEd.afterSave = null;
    rigEd.afterCancel = null;
    openCropMeta(rec);
    alert("動き設定を開けませんでした:\n" + ((e && e.message) || e));
  }
};
$("cropMetaBack").onclick = returnToCrop;

/* ---------- リグ編集 ---------- */
const rigEd = {
  rec: null, dataURL: "", img: null, keyed: null, trimmed: null, rig: null, cutout: null,
  drag: null, parts: null, puppet: null, raf: 0, cutoutRaf: 0,
  brush: "keep", painting: false, afterSave: null, afterCancel: null,
  rotateBase: null, rotateRig: null, rotateCutout: null, rotateTotal: 0, rotateStart: 0,
};

async function openRig(rec, opts) {
  opts = opts || {};
  rigEd.rec = rec;
  rigEd.afterSave = opts.afterSave || null;
  rigEd.afterCancel = opts.afterCancel || null;
  rigEd.rig = { ...Rig.DEFAULT, ...(rec.rig || {}) };
  if (rigEd.rig.arms) rigEd.rig.arms = JSON.parse(JSON.stringify(rigEd.rig.arms));
  rigEd.cutout = Util.cutoutSettings(rec.cutout);
  rigEd.cutout.strokes = rigEd.cutout.strokes.map((s) => ({ ...s }));
  rigEd.dataURL = rec.dataURL;
  rigEd.img = await Util.loadImage(rigEd.dataURL);
  rigEd.rotateBase = null;
  rigEd.rotateRig = null;
  rigEd.rotateCutout = null;
  rigEd.rotateTotal = 0;
  rigEd.rotateStart = 0;
  $("rigRotate").value = "0";
  $("rigRotateOut").textContent = "0°";
  $("rigModal").classList.remove("hidden");
  syncCutoutControls();
  refreshRigImage();
  animPreview();
}

function visibleBounds(cv, pad = 8) {
  const { width: w, height: h } = cv;
  const data = cv.getContext("2d").getImageData(0, 0, w, h).data;
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (data[(y * w + x) * 4 + 3] <= 20) continue;
    minX = Math.min(minX, x); minY = Math.min(minY, y);
    maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  if (maxX < 0) return null;
  minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad); maxY = Math.min(h - 1, maxY + pad);
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

function rotateRigSettings(base, degrees, width, height) {
  const out = JSON.parse(JSON.stringify(base));
  const point = (x, y) => Util.rotatePoint(x, y, degrees, width, height);
  const centerX = base.centerX == null ? 0.5 : base.centerX;
  const hipY = base.hipY == null ? 0.7 : base.hipY;

  if (base.neckY != null) out.neckY = point(centerX, base.neckY).y;
  if (base.hipY != null) out.hipY = point(centerX, base.hipY).y;
  if (base.centerX != null) out.centerX = point(base.centerX, hipY).x;
  if (base.bellyY != null) out.bellyY = point(centerX, base.bellyY).y;
  if (base.hingeX != null) out.hingeX = point(base.hingeX, 0.5).x;
  if (base.legLeftX != null) out.legLeftX = point(base.legLeftX, hipY).x;
  if (base.legRightX != null) out.legRightX = point(base.legRightX, hipY).x;

  if (base.arms) {
    for (const side of ["left", "right"]) {
      const arm = base.arms[side];
      if (!arm) continue;
      const corners = [
        point(arm.x, arm.y), point(arm.x + arm.w, arm.y),
        point(arm.x, arm.y + arm.h), point(arm.x + arm.w, arm.y + arm.h),
      ];
      const minX = Math.min(...corners.map((p) => p.x));
      const maxX = Math.max(...corners.map((p) => p.x));
      const minY = Math.min(...corners.map((p) => p.y));
      const maxY = Math.max(...corners.map((p) => p.y));
      const pivot = point(arm.px, arm.py);
      out.arms[side] = {
        ...arm,
        x: minX, y: minY,
        w: Math.max(0.04, maxX - minX), h: Math.max(0.04, maxY - minY),
        px: pivot.x, py: pivot.y,
      };
    }
  }
  return out;
}

function rotateCutoutSettings(base, degrees, width, height) {
  const out = { ...base, strokes: (base.strokes || []).map((stroke) => {
    const p = Util.rotatePoint(stroke.x, stroke.y, degrees, width, height);
    return { ...stroke, x: p.x, y: p.y };
  }) };
  return out;
}

$("rigRotate").oninput = (e) => {
  const degrees = +e.target.value;
  if (!rigEd.rotateBase) {
    rigEd.rotateBase = Util.makeCanvas(rigEd.img.width, rigEd.img.height);
    rigEd.rotateBase.getContext("2d").drawImage(rigEd.img, 0, 0);
    rigEd.rotateRig = JSON.parse(JSON.stringify(rigEd.rig));
    rigEd.rotateCutout = { ...rigEd.cutout, strokes: rigEd.cutout.strokes.map((s) => ({ ...s })) };
    rigEd.rotateStart = rigEd.rotateTotal;
  }
  const delta = degrees - rigEd.rotateStart;
  const out = Util.rotateCanvas(rigEd.rotateBase, delta);
  rigEd.img = out;
  rigEd.dataURL = out.toDataURL("image/png");
  rigEd.rig = rotateRigSettings(rigEd.rotateRig, delta, out.width, out.height);
  rigEd.cutout = rotateCutoutSettings(rigEd.rotateCutout, delta, out.width, out.height);
  $("rigRotateOut").textContent = `${degrees}°`;
  syncCutoutControls();
  refreshRigImage();
};
$("rigRotate").onchange = (e) => {
  rigEd.rotateTotal = +e.target.value;
  rigEd.rotateBase = null;
  rigEd.rotateRig = null;
  rigEd.rotateCutout = null;
  Sound.pop();
};

$("rigTrimWhitespace").onclick = async () => {
  const b = visibleBounds(rigEd.keyed);
  if (!b || (b.x === 0 && b.y === 0 && b.w === rigEd.img.width && b.h === rigEd.img.height)) {
    Ui.msg("カットする余白はありません", 1400, "#4dabf7");
    return;
  }
  const oldW = rigEd.img.width, oldH = rigEd.img.height;
  const out = Util.makeCanvas(b.w, b.h);
  out.getContext("2d").drawImage(rigEd.img, b.x, b.y, b.w, b.h, 0, 0, b.w, b.h);
  const oldMax = Math.max(oldW, oldH), newMax = Math.max(b.w, b.h);
  rigEd.cutout.strokes = rigEd.cutout.strokes
    .filter((s) => s.x * oldW >= b.x && s.x * oldW <= b.x + b.w && s.y * oldH >= b.y && s.y * oldH <= b.y + b.h)
    .map((s) => ({
      ...s,
      x: Util.clamp((s.x * oldW - b.x) / b.w, 0, 1),
      y: Util.clamp((s.y * oldH - b.y) / b.h, 0, 1),
      r: Util.clamp(s.r * oldMax / newMax, 0.002, 0.2),
    }));
  rigEd.dataURL = out.toDataURL("image/png");
  rigEd.img = await Util.loadImage(rigEd.dataURL);
  Sound.good();
  refreshRigImage();
  Ui.msg("余白をカットしました", 1200, "#51cf66");
};

/* 絵と調整位置をまとめて反転する。画像だけ反転して関節位置がずれないようにする。 */
$("rigFlip").onclick = async () => {
  const out = Util.makeCanvas(rigEd.img.width, rigEd.img.height);
  const ctx = out.getContext("2d");
  ctx.translate(out.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(rigEd.img, 0, 0);

  const r = rigEd.rig;
  if (r.centerX != null) r.centerX = 1 - r.centerX;
  if (r.legLeftX != null || r.legRightX != null) {
    const oldLeft = r.legLeftX == null ? 0.25 : r.legLeftX;
    const oldRight = r.legRightX == null ? 0.75 : r.legRightX;
    r.legLeftX = 1 - oldRight;
    r.legRightX = 1 - oldLeft;
  }
  if (r.arms) {
    const mirrorArm = (arm) => arm ? {
      ...arm,
      x: 1 - arm.x - arm.w,
      px: 1 - arm.px,
    } : arm;
    const oldLeft = r.arms.left;
    r.arms.left = mirrorArm(r.arms.right);
    r.arms.right = mirrorArm(oldLeft);
  }
  rigEd.cutout.strokes = rigEd.cutout.strokes.map((s) => ({ ...s, x: 1 - s.x }));
  rigEd.dataURL = out.toDataURL("image/png");
  rigEd.img = await Util.loadImage(rigEd.dataURL);
  Sound.pop();
  refreshRigImage();
  Ui.msg("左右を いれかえたよ", 1000, "#ff922b");
};

function refreshRigImage() {
  rigEd.keyed = Util.keyImage(rigEd.img, rigEd.cutout);
  rigEd.trimmed = Util.trimCanvas(rigEd.keyed);
  const cv = $("rigCanvas");
  const visualW = $("rigModal").querySelector(".rig-visual").clientWidth || innerWidth;
  const maxW = Math.min(390, Math.max(210, visualW - 255));
  const sc = Math.min(maxW / rigEd.trimmed.width, 520 / rigEd.trimmed.height);
  cv.width = Math.round(rigEd.trimmed.width * sc);
  cv.height = Math.round(rigEd.trimmed.height * sc);

  const cut = $("cutoutCanvas");
  const sideW = $("rigModal").querySelector(".rig-side").clientWidth || innerWidth;
  const cutW = Math.min(520, Math.max(240, sideW - 38));
  const cutSc = Math.min(cutW / rigEd.keyed.width, 360 / rigEd.keyed.height, 1);
  cut.width = Math.max(1, Math.round(rigEd.keyed.width * cutSc));
  cut.height = Math.max(1, Math.round(rigEd.keyed.height * cutSc));
  const cutCtx = cut.getContext("2d");
  cutCtx.clearRect(0, 0, cut.width, cut.height);
  cutCtx.drawImage(rigEd.keyed, 0, 0, cut.width, cut.height);

  syncTypeButtons();
  syncAdvancedRig();
  rebuildParts();
  drawRig();
}

function scheduleRigImageRefresh() {
  cancelAnimationFrame(rigEd.cutoutRaf);
  rigEd.cutoutRaf = requestAnimationFrame(refreshRigImage);
}

function syncCutoutControls() {
  document.querySelectorAll('input[name="cutoutMode"]').forEach((el) => { el.checked = el.value === rigEd.cutout.mode; });
  $("cutoutThreshold").value = rigEd.cutout.threshold;
  $("cutoutGap").value = rigEd.cutout.gap;
  $("cutoutThresholdOut").textContent = String(rigEd.cutout.threshold);
  $("cutoutGapOut").textContent = rigEd.cutout.gap ? `${rigEd.cutout.gap}px` : "なし";
  $("cutoutKeep").classList.toggle("active", rigEd.brush === "keep");
  $("cutoutErase").classList.toggle("active", rigEd.brush === "erase");
}

document.querySelectorAll('input[name="cutoutMode"]').forEach((el) => {
  el.onchange = () => {
    rigEd.cutout.mode = el.value;
    syncCutoutControls();
    scheduleRigImageRefresh();
  };
});
$("cutoutThreshold").oninput = (e) => {
  rigEd.cutout.threshold = +e.target.value;
  $("cutoutThresholdOut").textContent = e.target.value;
  scheduleRigImageRefresh();
};
$("cutoutGap").oninput = (e) => {
  rigEd.cutout.gap = +e.target.value;
  $("cutoutGapOut").textContent = rigEd.cutout.gap ? `${rigEd.cutout.gap}px` : "なし";
  scheduleRigImageRefresh();
};
$("cutoutKeep").onclick = () => { rigEd.brush = "keep"; syncCutoutControls(); };
$("cutoutErase").onclick = () => { rigEd.brush = "erase"; syncCutoutControls(); };
$("cutoutReset").onclick = () => {
  rigEd.cutout.strokes = [];
  Sound.tap();
  scheduleRigImageRefresh();
};

function addCutoutStroke(e) {
  const cv = $("cutoutCanvas");
  const p = Util.canvasPos(cv, e);
  const s = {
    x: Util.clamp(p.x / cv.width, 0, 1),
    y: Util.clamp(p.y / cv.height, 0, 1),
    r: (+$("cutoutBrush").value || 24) / Math.max(cv.width, cv.height),
    keep: rigEd.brush === "keep",
  };
  const prev = rigEd.cutout.strokes[rigEd.cutout.strokes.length - 1];
  if (prev && prev.keep === s.keep && Math.hypot(prev.x - s.x, prev.y - s.y) < s.r * 0.28) return;
  rigEd.cutout.strokes.push(s);
  if (rigEd.cutout.strokes.length > 800) rigEd.cutout.strokes.shift();
  scheduleRigImageRefresh();
}

(() => {
  const cv = $("cutoutCanvas");
  cv.addEventListener("pointerdown", (e) => {
    rigEd.painting = true;
    cv.setPointerCapture(e.pointerId);
    addCutoutStroke(e);
  });
  cv.addEventListener("pointermove", (e) => { if (rigEd.painting) addCutoutStroke(e); });
  const stop = () => { rigEd.painting = false; };
  cv.addEventListener("pointerup", stop);
  cv.addEventListener("pointercancel", stop);
})();

function syncTypeButtons() {
  const t = rigEd.rig.type || "biped";
  $("rigTypes").querySelectorAll("button").forEach((b) =>
    b.classList.toggle("active", b.dataset.type === t));
}

function ensureAdvancedArms() {
  const cur = rigEd.rig.arms || {};
  const left = { x: 0.02, y: 0.28, w: 0.38, h: 0.42, px: 0.36, py: 0.46, ...(cur.left || {}) };
  const right = { x: 0.60, y: 0.28, w: 0.38, h: 0.42, px: 0.64, py: 0.46, ...(cur.right || {}) };
  rigEd.rig.arms = { enabled: !!cur.enabled, ...cur, left, right };
  return rigEd.rig.arms;
}

function ensureLegRoots() {
  const center = Util.clamp(rigEd.rig.centerX == null ? 0.5 : rigEd.rig.centerX, 0.15, 0.85);
  if (rigEd.rig.legLeftX == null) rigEd.rig.legLeftX = center * 0.5;
  if (rigEd.rig.legRightX == null) rigEd.rig.legRightX = center + (1 - center) * 0.5;
  rigEd.rig.legLeftX = Util.clamp(rigEd.rig.legLeftX, 0.05, center - 0.03);
  rigEd.rig.legRightX = Util.clamp(rigEd.rig.legRightX, center + 0.03, 0.95);
  return { left: rigEd.rig.legLeftX, right: rigEd.rig.legRightX };
}

function syncLegRootControls() {
  const roots = ensureLegRoots();
  $("rigLegLeft").value = Math.round(roots.left * 100);
  $("rigLegRight").value = Math.round(roots.right * 100);
  $("rigLegLeftOut").textContent = `${Math.round(roots.left * 100)}%`;
  $("rigLegRightOut").textContent = `${Math.round(roots.right * 100)}%`;
}

function syncArmBottomControl() {
  const arms = ensureAdvancedArms();
  const bottom = Math.max(arms.left.y + arms.left.h, arms.right.y + arms.right.h);
  $("rigArmBottom").value = Math.round(bottom * 100);
  $("rigArmBottomOut").textContent = `${Math.round(bottom * 100)}%`;
  $("rigArmBottom").disabled = !arms.enabled;
}

function syncAdvancedRig() {
  const isBiped = (rigEd.rig.type || "biped") === "biped";
  if (isBiped) ensureAdvancedArms();
  $("armAdvancedBlock").classList.toggle("hidden", !isBiped);
  $("legAdvancedBlock").classList.toggle("hidden", !isBiped);
  $("rigArmsEnabled").checked = !!(rigEd.rig.arms && rigEd.rig.arms.enabled);
  if (isBiped) {
    syncArmBottomControl();
    syncLegRootControls();
  }
}

$("rigArmsEnabled").onchange = (e) => {
  ensureAdvancedArms().enabled = e.target.checked;
  syncArmBottomControl();
  Sound.tap();
  rebuildParts();
  drawRig();
};

$("rigArmBottom").oninput = (e) => {
  const bottom = +e.target.value / 100;
  const arms = ensureAdvancedArms();
  for (const side of ["left", "right"]) {
    const arm = arms[side];
    arm.h = Util.clamp(bottom - arm.y, 0.04, 1 - arm.y);
  }
  syncArmBottomControl();
  rebuildParts();
  drawRig();
};

for (const [id, key] of [["rigLegLeft", "legLeftX"], ["rigLegRight", "legRightX"]]) {
  $(id).oninput = (e) => {
    rigEd.rig[key] = +e.target.value / 100;
    syncLegRootControls();
    rebuildParts();
    drawRig();
  };
}

function setRigType(t) {
  if (!Rig.TYPES.includes(t)) return;
  rigEd.rig.type = t;
  syncTypeButtons();
  syncAdvancedRig();
  rebuildParts();
  drawRig();
}
$("rigTypes").querySelectorAll("button").forEach((b) => {
  b.onclick = () => { Sound.tap(); setRigType(b.dataset.type); };
});

function rebuildParts() {
  rigEd.parts = Rig.makeParts(rigEd.trimmed, rigEd.rig, rigEd.rec.name);
  const pv = $("rigPreview");
  const fly = rigEd.parts.type === "butterfly";
  $("rigPvLabel").textContent = fly ? "とびかたプレビュー" : "歩きプレビュー";
  // ちょうちょは よこに ひろがるので、はばが はみでない 高さに あわせて うかせる
  const h = fly
    ? Math.min(pv.height - 110, (pv.width - 40) * rigEd.parts.H / rigEd.parts.W)
    : pv.height - 60;
  rigEd.puppet = new Puppet(rigEd.parts, {
    x: pv.width / 2,
    y: fly ? pv.height * 0.62 : pv.height - 16,
    h,
  });
  rigEd.puppet.walking = true;
}

function drawRig() {
  const cv = $("rigCanvas"), ctx = cv.getContext("2d");
  const W = cv.width, Hc = cv.height;
  ctx.clearRect(0, 0, W, Hc);
  ctx.drawImage(rigEd.trimmed, 0, 0, W, Hc);
  const r = rigEd.rig, t = r.type || "biped";
  const hLine = (col, ry, label) => {
    const y = ry * Hc;
    ctx.strokeStyle = col; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    ctx.fillStyle = col; ctx.font = "bold 15px sans-serif";
    ctx.fillText(label, 6, y - 6);
  };
  const vLine = (col, rx, ry0, label) => {
    const x = rx * W, y0 = ry0 * Hc;
    ctx.strokeStyle = col; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, Hc); ctx.stroke();
    ctx.fillStyle = col; ctx.font = "bold 15px sans-serif";
    ctx.fillText(label, x + 6, Hc - 8);
  };
  if (t === "biped") {
    hLine("#4dabf7", r.neckY, "首");
    hLine("#51cf66", r.hipY, "腰");
    vLine("#ff6b9d", r.centerX, r.hipY, "中央");
    const roots = ensureLegRoots();
    const root = (x, col, label) => {
      const px = x * W, py = r.hipY * Hc;
      ctx.beginPath(); ctx.arc(px, py, 11, 0, Math.PI * 2);
      ctx.fillStyle = "#fff"; ctx.fill();
      ctx.lineWidth = 5; ctx.strokeStyle = col; ctx.stroke();
      ctx.font = "bold 15px sans-serif";
      ctx.lineWidth = 4; ctx.strokeStyle = "#fff"; ctx.strokeText(label, px - 18, py + 30);
      ctx.fillStyle = col; ctx.fillText(label, px - 18, py + 30);
    };
    root(roots.left, "#7950f2", "左足");
    root(roots.right, "#f76707", "右足");
  } else if (t === "skirt") {
    hLine("#4dabf7", r.neckY, "首");
    hLine("#51cf66", r.hipY, "腰");
  } else if (t === "quad") {
    hLine("#f59f00", r.bellyY, "おなか");
    vLine("#ff6b9d", r.centerX, r.bellyY, "中央");
  } else if (t === "butterfly") {
    const x = Math.max(2, (r.hingeX || 0) * W);
    ctx.strokeStyle = "#f76707"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, Hc); ctx.stroke();
    ctx.font = "bold 15px sans-serif";
    const label = (txt, tx, ty) => {          // 絵の上でも 読めるように 白ふちどり
      ctx.lineWidth = 4; ctx.strokeStyle = "#fff"; ctx.strokeText(txt, tx, ty);
      ctx.fillStyle = "#f76707"; ctx.fillText(txt, tx, ty);
    };
    label("はねのつけね", x + 6, Hc - 8);
    label("この線の右がわを 左右はんてんします", 6, 20);
  } else { // float
    ctx.fillStyle = "#868e96"; ctx.font = "bold 15px sans-serif";
    ctx.fillText("線なし(そのまま動きます)", 10, 24);
  }

  if (t === "biped" && r.arms && r.arms.enabled) {
    const drawArm = (a, col, label) => {
      const x = a.x * W, y = a.y * Hc, w = a.w * W, h = a.h * Hc;
      const px = a.px * W, py = a.py * Hc;
      ctx.save();
      ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.setLineDash([8, 5]);
      ctx.strokeRect(x, y, w, h); ctx.setLineDash([]);
      ctx.fillStyle = col;
      for (const [hx, hy] of [[x, y], [x + w, y + h]]) {
        ctx.fillRect(hx - 7, hy - 7, 14, 14);
      }
      ctx.beginPath(); ctx.arc(px, py, 10, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = "#fff"; ctx.strokeText(label, x + 8, Math.max(18, y + 20));
      ctx.fillStyle = col; ctx.fillText(label, x + 8, Math.max(18, y + 20));
      ctx.restore();
    };
    drawArm(r.arms.left, "#7950f2", "左うで");
    drawArm(r.arms.right, "#f76707", "右うで");
  }
}

function animPreview() {
  cancelAnimationFrame(rigEd.raf);
  let last = performance.now();
  const pv = $("rigPreview"), ctx = pv.getContext("2d");
  (function loop(now) {
    if ($("rigModal").classList.contains("hidden")) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    ctx.clearRect(0, 0, pv.width, pv.height);
    if (rigEd.parts.type !== "butterfly") {
      ctx.fillStyle = "#96d06c"; ctx.fillRect(0, pv.height - 16, pv.width, 16);
    }
    rigEd.puppet.update(dt);
    rigEd.puppet.draw(ctx);
    rigEd.raf = requestAnimationFrame(loop);
  })(last);
}

(() => {
  const cv = $("rigCanvas");
  const pick = (p) => {
    const r = rigEd.rig, t = 26, ty = r.type || "biped";
    const cands = [];
    if (ty === "biped") {
      cands.push(["neckY", Math.abs(p.y - r.neckY * cv.height)]);
      cands.push(["hipY", Math.abs(p.y - r.hipY * cv.height)]);
      cands.push(["centerX", Math.abs(p.x - r.centerX * cv.width)]);
      const roots = ensureLegRoots();
      const hipY = r.hipY * cv.height;
      cands.push(["legLeftX", Math.hypot(p.x - roots.left * cv.width, p.y - hipY) - 10]);
      cands.push(["legRightX", Math.hypot(p.x - roots.right * cv.width, p.y - hipY) - 10]);
      if (r.arms && r.arms.enabled) {
        for (const side of ["left", "right"]) {
          const a = r.arms[side];
          const pts = {
            tl: [a.x * cv.width, a.y * cv.height],
            br: [(a.x + a.w) * cv.width, (a.y + a.h) * cv.height],
            pivot: [a.px * cv.width, a.py * cv.height],
          };
          for (const handle of Object.keys(pts)) {
            const hp = pts[handle];
            const d = Math.hypot(p.x - hp[0], p.y - hp[1]);
            if (d < 22) cands.push([{ arm: side, handle }, d - 8]);
          }
        }
      }
    } else if (ty === "skirt") {
      cands.push(["neckY", Math.abs(p.y - r.neckY * cv.height)]);
      cands.push(["hipY", Math.abs(p.y - r.hipY * cv.height)]);
    } else if (ty === "quad") {
      cands.push(["bellyY", Math.abs(p.y - r.bellyY * cv.height)]);
      cands.push(["centerX", Math.abs(p.x - r.centerX * cv.width)]);
    } else if (ty === "butterfly") {
      cands.push(["hingeX", Math.abs(p.x - r.hingeX * cv.width)]);
    }
    const f = cands.filter(([, d]) => d < t).sort((a, b) => a[1] - b[1]);
    return f.length ? f[0][0] : null;
  };
  cv.addEventListener("pointerdown", (e) => {
    rigEd.drag = pick(Util.canvasPos(cv, e));
    cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener("pointermove", (e) => {
    if (!rigEd.drag) return;
    const p = Util.canvasPos(cv, e);
    if (rigEd.drag && typeof rigEd.drag === "object") {
      const a = rigEd.rig.arms[rigEd.drag.arm];
      const x = Util.clamp(p.x / cv.width, 0, 1);
      const y = Util.clamp(p.y / cv.height, 0, 1);
      if (rigEd.drag.handle === "tl") {
        const x2 = a.x + a.w, y2 = a.y + a.h;
        a.x = Math.min(x, x2 - 0.04); a.y = Math.min(y, y2 - 0.04);
        a.w = x2 - a.x; a.h = y2 - a.y;
      } else if (rigEd.drag.handle === "br") {
        a.w = Math.max(0.04, x - a.x); a.h = Math.max(0.04, y - a.y);
      } else {
        a.px = x; a.py = y;
      }
    } else if (rigEd.drag === "hingeX") rigEd.rig.hingeX = Util.clamp(p.x / cv.width, 0, 0.6);
    else if (rigEd.drag === "centerX") {
      rigEd.rig.centerX = Util.clamp(p.x / cv.width, 0.15, 0.85);
      syncLegRootControls();
    }
    else if (rigEd.drag === "legLeftX") {
      rigEd.rig.legLeftX = Util.clamp(p.x / cv.width, 0.05, rigEd.rig.centerX - 0.03);
      syncLegRootControls();
    }
    else if (rigEd.drag === "legRightX") {
      rigEd.rig.legRightX = Util.clamp(p.x / cv.width, rigEd.rig.centerX + 0.03, 0.95);
      syncLegRootControls();
    }
    else if (rigEd.drag === "bellyY") rigEd.rig.bellyY = Util.clamp(p.y / cv.height, 0.2, 0.85);
    else rigEd.rig[rigEd.drag] = Util.clamp(p.y / cv.height, 0.1, 0.92);
    if ((rigEd.drag === "neckY" || rigEd.drag === "hipY") && rigEd.rig.hipY < rigEd.rig.neckY + 0.08) {
      if (rigEd.drag === "neckY") rigEd.rig.neckY = rigEd.rig.hipY - 0.08;
      else rigEd.rig.hipY = rigEd.rig.neckY + 0.08;
    }
    drawRig();
  });
  cv.addEventListener("pointerup", () => {
    const movedArm = rigEd.drag && typeof rigEd.drag === "object";
    rigEd.drag = null;
    if (movedArm) syncArmBottomControl();
    rebuildParts();
  });
})();

$("rigSave").onclick = async () => {
  rigEd.rec.dataURL = rigEd.dataURL;
  rigEd.rec.rig = { ...rigEd.rig };
  rigEd.rec.cutout = {
    ...rigEd.cutout,
    strokes: rigEd.cutout.strokes.map((s) => ({ ...s })),
  };
  $("rigModal").classList.add("hidden");
  const afterSave = rigEd.afterSave;
  rigEd.afterSave = null;
  rigEd.afterCancel = null;
  if (afterSave) {
    Sound.tap();
    await afterSave(rigEd.rec);
  } else {
    await Store.put(rigEd.rec);
    Sound.good();
    await changed();
  }
};
$("rigCancel").onclick = () => {
  cancelAnimationFrame(rigEd.cutoutRaf);
  $("rigModal").classList.add("hidden");
  const afterCancel = rigEd.afterCancel;
  rigEd.afterSave = null;
  rigEd.afterCancel = null;
  if (afterCancel) afterCancel(rigEd.rec);
};

/* ---------- 差分画像・まちがいスポット編集 ---------- */
const spotEd = { rec: null, img: null, diffImg: null, variants: [], legacySpots: [], selected: -1, back: "admin.html" };

async function openSpot(rec, options) {
  options = options || {};
  spotEd.rec = rec;
  spotEd.back = options.back || "admin.html";
  spotEd.legacySpots = (rec.diffSpots || []).map((s) => ({ ...s }));
  spotEd.variants = (rec.diffVariants || []).map((v) => ({
    dataURL: v.dataURL,
    spots: (v.spots || []).map((s) => ({ ...s })),
  }));
  /* おえかきから戻った差分は、スポット設定を保存するまで正式データにしない。 */
  if (rec.pendingDiff) {
    spotEd.variants.push({ dataURL: rec.pendingDiff, spots: [] });
    delete rec.pendingDiff;
    await Store.put(rec);
  }
  spotEd.img = await Util.loadImage(rec.dataURL);
  const maxW = Math.min(520, innerWidth - 70);
  const sc = Math.min(maxW / spotEd.img.width, 350 / spotEd.img.height);
  for (const cv of [$("spotBaseCanvas"), $("spotCanvas")]) {
    cv.width = Math.round(spotEd.img.width * sc);
    cv.height = Math.round(spotEd.img.height * sc);
  }
  spotEd.selected = spotEd.variants.length ? spotEd.variants.length - 1 : -1;
  spotEd.diffImg = spotEd.selected >= 0 ? await Util.loadImage(spotEd.variants[spotEd.selected].dataURL) : spotEd.img;
  $("spotModal").classList.remove("hidden");
  renderSpotVariants();
  drawSpots();
  if (options.promptAdd && !spotEd.variants.length) await openSpotAddMenu();
}

function currentSpots() {
  return spotEd.selected >= 0 ? spotEd.variants[spotEd.selected].spots : spotEd.legacySpots;
}

async function selectSpotVariant(index) {
  spotEd.selected = index;
  spotEd.diffImg = index >= 0 ? await Util.loadImage(spotEd.variants[index].dataURL) : spotEd.img;
  renderSpotVariants();
  drawSpots();
}

function renderSpotVariants() {
  const box = $("spotVariants");
  box.innerHTML = "";
  spotEd.variants.forEach((v, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn " + (i === spotEd.selected ? "pink" : "gray");
    b.style.cssText = "min-width:110px;padding:5px";
    b.innerHTML = `<img src="${v.dataURL}" alt="" style="width:92px;height:62px;object-fit:cover;border-radius:8px;display:block"><span>差分${i + 1}・${v.spots.length}こ</span>`;
    b.onclick = () => { Sound.tap(); selectSpotVariant(i); };
    box.appendChild(b);
  });
  if (!spotEd.variants.length) box.innerHTML = '<p class="note">差分画像はまだありません。</p>';
  $("spotRemove").classList.toggle("hidden", spotEd.selected < 0);
  $("spotDiffLabel").textContent = spotEd.selected >= 0 ? `差分の絵 ${spotEd.selected + 1}` : "差分の絵(旧形式プレビュー)";
}

function drawSpots() {
  const base = $("spotBaseCanvas"), bctx = base.getContext("2d");
  bctx.clearRect(0, 0, base.width, base.height);
  bctx.drawImage(spotEd.img, 0, 0, base.width, base.height);
  const cv = $("spotCanvas"), ctx = cv.getContext("2d");
  ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.drawImage(spotEd.diffImg || spotEd.img, 0, 0, cv.width, cv.height);
  currentSpots().forEach((s, i) => {
    for (const [c, cctx] of [[base, bctx], [cv, ctx]]) {
      cctx.strokeStyle = "#ff6b9d"; cctx.lineWidth = 4;
      cctx.beginPath(); cctx.arc(s.x * c.width, s.y * c.height, s.r * c.width, 0, 7); cctx.stroke();
      cctx.fillStyle = "#ff6b9d"; cctx.font = "bold 18px sans-serif";
      cctx.fillText(i + 1, s.x * c.width - 5, s.y * c.height + 6);
    }
  });
}

$("spotCanvas").addEventListener("pointerdown", (e) => {
  const cv = $("spotCanvas");
  const p = Util.canvasPos(cv, e);
  const rx = p.x / cv.width, ry = p.y / cv.height;
  const spots = currentSpots();
  const hit = spots.findIndex((s) => Math.hypot((s.x - rx) * cv.width, (s.y - ry) * cv.height) < s.r * cv.width);
  if (hit >= 0) spots.splice(hit, 1);
  else if (spots.length < 8) spots.push({ x: rx, y: ry, r: 0.06 });
  Sound.tap();
  renderSpotVariants();
  drawSpots();
});

async function addSpotFiles(fileList) {
  const files = Array.from(fileList || []).slice(0, 8 - spotEd.variants.length);
  if (!files.length) return;
  for (const file of files) {
    spotEd.variants.push({ dataURL: await Util.fileToDataURL(file, 1100), spots: [] });
  }
  Sound.good();
  await selectSpotVariant(spotEd.variants.length - 1);
}

async function openSpotAddMenu() {
  const how = await Ui.menu({
    title: "差分画像を追加",
    items: [
      { value: "draw", label: "おえかきで つくる", color: "pink" },
      { value: "file", label: "ファイルを えらぶ", color: "green" },
      { value: "camera", label: "カメラで とる", color: "blue" },
    ],
  });
  if (how === "file") $("spotFiles").click();
  if (how === "camera") $("spotCamera").click();
  if (how === "draw") {
    if (spotEd.variants.some((v) => !v.spots.length)) {
      Ui.msg("先に いまの差分へスポットをつけて保存してください", 1900, "#f59f00");
      return;
    }
    spotEd.rec.diffSpots = spotEd.legacySpots;
    if (spotEd.variants.length) spotEd.rec.diffVariants = spotEd.variants;
    await Store.put(spotEd.rec);
    const p = new URLSearchParams({ diff: spotEd.rec.id, back: spotEd.back });
    location.href = `draw.html?${p}`;
  }
}

$("spotAdd").onclick = openSpotAddMenu;
$("spotFiles").onchange = async (e) => {
  await addSpotFiles(e.target.files);
  e.target.value = "";
};
$("spotCamera").onchange = async (e) => {
  await addSpotFiles(e.target.files);
  e.target.value = "";
};

$("spotRemove").onclick = async () => {
  if (spotEd.selected < 0) return;
  spotEd.variants.splice(spotEd.selected, 1);
  const next = spotEd.variants.length ? Math.min(spotEd.selected, spotEd.variants.length - 1) : -1;
  Sound.tap();
  await selectSpotVariant(next);
};

$("spotSave").onclick = async () => {
  if (spotEd.variants.some((v) => !v.spots.length)) {
    Ui.msg("スポットが0この差分画像があります", 1800, "#f59f00");
    return;
  }
  spotEd.rec.diffSpots = spotEd.legacySpots;
  if (spotEd.variants.length) spotEd.rec.diffVariants = spotEd.variants;
  else delete spotEd.rec.diffVariants;
  await Store.put(spotEd.rec);
  $("spotModal").classList.add("hidden");
  Sound.good();
  changed();
};
$("spotCancel").onclick = () => $("spotModal").classList.add("hidden");

/* ---------- ふくわらいパーツ編集 ----------
   絵の上を ドラッグして め・まゆげ・はな・くち・そのほか を矩形でかこむ。
   わくをタップで しゅるいを じゅんに切りかえ、そのほかの つぎで さくじょ。 */
const FUKU_KINDS = ["め", "まゆげ", "はな", "くち", "そのほか"];
const FUKU_COLORS = { "め": "#4dabf7", "まゆげ": "#51cf66", "はな": "#f59f00", "くち": "#ff6b9d", "そのほか": "#9775fa" };
const fukuEd = { rec: null, img: null, parts: [], kind: "め", drag: null, sc: 1 };

async function openFuku(rec) {
  fukuEd.rec = rec;
  fukuEd.parts = (rec.fukuParts || []).map((p) => ({ ...p }));
  fukuEd.kind = "め";
  fukuEd.drag = null;
  fukuEd.img = await Util.loadImage(rec.dataURL);
  const cv = $("fukuCanvas");
  const maxW = Math.min(640, innerWidth - 70);
  fukuEd.sc = Math.min(maxW / fukuEd.img.width, 460 / fukuEd.img.height);
  cv.width = Math.round(fukuEd.img.width * fukuEd.sc);
  cv.height = Math.round(fukuEd.img.height * fukuEd.sc);
  $("fukuModal").classList.remove("hidden");
  syncFukuKinds();
  drawFuku();
}

function syncFukuKinds() {
  $("fukuKinds").querySelectorAll("button").forEach((b) =>
    b.classList.toggle("active", b.dataset.kind === fukuEd.kind));
}
$("fukuKinds").querySelectorAll("button").forEach((b) => {
  b.onclick = () => { Sound.tap(); fukuEd.kind = b.dataset.kind; syncFukuKinds(); };
});

function drawFuku() {
  const cv = $("fukuCanvas"), ctx = cv.getContext("2d");
  ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.drawImage(fukuEd.img, 0, 0, cv.width, cv.height);
  fukuEd.parts.forEach((p) => {
    const x = p.x * cv.width, y = p.y * cv.height, w = p.w * cv.width, h = p.h * cv.height;
    const col = FUKU_COLORS[p.kind] || "#9775fa";
    ctx.strokeStyle = col; ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = col;
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(p.kind, x + 4, y + 18);
  });
  if (fukuEd.drag && fukuEd.drag.rect) {
    const r = fukuEd.drag.rect;
    ctx.strokeStyle = FUKU_COLORS[fukuEd.kind]; ctx.lineWidth = 3;
    ctx.setLineDash([9, 6]);
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.setLineDash([]);
  }
}

(() => {
  const cv = $("fukuCanvas");
  const hitPart = (px, py) => {
    for (let i = fukuEd.parts.length - 1; i >= 0; i--) {
      const p = fukuEd.parts[i];
      const x = p.x * cv.width, y = p.y * cv.height, w = p.w * cv.width, h = p.h * cv.height;
      if (px >= x && px <= x + w && py >= y && py <= y + h) return i;
    }
    return -1;
  };
  cv.addEventListener("pointerdown", (e) => {
    const p = Util.canvasPos(cv, e);
    fukuEd.drag = { x0: p.x, y0: p.y, moved: false, hit: hitPart(p.x, p.y), rect: null };
    cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener("pointermove", (e) => {
    if (!fukuEd.drag) return;
    const p = Util.canvasPos(cv, e);
    const dx = p.x - fukuEd.drag.x0, dy = p.y - fukuEd.drag.y0;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) fukuEd.drag.moved = true;
    if (fukuEd.drag.moved) {
      fukuEd.drag.rect = {
        x: Math.max(0, Math.min(fukuEd.drag.x0, p.x)),
        y: Math.max(0, Math.min(fukuEd.drag.y0, p.y)),
        w: Math.abs(dx), h: Math.abs(dy),
      };
      drawFuku();
    }
  });
  cv.addEventListener("pointerup", () => {
    const d = fukuEd.drag; fukuEd.drag = null;
    if (!d) return;
    if (d.moved && d.rect) {
      if (d.rect.w < 12 || d.rect.h < 12) { drawFuku(); return; }
      if (fukuEd.parts.length >= 8) {
        Ui.msg("パーツは8個までです", 1300, "#4dabf7");
        drawFuku(); return;
      }
      fukuEd.parts.push({
        kind: fukuEd.kind,
        x: d.rect.x / cv.width, y: d.rect.y / cv.height,
        w: d.rect.w / cv.width, h: d.rect.h / cv.height,
      });
      Sound.pop();
    } else if (d.hit >= 0) {
      const p = fukuEd.parts[d.hit];
      const idx = FUKU_KINDS.indexOf(p.kind);
      if (idx < 0 || idx >= FUKU_KINDS.length - 1) fukuEd.parts.splice(d.hit, 1);
      else p.kind = FUKU_KINDS[idx + 1];
      Sound.tap();
    }
    drawFuku();
  });
})();

$("fukuSave").onclick = async () => {
  fukuEd.rec.fukuParts = fukuEd.parts;
  await Store.put(fukuEd.rec);
  $("fukuModal").classList.add("hidden");
  Sound.good();
  changed();
};
$("fukuCancel").onclick = () => $("fukuModal").classList.add("hidden");

/* ---------- クイズを つくる ---------- */
const QUIZ_SCHOOLS = {
  hoikuen: { word: "ほいくえん", leader: "えんちょうせんせい", leaderLabel: "園長先生" },
  youchien: { word: "ようちえん", leader: "えんちょうせんせい", leaderLabel: "園長先生" },
  shougakkou: { word: "しょうがっこう", leader: "こうちょうせんせい", leaderLabel: "校長先生" },
};
function quizSchool() {
  return QUIZ_SCHOOLS[$("quizSchoolType")?.value] || QUIZ_SCHOOLS.hoikuen;
}

const QUIZ_TEMPLATES = [
  { label: () => `${quizSchool().word}の名前`, ph: () => `○○${quizSchool().word}`,
    make: (v) => {
      const word = quizSchool().word;
      return { q: `わたしたちの ${word}の なまえは?`, emoji: "🏫",
        choices: [v, `うちゅう${word}`, `おかしのくに ${word}`, `きょうりゅう${word}`], answer: 0 };
    } },
  { label: () => `${quizSchool().word}がある町`, ph: "○○区・○○市 など",
    make: (v) => ({ q: `${quizSchool().word}が あるのは どこの まち?`, emoji: "🗾",
      choices: [v, "ほっかいどう", "おきなわ", "うちゅう"], answer: 0 }) },
  { label: () => `${quizSchool().leaderLabel}の名前`, ph: "○○先生",
    make: (v) => ({ q: `${quizSchool().leader}は だれ?`, emoji: "👓",
      choices: [v, "サンタさん", "ももたろう", "かぐやひめ"], answer: 0 }) },
  { label: "クラス(組)の名前", ph: "○○ぐみ",
    make: (v) => ({ q: "みんなの くみの なまえは?", emoji: "🎒",
      choices: [v, "おばけぐみ", "ロボットぐみ", "きょうりゅうぐみ"], answer: 0 }) },
  { label: "給食の人気メニュー", ph: "カレーライス など",
    make: (v) => ({ q: "きゅうしょくで にんきの メニューは どれ?", emoji: "🍚",
      choices: [v, "いしころの スープ", "くつしたの にもの", "えんぴつの サラダ"], answer: 0 }) },
  { label: "好きな歌・遊び", ph: "歌や遊びの名前",
    make: (v) => ({ q: "みんなが だいすきなのは どれ?", emoji: "🎶",
      choices: [v, "そうじきの おと", "ずっと しずかに すわる", "おかたづけだけ"], answer: 0 }) },
];

function initQuiz() {
  if (!$("quizTemplates")) return;
  const school = $("quizSchoolType");
  const savedSchool = localStorage.getItem("quizSchoolType");
  if (QUIZ_SCHOOLS[savedSchool]) school.value = savedSchool;
  school.onchange = () => {
    localStorage.setItem("quizSchoolType", school.value);
    initQuizTemplates();
  };
  initQuizTemplates();
  refreshQuizList();
  refreshDefaultQuizList();
  $("qfAdd").onclick = qfAdd;
  $("quizExport").onclick = exportQuiz;
  $("quizImport").onclick = () => $("quizImportInput").click();
  $("quizImportInput").onchange = importQuiz;
}

function initQuizTemplates() {
  const box = $("quizTemplates");
  box.innerHTML = "";
  QUIZ_TEMPLATES.forEach((t) => {
    const d = document.createElement("div");
    d.className = "admin-row";
    const label = document.createElement("span");
    label.className = "nm";
    label.style.flex = "0 0 230px";
    label.textContent = typeof t.label === "function" ? t.label() : t.label;
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = typeof t.ph === "function" ? t.ph() : t.ph;
    input.style.flex = "1 1 180px";
    const btn = document.createElement("button");
    btn.className = "btn green";
    btn.textContent = "➕ いれる";
    btn.onclick = () => {
      const v = input.value.trim();
      if (!v) { Ui.msg("答えを入力してください", 1300, "#4dabf7"); return; }
      CustomQuiz.add(t.make(v));
      input.value = "";
      Sound.good();
      Ui.msg("クイズに追加しました", 1300, "#51cf66");
      refreshQuizList();
    };
    d.append(label, input, btn);
    box.appendChild(d);
  });
}

function refreshQuizList() {
  const box = $("quizList");
  const list = CustomQuiz.all();
  box.innerHTML = list.length ? "" : '<p class="note">まだありません(上で作るとクイズに追加されます)</p>';
  list.forEach((q, i) => {
    const d = document.createElement("div");
    d.className = "admin-row";
    const t = document.createElement("span");
    t.className = "nm";
    t.textContent = `${q.emoji || "❓"} ${q.q}(正解: ${q.choices[q.answer]})`;
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "mt-toggle" + (q.enabled === false ? "" : " on");
    toggle.setAttribute("aria-label", q.enabled === false ? "この問題を使う" : "この問題を使わない");
    toggle.setAttribute("aria-pressed", q.enabled === false ? "false" : "true");
    toggle.innerHTML = '<span class="knob"></span>';
    toggle.onclick = () => { CustomQuiz.toggle(i); refreshQuizList(); Sound.tap(); };
    const del = document.createElement("button");
    del.className = "btn red icon-btn";
    del.type = "button";
    del.setAttribute("aria-label", "削除");
    del.title = "削除";
    del.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="m7 7 1 13h8l1-13"/><path d="M10 11v5M14 11v5"/></svg>';
    del.onclick = () => { CustomQuiz.remove(i); refreshQuizList(); Sound.tap(); };
    d.classList.toggle("off", q.enabled === false);
    d.append(t, toggle, del);
    box.appendChild(d);
  });
}

function refreshDefaultQuizList() {
  const box = $("quizDefaultList");
  if (!box) return;
  const list = Array.isArray(window.QUIZ) ? window.QUIZ : [];
  box.innerHTML = list.length ? "" : '<p class="note">ありません</p>';
  list.forEach((q) => {
    const d = document.createElement("div");
    d.className = "admin-row";
    const t = document.createElement("span");
    t.className = "nm";
    t.textContent = `${q.emoji || "❓"} ${q.q}(正解: ${q.choices[q.answer]})`;
    const enabled = CustomQuiz.defaultEnabled(q);
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "mt-toggle" + (enabled ? " on" : "");
    toggle.setAttribute("aria-label", enabled ? "この問題を使わない" : "この問題を使う");
    toggle.setAttribute("aria-pressed", String(enabled));
    toggle.innerHTML = '<span class="knob"></span>';
    toggle.onclick = () => {
      CustomQuiz.toggleDefault(q);
      refreshDefaultQuizList();
      Sound.tap();
    };
    d.classList.toggle("off", !enabled);
    d.append(t, toggle);
    box.appendChild(d);
  });
}

function exportQuiz() {
  const blob = new Blob([JSON.stringify(CustomQuiz.exportData(), null, 2)], { type: "application/json" });
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  Backup.download(blob, `hoiku-quiz-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}.json`);
  Sound.good();
}

async function importQuiz(e) {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  if (!confirm("この端末のクイズを、選んだファイルの内容に置き換えます。よろしいですか?")) return;
  try {
    const data = JSON.parse(await file.text());
    CustomQuiz.importData(data);
    refreshQuizList();
    refreshDefaultQuizList();
    Sound.good();
    Ui.msg("クイズをインポートしました", 1500, "#51cf66");
  } catch (err) {
    alert("インポートに失敗しました:\n" + ((err && err.message) || err));
  }
}

function qfAdd() {
  const q = $("qfQ").value.trim();
  const answers = ["qfA0", "qfA1", "qfA2", "qfA3"].map((id) => $(id).value.trim());
  if (!q || answers.some((a) => !a)) {
    Ui.msg("すべての枠を埋めてください", 1500, "#4dabf7");
    return;
  }
  CustomQuiz.add({ q, emoji: $("qfE").value.trim() || "❓", choices: answers, answer: 0 });
  ["qfQ", "qfE", "qfA0", "qfA1", "qfA2", "qfA3"].forEach((id) => { $(id).value = ""; });
  Sound.good();
  Ui.msg("クイズに追加しました", 1300, "#51cf66");
  refreshQuizList();
}


/* ---------- キャラの こえ 登録 ----------
   よろこび(joy)/あいさつ(greet)/おどろき・いたみ(ouch)/しっぱい(fail) の
   4しゅるいを MediaRecorder で ろくおん(さいちょう10びょう)し、
   dataURL を rec.voices に ほぞんする(この端末の IndexedDB だけ)。 */
const VOICE_TYPES = [
  { key: "joy",   label: "よろこび",         ex: "やったー! わーい いえーい" },
  { key: "greet", label: "あいさつ",         ex: "こんにちは やっほー ハロー" },
  { key: "ouch",  label: "おどろき・いたみ", ex: "いたっ! うわっ!" },
  { key: "fail",  label: "しっぱい",         ex: "そんなぁ… ざんねん つぎはがんばろう" },
];
const voiceEd = { rec: null, mr: null, stream: null, chunks: [], key: null, timer: 0, audio: null };

function openVoice(rec) {
  voiceEd.rec = rec;
  if (!rec.voices) rec.voices = {};
  $("voiceModal").classList.remove("hidden");
  renderVoiceRows();
}

function renderVoiceRows() {
  const box = $("voiceRows");
  box.innerHTML = "";
  for (const t of VOICE_TYPES) {
    const has = !!voiceEd.rec.voices[t.key];
    const recording = voiceEd.key === t.key;
    const busy = voiceEd.key != null;      // どれか録音中は他のボタンを止める
    const d = document.createElement("div");
    d.className = "admin-row";
    const info = document.createElement("span");
    info.className = "nm";
    info.innerHTML =
      `<b>${t.label}</b> <span style="color:#8a7a68;font-size:13px">れい: ${t.ex}</span>` +
      `<br><span style="font-size:14px">${recording ? "🔴 ろくおんちゅう…(さいだい10びょう)" : has ? "✅ とうろくずみ" : "— みとうろく"}</span>`;
    d.appendChild(info);
    const mk = (label, cls, fn, dis) => {
      const b = document.createElement("button");
      b.className = "btn " + cls;
      b.textContent = label;
      if (dis) { b.disabled = true; b.style.opacity = "0.4"; }
      else b.onclick = fn;
      d.appendChild(b);
    };
    if (recording) {
      mk("⏹ ていし", "gray", () => stopVoiceRec());
    } else {
      mk("🔴 ろくおん", "pink", () => startVoiceRec(t.key), busy);
      mk("▶ しちょう", "green", () => playVoicePreview(t.key), busy || !has);
      mk("🗑 さくじょ", "gray", () => delVoice(t.key), busy || !has);
    }
    box.appendChild(d);
  }
}

async function startVoiceRec(key) {
  if (voiceEd.key) return;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert("このブラウザでは マイクが つかえません(Chrome推奨)。");
    return;
  }
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (e) {
    alert("マイクが つかえません。\nlocalhost か https で ひらいて、マイクの しようを「きょか」してください。");
    return;
  }
  let mr;
  try { mr = new MediaRecorder(stream); }
  catch (e) {
    alert("このブラウザは ろくおんに たいおうしていません(Chrome推奨)。");
    stream.getTracks().forEach((t) => t.stop());
    return;
  }
  voiceEd.stream = stream;
  voiceEd.mr = mr;
  voiceEd.key = key;
  voiceEd.chunks = [];
  mr.ondataavailable = (e) => { if (e.data && e.data.size) voiceEd.chunks.push(e.data); };
  mr.onstop = async () => {
    clearTimeout(voiceEd.timer);
    const blob = new Blob(voiceEd.chunks, { type: (voiceEd.mr && voiceEd.mr.mimeType) || "audio/webm" });
    if (blob.size) {
      const url = await Util.blobToDataURL(blob);
      voiceEd.rec.voices[key] = url;
      await Store.put(voiceEd.rec);
      Sound.pop();
    }
    stopVoiceStream();
    voiceEd.key = null;
    renderVoiceRows();
  };
  mr.start();
  renderVoiceRows();
  // 10びょうで じどう ていし
  voiceEd.timer = setTimeout(() => stopVoiceRec(), 10000);
}

function stopVoiceRec() {
  if (voiceEd.mr && voiceEd.mr.state !== "inactive") voiceEd.mr.stop();
}

function stopVoiceStream() {
  if (voiceEd.stream) { voiceEd.stream.getTracks().forEach((t) => t.stop()); voiceEd.stream = null; }
  voiceEd.mr = null;
}

function playVoicePreview(key) {
  const url = voiceEd.rec.voices[key];
  if (!url) return;
  if (voiceEd.audio) voiceEd.audio.pause();
  voiceEd.audio = new Audio(url);
  voiceEd.audio.play().catch(() => {});
}

async function delVoice(key) {
  const t = VOICE_TYPES.find((v) => v.key === key);
  if (!confirm(`「${t.label}」の こえを けしますか?`)) return;
  delete voiceEd.rec.voices[key];
  await Store.put(voiceEd.rec);
  Sound.tap();
  renderVoiceRows();
}

$("voiceClose").onclick = () => {
  stopVoiceRec();
  stopVoiceStream();
  if (voiceEd.audio) { voiceEd.audio.pause(); voiceEd.audio = null; }
  voiceEd.key = null;
  $("voiceModal").classList.add("hidden");
  changed();
};
/* ---------- ファイル/カメラ/既存の えから とりこむ ---------- */
let pickCat = "char";
let pickMeta = {};

$("edFileInput").onchange = (e) => {
  const files = [...e.target.files];
  e.target.value = "";
  importFiles(files, pickCat, pickMeta);
  pickMeta = {};
};
$("edCameraInput").onchange = async (e) => {
  const files = [...e.target.files];
  e.target.value = "";
  if (!files.length) return;
  const pages = [];
  for (const f of files) {
    try {
      // きりだし前提なので もとは たかめの かいぞうどで もつ(保存時に ちぢむ)
      const dataURL = await Util.fileToDataURL(f, 1600);
      const img = await Util.loadImage(dataURL);
      const c = Util.makeCanvas(img.width, img.height);
      c.getContext("2d").drawImage(img, 0, 0);
      pages.push(c);
    } catch (err) {
      alert("写真の読み込みに失敗しました: " + (f.name || ""));
    }
  }
  if (pages.length) openCrop(pages, pickMeta.name || "写真", {
    cat: pickCat,
    author: pickMeta.author || "",
  });
  pickMeta = {};
};

/* すでに とりこんである え(元素材など)から きりだす */
async function cropRecord(rec, cat) {
  const img = await Util.loadImage(rec.dataURL);
  const c = Util.makeCanvas(img.width, img.height);
  c.getContext("2d").drawImage(img, 0, 0);
  openCrop([c], rec.name || "切り出し", { cat: cat || null });
}

/* ---------- つくる画面の いちらん(create-*.html / draw-pick.html で 共通) ----------
   おなじ「1行 = 1まいの え + 編集ボタン」を どのページでも 同じ形で出す。

     defs: [{ cat, el, what, btns, kind }]
       cat  … 新しく保存する Store の カテゴリ("char" / "fuku" / "bg")
       cats … 一覧へまとめて出すカテゴリ(省略時は cat だけ)
       el   … いちらんを 入れる 要素の id
       what … ふやすボタンの ことば(「キャラクターの ぜんしん」など)
       btns … その行に 出す 編集ボタン("rig" / "voice" / "fuku" / "spot")
              ※ 名前かえ・DL・トリミング・削除は「とりこみ」の しごと
       kind … おえかきに わたす あたりの しゅるい(Guide.KINDS のキー。なくてもよい)
     opts: { back } … おえかきから もどってくる ページ(いま ひらいている ページ)

   もどってくる先を つけておくと、draw.html の「← もどる」と
   ほぞんした あとの いき先が、そのページに なる。 */
function mountLists(defs, opts) {
  opts = opts || {};

  const drawURL = (params) => {
    const p = new URLSearchParams(params);
    if (opts.back) p.set("back", opts.back);
    return "draw.html?" + p.toString();
  };

  async function refresh() {
    await Store.ensureSamples();
    for (const L of defs) {
      const el = $(L.el);
      if (!el) continue;
      el.innerHTML = "";
      const all = await Store.all();
      const cats = L.cats || [L.cat];
      const recs = all.filter((r) => cats.includes(r.cat));
      for (const r of recs) el.appendChild(row(r, L));
      el.appendChild(addButton(L));
    }
  }

  function row(r, L) {
    const d = document.createElement("div");
    d.className = "admin-row";
    d.innerHTML = `<img src="${r.dataURL}"><span class="nm">${r.name || "(名前なし)"}</span>`;
    Ui.thumbFix(d.querySelector("img"), r);
    const mk = (label, cls, fn) => {
      const b = document.createElement("button");
      b.className = "btn " + cls;
      b.textContent = label;
      b.onclick = fn;
      d.appendChild(b);
    };
    mk("名前", "blue", async () => {
      const nm = prompt("名前を入力してください", r.name || "");
      if (nm !== null) { r.name = nm.trim(); await Store.put(r); refresh(); }
    });
    mk("かく", "yellow", () => { location.href = drawURL({ edit: r.id }); });
    const btns = L.btns || [];
    if (btns.includes("rig")) mk("うごきせってい", "purple", () => openRig(r));
    if (btns.includes("voice")) mk("こえ", "orange", () => openVoice(r));
    if (btns.includes("fuku")) mk("パーツ", "green", () => openFuku(r));
    if (btns.includes("spot")) {
      const hasDiff = Array.isArray(r.diffVariants) && r.diffVariants.length > 0;
      mk(hasDiff ? "さぶん" : "＋", "orange", () => openSpot(r, {
        back: opts.back,
        promptAdd: !hasDiff,
      }));
    }
    return d;
  }

  /* いちらんの さいごの ＋ボタン */
  function addButton(L) {
    const b = document.createElement("button");
    b.className = "add-row";
    b.type = "button";
    b.innerHTML = '<span class="add-mark">＋</span>' + L.what + 'を ふやす';
    b.onclick = () => addNew(L);
    return b;
  }

  async function addNew(L) {
    Sound.tap();
    const how = await Ui.menu({
      title: L.what + "を ふやす",
      note: "やりかたを えらんでね",
      items: [
        { value: "draw", label: "おえかきする", color: "blue" },
        { value: "file", label: "ファイルをえらぶ", color: "blue" },
        { value: "camera", label: "さつえいする", color: "blue" },
        { value: "src", label: "もとそざいから きりだす", color: "blue" },
      ],
    });
    if (!how) return;
    if (how === "file") return Editors.chooseFiles(L.cat);
    if (how === "camera") return Editors.chooseCamera(L.cat);
    if (how === "draw") {
      location.href = drawURL(L.kind ? { kind: L.kind } : { cat: L.cat });
      return;
    }

    /* 元素材から:えらんだ 1枚を そのまま きりだし画面へ(保存先は このカテゴリ) */
    const srcs = await Store.all("src");
    if (!srcs.length) {
      Ui.msg("もとそざいが まだ ないよ", 1800, "#4dabf7");
      return;
    }
    const rec = await Picker.one({
      title: "どの もとそざいから きりだす?",
      note: "つぎの がめんで かこんだ ところが「" + L.what + "」に なります",
      records: srcs,
    });
    if (rec) cropRecord(rec, L.cat);
  }

  Editors.onChange = refresh;
  refresh();
  return refresh;
}

window.Editors = {
  onChange: null,
  openRig, openSpot, openFuku, openVoice, openCrop,
  importFiles,
  cropRecord,
  initQuiz,
  mountLists,
  chooseFiles(cat, meta) { pickCat = cat || "char"; pickMeta = meta || {}; $("edFileInput").click(); },
  chooseCamera(cat, meta) { pickCat = cat || "char"; pickMeta = meta || {}; $("edCameraInput").click(); },
};
})();
