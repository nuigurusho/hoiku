# 権利表示

「みんなの ゲームパック」のコード・画像・文章の著作権は制作者にあります。

    Copyright (c) 2026 aoki seiko

利用条件は [`LICENSE`](LICENSE)(PolyForm Noncommercial License 1.0.0)のとおりです。
非営利の目的であれば自由に使えます。保育園・幼稚園・学校・自治体などが自らの
保育・教育・行事のために使うことは、運営主体が営利法人であっても許諾しています。
営利の目的で利用する場合は別途の許諾が必要です。

---

## 同梱している第三者の成果物

このリポジトリには、次のフォントとライブラリを**そのまま同梱して再配布**しています。
オフラインの会場でも表示・動作を変えないため、外部CDNは使いません。
それぞれのライセンス条件に従ってください。

### フォント

#### M PLUS Rounded 1c

| | |
|---|---|
| 収録ファイル | `assets/fonts/RoundedMplus1c-Medium.woff2`<br>`assets/fonts/RoundedMplus1c-Bold.woff2`<br>`assets/fonts/RoundedMplus1c-ExtraBold.woff2` |
| 権利表示 | Copyright 2016 The Rounded M+ Project Authors. |
| ライセンス | SIL Open Font License 1.1 |
| ライセンス全文 | [`assets/fonts/MPLUS-Rounded-1c-OFL.txt`](assets/fonts/MPLUS-Rounded-1c-OFL.txt) |
| 入手元 | https://fonts.google.com/specimen/M+PLUS+Rounded+1c |

#### Mochiy Pop One

| | |
|---|---|
| 収録ファイル | `assets/fonts/MochiyPopOne-Regular.woff2` |
| 権利表示 | Copyright 2020 The Mochiypop Project Authors (https://github.com/fontdasu/Mochiypop) |
| ライセンス | SIL Open Font License 1.1 |
| ライセンス全文 | [`assets/fonts/Mochiy-Pop-One-OFL.txt`](assets/fonts/Mochiy-Pop-One-OFL.txt) |
| 入手元 | https://fonts.google.com/specimen/Mochiy+Pop+One |

CSS では `Hoiku Rounded` / `Hoiku Pop` という別名で読み込んでいますが、
フォントファイルそのものは配布されている Web フォント版のままで、改変していません。

### ライブラリ

#### PDF.js

| | |
|---|---|
| 収録ファイル | `js/vendor/pdf.min.js`<br>`js/vendor/pdf.worker.min.js` |
| バージョン | 3.11.174 (build ce8716743) |
| 権利表示 | Copyright 2023 Mozilla Foundation |
| ライセンス | Apache License 2.0 (http://www.apache.org/licenses/LICENSE-2.0) |
| 入手元 | https://github.com/mozilla/pdf.js |

Apache License 2.0 の条件により、収録ファイル冒頭のライセンス表記
(`@licstart` から始まるブロック)は削除せずそのまま保持しています。

#### core-js

| | |
|---|---|
| 収録場所 | 上記 PDF.js のビルドに同梱 |
| バージョン | 3.32.2 |
| ライセンス | MIT License (https://github.com/zloirock/core-js/blob/v3.32.2/LICENSE) |

---

## 本体の素材について

- `assets/` の背景・ボタン・ロゴ・サンプル画像は、このアプリのために用意したものです
- 効果音は WebAudio でその場で合成しており、音声ファイルは同梱していません
- 画面に出る絵文字は各OSのフォントで表示されるもので、リポジトリには含みません

## 園児の絵・名前・声について

**取り込んだ絵・写真・名前・作者名・録音した声は、このリポジトリには一切含まれません。**

これらは遊ぶ端末の IndexedDB にだけ保存され、外部のサーバーへ送信されません。
バックアップzipも、大人が自分で書き出して自分で保管する形です。
