/* ============================================================
   i18n.js — オフライン多言語表示
   日本語の画面文言をキーとして扱い、DOM追加後の文言にも適用する。
   ============================================================ */
"use strict";

const I18n = (() => {
  const STORAGE_KEY = "hoikuLanguage";
  const LOCALES = {
    ja: { label: "日本語", htmlLang: "ja" },
    en: { label: "English", htmlLang: "en" },
    id: { label: "Bahasa Indonesia", htmlLang: "id" },
    ko: { label: "한국어", htmlLang: "ko" },
    "zh-Hans": { label: "简体中文", htmlLang: "zh-Hans" },
    "zh-Hant": { label: "繁體中文", htmlLang: "zh-Hant" },
    de: { label: "Deutsch", htmlLang: "de" },
  };
  const LOGO_FILES = {
    ja: "logo.png",
    en: "logo-en.png",
    id: "logo-id.png",
    ko: "logo-ko.png",
    "zh-Hans": "logo-zh-hans.png",
    "zh-Hant": "logo-zh-hant.png",
    de: "logo-de.png",
  };

  /* 子ども向けの短い文言を中心にする。固有名・作品名・クイズの答えは翻訳しない。 */
  const PACKS = {
    en: {
      "みんなの ゲームパック": "Everyone’s Game Pack", "みんなのゲームパック": "Everyone’s Game Pack", "ゲームパック": "Game Pack",
      "つくる": "Create", "みる": "Watch", "あそぶ": "Play", "設定": "Settings", "せってい": "Settings", "もどる": "Back", "← もどる": "← Back", "表紙へ戻る": "Back to home",
      "つくる・みる・あそぶ": "Create, watch, or play", "やることを えらぶ": "Choose what to do", "あそびかたを えらぶ": "Choose how to play",
      "ひとりで": "Solo", "ふたりで": "Two players", "みんなで": "Group", "ゲーム別": "All games", "みるだけ(オート)": "Watch (Auto)", "れんしゅう": "Practice", "2Pたいせん": "2-player battle",
      "つくりかたから えらぶ": "Choose a method", "つくるものから えらぶ": "Choose what to create", "クイズを つくる": "Create a quiz",
      "おえかき": "Drawing", "カメラ": "Camera", "とりこみ": "Import", "キャラクター": "Character", "はいけい": "Background", "４たくクイズ": "4-choice quiz",
      "キャラしょうかい": "Character gallery", "びじゅつかん": "Art gallery", "みんなの せかい": "Everyone's World", "かけっこ": "Race", "たまいれ": "Ball toss", "ドッヂボール": "Dodgeball", "リレー": "Relay", "うんどうかい": "Sports day",
      "ふくわらい": "Make a face", "じゃんけん": "Rock paper scissors", "かげえクイズ": "Silhouette quiz", "さかさクイズ": "Reverse-word quiz", "まちがいさがし": "Spot the difference", "カードあわせ": "Memory match", "おえかきパズル": "Drawing puzzle", "おえかきのたび": "Drawing adventure", "もぐらたたき": "Whack-a-mole", "こえで ジャンプ": "Voice jump", "なわとび": "Jump rope",
      "スタート!": "Start!", "ゲームかいし": "Start game", "きめた！": "Done!", "つぎ ▶": "Next ▶", "つぎへ →": "Next →", "もういちど": "Again", "やりなおす": "Choose again", "やりなおし": "Redo", "もどす": "Undo", "おしまい!": "Finished!", "けっかへ ▶": "Results ▶", "こたえを みる": "Show answer", "ほぞん": "Save", "✔ ほぞん": "✔ Save", "✔ 保存する": "✔ Save", "キャンセル": "Cancel", "✕ とじる": "✕ Close", "シャッフル": "Shuffle", "🎲 シャッフル": "🎲 Shuffle", "🏆 ランキング": "🏆 Ranking",
      "かんたん": "Easy", "ふつう": "Normal", "むずかしい": "Hard", "🔥 ガチンコ": "🔥 Challenge", "🌈 ゆるふわ": "🌈 Relaxed", "ものしりクイズ": "Knowledge quiz", "キャラクタークイズ": "Character quiz",
      "なにを かく?": "What will you draw?", "どの かおで あそぶ?": "Choose a face", "さんかする キャラを えらんでね": "Choose characters", "はしる キャラを えらんでね": "Choose racers", "たたかう キャラを えらんでね": "Choose players", "たまいれを する キャラを えらんでね": "Choose players", "きょうぎを えらんでね": "Choose events", "だすのを えらんでね!": "Choose one!", "あそびかたを えらんでね": "Choose how to play",
      "キャラクターの絵": "Character art", "キャラクターのぜんしん": "Full-body character", "キャラクターのかお": "Character face", "はいけいの絵": "Background art", "もとそざい": "Source image", "ぜんしん": "Full body", "かお": "Face", "イラスト": "Illustration", "ステージ": "Stage", "しゅるい": "Type", "作品名": "Title", "作者名": "Creator", "作者:": "Creator:", "（任意）": "Optional", "うごき": "Motion", "こえ": "Voice", "かんせつ": "Joints", "どうぐ": "Tools", "🎨 どうぐ": "🎨 Tools", "いろ": "Color", "ふとさ": "Width", "けしゴム": "Eraser", "ぬりつぶし": "Fill", "ぜんぶけす": "Clear all", "↻ かいてん": "↻ Rotate", "↔ 左右はんてん": "↔ Flip",
      "👀 表示": "👀 Display", "作者名を非表示": "Hide creator names", "作品に作者名があることは、伏せ字で表示します": "Show creator names as hidden text", "📱 オフライン・更新": "📱 Offline & updates", "準備状況を確認しています…": "Checking readiness…", "最新版を確認": "Check for updates", "💾 設定・データのバックアップ": "💾 Settings & data backup", "すべてエクスポート(zip)": "Export all (zip)", "zipからインポート": "Import from zip", "その他": "Other", "サンプルをもう一度入れる": "Restore samples", "すべて削除する": "Delete all", "追加する": "Add", "置き換える": "Replace", "インポート": "Import", "エクスポート": "Export",
      "言語": "Language", "画面に表示する言語": "Language used on screen", "日本語": "Japanese",
      "チームわけ": "Teams", "🎪 チームわけ!": "🎪 Teams!", "チームがえ": "Change teams", "じぶんで チームを きめる": "Choose teams", "よーい…": "Ready…", "かち!": "Winner!", "かんせい!": "Complete!", "ぽん!": "Go!", "ほんばんへ": "Main game", "めかくしモード": "Blindfold mode", "ぎゃくさいせい": "Reverse", "ろくおん": "Record", "きいてみる": "Listen", "ていし": "Stop", "ことば": "Word", "べつの ことば": "Another word"
    },
    id: {
      "みんなの ゲームパック": "Paket Game untuk Semua", "みんなのゲームパック": "Paket Game untuk Semua", "ゲームパック": "Paket Game", "つくる": "Buat", "みる": "Lihat", "あそぶ": "Main", "設定": "Pengaturan", "せってい": "Pengaturan", "もどる": "Kembali", "← もどる": "← Kembali", "表紙へ戻る": "Kembali ke beranda", "つくる・みる・あそぶ": "Buat, lihat, atau main", "やることを えらぶ": "Pilih kegiatan", "あそびかたを えらぶ": "Pilih cara bermain",
      "ひとりで": "Sendiri", "ふたりで": "Berdua", "みんなで": "Bersama", "ゲーム別": "Semua game", "みるだけ(オート)": "Tonton (Otomatis)", "れんしゅう": "Latihan", "2Pたいせん": "Duel 2 pemain", "つくりかたから えらぶ": "Pilih cara membuat", "つくるものから えらぶ": "Pilih yang dibuat", "クイズを つくる": "Buat kuis", "おえかき": "Menggambar", "カメラ": "Kamera", "とりこみ": "Impor", "キャラクター": "Karakter", "はいけい": "Latar", "４たくクイズ": "Kuis 4 pilihan",
      "キャラしょうかい": "Galeri karakter", "びじゅつかん": "Galeri seni", "みんなの せかい": "Dunia Bersama", "かけっこ": "Balapan", "たまいれ": "Lempar bola", "ドッヂボール": "Bola hindar", "リレー": "Estafet", "うんどうかい": "Hari olahraga", "ふくわらい": "Susun wajah", "じゃんけん": "Suit", "かげえクイズ": "Kuis siluet", "さかさクイズ": "Kuis kata terbalik", "まちがいさがし": "Cari perbedaan", "カードあわせ": "Cocokkan kartu", "おえかきパズル": "Puzzle gambar", "おえかきのたび": "Petualangan gambar", "もぐらたたき": "Pukul tikus tanah", "こえで ジャンプ": "Lompat dengan suara", "なわとび": "Lompat tali",
      "スタート!": "Mulai!", "ゲームかいし": "Mulai game", "きめた！": "Selesai!", "つぎ ▶": "Berikutnya ▶", "つぎへ →": "Berikutnya →", "もういちど": "Sekali lagi", "やりなおす": "Pilih ulang", "やりなおし": "Ulangi", "もどす": "Urungkan", "おしまい!": "Selesai!", "けっかへ ▶": "Hasil ▶", "こたえを みる": "Lihat jawaban", "ほぞん": "Simpan", "✔ ほぞん": "✔ Simpan", "✔ 保存する": "✔ Simpan", "キャンセル": "Batal", "✕ とじる": "✕ Tutup", "シャッフル": "Acak", "🎲 シャッフル": "🎲 Acak", "🏆 ランキング": "🏆 Peringkat", "かんたん": "Mudah", "ふつう": "Normal", "むずかしい": "Sulit", "🔥 ガチンコ": "🔥 Tantangan", "🌈 ゆるふわ": "🌈 Santai", "ものしりクイズ": "Kuis pengetahuan", "キャラクタークイズ": "Kuis karakter",
      "なにを かく?": "Mau gambar apa?", "どの かおで あそぶ?": "Pilih wajah", "さんかする キャラを えらんでね": "Pilih karakter", "はしる キャラを えらんでね": "Pilih pelari", "たたかう キャラを えらんでね": "Pilih pemain", "たまいれを する キャラを えらんでね": "Pilih pemain", "きょうぎを えらんでね": "Pilih lomba", "だすのを えらんでね!": "Pilih satu!", "あそびかたを えらんでね": "Pilih cara bermain",
      "キャラクターの絵": "Gambar karakter", "キャラクターのぜんしん": "Karakter seluruh tubuh", "キャラクターのかお": "Wajah karakter", "はいけいの絵": "Gambar latar", "もとそざい": "Gambar sumber", "ぜんしん": "Seluruh tubuh", "かお": "Wajah", "イラスト": "Ilustrasi", "ステージ": "Panggung", "しゅるい": "Jenis", "作品名": "Judul", "作者名": "Pembuat", "作者:": "Pembuat:", "（任意）": "Opsional", "うごき": "Gerakan", "こえ": "Suara", "かんせつ": "Sendi", "どうぐ": "Alat", "🎨 どうぐ": "🎨 Alat", "いろ": "Warna", "ふとさ": "Ketebalan", "けしゴム": "Penghapus", "ぬりつぶし": "Isi", "ぜんぶけす": "Hapus semua", "↻ かいてん": "↻ Putar", "↔ 左右はんてん": "↔ Balik",
      "👀 表示": "👀 Tampilan", "作者名を非表示": "Sembunyikan nama pembuat", "作品に作者名があることは、伏せ字で表示します": "Tampilkan nama pembuat sebagai teks tersembunyi", "📱 オフライン・更新": "📱 Offline & pembaruan", "準備状況を確認しています…": "Memeriksa kesiapan…", "最新版を確認": "Periksa pembaruan", "💾 設定・データのバックアップ": "💾 Cadangan pengaturan & data", "すべてエクスポート(zip)": "Ekspor semua (zip)", "zipからインポート": "Impor dari zip", "その他": "Lainnya", "サンプルをもう一度入れる": "Pulihkan contoh", "すべて削除する": "Hapus semua", "追加する": "Tambahkan", "置き換える": "Ganti", "インポート": "Impor", "エクスポート": "Ekspor", "言語": "Bahasa", "画面に表示する言語": "Bahasa tampilan", "日本語": "Bahasa Jepang",
      "チームわけ": "Tim", "🎪 チームわけ!": "🎪 Tim!", "チームがえ": "Ganti tim", "じぶんで チームを きめる": "Pilih tim", "よーい…": "Siap…", "かち!": "Menang!", "かんせい!": "Selesai!", "ぽん!": "Mulai!", "ほんばんへ": "Game utama", "めかくしモード": "Mode tutup mata", "ぎゃくさいせい": "Putar balik", "ろくおん": "Rekam", "きいてみる": "Dengarkan", "ていし": "Berhenti", "ことば": "Kata", "べつの ことば": "Kata lain"
    },
    ko: {
      "みんなの ゲームパック": "모두의 게임 팩", "みんなのゲームパック": "모두의 게임 팩", "ゲームパック": "게임 팩", "つくる": "만들기", "みる": "보기", "あそぶ": "놀기", "設定": "설정", "せってい": "설정", "もどる": "뒤로", "← もどる": "← 뒤로", "表紙へ戻る": "홈으로", "つくる・みる・あそぶ": "만들기, 보기, 놀기", "やることを えらぶ": "할 일을 골라요", "あそびかたを えらぶ": "놀이 방법을 골라요",
      "ひとりで": "혼자", "ふたりで": "둘이서", "みんなで": "다 함께", "ゲーム別": "모든 게임", "みるだけ(オート)": "구경하기 (자동)", "れんしゅう": "연습", "2Pたいせん": "2인 대전", "つくりかたから えらぶ": "만드는 방법", "つくるものから えらぶ": "만들 것", "クイズを つくる": "퀴즈 만들기", "おえかき": "그림 그리기", "カメラ": "카메라", "とりこみ": "가져오기", "キャラクター": "캐릭터", "はいけい": "배경", "４たくクイズ": "4지선다 퀴즈",
      "キャラしょうかい": "캐릭터 갤러리", "びじゅつかん": "미술관", "みんなの せかい": "모두의 세상", "かけっこ": "달리기", "たまいれ": "공 넣기", "ドッヂボール": "피구", "リレー": "이어달리기", "うんどうかい": "운동회", "ふくわらい": "얼굴 맞추기", "じゃんけん": "가위바위보", "かげえクイズ": "그림자 퀴즈", "さかさクイズ": "거꾸로 말 퀴즈", "まちがいさがし": "다른 그림 찾기", "カードあわせ": "카드 짝 맞추기", "おえかきパズル": "그림 퍼즐", "おえかきのたび": "그림 여행", "もぐらたたき": "두더지 잡기", "こえで ジャンプ": "목소리 점프", "なわとび": "줄넘기",
      "スタート!": "시작!", "ゲームかいし": "게임 시작", "きめた！": "결정!", "つぎ ▶": "다음 ▶", "つぎへ →": "다음 →", "もういちど": "한 번 더", "やりなおす": "다시 고르기", "やりなおし": "다시 하기", "もどす": "되돌리기", "おしまい!": "끝!", "けっかへ ▶": "결과 ▶", "こたえを みる": "정답 보기", "ほぞん": "저장", "✔ ほぞん": "✔ 저장", "✔ 保存する": "✔ 저장", "キャンセル": "취소", "✕ とじる": "✕ 닫기", "シャッフル": "섞기", "🎲 シャッフル": "🎲 섞기", "🏆 ランキング": "🏆 순위", "かんたん": "쉬움", "ふつう": "보통", "むずかしい": "어려움", "🔥 ガチンコ": "🔥 도전", "🌈 ゆるふわ": "🌈 편하게", "ものしりクイズ": "상식 퀴즈", "キャラクタークイズ": "캐릭터 퀴즈",
      "なにを かく?": "무엇을 그릴까?", "どの かおで あそぶ?": "얼굴을 골라요", "さんかする キャラを えらんでね": "캐릭터를 골라요", "はしる キャラを えらんでね": "달릴 캐릭터를 골라요", "たたかう キャラを えらんでね": "선수를 골라요", "たまいれを する キャラを えらんでね": "선수를 골라요", "きょうぎを えらんでね": "경기를 골라요", "だすのを えらんでね!": "하나 골라요!", "あそびかたを えらんでね": "놀이 방법을 골라요",
      "キャラクターの絵": "캐릭터 그림", "キャラクターのぜんしん": "캐릭터 전신", "キャラクターのかお": "캐릭터 얼굴", "はいけいの絵": "배경 그림", "もとそざい": "원본 그림", "ぜんしん": "전신", "かお": "얼굴", "イラスト": "일러스트", "ステージ": "스테이지", "しゅるい": "종류", "作品名": "작품명", "作者名": "만든 사람", "作者:": "만든 사람:", "（任意）": "선택", "うごき": "움직임", "こえ": "목소리", "かんせつ": "관절", "どうぐ": "도구", "🎨 どうぐ": "🎨 도구", "いろ": "색", "ふとさ": "굵기", "けしゴム": "지우개", "ぬりつぶし": "채우기", "ぜんぶけす": "모두 지우기", "↻ かいてん": "↻ 회전", "↔ 左右はんてん": "↔ 좌우 반전",
      "👀 表示": "👀 표시", "作者名を非表示": "만든 사람 이름 숨기기", "作品に作者名があることは、伏せ字で表示します": "만든 사람 이름을 가려서 표시합니다", "📱 オフライン・更新": "📱 오프라인 및 업데이트", "準備状況を確認しています…": "준비 상태 확인 중…", "最新版を確認": "업데이트 확인", "💾 設定・データのバックアップ": "💾 설정 및 데이터 백업", "すべてエクスポート(zip)": "모두 내보내기 (zip)", "zipからインポート": "zip에서 가져오기", "その他": "기타", "サンプルをもう一度入れる": "샘플 복원", "すべて削除する": "모두 삭제", "追加する": "추가", "置き換える": "바꾸기", "インポート": "가져오기", "エクスポート": "내보내기", "言語": "언어", "画面に表示する言語": "화면에 표시할 언어", "日本語": "일본어",
      "チームわけ": "팀 나누기", "🎪 チームわけ!": "🎪 팀 나누기!", "チームがえ": "팀 바꾸기", "じぶんで チームを きめる": "직접 팀 정하기", "よーい…": "준비…", "かち!": "승리!", "かんせい!": "완성!", "ぽん!": "출발!", "ほんばんへ": "본게임", "めかくしモード": "눈가림 모드", "ぎゃくさいせい": "거꾸로 재생", "ろくおん": "녹음", "きいてみる": "들어보기", "ていし": "정지", "ことば": "단어", "べつの ことば": "다른 단어"
    },
    "zh-Hans": {
      "みんなの ゲームパック": "大家的游戏包", "みんなのゲームパック": "大家的游戏包", "ゲームパック": "游戏包", "つくる": "创作", "みる": "观看", "あそぶ": "游玩", "設定": "设置", "せってい": "设置", "もどる": "返回", "← もどる": "← 返回", "表紙へ戻る": "返回首页", "つくる・みる・あそぶ": "创作、观看或游玩", "やることを えらぶ": "选择要做的事", "あそびかたを えらぶ": "选择玩法",
      "ひとりで": "单人", "ふたりで": "双人", "みんなで": "大家一起", "ゲーム別": "全部游戏", "みるだけ(オート)": "观看（自动）", "れんしゅう": "练习", "2Pたいせん": "双人对战", "つくりかたから えらぶ": "选择创作方式", "つくるものから えらぶ": "选择创作内容", "クイズを つくる": "制作问答", "おえかき": "画画", "カメラ": "相机", "とりこみ": "导入", "キャラクター": "角色", "はいけい": "背景", "４たくクイズ": "四选一问答",
      "キャラしょうかい": "角色画廊", "びじゅつかん": "美术馆", "みんなの せかい": "大家的世界", "かけっこ": "赛跑", "たまいれ": "投球入篮", "ドッヂボール": "躲避球", "リレー": "接力赛", "うんどうかい": "运动会", "ふくわらい": "拼脸游戏", "じゃんけん": "石头剪刀布", "かげえクイズ": "剪影问答", "さかさクイズ": "倒放词语问答", "まちがいさがし": "找不同", "カードあわせ": "卡片配对", "おえかきパズル": "绘画拼图", "おえかきのたび": "绘画冒险", "もぐらたたき": "打地鼠", "こえで ジャンプ": "声音跳跃", "なわとび": "跳绳",
      "スタート!": "开始！", "ゲームかいし": "开始游戏", "きめた！": "选好了！", "つぎ ▶": "下一步 ▶", "つぎへ →": "下一步 →", "もういちど": "再来一次", "やりなおす": "重新选择", "やりなおし": "重做", "もどす": "撤销", "おしまい!": "结束！", "けっかへ ▶": "查看结果 ▶", "こたえを みる": "查看答案", "ほぞん": "保存", "✔ ほぞん": "✔ 保存", "✔ 保存する": "✔ 保存", "キャンセル": "取消", "✕ とじる": "✕ 关闭", "シャッフル": "随机", "🎲 シャッフル": "🎲 随机", "🏆 ランキング": "🏆 排名", "かんたん": "简单", "ふつう": "普通", "むずかしい": "困难", "🔥 ガチンコ": "🔥 挑战", "🌈 ゆるふわ": "🌈 轻松", "ものしりクイズ": "知识问答", "キャラクタークイズ": "角色问答",
      "なにを かく?": "画什么？", "どの かおで あそぶ?": "选择一张脸", "さんかする キャラを えらんでね": "选择角色", "はしる キャラを えらんでね": "选择参赛角色", "たたかう キャラを えらんでね": "选择参赛角色", "たまいれを する キャラを えらんでね": "选择参赛角色", "きょうぎを えらんでね": "选择项目", "だすのを えらんでね!": "选择一个！", "あそびかたを えらんでね": "选择玩法",
      "キャラクターの絵": "角色图片", "キャラクターのぜんしん": "角色全身", "キャラクターのかお": "角色脸部", "はいけいの絵": "背景图片", "もとそざい": "原始图片", "ぜんしん": "全身", "かお": "脸部", "イラスト": "插图", "ステージ": "场景", "しゅるい": "类型", "作品名": "作品名", "作者名": "作者名", "作者:": "作者：", "（任意）": "选填", "うごき": "动作", "こえ": "声音", "かんせつ": "关节", "どうぐ": "工具", "🎨 どうぐ": "🎨 工具", "いろ": "颜色", "ふとさ": "粗细", "けしゴム": "橡皮擦", "ぬりつぶし": "填充", "ぜんぶけす": "全部清除", "↻ かいてん": "↻ 旋转", "↔ 左右はんてん": "↔ 左右翻转",
      "👀 表示": "👀 显示", "作者名を非表示": "隐藏作者名", "作品に作者名があることは、伏せ字で表示します": "用遮挡字符显示作者名", "📱 オフライン・更新": "📱 离线与更新", "準備状況を確認しています…": "正在检查准备状态…", "最新版を確認": "检查更新", "💾 設定・データのバックアップ": "💾 设置与数据备份", "すべてエクスポート(zip)": "全部导出（zip）", "zipからインポート": "从 zip 导入", "その他": "其他", "サンプルをもう一度入れる": "恢复示例", "すべて削除する": "全部删除", "追加する": "添加", "置き換える": "替换", "インポート": "导入", "エクスポート": "导出", "言語": "语言", "画面に表示する言語": "界面显示语言", "日本語": "日语",
      "チームわけ": "分队", "🎪 チームわけ!": "🎪 分队！", "チームがえ": "更换队伍", "じぶんで チームを きめる": "自己分队", "よーい…": "预备…", "かち!": "胜利！", "かんせい!": "完成！", "ぽん!": "开始！", "ほんばんへ": "正式游戏", "めかくしモード": "蒙眼模式", "ぎゃくさいせい": "倒放", "ろくおん": "录音", "きいてみる": "试听", "ていし": "停止", "ことば": "词语", "べつの ことば": "其他词语"
    },
    "zh-Hant": {
      "みんなの ゲームパック": "大家的遊戲包", "みんなのゲームパック": "大家的遊戲包", "ゲームパック": "遊戲包", "つくる": "創作", "みる": "觀看", "あそぶ": "遊玩", "設定": "設定", "せってい": "設定", "もどる": "返回", "← もどる": "← 返回", "表紙へ戻る": "返回首頁", "つくる・みる・あそぶ": "創作、觀看或遊玩", "やることを えらぶ": "選擇要做的事", "あそびかたを えらぶ": "選擇玩法",
      "ひとりで": "單人", "ふたりで": "雙人", "みんなで": "大家一起", "ゲーム別": "全部遊戲", "みるだけ(オート)": "觀看（自動）", "れんしゅう": "練習", "2Pたいせん": "雙人對戰", "つくりかたから えらぶ": "選擇創作方式", "つくるものから えらぶ": "選擇創作內容", "クイズを つくる": "製作問答", "おえかき": "畫畫", "カメラ": "相機", "とりこみ": "匯入", "キャラクター": "角色", "はいけい": "背景", "４たくクイズ": "四選一問答",
      "キャラしょうかい": "角色畫廊", "びじゅつかん": "美術館", "みんなの せかい": "大家的世界", "かけっこ": "賽跑", "たまいれ": "投球入籃", "ドッヂボール": "躲避球", "リレー": "接力賽", "うんどうかい": "運動會", "ふくわらい": "拼臉遊戲", "じゃんけん": "剪刀石頭布", "かげえクイズ": "剪影問答", "さかさクイズ": "倒放詞語問答", "まちがいさがし": "找不同", "カードあわせ": "卡片配對", "おえかきパズル": "繪畫拼圖", "おえかきのたび": "繪畫冒險", "もぐらたたき": "打地鼠", "こえで ジャンプ": "聲音跳躍", "なわとび": "跳繩",
      "スタート!": "開始！", "ゲームかいし": "開始遊戲", "きめた！": "選好了！", "つぎ ▶": "下一步 ▶", "つぎへ →": "下一步 →", "もういちど": "再來一次", "やりなおす": "重新選擇", "やりなおし": "重做", "もどす": "復原", "おしまい!": "結束！", "けっかへ ▶": "查看結果 ▶", "こたえを みる": "查看答案", "ほぞん": "儲存", "✔ ほぞん": "✔ 儲存", "✔ 保存する": "✔ 儲存", "キャンセル": "取消", "✕ とじる": "✕ 關閉", "シャッフル": "隨機", "🎲 シャッフル": "🎲 隨機", "🏆 ランキング": "🏆 排名", "かんたん": "簡單", "ふつう": "普通", "むずかしい": "困難", "🔥 ガチンコ": "🔥 挑戰", "🌈 ゆるふわ": "🌈 輕鬆", "ものしりクイズ": "知識問答", "キャラクタークイズ": "角色問答",
      "なにを かく?": "畫什麼？", "どの かおで あそぶ?": "選擇一張臉", "さんかする キャラを えらんでね": "選擇角色", "はしる キャラを えらんでね": "選擇參賽角色", "たたかう キャラを えらんでね": "選擇參賽角色", "たまいれを する キャラを えらんでね": "選擇參賽角色", "きょうぎを えらんでね": "選擇項目", "だすのを えらんでね!": "選擇一個！", "あそびかたを えらんでね": "選擇玩法",
      "キャラクターの絵": "角色圖片", "キャラクターのぜんしん": "角色全身", "キャラクターのかお": "角色臉部", "はいけいの絵": "背景圖片", "もとそざい": "原始圖片", "ぜんしん": "全身", "かお": "臉部", "イラスト": "插圖", "ステージ": "場景", "しゅるい": "類型", "作品名": "作品名", "作者名": "作者名", "作者:": "作者：", "（任意）": "選填", "うごき": "動作", "こえ": "聲音", "かんせつ": "關節", "どうぐ": "工具", "🎨 どうぐ": "🎨 工具", "いろ": "顏色", "ふとさ": "粗細", "けしゴム": "橡皮擦", "ぬりつぶし": "填滿", "ぜんぶけす": "全部清除", "↻ かいてん": "↻ 旋轉", "↔ 左右はんてん": "↔ 左右翻轉",
      "👀 表示": "👀 顯示", "作者名を非表示": "隱藏作者名", "作品に作者名があることは、伏せ字で表示します": "用遮擋字元顯示作者名", "📱 オフライン・更新": "📱 離線與更新", "準備状況を確認しています…": "正在檢查準備狀態…", "最新版を確認": "檢查更新", "💾 設定・データのバックアップ": "💾 設定與資料備份", "すべてエクスポート(zip)": "全部匯出（zip）", "zipからインポート": "從 zip 匯入", "その他": "其他", "サンプルをもう一度入れる": "恢復範例", "すべて削除する": "全部刪除", "追加する": "新增", "置き換える": "取代", "インポート": "匯入", "エクスポート": "匯出", "言語": "語言", "画面に表示する言語": "介面顯示語言", "日本語": "日語",
      "チームわけ": "分隊", "🎪 チームわけ!": "🎪 分隊！", "チームがえ": "更換隊伍", "じぶんで チームを きめる": "自己分隊", "よーい…": "預備…", "かち!": "勝利！", "かんせい!": "完成！", "ぽん!": "開始！", "ほんばんへ": "正式遊戲", "めかくしモード": "蒙眼模式", "ぎゃくさいせい": "倒放", "ろくおん": "錄音", "きいてみる": "試聽", "ていし": "停止", "ことば": "詞語", "べつの ことば": "其他詞語"
    },
    de: {
      "みんなの ゲームパック": "Spielepaket für alle", "みんなのゲームパック": "Spielepaket für alle", "ゲームパック": "Spielepaket", "つくる": "Gestalten", "みる": "Ansehen", "あそぶ": "Spielen", "設定": "Einstellungen", "せってい": "Einstellungen", "もどる": "Zurück", "← もどる": "← Zurück", "表紙へ戻る": "Zur Startseite", "つくる・みる・あそぶ": "Gestalten, ansehen oder spielen", "やることを えらぶ": "Wähle aus", "あそびかたを えらぶ": "Spielart wählen",
      "ひとりで": "Allein", "ふたりで": "Zu zweit", "みんなで": "Gemeinsam", "ゲーム別": "Alle Spiele", "みるだけ(オート)": "Zuschauen (Auto)", "れんしゅう": "Üben", "2Pたいせん": "Duell zu zweit", "つくりかたから えらぶ": "Methode wählen", "つくるものから えらぶ": "Motiv wählen", "クイズを つくる": "Quiz erstellen", "おえかき": "Malen", "カメラ": "Kamera", "とりこみ": "Importieren", "キャラクター": "Figur", "はいけい": "Hintergrund", "４たくクイズ": "Quiz mit 4 Antworten",
      "キャラしょうかい": "Figurengalerie", "びじゅつかん": "Kunstgalerie", "みんなの せかい": "Unsere Welt", "かけっこ": "Wettrennen", "たまいれ": "Ballwurf", "ドッヂボール": "Völkerball", "リレー": "Staffellauf", "うんどうかい": "Sportfest", "ふくわらい": "Gesicht legen", "じゃんけん": "Schere Stein Papier", "かげえクイズ": "Schattenquiz", "さかさクイズ": "Rückwärtswort-Quiz", "まちがいさがし": "Fehler suchen", "カードあわせ": "Kartenpaare", "おえかきパズル": "Bilderpuzzle", "おえかきのたび": "Mal-Abenteuer", "もぐらたたき": "Maulwurfspiel", "こえで ジャンプ": "Stimmen-Sprung", "なわとび": "Seilspringen",
      "スタート!": "Start!", "ゲームかいし": "Spiel starten", "きめた！": "Fertig!", "つぎ ▶": "Weiter ▶", "つぎへ →": "Weiter →", "もういちど": "Noch einmal", "やりなおす": "Neu wählen", "やりなおし": "Wiederholen", "もどす": "Rückgängig", "おしまい!": "Geschafft!", "けっかへ ▶": "Ergebnis ▶", "こたえを みる": "Antwort zeigen", "ほぞん": "Speichern", "✔ ほぞん": "✔ Speichern", "✔ 保存する": "✔ Speichern", "キャンセル": "Abbrechen", "✕ とじる": "✕ Schließen", "シャッフル": "Mischen", "🎲 シャッフル": "🎲 Mischen", "🏆 ランキング": "🏆 Rangliste", "かんたん": "Leicht", "ふつう": "Normal", "むずかしい": "Schwer", "🔥 ガチンコ": "🔥 Herausforderung", "🌈 ゆるふわ": "🌈 Entspannt", "ものしりクイズ": "Wissensquiz", "キャラクタークイズ": "Figurenquiz",
      "なにを かく?": "Was malst du?", "どの かおで あそぶ?": "Wähle ein Gesicht", "さんかする キャラを えらんでね": "Figuren auswählen", "はしる キャラを えらんでね": "Läufer auswählen", "たたかう キャラを えらんでね": "Spieler auswählen", "たまいれを する キャラを えらんでね": "Spieler auswählen", "きょうぎを えらんでね": "Disziplinen wählen", "だすのを えらんでね!": "Wähle eins!", "あそびかたを えらんでね": "Spielart wählen",
      "キャラクターの絵": "Figurenbild", "キャラクターのぜんしん": "Ganze Figur", "キャラクターのかお": "Figurengesicht", "はいけいの絵": "Hintergrundbild", "もとそざい": "Originalbild", "ぜんしん": "Ganze Figur", "かお": "Gesicht", "イラスト": "Illustration", "ステージ": "Bühne", "しゅるい": "Art", "作品名": "Titel", "作者名": "Erstellt von", "作者:": "Erstellt von:", "（任意）": "Optional", "うごき": "Bewegung", "こえ": "Stimme", "かんせつ": "Gelenke", "どうぐ": "Werkzeuge", "🎨 どうぐ": "🎨 Werkzeuge", "いろ": "Farbe", "ふとさ": "Stärke", "けしゴム": "Radierer", "ぬりつぶし": "Füllen", "ぜんぶけす": "Alles löschen", "↻ かいてん": "↻ Drehen", "↔ 左右はんてん": "↔ Spiegeln",
      "👀 表示": "👀 Anzeige", "作者名を非表示": "Namen ausblenden", "作品に作者名があることは、伏せ字で表示します": "Namen von Erstellern verdeckt anzeigen", "📱 オフライン・更新": "📱 Offline & Updates", "準備状況を確認しています…": "Bereitschaft wird geprüft…", "最新版を確認": "Nach Updates suchen", "💾 設定・データのバックアップ": "💾 Einstellungen & Datensicherung", "すべてエクスポート(zip)": "Alles exportieren (zip)", "zipからインポート": "Aus zip importieren", "その他": "Sonstiges", "サンプルをもう一度入れる": "Beispiele wiederherstellen", "すべて削除する": "Alles löschen", "追加する": "Hinzufügen", "置き換える": "Ersetzen", "インポート": "Importieren", "エクスポート": "Exportieren", "言語": "Sprache", "画面に表示する言語": "Anzeigesprache", "日本語": "Japanisch",
      "チームわけ": "Teams", "🎪 チームわけ!": "🎪 Teams!", "チームがえ": "Teams ändern", "じぶんで チームを きめる": "Teams selbst wählen", "よーい…": "Bereit…", "かち!": "Gewonnen!", "かんせい!": "Fertig!", "ぽん!": "Los!", "ほんばんへ": "Zum Hauptspiel", "めかくしモード": "Blindmodus", "ぎゃくさいせい": "Rückwärts", "ろくおん": "Aufnehmen", "きいてみる": "Anhören", "ていし": "Stopp", "ことば": "Wort", "べつの ことば": "Anderes Wort"
    }
  };

  const EXTRA_PACKS = {
    en: { "せってい おとなのひとよう": "Settings for adults", "せってい(おとなのひとよう)": "Settings (for adults)", "ホームへ戻る": "Back to home", "ぜんがめんに する": "Full screen", "最新版です。オフラインでも使えます。": "Up to date. Available offline.", "オフラインで使用中です。": "You are offline." },
    id: { "せってい おとなのひとよう": "Pengaturan untuk orang dewasa", "せってい(おとなのひとよう)": "Pengaturan (untuk orang dewasa)", "ホームへ戻る": "Kembali ke beranda", "ぜんがめんに する": "Layar penuh", "最新版です。オフラインでも使えます。": "Sudah versi terbaru. Bisa digunakan offline.", "オフラインで使用中です。": "Sedang offline." },
    ko: { "せってい おとなのひとよう": "어른용 설정", "せってい(おとなのひとよう)": "설정 (어른용)", "ホームへ戻る": "홈으로", "ぜんがめんに する": "전체 화면", "最新版です。オフラインでも使えます。": "최신 버전입니다. 오프라인에서도 사용할 수 있어요.", "オフラインで使用中です。": "오프라인으로 사용 중입니다." },
    "zh-Hans": { "せってい おとなのひとよう": "成人设置", "せってい(おとなのひとよう)": "设置（成人）", "ホームへ戻る": "返回首页", "ぜんがめんに する": "全屏", "最新版です。オフラインでも使えます。": "已是最新版本，可离线使用。", "オフラインで使用中です。": "当前处于离线状态。" },
    "zh-Hant": { "せってい おとなのひとよう": "成人設定", "せってい(おとなのひとよう)": "設定（成人）", "ホームへ戻る": "返回首頁", "ぜんがめんに する": "全螢幕", "最新版です。オフラインでも使えます。": "已是最新版本，可離線使用。", "オフラインで使用中です。": "目前處於離線狀態。" },
    de: { "せってい おとなのひとよう": "Einstellungen für Erwachsene", "せってい(おとなのひとよう)": "Einstellungen (für Erwachsene)", "ホームへ戻る": "Zur Startseite", "ぜんがめんに する": "Vollbild", "最新版です。オフラインでも使えます。": "Aktuell. Auch offline verfügbar.", "オフラインで使用中です。": "Offline-Modus aktiv." }
  };

  /* 設定画面は大人向けの長い説明も省略せず翻訳する。 */
  const SETTINGS_PACKS = {
    en: {
      "オンにすると、鑑賞画面では「作者: ＊＊＊＊」と表示され、キャラクタークイズにも作者名の問題を出しません。登録した作者名は消えません。": "When enabled, creator names appear as “Creator: ****” in the gallery and are not used in character quiz questions. Saved names are not deleted.",
      "更新しても、取り込んだ絵・声・動き設定・ランキングは消えません。更新後も、前日に機内モードで起動確認してください。": "Updates do not delete imported pictures, voices, motion settings, or rankings. After updating, test a full launch in airplane mode the day before use.",
      "取り込んだ絵・写真、動き設定、まちがいスポット、オリジナルクイズ、ランキングを まとめて1つの": "Export imported pictures, photos, motion settings, difference spots, original quizzes, and rankings together as one",
      "zipファイル": "zip file", "に書き出せます。別のPCで「インポート」すれば、まるごと移行できます。画像はこの端末の中(IndexedDB)だけに保存されるので、": ". Import it on another PC to move everything. Images are stored only on this device (IndexedDB), so this is useful", "当日使うPCへ移すとき": "when moving data to the PC you will use", "に便利です。": ".",
      "内蔵サンプルはそのまま残し、それ以外を": "Built-in samples remain unchanged. You can", "か、現在のデータへ": "or", "か選べます。": "the other data.",
      "クイズは「つくる」画面で追加できます。全端末共通の内蔵問題を変更したい場合のみ、": "Add quizzes from the Create screen. To change built-in questions shared by all devices, edit only", "を編集してください。": ".",
      "新しいバージョンがあります": "A new version is available", "ゲームが終わってから更新してください。": "Update after the game is finished.", "最新版に更新": "Update now", "あとで": "Later",
      "最新版を準備しました。「最新版に更新」を押すと切り替わります。": "The update is ready. Select “Update now” to switch.", "オフラインで使う準備ができました。": "Ready for offline use.", "このブラウザではオフライン版を利用できません。": "Offline mode is not available in this browser.", "オフラインで使用中です。更新確認には通信が必要です。": "You are offline. An internet connection is required to check for updates.", "最新版を確認しています…": "Checking for updates…", "最新版をオフライン用に保存しています…": "Saving the latest version for offline use…", "更新を確認できませんでした。通信を確認して、もう一度押してください。": "Could not check for updates. Check your connection and try again.", "最新版へ切り替えています…": "Switching to the latest version…", "ホーム画面版に対応したブラウザで開いてください。": "Open this page in a browser that supports Home Screen apps.", "オフライン版を準備できませんでした。通信を確認して再読み込みしてください。": "Could not prepare offline mode. Check your connection and reload."
    },
    id: {
      "オンにすると、鑑賞画面では「作者: ＊＊＊＊」と表示され、キャラクタークイズにも作者名の問題を出しません。登録した作者名は消えません。": "Jika aktif, nama pembuat ditampilkan sebagai “Pembuat: ****” di galeri dan tidak digunakan dalam soal kuis karakter. Nama yang tersimpan tidak dihapus.",
      "更新しても、取り込んだ絵・声・動き設定・ランキングは消えません。更新後も、前日に機内モードで起動確認してください。": "Pembaruan tidak menghapus gambar, suara, pengaturan gerakan, atau peringkat. Setelah memperbarui, uji peluncuran penuh dalam mode pesawat sehari sebelum digunakan.",
      "取り込んだ絵・写真、動き設定、まちがいスポット、オリジナルクイズ、ランキングを まとめて1つの": "Ekspor gambar, foto, pengaturan gerakan, titik perbedaan, kuis buatan, dan peringkat menjadi satu", "zipファイル": "file zip", "に書き出せます。別のPCで「インポート」すれば、まるごと移行できます。画像はこの端末の中(IndexedDB)だけに保存されるので、": ". Impor di PC lain untuk memindahkan semuanya. Gambar hanya tersimpan di perangkat ini (IndexedDB), jadi fitur ini berguna", "当日使うPCへ移すとき": "saat memindahkan data ke PC yang akan digunakan", "に便利です。": ".",
      "内蔵サンプルはそのまま残し、それ以外を": "Contoh bawaan tetap ada. Data lain dapat", "か、現在のデータへ": "atau", "か選べます。": ".", "クイズは「つくる」画面で追加できます。全端末共通の内蔵問題を変更したい場合のみ、": "Tambahkan kuis dari layar Buat. Untuk mengubah soal bawaan di semua perangkat, edit hanya", "を編集してください。": ".",
      "新しいバージョンがあります": "Versi baru tersedia", "ゲームが終わってから更新してください。": "Perbarui setelah permainan selesai.", "最新版に更新": "Perbarui sekarang", "あとで": "Nanti", "最新版を準備しました。「最新版に更新」を押すと切り替わります。": "Pembaruan siap. Pilih “Perbarui sekarang” untuk beralih.", "オフラインで使う準備ができました。": "Siap digunakan offline.", "このブラウザではオフライン版を利用できません。": "Mode offline tidak tersedia di browser ini.", "オフラインで使用中です。更新確認には通信が必要です。": "Anda sedang offline. Koneksi internet diperlukan untuk memeriksa pembaruan.", "最新版を確認しています…": "Memeriksa pembaruan…", "最新版をオフライン用に保存しています…": "Menyimpan versi terbaru untuk offline…", "更新を確認できませんでした。通信を確認して、もう一度押してください。": "Tidak dapat memeriksa pembaruan. Periksa koneksi lalu coba lagi.", "最新版へ切り替えています…": "Beralih ke versi terbaru…", "ホーム画面版に対応したブラウザで開いてください。": "Buka di browser yang mendukung aplikasi Layar Utama.", "オフライン版を準備できませんでした。通信を確認して再読み込みしてください。": "Mode offline tidak dapat disiapkan. Periksa koneksi lalu muat ulang."
    },
    ko: {
      "オンにすると、鑑賞画面では「作者: ＊＊＊＊」と表示され、キャラクタークイズにも作者名の問題を出しません。登録した作者名は消えません。": "켜면 감상 화면에서 ‘만든 사람: ****’로 표시되고 캐릭터 퀴즈에도 만든 사람 이름 문제가 나오지 않습니다. 저장된 이름은 삭제되지 않습니다.",
      "更新しても、取り込んだ絵・声・動き設定・ランキングは消えません。更新後も、前日に機内モードで起動確認してください。": "업데이트해도 가져온 그림, 목소리, 움직임 설정, 순위는 사라지지 않습니다. 업데이트 후에는 사용 전날 비행기 모드에서 완전히 실행되는지 확인해 주세요.",
      "取り込んだ絵・写真、動き設定、まちがいスポット、オリジナルクイズ、ランキングを まとめて1つの": "가져온 그림과 사진, 움직임 설정, 다른 부분 위치, 직접 만든 퀴즈, 순위를 하나의", "zipファイル": "zip 파일", "に書き出せます。別のPCで「インポート」すれば、まるごと移行できます。画像はこの端末の中(IndexedDB)だけに保存されるので、": "로 내보낼 수 있습니다. 다른 PC에서 가져오면 모두 옮길 수 있습니다. 이미지는 이 기기(IndexedDB)에만 저장되므로", "当日使うPCへ移すとき": "사용할 PC로 옮길 때", "に便利です。": " 편리합니다.",
      "内蔵サンプルはそのまま残し、それ以外を": "기본 샘플은 그대로 두고 나머지 데이터를", "か、現在のデータへ": "하거나 현재 데이터에", "か選べます。": "할 수 있습니다.", "クイズは「つくる」画面で追加できます。全端末共通の内蔵問題を変更したい場合のみ、": "퀴즈는 만들기 화면에서 추가할 수 있습니다. 모든 기기의 기본 문제를 바꿀 때만", "を編集してください。": "를 편집하세요.",
      "新しいバージョンがあります": "새 버전이 있습니다", "ゲームが終わってから更新してください。": "게임이 끝난 뒤 업데이트해 주세요.", "最新版に更新": "최신 버전으로 업데이트", "あとで": "나중에", "最新版を準備しました。「最新版に更新」を押すと切り替わります。": "최신 버전이 준비되었습니다. ‘최신 버전으로 업데이트’를 누르면 전환됩니다.", "オフラインで使う準備ができました。": "오프라인 사용 준비가 끝났습니다.", "このブラウザではオフライン版を利用できません。": "이 브라우저에서는 오프라인 버전을 사용할 수 없습니다.", "オフラインで使用中です。更新確認には通信が必要です。": "오프라인으로 사용 중입니다. 업데이트 확인에는 인터넷 연결이 필요합니다.", "最新版を確認しています…": "업데이트 확인 중…", "最新版をオフライン用に保存しています…": "최신 버전을 오프라인용으로 저장 중…", "更新を確認できませんでした。通信を確認して、もう一度押してください。": "업데이트를 확인하지 못했습니다. 인터넷 연결을 확인한 뒤 다시 눌러 주세요.", "最新版へ切り替えています…": "최신 버전으로 전환 중…", "ホーム画面版に対応したブラウザで開いてください。": "홈 화면 앱을 지원하는 브라우저에서 열어 주세요.", "オフライン版を準備できませんでした。通信を確認して再読み込みしてください。": "오프라인 버전을 준비하지 못했습니다. 연결을 확인하고 새로고침해 주세요."
    },
    "zh-Hans": {
      "オンにすると、鑑賞画面では「作者: ＊＊＊＊」と表示され、キャラクタークイズにも作者名の問題を出しません。登録した作者名は消えません。": "开启后，作品浏览页会显示“作者：****”，角色问答中也不会出现作者姓名题。已保存的姓名不会被删除。", "更新しても、取り込んだ絵・声・動き設定・ランキングは消えません。更新後も、前日に機内モードで起動確認してください。": "更新不会删除已导入的图片、声音、动作设置和排名。更新后请在使用前一天开启飞行模式，确认应用能够完整启动。",
      "取り込んだ絵・写真、動き設定、まちがいスポット、オリジナルクイズ、ランキングを まとめて1つの": "可将导入的图片、照片、动作设置、不同点位置、自制问答和排名导出为一个", "zipファイル": "zip 文件", "に書き出せます。別のPCで「インポート」すれば、まるごと移行できます。画像はこの端末の中(IndexedDB)だけに保存されるので、": "。在另一台电脑上导入即可整体迁移。图片只保存在本设备（IndexedDB）中，因此适合", "当日使うPCへ移すとき": "将数据移至当天使用的电脑时", "に便利です。": "使用。", "内蔵サンプルはそのまま残し、それ以外を": "内置示例会保留，其他数据可以", "か、現在のデータへ": "，也可以", "か選べます。": "。", "クイズは「つくる」画面で追加できます。全端末共通の内蔵問題を変更したい場合のみ、": "可在“创作”页面添加问答。只有要修改所有设备共用的内置题目时，才需要编辑", "を編集してください。": "。",
      "新しいバージョンがあります": "有新版本", "ゲームが終わってから更新してください。": "请在游戏结束后更新。", "最新版に更新": "更新到最新版", "あとで": "稍后", "最新版を準備しました。「最新版に更新」を押すと切り替わります。": "最新版已准备好。点击“更新到最新版”即可切换。", "オフラインで使う準備ができました。": "已准备好离线使用。", "このブラウザではオフライン版を利用できません。": "此浏览器不支持离线版。", "オフラインで使用中です。更新確認には通信が必要です。": "当前处于离线状态，检查更新需要网络连接。", "最新版を確認しています…": "正在检查更新…", "最新版をオフライン用に保存しています…": "正在保存最新版以供离线使用…", "更新を確認できませんでした。通信を確認して、もう一度押してください。": "无法检查更新。请检查网络连接后重试。", "最新版へ切り替えています…": "正在切换到最新版…", "ホーム画面版に対応したブラウザで開いてください。": "请使用支持主屏幕应用的浏览器打开。", "オフライン版を準備できませんでした。通信を確認して再読み込みしてください。": "无法准备离线版。请检查网络连接并重新加载。"
    },
    "zh-Hant": {
      "オンにすると、鑑賞画面では「作者: ＊＊＊＊」と表示され、キャラクタークイズにも作者名の問題を出しません。登録した作者名は消えません。": "開啟後，作品瀏覽頁會顯示「作者：****」，角色問答中也不會出現作者姓名題。已儲存的姓名不會被刪除。", "更新しても、取り込んだ絵・声・動き設定・ランキングは消えません。更新後も、前日に機内モードで起動確認してください。": "更新不會刪除已匯入的圖片、聲音、動作設定和排名。更新後請在使用前一天開啟飛航模式，確認應用程式能完整啟動。",
      "取り込んだ絵・写真、動き設定、まちがいスポット、オリジナルクイズ、ランキングを まとめて1つの": "可將匯入的圖片、照片、動作設定、不同處位置、自製問答和排名匯出為一個", "zipファイル": "zip 檔案", "に書き出せます。別のPCで「インポート」すれば、まるごと移行できます。画像はこの端末の中(IndexedDB)だけに保存されるので、": "。在另一台電腦上匯入即可整體移轉。圖片只儲存在本裝置（IndexedDB）中，因此適合", "当日使うPCへ移すとき": "將資料移至當天使用的電腦時", "に便利です。": "使用。", "内蔵サンプルはそのまま残し、それ以外を": "內建範例會保留，其他資料可以", "か、現在のデータへ": "，也可以", "か選べます。": "。", "クイズは「つくる」画面で追加できます。全端末共通の内蔵問題を変更したい場合のみ、": "可在「創作」頁面新增問答。只有要修改所有裝置共用的內建題目時，才需要編輯", "を編集してください。": "。",
      "新しいバージョンがあります": "有新版本", "ゲームが終わってから更新してください。": "請在遊戲結束後更新。", "最新版に更新": "更新至最新版", "あとで": "稍後", "最新版を準備しました。「最新版に更新」を押すと切り替わります。": "最新版已準備好。按下「更新至最新版」即可切換。", "オフラインで使う準備ができました。": "已準備好離線使用。", "このブラウザではオフライン版を利用できません。": "此瀏覽器不支援離線版。", "オフラインで使用中です。更新確認には通信が必要です。": "目前處於離線狀態，檢查更新需要網路連線。", "最新版を確認しています…": "正在檢查更新…", "最新版をオフライン用に保存しています…": "正在儲存最新版以供離線使用…", "更新を確認できませんでした。通信を確認して、もう一度押してください。": "無法檢查更新。請檢查網路連線後重試。", "最新版へ切り替えています…": "正在切換至最新版…", "ホーム画面版に対応したブラウザで開いてください。": "請使用支援主畫面應用程式的瀏覽器開啟。", "オフライン版を準備できませんでした。通信を確認して再読み込みしてください。": "無法準備離線版。請檢查網路連線並重新載入。"
    },
    de: {
      "オンにすると、鑑賞画面では「作者: ＊＊＊＊」と表示され、キャラクタークイズにも作者名の問題を出しません。登録した作者名は消えません。": "Wenn diese Option aktiv ist, werden Namen in der Galerie als „Erstellt von: ****“ angezeigt und nicht für Fragen im Figurenquiz verwendet. Gespeicherte Namen werden nicht gelöscht.", "更新しても、取り込んだ絵・声・動き設定・ランキングは消えません。更新後も、前日に機内モードで起動確認してください。": "Updates löschen keine importierten Bilder, Stimmen, Bewegungseinstellungen oder Ranglisten. Teste nach dem Update am Vortag einen vollständigen Start im Flugmodus.",
      "取り込んだ絵・写真、動き設定、まちがいスポット、オリジナルクイズ、ランキングを まとめて1つの": "Exportiere Bilder, Fotos, Bewegungseinstellungen, Fehlerpositionen, eigene Quizfragen und Ranglisten gemeinsam als eine", "zipファイル": "ZIP-Datei", "に書き出せます。別のPCで「インポート」すれば、まるごと移行できます。画像はこの端末の中(IndexedDB)だけに保存されるので、": ". Importiere sie auf einem anderen PC, um alles zu übertragen. Bilder werden nur auf diesem Gerät (IndexedDB) gespeichert. Das ist praktisch", "当日使うPCへ移すとき": "beim Übertragen auf den verwendeten PC", "に便利です。": ".", "内蔵サンプルはそのまま残し、それ以外を": "Die integrierten Beispiele bleiben erhalten. Andere Daten lassen sich", "か、現在のデータへ": "oder zu den vorhandenen Daten", "か選べます。": ".", "クイズは「つくる」画面で追加できます。全端末共通の内蔵問題を変更したい場合のみ、": "Quizfragen lassen sich unter Gestalten hinzufügen. Bearbeite zum Ändern der integrierten Fragen auf allen Geräten nur", "を編集してください。": ".",
      "新しいバージョンがあります": "Eine neue Version ist verfügbar", "ゲームが終わってから更新してください。": "Aktualisiere nach dem Spiel.", "最新版に更新": "Jetzt aktualisieren", "あとで": "Später", "最新版を準備しました。「最新版に更新」を押すと切り替わります。": "Das Update ist bereit. Wähle „Jetzt aktualisieren“, um zu wechseln.", "オフラインで使う準備ができました。": "Bereit für die Offline-Nutzung.", "このブラウザではオフライン版を利用できません。": "Der Offline-Modus ist in diesem Browser nicht verfügbar.", "オフラインで使用中です。更新確認には通信が必要です。": "Du bist offline. Zum Suchen nach Updates ist eine Internetverbindung nötig.", "最新版を確認しています…": "Updates werden gesucht…", "最新版をオフライン用に保存しています…": "Die neueste Version wird offline gespeichert…", "更新を確認できませんでした。通信を確認して、もう一度押してください。": "Updates konnten nicht geprüft werden. Prüfe die Verbindung und versuche es erneut.", "最新版へ切り替えています…": "Wechsel zur neuesten Version…", "ホーム画面版に対応したブラウザで開いてください。": "Öffne die Seite in einem Browser mit Unterstützung für Startbildschirm-Apps.", "オフライン版を準備できませんでした。通信を確認して再読み込みしてください。": "Der Offline-Modus konnte nicht vorbereitet werden. Prüfe die Verbindung und lade neu."
    }
  };

  const GAME_UI_PACKS = {
    en: { "(タッチで えらぶ / はずす)": "(Tap to select / remove)", "にん せんたくちゅう": " selected", "ぜんキャラ えらぶ": "Select all", "ぜんキャラ はずす": "Remove all", "2〜6にん えらんでね": "Choose 2–6 players", "2にん えらんでね": "Choose 2 players", "6にんまで えらべるよ": "Choose up to 6 players" },
    id: { "(タッチで えらぶ / はずす)": "(Ketuk untuk pilih / hapus)", "にん せんたくちゅう": " dipilih", "ぜんキャラ えらぶ": "Pilih semua", "ぜんキャラ はずす": "Hapus semua", "2〜6にん えらんでね": "Pilih 2–6 pemain", "2にん えらんでね": "Pilih 2 pemain", "6にんまで えらべるよ": "Pilih hingga 6 pemain" },
    ko: { "(タッチで えらぶ / はずす)": "(눌러서 선택 / 해제)", "にん せんたくちゅう": "명 선택 중", "ぜんキャラ えらぶ": "모두 선택", "ぜんキャラ はずす": "모두 해제", "2〜6にん えらんでね": "2~6명을 골라요", "2にん えらんでね": "2명을 골라요", "6にんまで えらべるよ": "6명까지 고를 수 있어요" },
    "zh-Hans": { "(タッチで えらぶ / はずす)": "（点击选择／取消）", "にん せんたくちゅう": "人已选择", "ぜんキャラ えらぶ": "全选", "ぜんキャラ はずす": "全部取消", "2〜6にん えらんでね": "请选择2～6名玩家", "2にん えらんでね": "请选择2名玩家", "6にんまで えらべるよ": "最多可选6名玩家" },
    "zh-Hant": { "(タッチで えらぶ / はずす)": "（點選／取消）", "にん せんたくちゅう": "人已選擇", "ぜんキャラ えらぶ": "全選", "ぜんキャラ はずす": "全部取消", "2〜6にん えらんでね": "請選擇2～6名玩家", "2にん えらんでね": "請選擇2名玩家", "6にんまで えらべるよ": "最多可選6名玩家" },
    de: { "(タッチで えらぶ / はずす)": "(Antippen zum Auswählen / Entfernen)", "にん せんたくちゅう": " ausgewählt", "ぜんキャラ えらぶ": "Alle auswählen", "ぜんキャラ はずす": "Alle entfernen", "2〜6にん えらんでね": "Wähle 2–6 Spieler", "2にん えらんでね": "Wähle 2 Spieler", "6にんまで えらべるよ": "Wähle bis zu 6 Spieler" }
  };

  const DODGEBALL_PACKS = {
    en: { "アウトの子は 外野(がいや)へ": "Out players move outside", "コートの そとに でて、まだ 内野を あてられる": "They can keep throwing from outside the court", "外野で あてたら 内野に もどれる": "Return inside after a hit from outside", "「外野へ」ルールが ONのときだけ つかえる": "Available only when the outside-player rule is on", "🔴 あかチーム": "🔴 Red team", "🔵 あおチーム": "🔵 Blue team", "あかチーム": "Red team", "あおチーム": "Blue team" },
    id: { "アウトの子は 外野(がいや)へ": "Pemain yang keluar pindah ke luar lapangan", "コートの そとに でて、まだ 内野を あてられる": "Tetap dapat melempar dari luar lapangan", "外野で あてたら 内野に もどれる": "Kembali ke dalam setelah mengenai lawan dari luar", "「外野へ」ルールが ONのときだけ つかえる": "Hanya tersedia jika aturan pemain luar aktif", "🔴 あかチーム": "🔴 Tim merah", "🔵 あおチーム": "🔵 Tim biru", "あかチーム": "Tim merah", "あおチーム": "Tim biru" },
    ko: { "アウトの子は 外野(がいや)へ": "아웃된 선수는 외야로", "コートの そとに でて、まだ 内野を あてられる": "코트 밖에서도 안쪽 선수를 맞힐 수 있어요", "外野で あてたら 内野に もどれる": "외야에서 맞히면 내야로 돌아오기", "「外野へ」ルールが ONのときだけ つかえる": "‘외야로’ 규칙을 켰을 때만 사용할 수 있어요", "🔴 あかチーム": "🔴 빨강 팀", "🔵 あおチーム": "🔵 파랑 팀", "あかチーム": "빨강 팀", "あおチーム": "파랑 팀" },
    "zh-Hans": { "アウトの子は 外野(がいや)へ": "出局后移至外场", "コートの そとに でて、まだ 内野を あてられる": "在场外仍可投球击中内场玩家", "外野で あてたら 内野に もどれる": "从外场击中对手后返回内场", "「外野へ」ルールが ONのときだけ つかえる": "仅在“移至外场”规则开启时可用", "🔴 あかチーム": "🔴 红队", "🔵 あおチーム": "🔵 蓝队", "あかチーム": "红队", "あおチーム": "蓝队" },
    "zh-Hant": { "アウトの子は 外野(がいや)へ": "出局後移至外場", "コートの そとに でて、まだ 内野を あてられる": "在場外仍可投球擊中內場玩家", "外野で あてたら 内野に もどれる": "從外場擊中對手後返回內場", "「外野へ」ルールが ONのときだけ つかえる": "僅在「移至外場」規則開啟時可用", "🔴 あかチーム": "🔴 紅隊", "🔵 あおチーム": "🔵 藍隊", "あかチーム": "紅隊", "あおチーム": "藍隊" },
    de: { "アウトの子は 外野(がいや)へ": "Getroffene Spieler gehen ins Außenfeld", "コートの そとに でて、まだ 内野を あてられる": "Sie können von außen weiter auf das Innenfeld werfen", "外野で あてたら 内野に もどれる": "Nach einem Treffer vom Außenfeld zurückkehren", "「外野へ」ルールが ONのときだけ つかえる": "Nur verfügbar, wenn die Außenfeldregel aktiv ist", "🔴 あかチーム": "🔴 Rotes Team", "🔵 あおチーム": "🔵 Blaues Team", "あかチーム": "Rotes Team", "あおチーム": "Blaues Team" }
  };

  /* 全画面の初期表示を横断検査して拾った、共通辞書以外のUI文言。 */
  const UI_CODES = ["en", "id", "ko", "zh-Hans", "zh-Hant", "de"];
  const UI_ROWS = [
    ["📊 匿名の利用状況", "📊 Anonymous usage", "📊 Penggunaan anonim", "📊 익명 사용 현황", "📊 匿名使用情况", "📊 匿名使用狀況", "📊 Anonyme Nutzung"],
    ["匿名の利用状況を送信", "Send anonymous usage data", "Kirim data penggunaan anonim", "익명 사용 데이터 보내기", "发送匿名使用数据", "傳送匿名使用資料", "Anonyme Nutzungsdaten senden"],
    ["ゲームごとの開始・クリア回数を送ります", "Sends game starts and completions", "Mengirim jumlah mulai dan selesai per game", "게임별 시작 및 완료 횟수를 보냅니다", "发送各游戏的开始和完成次数", "傳送各遊戲的開始與完成次數", "Sendet Starts und Abschlüsse je Spiel"],
    ["集計とプライバシーについて", "Usage data and privacy", "Data penggunaan dan privasi", "사용 데이터 및 개인정보 보호", "使用数据与隐私", "使用資料與隱私權", "Nutzungsdaten und Datenschutz"],
    ["おえかきする", "Draw", "Menggambar", "그리기", "画画", "畫畫", "Malen"],
    ["ファイルをえらぶ", "Choose file", "Pilih file", "파일 선택", "选择文件", "選擇檔案", "Datei wählen"],
    ["さつえいする", "Take photo", "Ambil foto", "사진 찍기", "拍照", "拍照", "Foto aufnehmen"],
    ["✏️ 作品情報", "✏️ Work details", "✏️ Info karya", "✏️ 작품 정보", "✏️ 作品信息", "✏️ 作品資訊", "✏️ Werkdetails"],
    ["絵の種類", "Picture type", "Jenis gambar", "그림 종류", "图片类型", "圖片類型", "Bildtyp"],
    ["歩きプレビュー", "Walking preview", "Pratinjau berjalan", "걷기 미리보기", "行走预览", "行走預覽", "Laufvorschau"],
    ["🧍にんげん", "🧍 Person", "🧍 Orang", "🧍 사람", "🧍人物", "🧍人物", "🧍 Mensch"],
    ["👗スカート", "👗 Skirt", "👗 Rok", "👗 치마", "👗裙装", "👗裙裝", "👗 Rock"],
    ["🐕どうぶつ", "🐕 Animal", "🐕 Hewan", "🐕 동물", "🐕动物", "🐕動物", "🐕 Tier"],
    ["👻ふわふわ", "👻 Floating", "👻 Melayang", "👻 둥실둥실", "👻漂浮", "👻漂浮", "👻 Schwebend"],
    ["🦋ちょうちょ", "🦋 Butterfly", "🦋 Kupu-kupu", "🦋 나비", "🦋蝴蝶", "🦋蝴蝶", "🦋 Schmetterling"],
    ["高度な設定", "Advanced settings", "Pengaturan lanjutan", "고급 설정", "高级设置", "進階設定", "Erweiterte Einstellungen"],
    ["絵の向き", "Picture direction", "Arah gambar", "그림 방향", "图片方向", "圖片方向", "Bildausrichtung"],
    ["余白をカット", "Trim margins", "Potong margin", "여백 자르기", "裁剪留白", "裁剪留白", "Ränder zuschneiden"],
    ["絵のまわりの空白だけを詰めます", "Remove only empty space around the picture", "Hapus hanya ruang kosong di sekitar gambar", "그림 주변의 빈 공간만 줄여요", "仅裁掉图片周围的空白", "只裁掉圖片周圍的留白", "Nur leeren Rand um das Bild entfernen"],
    ["白い体を残して背景を抜く", "Remove background but keep white parts", "Hapus latar, pertahankan bagian putih", "흰색 몸은 남기고 배경 지우기", "保留白色主体并移除背景", "保留白色主體並移除背景", "Hintergrund entfernen, weiße Teile behalten"],
    ["外側の白だけ抜く", "Remove only outside white", "Hapus putih di luar saja", "바깥쪽 흰색만 지우기", "仅移除外侧白色", "僅移除外側白色", "Nur äußeres Weiß entfernen"],
    ["白いかお・服・体を残す", "Keep white face, clothes, and body", "Pertahankan wajah, pakaian, dan tubuh putih", "흰 얼굴·옷·몸 남기기", "保留白色脸、衣服和身体", "保留白色臉、衣服和身體", "Weißes Gesicht, Kleidung und Körper behalten"],
    ["白をすべて抜く", "Remove all white", "Hapus semua warna putih", "흰색 모두 지우기", "移除所有白色", "移除所有白色", "Alles Weiß entfernen"],
    ["これまでと同じ方式", "Use previous method", "Gunakan cara lama", "이전 방식 사용", "使用原有方式", "使用原有方式", "Bisherige Methode"],
    ["白を残す筆", "Keep-white brush", "Kuas pertahankan putih", "흰색 살리기 펜", "保留白色画笔", "保留白色筆刷", "Weiß-behalten-Pinsel"],
    ["背景を消す筆", "Background eraser", "Penghapus latar", "배경 지우기 펜", "背景橡皮擦", "背景橡皮擦", "Hintergrundradierer"],
    ["筆をリセット", "Reset brushes", "Reset kuas", "펜 초기화", "重置画笔", "重設筆刷", "Pinsel zurücksetzen"],
    ["腕も動かす", "Move arms too", "Gerakkan lengan juga", "팔도 움직이기", "同时移动手臂", "同時移動手臂", "Arme mitbewegen"],
    ["かんたん作成", "Quick create", "Buat cepat", "간편 만들기", "快速创建", "快速建立", "Schnell erstellen"],
    ["ほいくえんの名前", "Preschool name", "Nama prasekolah", "어린이집 이름", "幼儿园名称", "幼兒園名稱", "Name der Kita"],
    ["➕ いれる", "➕ Add", "➕ Tambah", "➕ 추가", "➕ 添加", "➕ 新增", "➕ Hinzufügen"],
    ["ほいくえんがある町", "Preschool town", "Kota prasekolah", "어린이집이 있는 지역", "幼儿园所在城市", "幼兒園所在城市", "Ort der Kita"],
    ["園長先生の名前", "Director's name", "Nama kepala sekolah", "원장님 이름", "园长姓名", "園長姓名", "Name der Leitung"],
    ["クラス(組)の名前", "Class name", "Nama kelas", "반 이름", "班级名称", "班級名稱", "Gruppenname"],
    ["給食の人気メニュー", "Popular lunch", "Menu makan siang favorit", "인기 급식 메뉴", "受欢迎的午餐", "受歡迎的午餐", "Beliebtes Mittagessen"],
    ["好きな歌・遊び", "Favorite song or game", "Lagu atau permainan favorit", "좋아하는 노래·놀이", "喜欢的歌曲或游戏", "喜歡的歌曲或遊戲", "Lieblingslied oder -spiel"],
    ["自分で作る", "Create manually", "Buat sendiri", "직접 만들기", "自行创建", "自行建立", "Selbst erstellen"],
    ["クイズに追加", "Add to quiz", "Tambahkan ke kuis", "퀴즈에 추가", "添加到问答", "新增至問答", "Zum Quiz hinzufügen"],
    ["この端末の問題", "Questions on this device", "Soal di perangkat ini", "이 기기의 문제", "本设备的题目", "本裝置的題目", "Fragen auf diesem Gerät"],
    ["デフォルトの問題", "Built-in questions", "Soal bawaan", "기본 문제", "内置题目", "內建題目", "Integrierte Fragen"],
    ["🧍 にんげん", "🧍 Person", "🧍 Orang", "🧍 사람", "🧍 人物", "🧍 人物", "🧍 Mensch"],
    ["👗 スカート", "👗 Skirt", "👗 Rok", "👗 치마", "👗 裙装", "👗 裙裝", "👗 Rock"],
    ["🐕 どうぶつ", "🐕 Animal", "🐕 Hewan", "🐕 동물", "🐕 动物", "🐕 動物", "🐕 Tier"],
    ["🦋 ちょうちょ", "🦋 Butterfly", "🦋 Kupu-kupu", "🦋 나비", "🦋 蝴蝶", "🦋 蝴蝶", "🦋 Schmetterling"],
    ["👻 ふわふわ", "👻 Floating", "👻 Melayang", "👻 둥실둥실", "👻 漂浮", "👻 漂浮", "👻 Schwebend"],
    ["そのほか", "Other", "Lainnya", "기타", "其他", "其他", "Andere"],
    ["😀 かお", "😀 Face", "😀 Wajah", "😀 얼굴", "😀 脸", "😀 臉", "😀 Gesicht"],
    ["🏞️ はいけい", "🏞️ Background", "🏞️ Latar", "🏞️ 배경", "🏞️ 背景", "🏞️ 背景", "🏞️ Hintergrund"],
    ["あたり", "Guide", "Panduan", "가이드", "参考线", "參考線", "Vorlage"],
    ["なんの え?", "What picture?", "Gambar apa?", "무슨 그림?", "画什么？", "畫什麼？", "Welches Bild?"],
    ["べつの えとして ほぞん", "Save as a new picture", "Simpan sebagai gambar baru", "새 그림으로 저장", "另存为新图片", "另存為新圖片", "Als neues Bild speichern"],
    ["とりこんだ えを なおす", "Edit imported picture", "Edit gambar impor", "가져온 그림 수정", "编辑导入的图片", "編輯匯入的圖片", "Importiertes Bild bearbeiten"],
    ["🚶 あるく", "🚶 Walk", "🚶 Berjalan", "🚶 걷기", "🚶 行走", "🚶 行走", "🚶 Gehen"],
    ["⬆️ ジャンプ", "⬆️ Jump", "⬆️ Lompat", "⬆️ 점프", "⬆️ 跳跃", "⬆️ 跳躍", "⬆️ Springen"],
    ["🌀 くるり", "🌀 Spin", "🌀 Berputar", "🌀 빙글", "🌀 旋转", "🌀 旋轉", "🌀 Drehen"],
    ["👋 ごあいさつ", "👋 Greeting", "👋 Salam", "👋 인사", "👋 打招呼", "👋 打招呼", "👋 Begrüßung"],
    ["はじまる まえに チームを はっぴょうします。", "Teams are announced before the game.", "Tim diumumkan sebelum permainan.", "경기 전에 팀을 발표해요.", "比赛前公布队伍。", "比賽前公布隊伍。", "Die Teams werden vor dem Spiel bekannt gegeben."],
    ["チーム名は タッチして かえられます。キャラは タッチ、または もう いっぽうへ ドラッグで うつせます。", "Tap a team name to change it. Tap or drag characters to move them.", "Ketuk nama tim untuk mengubahnya. Ketuk atau seret karakter untuk memindahkan.", "팀 이름을 눌러 바꿀 수 있어요. 캐릭터는 누르거나 드래그해서 옮겨요.", "点击队名可修改；点击或拖动角色可换队。", "點選隊名可修改；點選或拖曳角色可換隊。", "Teamnamen antippen zum Ändern. Figuren antippen oder ziehen zum Verschieben."],
    ["オンにした きょうぎを、うえから じゅんばんに 再生します。", "Enabled events play from top to bottom.", "Lomba yang aktif dimainkan dari atas ke bawah.", "켠 경기를 위에서부터 차례로 진행해요.", "已开启的项目将从上到下依次进行。", "已開啟的項目會由上至下依序進行。", "Aktivierte Disziplinen werden von oben nach unten gespielt."],
    ["みぎの えを タッチして まちがいを さがしてね!", "Tap the right picture and find the differences!", "Ketuk gambar kanan dan cari perbedaannya!", "오른쪽 그림을 눌러 다른 곳을 찾아요!", "点击右图找出不同之处！", "點選右圖找出不同之處！", "Tippe auf das rechte Bild und finde die Unterschiede!"],
    ["かちまけなし・すきなだけ あそべる", "No winners—play as long as you like", "Tanpa menang atau kalah—main sesukamu", "승패 없이 마음껏 놀아요", "不分胜负，想玩多久都可以", "不分勝負，想玩多久都可以", "Ohne Gewinner – so lange spielen wie du möchtest"],
    ["め・まゆげ・はな・くちを ドラッグして かおを つくろう!", "Drag the eyes, eyebrows, nose, and mouth to make a face!", "Seret mata, alis, hidung, dan mulut untuk membuat wajah!", "눈·눈썹·코·입을 드래그해 얼굴을 만들어요!", "拖动眼睛、眉毛、鼻子和嘴巴来拼脸！", "拖曳眼睛、眉毛、鼻子和嘴巴來拼臉！", "Ziehe Augen, Brauen, Nase und Mund zu einem Gesicht!"],
    ["おなじ えを 2まい みつけてね!", "Find two matching pictures!", "Temukan dua gambar yang sama!", "같은 그림 두 장을 찾아요!", "找出两张相同的图片！", "找出兩張相同的圖片！", "Finde zwei gleiche Bilder!"],
    ["でてきた みんなの えを タッチ!", "Tap the pictures that pop up!", "Ketuk gambar yang muncul!", "튀어나온 그림을 눌러요!", "点击出现的图片！", "點選出現的圖片！", "Tippe auf die auftauchenden Bilder!"],
    ["クイズたいかい!", "Quiz time!", "Waktunya kuis!", "퀴즈 대회!", "问答大会！", "問答大會！", "Quizzeit!"],
    ["4つのなかから こたえを えらぼう!", "Choose the answer from four choices!", "Pilih jawaban dari empat pilihan!", "네 개 중에서 답을 골라요!", "从四个选项中选择答案！", "從四個選項中選擇答案！", "Wähle die Antwort aus vier Möglichkeiten!"],
    ["🌈 みんなで", "🌈 Group", "🌈 Bersama", "🌈 다 함께", "🌈 大家一起", "🌈 大家一起", "🌈 Gemeinsam"],
    ["これ なんの かげ?", "Whose shadow is this?", "Bayangan apa ini?", "이건 무슨 그림자일까?", "这是什么影子？", "這是什麼影子？", "Was ist das für ein Schatten?"],
    ["こえを だすと キャラが とぶよ!", "Make a sound to make the character jump!", "Bersuara agar karakter melompat!", "소리를 내면 캐릭터가 점프해요!", "发出声音让角色跳起来！", "發出聲音讓角色跳起來！", "Mach ein Geräusch, damit die Figur springt!"],
    ["※マイクの使用許可が必要です", "Microphone permission is required", "Izin mikrofon diperlukan", "마이크 권한이 필요합니다", "需要麦克风权限", "需要麥克風權限", "Mikrofonberechtigung erforderlich"],
    ["キーワードを さかさに よんで ろくおん(かんたん)", "Say the keyword backward and record it (easy)", "Ucapkan kata kunci terbalik lalu rekam (mudah)", "낱말을 거꾸로 말해 녹음해요 (쉬움)", "倒着读关键词并录音（简单）", "倒著讀關鍵詞並錄音（簡單）", "Schlüsselwort rückwärts sprechen und aufnehmen (leicht)"],
    ["ふつうに よんだ こえを きかいが さかさまに(むずかしい)", "The app reverses a normally spoken word (hard)", "Aplikasi membalik kata yang diucapkan biasa (sulit)", "평소처럼 말한 목소리를 앱이 거꾸로 재생해요 (어려움)", "应用会倒放正常朗读的声音（困难）", "應用程式會倒放正常朗讀的聲音（困難）", "Die App dreht ein normal gesprochenes Wort um (schwer)"],
    ["🎙 つくるひと の ばん", "🎙 Recorder's turn", "🎙 Giliran pembuat", "🎙 만드는 사람 차례", "🎙 出题者回合", "🎙 出題者回合", "🎙 Aufnahme-Runde"],
    ["もんだい かんせい!", "Question complete!", "Soal selesai!", "문제 완성!", "题目完成！", "題目完成！", "Frage fertig!"],
    ["こえは なんかいでも きけるよ。ぜんもん せいかい めざして がんばろう!", "Listen as many times as you like. Try to answer every question!", "Dengarkan sesering yang kamu mau. Coba jawab semuanya!", "몇 번이든 들을 수 있어요. 전부 맞혀 봐요!", "可以反复听。努力答对所有题目吧！", "可以反覆聽。努力答對所有題目吧！", "Höre so oft du möchtest und versuche alle Fragen zu lösen!"],
    ["CPU ゆっくり", "CPU Slow", "CPU Lambat", "CPU 느리게", "CPU 慢速", "CPU 慢速", "CPU Langsam"],
    ["CPU ふつう", "CPU Normal", "CPU Normal", "CPU 보통", "CPU 普通", "CPU 普通", "CPU Normal"],
    ["CPU はやい", "CPU Fast", "CPU Cepat", "CPU 빠르게", "CPU 快速", "CPU 快速", "CPU Schnell"],
    ["15タッチ・はやい", "15 touches · fast", "15 sentuhan · cepat", "15번 터치 · 빠르게", "点击15次·快速", "點選15次·快速", "15 Treffer · schnell"],
    ["20タッチ・もっとはやい", "20 touches · faster", "20 sentuhan · lebih cepat", "20번 터치 · 더 빠르게", "点击20次·更快", "點選20次·更快", "20 Treffer · schneller"],
    ["30かい・かそく!", "30 jumps · speeding up!", "30 lompatan · makin cepat!", "30번 · 점점 빠르게!", "30次·加速！", "30次·加速！", "30 Sprünge · schneller!"],
    ["localhost か https", "localhost or https", "localhost atau https", "localhost 또는 https", "localhost 或 https", "localhost 或 https", "localhost oder https"],
    ["ほぞんされません", "is not saved", "tidak disimpan", "저장되지 않습니다", "不会保存", "不會儲存", "wird nicht gespeichert"],
    ["「とりこみ」で かおの絵を とりこんで「パーツ」を せっていすると、みんなの おえかきで あそべます", "Import a face picture and set its Parts to use it in the face game.", "Impor gambar wajah dan atur Bagiannya untuk digunakan dalam permainan wajah.", "얼굴 그림을 가져와 ‘파츠’를 설정하면 얼굴 놀이에서 사용할 수 있어요.", "导入脸部图片并设置“部件”后，即可在拼脸游戏中使用。", "匯入臉部圖片並設定「部件」後，即可在拼臉遊戲中使用。", "Importiere ein Gesichtsbild und richte die Teile ein, um es im Gesichtsspiel zu verwenden."],
    ["バッジの すうじが はしる じゅんばん。⭐は さいごに はしる アンカーだよ!", "The badge number shows the running order. ⭐ is the final runner!", "Nomor lencana menunjukkan urutan lari. ⭐ adalah pelari terakhir!", "배지 숫자가 달리는 순서예요. ⭐는 마지막 주자예요!", "徽章数字表示出场顺序，⭐是最后一棒！", "徽章數字表示出場順序，⭐是最後一棒！", "Die Zahl auf dem Abzeichen zeigt die Reihenfolge. ⭐ läuft zuletzt!"],
    ["🔴 1にんめ", "🔴 Runner 1", "🔴 Pelari 1", "🔴 1번째", "🔴 第1位", "🔴 第1位", "🔴 Läufer 1"],
    ["🔵 1にんめ", "🔵 Runner 1", "🔵 Pelari 1", "🔵 1번째", "🔵 第1位", "🔵 第1位", "🔵 Läufer 1"]
    ,["輪郭が薄いときだけ白の判定と隙間補正を調整します。", "Adjust white detection and gap correction only for faint outlines.", "Sesuaikan deteksi putih dan koreksi celah hanya untuk garis samar.", "윤곽선이 흐릴 때만 흰색 판정과 틈 보정을 조절하세요.", "仅在线条较浅时调整白色判断和缝隙修正。", "只在線條較淡時調整白色判定和縫隙修正。", "Weißerkennung und Lückenkorrektur nur bei blassen Konturen anpassen."],
    ["左右の腕を肩から動かす", "Move both arms from the shoulders", "Gerakkan kedua lengan dari bahu", "양팔을 어깨부터 움직이기", "让双臂从肩部活动", "讓雙臂從肩部活動", "Beide Arme ab den Schultern bewegen"],
    ["足の付け根", "Hip joints", "Pangkal kaki", "다리 관절", "髋关节", "髖關節", "Hüftgelenke"],
    ["左右の足が回る位置を合わせます。中央の絵にある丸もドラッグできます。", "Align where each leg rotates. You can also drag the circles on the center picture.", "Sesuaikan titik putar tiap kaki. Lingkaran pada gambar tengah juga dapat diseret.", "양쪽 다리가 회전하는 위치를 맞추세요. 가운데 그림의 원도 드래그할 수 있어요.", "调整双腿的旋转位置，也可拖动中央图片上的圆点。", "調整雙腿的旋轉位置，也可拖曳中央圖片上的圓點。", "Drehpunkte beider Beine ausrichten. Die Kreise im mittleren Bild lassen sich ziehen."],
    ["差分画像と まちがいスポット", "Difference image and spots", "Gambar perbedaan dan titik", "다른 그림과 다른 위치", "差异图片与不同点", "差異圖片與不同處", "Unterschiedsbild und Fehlerstellen"],
    ["右の絵で違う場所をタップします。画像ごとに最大8個まで設定できます。", "Tap each difference in the right picture. Set up to 8 per image.", "Ketuk tiap perbedaan pada gambar kanan. Maksimal 8 per gambar.", "오른쪽 그림에서 다른 곳을 누르세요. 그림마다 최대 8개까지 설정할 수 있어요.", "点击右图中的不同之处，每张图最多可设置8处。", "點選右圖中的不同處，每張圖最多可設定8處。", "Unterschiede im rechten Bild antippen. Bis zu 8 pro Bild."],
    ["＋ 差分画像を追加", "+ Add difference image", "+ Tambah gambar perbedaan", "+ 다른 그림 추가", "+ 添加差异图片", "+ 新增差異圖片", "+ Unterschiedsbild hinzufügen"],
    ["この差分を外す", "Remove this difference", "Hapus perbedaan ini", "이 다른 그림 제거", "移除此差异图", "移除此差異圖", "Dieses Unterschiedsbild entfernen"],
    ["もとの絵", "Original picture", "Gambar asli", "원본 그림", "原图", "原圖", "Originalbild"],
    ["差分の絵", "Difference picture", "Gambar perbedaan", "다른 그림", "差异图", "差異圖", "Unterschiedsbild"],
    ["パーツ設定", "Parts setup", "Pengaturan bagian", "파츠 설정", "部件设置", "部件設定", "Teile einrichten"],
    ["下のボタンで種類を選んで、絵の上をドラッグして目・鼻・口を囲みます(最大8個)。 囲んだ枠をタップすると種類が変わり、「そのほか」の次で消せます。", "Choose a type below, then drag around eyes, nose, or mouth (up to 8). Tap a box to change its type; after Other it is removed.", "Pilih jenis di bawah, lalu seret mengelilingi mata, hidung, atau mulut (maks. 8). Ketuk kotak untuk mengubah jenis; setelah Lainnya kotak dihapus.", "아래에서 종류를 고르고 그림에서 눈·코·입을 드래그해 둘러싸세요(최대 8개). 상자를 누르면 종류가 바뀌며 ‘기타’ 다음에는 삭제됩니다.", "选择下方类型，然后在图片上拖动框选眼睛、鼻子或嘴巴（最多8个）。点击框可更改类型，“其他”之后会删除。", "選擇下方類型，然後在圖片上拖曳框選眼睛、鼻子或嘴巴（最多8個）。點選框可更改類型，「其他」之後會刪除。", "Unten einen Typ wählen und Augen, Nase oder Mund im Bild umziehen (max. 8). Antippen ändert den Typ; nach Andere wird der Rahmen entfernt."],
    ["め", "Eyes", "Mata", "눈", "眼睛", "眼睛", "Augen"], ["まゆげ", "Eyebrows", "Alis", "눈썹", "眉毛", "眉毛", "Augenbrauen"], ["はな", "Nose", "Hidung", "코", "鼻子", "鼻子", "Nase"], ["くち", "Mouth", "Mulut", "입", "嘴巴", "嘴巴", "Mund"],
    ["🎤 こえの とうろく", "🎤 Record voices", "🎤 Rekam suara", "🎤 목소리 등록", "🎤 录制声音", "🎤 錄製聲音", "🎤 Stimmen aufnehmen"],
    ["「みんなのせかい」で タッチしたときや、じゃんけん・レースの かちまけで つかわれます。", "Used when tapped in Everyone's World and for wins or losses in rock paper scissors and races.", "Digunakan saat diketuk di Dunia Bersama dan saat menang atau kalah dalam suit dan balapan.", "모두의 세상에서 누를 때와 가위바위보·달리기의 승패에 사용돼요.", "用于在“大家的世界”中点击角色，以及石头剪刀布和赛跑的胜负。", "用於在「大家的世界」中點選角色，以及剪刀石頭布和賽跑的勝負。", "Wird beim Antippen in Unsere Welt sowie bei Sieg oder Niederlage in Schere-Stein-Papier und Rennen verwendet."],
    ["とじる", "Close", "Tutup", "닫기", "关闭", "關閉", "Schließen"],
    ["✂ 切り出して取り込む", "✂ Crop and import", "✂ Potong dan impor", "✂ 잘라서 가져오기", "✂ 裁剪并导入", "✂ 裁剪並匯入", "✂ Zuschneiden und importieren"],
    ["ドラッグで囲んで「切り出して保存」。1枚から何回でも切り出せます。", "Drag around an area and choose Crop and save. You can crop one picture multiple times.", "Seret mengelilingi area lalu pilih Potong dan simpan. Satu gambar dapat dipotong berkali-kali.", "영역을 드래그한 뒤 ‘잘라서 저장’을 누르세요. 한 장에서 여러 번 자를 수 있어요.", "拖动框选区域后选择“裁剪并保存”，一张图片可多次裁剪。", "拖曳框選區域後選擇「裁剪並儲存」，一張圖片可多次裁剪。", "Bereich aufziehen und Zuschneiden und speichern wählen. Ein Bild kann mehrfach zugeschnitten werden."],
    ["取り込み先", "Import destination", "Tujuan impor", "가져올 위치", "导入位置", "匯入位置", "Importziel"],
    ["✨ みやすくする", "✨ Enhance", "✨ Perjelas", "✨ 보기 좋게", "✨ 增强显示", "✨ 增強顯示", "✨ Verbessern"],
    ["✨ じどう", "✨ Auto", "✨ Otomatis", "✨ 자동", "✨ 自动", "✨ 自動", "✨ Automatisch"],
    ["↶ もとにもどす", "↶ Restore original", "↶ Kembalikan asli", "↶ 원본으로", "↶ 恢复原图", "↶ 恢復原圖", "↶ Original wiederherstellen"],
    ["あかるさ", "Brightness", "Kecerahan", "밝기", "亮度", "亮度", "Helligkeit"],
    ["せんをくっきり", "Line clarity", "Ketajaman garis", "선명한 선", "线条清晰度", "線條清晰度", "Linien schärfen"],
    ["かみのかげ", "Paper shadow", "Bayangan kertas", "종이 그림자", "纸张阴影", "紙張陰影", "Papierschatten"],
    ["いろのこさ", "Color strength", "Kekuatan warna", "색 농도", "色彩浓度", "色彩濃度", "Farbstärke"],
    ["✂ 切り出して保存", "✂ Crop and save", "✂ Potong dan simpan", "✂ 잘라서 저장", "✂ 裁剪并保存", "✂ 裁剪並儲存", "✂ Zuschneiden und speichern"],
    ["□ ページ全体を保存", "□ Save full page", "□ Simpan seluruh halaman", "□ 전체 페이지 저장", "□ 保存整页", "□ 儲存整頁", "□ Ganze Seite speichern"],
    ["次のページ ▶", "Next page ▶", "Halaman berikut ▶", "다음 페이지 ▶", "下一页 ▶", "下一頁 ▶", "Nächste Seite ▶"],
    ["閉じる", "Close", "Tutup", "닫기", "关闭", "關閉", "Schließen"],
    ["名前設定", "Name settings", "Pengaturan nama", "이름 설정", "名称设置", "名稱設定", "Name festlegen"]
  ];
  const VISIBLE_UI_PACKS = Object.fromEntries(UI_CODES.map((code, index) => [code,
    Object.fromEntries(UI_ROWS.map((row) => [row[0], row[index + 1]]))
  ]));

  const PATTERN_PACKS = {
    en: [
      [/^(\d+)にん せんたくちゅう$/, "$1 selected"], [/^あと (\d+)にん えらんでね$/, "Choose $1 more"], [/^(\d+)かい で (\d+)てん$/, "$1 tries · $2 points"], [/^(\d+)くみ$/, "$1 pairs"], [/^(\d+)タッチ$/, "$1 touches"], [/^(\d+)ピース$/, "$1 pieces"], [/^(\d+)もんちゅう (\d+)もんで クリア$/, "Clear with $2 of $1"], [/^(\d+)かい れんぞく$/, "$1 in a row"], [/^(\d+)もん れんぞく$/, "$1 in a row"], [/^⭐(\d+)こ$/, "⭐$1"], [/^([🔴🔵]) (\d+)にんめ$/, "$1 Runner $2"], [/^のこり:\s*(\d+|\?)$/, "Remaining: $1"], [/^タッチ:\s*(\d+)$/, "Touches: $1"], [/^れんぞく:\s*(\d+)$/, "Streak: $1"], [/^みつけた:\s*(\d+)$/, "Found: $1"], [/^とんだ:\s*(\d+)$/, "Jumps: $1"], [/^(\d+)びょう$/, "$1 sec"], [/^(\d+)てん$/, "$1 points"], [/^(\d+)もん$/, "$1 questions"]
    ],
    id: [
      [/^(\d+)にん せんたくちゅう$/, "$1 dipilih"], [/^あと (\d+)にん えらんでね$/, "Pilih $1 lagi"], [/^(\d+)かい で (\d+)てん$/, "$1 kali · $2 poin"], [/^(\d+)くみ$/, "$1 pasang"], [/^(\d+)タッチ$/, "$1 sentuhan"], [/^(\d+)ピース$/, "$1 keping"], [/^(\d+)もんちゅう (\d+)もんで クリア$/, "Lulus dengan $2 dari $1"], [/^(\d+)かい れんぞく$/, "$1 berturut-turut"], [/^(\d+)もん れんぞく$/, "$1 berturut-turut"], [/^⭐(\d+)こ$/, "⭐$1"], [/^([🔴🔵]) (\d+)にんめ$/, "$1 Pelari $2"], [/^のこり:\s*(\d+|\?)$/, "Sisa: $1"], [/^タッチ:\s*(\d+)$/, "Sentuhan: $1"], [/^れんぞく:\s*(\d+)$/, "Beruntun: $1"], [/^みつけた:\s*(\d+)$/, "Ditemukan: $1"], [/^とんだ:\s*(\d+)$/, "Lompatan: $1"], [/^(\d+)びょう$/, "$1 dtk"], [/^(\d+)てん$/, "$1 poin"], [/^(\d+)もん$/, "$1 soal"]
    ],
    ko: [
      [/^(\d+)にん せんたくちゅう$/, "$1명 선택 중"], [/^あと (\d+)にん えらんでね$/, "$1명 더 골라요"], [/^(\d+)かい で (\d+)てん$/, "$1번에 $2점"], [/^(\d+)くみ$/, "$1쌍"], [/^(\d+)タッチ$/, "$1번 터치"], [/^(\d+)ピース$/, "$1조각"], [/^(\d+)もんちゅう (\d+)もんで クリア$/, "$1문제 중 $2문제면 성공"], [/^(\d+)かい れんぞく$/, "$1번 연속"], [/^(\d+)もん れんぞく$/, "$1문제 연속"], [/^⭐(\d+)こ$/, "⭐$1개"], [/^([🔴🔵]) (\d+)にんめ$/, "$1 $2번째"], [/^のこり:\s*(\d+|\?)$/, "남은 수: $1"], [/^タッチ:\s*(\d+)$/, "터치: $1"], [/^れんぞく:\s*(\d+)$/, "연속: $1"], [/^みつけた:\s*(\d+)$/, "찾음: $1"], [/^とんだ:\s*(\d+)$/, "점프: $1"], [/^(\d+)びょう$/, "$1초"], [/^(\d+)てん$/, "$1점"], [/^(\d+)もん$/, "$1문제"]
    ],
    "zh-Hans": [
      [/^(\d+)にん せんたくちゅう$/, "已选择$1人"], [/^あと (\d+)にん えらんでね$/, "请再选择$1人"], [/^(\d+)かい で (\d+)てん$/, "$1次·$2分"], [/^(\d+)くみ$/, "$1对"], [/^(\d+)タッチ$/, "点击$1次"], [/^(\d+)ピース$/, "$1块"], [/^(\d+)もんちゅう (\d+)もんで クリア$/, "$1题中答对$2题即可过关"], [/^(\d+)かい れんぞく$/, "连续$1次"], [/^(\d+)もん れんぞく$/, "连续$1题"], [/^⭐(\d+)こ$/, "⭐$1个"], [/^([🔴🔵]) (\d+)にんめ$/, "$1 第$2位"], [/^のこり:\s*(\d+|\?)$/, "剩余：$1"], [/^タッチ:\s*(\d+)$/, "点击：$1"], [/^れんぞく:\s*(\d+)$/, "连续：$1"], [/^みつけた:\s*(\d+)$/, "已找到：$1"], [/^とんだ:\s*(\d+)$/, "跳跃：$1"], [/^(\d+)びょう$/, "$1秒"], [/^(\d+)てん$/, "$1分"], [/^(\d+)もん$/, "$1题"]
    ],
    "zh-Hant": [
      [/^(\d+)にん せんたくちゅう$/, "已選擇$1人"], [/^あと (\d+)にん えらんでね$/, "請再選擇$1人"], [/^(\d+)かい で (\d+)てん$/, "$1次·$2分"], [/^(\d+)くみ$/, "$1對"], [/^(\d+)タッチ$/, "點選$1次"], [/^(\d+)ピース$/, "$1塊"], [/^(\d+)もんちゅう (\d+)もんで クリア$/, "$1題中答對$2題即可過關"], [/^(\d+)かい れんぞく$/, "連續$1次"], [/^(\d+)もん れんぞく$/, "連續$1題"], [/^⭐(\d+)こ$/, "⭐$1個"], [/^([🔴🔵]) (\d+)にんめ$/, "$1 第$2位"], [/^のこり:\s*(\d+|\?)$/, "剩餘：$1"], [/^タッチ:\s*(\d+)$/, "點選：$1"], [/^れんぞく:\s*(\d+)$/, "連續：$1"], [/^みつけた:\s*(\d+)$/, "已找到：$1"], [/^とんだ:\s*(\d+)$/, "跳躍：$1"], [/^(\d+)びょう$/, "$1秒"], [/^(\d+)てん$/, "$1分"], [/^(\d+)もん$/, "$1題"]
    ],
    de: [
      [/^(\d+)にん せんたくちゅう$/, "$1 ausgewählt"], [/^あと (\d+)にん えらんでね$/, "Wähle noch $1"], [/^(\d+)かい で (\d+)てん$/, "$1 Versuche · $2 Punkte"], [/^(\d+)くみ$/, "$1 Paare"], [/^(\d+)タッチ$/, "$1 Treffer"], [/^(\d+)ピース$/, "$1 Teile"], [/^(\d+)もんちゅう (\d+)もんで クリア$/, "$2 von $1 zum Bestehen"], [/^(\d+)かい れんぞく$/, "$1 in Folge"], [/^(\d+)もん れんぞく$/, "$1 in Folge"], [/^⭐(\d+)こ$/, "⭐$1"], [/^([🔴🔵]) (\d+)にんめ$/, "$1 Läufer $2"], [/^のこり:\s*(\d+|\?)$/, "Übrig: $1"], [/^タッチ:\s*(\d+)$/, "Berührungen: $1"], [/^れんぞく:\s*(\d+)$/, "Serie: $1"], [/^みつけた:\s*(\d+)$/, "Gefunden: $1"], [/^とんだ:\s*(\d+)$/, "Sprünge: $1"], [/^(\d+)びょう$/, "$1 Sek."], [/^(\d+)てん$/, "$1 Punkte"], [/^(\d+)もん$/, "$1 Fragen"]
    ]
  };

  let language = localStorage.getItem(STORAGE_KEY) || "ja";
  if (!LOCALES[language]) language = "ja";
  const renderedText = new WeakMap();
  const sourceText = new WeakMap();
  const renderedAttrs = new WeakMap();
  const sourceAttrs = new WeakMap();

  function t(source) {
    if (language === "ja" || typeof source !== "string") return source;
    const normalized = source.replace(/\s+/g, " ").trim();
    if (normalized === "する") return "";
    const direct = (PACKS[language] && (PACKS[language][source] || PACKS[language][normalized]))
      || (EXTRA_PACKS[language] && (EXTRA_PACKS[language][source] || EXTRA_PACKS[language][normalized]))
      || (SETTINGS_PACKS[language] && (SETTINGS_PACKS[language][source] || SETTINGS_PACKS[language][normalized]))
      || (GAME_UI_PACKS[language] && (GAME_UI_PACKS[language][source] || GAME_UI_PACKS[language][normalized]))
      || (DODGEBALL_PACKS[language] && (DODGEBALL_PACKS[language][source] || DODGEBALL_PACKS[language][normalized]))
      || (VISIBLE_UI_PACKS[language] && (VISIBLE_UI_PACKS[language][source] || VISIBLE_UI_PACKS[language][normalized]));
    if (direct) return direct;
    for (const [pattern, replacement] of PATTERN_PACKS[language] || []) {
      if (pattern.test(normalized)) return normalized.replace(pattern, replacement);
    }
    if (source.includes(" — ")) {
      const parts = source.split(" — ");
      const translated = parts.map(t);
      if (translated.some((part, index) => part !== parts[index])) return translated.join(" — ");
    }
    return source;
  }

  function translateText(node) {
    /* クイズの問題文・選択肢・正解は表示文字列を判定にも使うため、勝手に置き換えない。 */
    if (!node || !node.parentElement || node.parentElement.closest("script,style,textarea,.choices,.qtext,.answer-big,[data-i18n-skip]")) return;
    const current = node.nodeValue;
    if (!current || !current.trim()) return;
    let source = sourceText.get(node);
    if (!source || current !== renderedText.get(node)) {
      source = current;
      sourceText.set(node, source);
    }
    const lead = source.match(/^\s*/)[0];
    const tail = source.match(/\s*$/)[0];
    const translated = lead + t(source.trim()) + tail;
    renderedText.set(node, translated);
    if (current !== translated) node.nodeValue = translated;
  }

  function translateAttrs(el) {
    if (!(el instanceof Element) || el.closest("[data-i18n-skip]")) return;
    let sources = sourceAttrs.get(el);
    let rendered = renderedAttrs.get(el);
    if (!sources) { sources = {}; sourceAttrs.set(el, sources); }
    if (!rendered) { rendered = {}; renderedAttrs.set(el, rendered); }
    for (const name of ["title", "aria-label", "placeholder", "alt"]) {
      if (!el.hasAttribute(name)) continue;
      const current = el.getAttribute(name);
      if (!(name in sources) || current !== rendered[name]) sources[name] = current;
      const translated = t(sources[name]);
      rendered[name] = translated;
      if (current !== translated) el.setAttribute(name, translated);
    }
  }

  function apply(root = document) {
    if (root.nodeType === Node.TEXT_NODE) return translateText(root);
    if (root.nodeType !== Node.DOCUMENT_NODE && root.nodeType !== Node.ELEMENT_NODE) return;
    if (root.nodeType === Node.ELEMENT_NODE) translateAttrs(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) translateText(walker.currentNode);
    if (root.querySelectorAll) root.querySelectorAll("[title],[aria-label],[placeholder],[alt]").forEach(translateAttrs);
  }

  function setLanguage(next) {
    if (!LOCALES[next]) return;
    localStorage.setItem(STORAGE_KEY, next);
    language = next;
    location.reload();
  }

  function applyLogo() {
    const file = LOGO_FILES[language] || LOGO_FILES.ja;
    document.querySelectorAll("img.logo").forEach((logo) => {
      const source = logo.getAttribute("src") || "assets/logo.png";
      logo.setAttribute("src", source.replace(/logo(?:-[a-z-]+)?\.png(?:\?.*)?$/, file));
    });
  }

  function init() {
    document.documentElement.lang = LOCALES[language].htmlLang;
    applyLogo();
    apply();
    const observer = new MutationObserver((changes) => {
      for (const change of changes) {
        if (change.type === "characterData") translateText(change.target);
        else if (change.type === "attributes") translateAttrs(change.target);
        else for (const node of change.addedNodes) apply(node);
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["title", "aria-label", "placeholder", "alt"]
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();

  return { LOCALES, get language() { return language; }, t, apply, setLanguage };
})();
