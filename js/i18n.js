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

  /* 子ども向けの短い文言を中心にする。固有名・作品名・クイズの答えは翻訳しない。 */
  const PACKS = {
    en: {
      "みんなの ゲームパック": "Everyone's Game Pack", "みんなのゲームパック": "Everyone's Game Pack", "ゲームパック": "Game Pack",
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
      "キャラクターの絵": "Character art", "キャラクターのぜんしん": "Full-body character", "キャラクターのかお": "Character face", "はいけいの絵": "Background art", "もとそざい": "Source image", "ぜんしん": "Full body", "かお": "Face", "イラスト": "Illustration", "ステージ": "Stage", "しゅるい": "Type", "作品名": "Title", "作者名": "Creator", "（任意）": "Optional", "うごき": "Motion", "こえ": "Voice", "かんせつ": "Joints", "どうぐ": "Tools", "🎨 どうぐ": "🎨 Tools", "いろ": "Color", "ふとさ": "Width", "けしゴム": "Eraser", "ぬりつぶし": "Fill", "ぜんぶけす": "Clear all", "↻ かいてん": "↻ Rotate", "↔ 左右はんてん": "↔ Flip",
      "👀 表示": "👀 Display", "作者名を非表示": "Hide creator names", "作品に作者名があることは、伏せ字で表示します": "Show creator names as hidden text", "📱 オフライン・更新": "📱 Offline & updates", "準備状況を確認しています…": "Checking readiness…", "最新版を確認": "Check for updates", "💾 設定・データのバックアップ": "💾 Settings & data backup", "すべてエクスポート(zip)": "Export all (zip)", "zipからインポート": "Import from zip", "その他": "Other", "サンプルをもう一度入れる": "Restore samples", "すべて削除する": "Delete all", "追加する": "Add", "置き換える": "Replace", "インポート": "Import", "エクスポート": "Export",
      "言語": "Language", "画面に表示する言語": "Language used on screen", "日本語": "Japanese",
      "チームわけ": "Teams", "🎪 チームわけ!": "🎪 Teams!", "チームがえ": "Change teams", "じぶんで チームを きめる": "Choose teams", "よーい…": "Ready…", "かち!": "Winner!", "かんせい!": "Complete!", "ぽん!": "Go!", "ほんばんへ": "Main game", "めかくしモード": "Blindfold mode", "ぎゃくさいせい": "Reverse", "ろくおん": "Record", "きいてみる": "Listen", "ていし": "Stop", "ことば": "Word", "べつの ことば": "Another word"
    },
    id: {
      "みんなの ゲームパック": "Paket Game Bersama", "みんなのゲームパック": "Paket Game Bersama", "ゲームパック": "Paket Game", "つくる": "Buat", "みる": "Lihat", "あそぶ": "Main", "設定": "Pengaturan", "せってい": "Pengaturan", "もどる": "Kembali", "← もどる": "← Kembali", "表紙へ戻る": "Kembali ke beranda", "つくる・みる・あそぶ": "Buat, lihat, atau main", "やることを えらぶ": "Pilih kegiatan", "あそびかたを えらぶ": "Pilih cara bermain",
      "ひとりで": "Sendiri", "ふたりで": "Berdua", "みんなで": "Bersama", "ゲーム別": "Semua game", "みるだけ(オート)": "Tonton (Otomatis)", "れんしゅう": "Latihan", "2Pたいせん": "Duel 2 pemain", "つくりかたから えらぶ": "Pilih cara membuat", "つくるものから えらぶ": "Pilih yang dibuat", "クイズを つくる": "Buat kuis", "おえかき": "Menggambar", "カメラ": "Kamera", "とりこみ": "Impor", "キャラクター": "Karakter", "はいけい": "Latar", "４たくクイズ": "Kuis 4 pilihan",
      "キャラしょうかい": "Galeri karakter", "びじゅつかん": "Galeri seni", "みんなの せかい": "Dunia Bersama", "かけっこ": "Balapan", "たまいれ": "Lempar bola", "ドッヂボール": "Bola hindar", "リレー": "Estafet", "うんどうかい": "Hari olahraga", "ふくわらい": "Susun wajah", "じゃんけん": "Suit", "かげえクイズ": "Kuis siluet", "さかさクイズ": "Kuis kata terbalik", "まちがいさがし": "Cari perbedaan", "カードあわせ": "Cocokkan kartu", "おえかきパズル": "Puzzle gambar", "おえかきのたび": "Petualangan gambar", "もぐらたたき": "Pukul tikus tanah", "こえで ジャンプ": "Lompat dengan suara", "なわとび": "Lompat tali",
      "スタート!": "Mulai!", "ゲームかいし": "Mulai game", "きめた！": "Selesai!", "つぎ ▶": "Berikutnya ▶", "つぎへ →": "Berikutnya →", "もういちど": "Sekali lagi", "やりなおす": "Pilih ulang", "やりなおし": "Ulangi", "もどす": "Urungkan", "おしまい!": "Selesai!", "けっかへ ▶": "Hasil ▶", "こたえを みる": "Lihat jawaban", "ほぞん": "Simpan", "✔ ほぞん": "✔ Simpan", "✔ 保存する": "✔ Simpan", "キャンセル": "Batal", "✕ とじる": "✕ Tutup", "シャッフル": "Acak", "🎲 シャッフル": "🎲 Acak", "🏆 ランキング": "🏆 Peringkat", "かんたん": "Mudah", "ふつう": "Normal", "むずかしい": "Sulit", "🔥 ガチンコ": "🔥 Tantangan", "🌈 ゆるふわ": "🌈 Santai", "ものしりクイズ": "Kuis pengetahuan", "キャラクタークイズ": "Kuis karakter",
      "なにを かく?": "Mau gambar apa?", "どの かおで あそぶ?": "Pilih wajah", "さんかする キャラを えらんでね": "Pilih karakter", "はしる キャラを えらんでね": "Pilih pelari", "たたかう キャラを えらんでね": "Pilih pemain", "たまいれを する キャラを えらんでね": "Pilih pemain", "きょうぎを えらんでね": "Pilih lomba", "だすのを えらんでね!": "Pilih satu!", "あそびかたを えらんでね": "Pilih cara bermain",
      "キャラクターの絵": "Gambar karakter", "キャラクターのぜんしん": "Karakter seluruh tubuh", "キャラクターのかお": "Wajah karakter", "はいけいの絵": "Gambar latar", "もとそざい": "Gambar sumber", "ぜんしん": "Seluruh tubuh", "かお": "Wajah", "イラスト": "Ilustrasi", "ステージ": "Panggung", "しゅるい": "Jenis", "作品名": "Judul", "作者名": "Pembuat", "（任意）": "Opsional", "うごき": "Gerakan", "こえ": "Suara", "かんせつ": "Sendi", "どうぐ": "Alat", "🎨 どうぐ": "🎨 Alat", "いろ": "Warna", "ふとさ": "Ketebalan", "けしゴム": "Penghapus", "ぬりつぶし": "Isi", "ぜんぶけす": "Hapus semua", "↻ かいてん": "↻ Putar", "↔ 左右はんてん": "↔ Balik",
      "👀 表示": "👀 Tampilan", "作者名を非表示": "Sembunyikan nama pembuat", "作品に作者名があることは、伏せ字で表示します": "Tampilkan nama pembuat sebagai teks tersembunyi", "📱 オフライン・更新": "📱 Offline & pembaruan", "準備状況を確認しています…": "Memeriksa kesiapan…", "最新版を確認": "Periksa pembaruan", "💾 設定・データのバックアップ": "💾 Cadangan pengaturan & data", "すべてエクスポート(zip)": "Ekspor semua (zip)", "zipからインポート": "Impor dari zip", "その他": "Lainnya", "サンプルをもう一度入れる": "Pulihkan contoh", "すべて削除する": "Hapus semua", "追加する": "Tambahkan", "置き換える": "Ganti", "インポート": "Impor", "エクスポート": "Ekspor", "言語": "Bahasa", "画面に表示する言語": "Bahasa tampilan", "日本語": "Bahasa Jepang",
      "チームわけ": "Tim", "🎪 チームわけ!": "🎪 Tim!", "チームがえ": "Ganti tim", "じぶんで チームを きめる": "Pilih tim", "よーい…": "Siap…", "かち!": "Menang!", "かんせい!": "Selesai!", "ぽん!": "Mulai!", "ほんばんへ": "Game utama", "めかくしモード": "Mode tutup mata", "ぎゃくさいせい": "Putar balik", "ろくおん": "Rekam", "きいてみる": "Dengarkan", "ていし": "Berhenti", "ことば": "Kata", "べつの ことば": "Kata lain"
    },
    ko: {
      "みんなの ゲームパック": "모두의 게임 팩", "みんなのゲームパック": "모두의 게임 팩", "ゲームパック": "게임 팩", "つくる": "만들기", "みる": "보기", "あそぶ": "놀기", "設定": "설정", "せってい": "설정", "もどる": "뒤로", "← もどる": "← 뒤로", "表紙へ戻る": "홈으로", "つくる・みる・あそぶ": "만들기, 보기, 놀기", "やることを えらぶ": "할 일을 골라요", "あそびかたを えらぶ": "놀이 방법을 골라요",
      "ひとりで": "혼자", "ふたりで": "둘이서", "みんなで": "다 함께", "ゲーム別": "모든 게임", "みるだけ(オート)": "구경하기 (자동)", "れんしゅう": "연습", "2Pたいせん": "2인 대전", "つくりかたから えらぶ": "만드는 방법", "つくるものから えらぶ": "만들 것", "クイズを つくる": "퀴즈 만들기", "おえかき": "그림 그리기", "カメラ": "카메라", "とりこみ": "가져오기", "キャラクター": "캐릭터", "はいけい": "배경", "４たくクイズ": "4지선다 퀴즈",
      "キャラしょうかい": "캐릭터 갤러리", "びじゅつかん": "미술관", "みんなの せかい": "모두의 세상", "かけっこ": "달리기", "たまいれ": "공 넣기", "ドッヂボール": "피구", "リレー": "이어달리기", "うんどうかい": "운동회", "ふくわらい": "얼굴 맞추기", "じゃんけん": "가위바위보", "かげえクイズ": "그림자 퀴즈", "さかさクイズ": "거꾸로 말 퀴즈", "まちがいさがし": "다른 그림 찾기", "カードあわせ": "카드 짝 맞추기", "おえかきパズル": "그림 퍼즐", "おえかきのたび": "그림 여행", "もぐらたたき": "두더지 잡기", "こえで ジャンプ": "목소리 점프", "なわとび": "줄넘기",
      "スタート!": "시작!", "ゲームかいし": "게임 시작", "きめた！": "결정!", "つぎ ▶": "다음 ▶", "つぎへ →": "다음 →", "もういちど": "한 번 더", "やりなおす": "다시 고르기", "やりなおし": "다시 하기", "もどす": "되돌리기", "おしまい!": "끝!", "けっかへ ▶": "결과 ▶", "こたえを みる": "정답 보기", "ほぞん": "저장", "✔ ほぞん": "✔ 저장", "✔ 保存する": "✔ 저장", "キャンセル": "취소", "✕ とじる": "✕ 닫기", "シャッフル": "섞기", "🎲 シャッフル": "🎲 섞기", "🏆 ランキング": "🏆 순위", "かんたん": "쉬움", "ふつう": "보통", "むずかしい": "어려움", "🔥 ガチンコ": "🔥 도전", "🌈 ゆるふわ": "🌈 편하게", "ものしりクイズ": "상식 퀴즈", "キャラクタークイズ": "캐릭터 퀴즈",
      "なにを かく?": "무엇을 그릴까?", "どの かおで あそぶ?": "얼굴을 골라요", "さんかする キャラを えらんでね": "캐릭터를 골라요", "はしる キャラを えらんでね": "달릴 캐릭터를 골라요", "たたかう キャラを えらんでね": "선수를 골라요", "たまいれを する キャラを えらんでね": "선수를 골라요", "きょうぎを えらんでね": "경기를 골라요", "だすのを えらんでね!": "하나 골라요!", "あそびかたを えらんでね": "놀이 방법을 골라요",
      "キャラクターの絵": "캐릭터 그림", "キャラクターのぜんしん": "캐릭터 전신", "キャラクターのかお": "캐릭터 얼굴", "はいけいの絵": "배경 그림", "もとそざい": "원본 그림", "ぜんしん": "전신", "かお": "얼굴", "イラスト": "일러스트", "ステージ": "스테이지", "しゅるい": "종류", "作品名": "작품명", "作者名": "만든 사람", "（任意）": "선택", "うごき": "움직임", "こえ": "목소리", "かんせつ": "관절", "どうぐ": "도구", "🎨 どうぐ": "🎨 도구", "いろ": "색", "ふとさ": "굵기", "けしゴム": "지우개", "ぬりつぶし": "채우기", "ぜんぶけす": "모두 지우기", "↻ かいてん": "↻ 회전", "↔ 左右はんてん": "↔ 좌우 반전",
      "👀 表示": "👀 표시", "作者名を非表示": "만든 사람 이름 숨기기", "作品に作者名があることは、伏せ字で表示します": "만든 사람 이름을 가려서 표시합니다", "📱 オフライン・更新": "📱 오프라인 및 업데이트", "準備状況を確認しています…": "준비 상태 확인 중…", "最新版を確認": "업데이트 확인", "💾 設定・データのバックアップ": "💾 설정 및 데이터 백업", "すべてエクスポート(zip)": "모두 내보내기 (zip)", "zipからインポート": "zip에서 가져오기", "その他": "기타", "サンプルをもう一度入れる": "샘플 복원", "すべて削除する": "모두 삭제", "追加する": "추가", "置き換える": "바꾸기", "インポート": "가져오기", "エクスポート": "내보내기", "言語": "언어", "画面に表示する言語": "화면에 표시할 언어", "日本語": "일본어",
      "チームわけ": "팀 나누기", "🎪 チームわけ!": "🎪 팀 나누기!", "チームがえ": "팀 바꾸기", "じぶんで チームを きめる": "직접 팀 정하기", "よーい…": "준비…", "かち!": "승리!", "かんせい!": "완성!", "ぽん!": "출발!", "ほんばんへ": "본게임", "めかくしモード": "눈가림 모드", "ぎゃくさいせい": "거꾸로 재생", "ろくおん": "녹음", "きいてみる": "들어보기", "ていし": "정지", "ことば": "단어", "べつの ことば": "다른 단어"
    },
    "zh-Hans": {
      "みんなの ゲームパック": "大家的游戏包", "みんなのゲームパック": "大家的游戏包", "ゲームパック": "游戏包", "つくる": "创作", "みる": "观看", "あそぶ": "游玩", "設定": "设置", "せってい": "设置", "もどる": "返回", "← もどる": "← 返回", "表紙へ戻る": "返回首页", "つくる・みる・あそぶ": "创作、观看或游玩", "やることを えらぶ": "选择要做的事", "あそびかたを えらぶ": "选择玩法",
      "ひとりで": "单人", "ふたりで": "双人", "みんなで": "大家一起", "ゲーム別": "全部游戏", "みるだけ(オート)": "观看（自动）", "れんしゅう": "练习", "2Pたいせん": "双人对战", "つくりかたから えらぶ": "选择创作方式", "つくるものから えらぶ": "选择创作内容", "クイズを つくる": "制作问答", "おえかき": "画画", "カメラ": "相机", "とりこみ": "导入", "キャラクター": "角色", "はいけい": "背景", "４たくクイズ": "四选一问答",
      "キャラしょうかい": "角色画廊", "びじゅつかん": "美术馆", "みんなの せかい": "大家的世界", "かけっこ": "赛跑", "たまいれ": "投球入篮", "ドッヂボール": "躲避球", "リレー": "接力赛", "うんどうかい": "运动会", "ふくわらい": "拼脸游戏", "じゃんけん": "石头剪刀布", "かげえクイズ": "剪影问答", "さかさクイズ": "倒放词语问答", "まちがいさがし": "找不同", "カードあわせ": "卡片配对", "おえかきパズル": "绘画拼图", "おえかきのたび": "绘画冒险", "もぐらたたき": "打地鼠", "こえで ジャンプ": "声音跳跃", "なわとび": "跳绳",
      "スタート!": "开始！", "ゲームかいし": "开始游戏", "きめた！": "选好了！", "つぎ ▶": "下一步 ▶", "つぎへ →": "下一步 →", "もういちど": "再来一次", "やりなおす": "重新选择", "やりなおし": "重做", "もどす": "撤销", "おしまい!": "结束！", "けっかへ ▶": "查看结果 ▶", "こたえを みる": "查看答案", "ほぞん": "保存", "✔ ほぞん": "✔ 保存", "✔ 保存する": "✔ 保存", "キャンセル": "取消", "✕ とじる": "✕ 关闭", "シャッフル": "随机", "🎲 シャッフル": "🎲 随机", "🏆 ランキング": "🏆 排名", "かんたん": "简单", "ふつう": "普通", "むずかしい": "困难", "🔥 ガチンコ": "🔥 挑战", "🌈 ゆるふわ": "🌈 轻松", "ものしりクイズ": "知识问答", "キャラクタークイズ": "角色问答",
      "なにを かく?": "画什么？", "どの かおで あそぶ?": "选择一张脸", "さんかする キャラを えらんでね": "选择角色", "はしる キャラを えらんでね": "选择参赛角色", "たたかう キャラを えらんでね": "选择参赛角色", "たまいれを する キャラを えらんでね": "选择参赛角色", "きょうぎを えらんでね": "选择项目", "だすのを えらんでね!": "选择一个！", "あそびかたを えらんでね": "选择玩法",
      "キャラクターの絵": "角色图片", "キャラクターのぜんしん": "角色全身", "キャラクターのかお": "角色脸部", "はいけいの絵": "背景图片", "もとそざい": "原始图片", "ぜんしん": "全身", "かお": "脸部", "イラスト": "插图", "ステージ": "场景", "しゅるい": "类型", "作品名": "作品名", "作者名": "作者名", "（任意）": "选填", "うごき": "动作", "こえ": "声音", "かんせつ": "关节", "どうぐ": "工具", "🎨 どうぐ": "🎨 工具", "いろ": "颜色", "ふとさ": "粗细", "けしゴム": "橡皮擦", "ぬりつぶし": "填充", "ぜんぶけす": "全部清除", "↻ かいてん": "↻ 旋转", "↔ 左右はんてん": "↔ 左右翻转",
      "👀 表示": "👀 显示", "作者名を非表示": "隐藏作者名", "作品に作者名があることは、伏せ字で表示します": "用遮挡字符显示作者名", "📱 オフライン・更新": "📱 离线与更新", "準備状況を確認しています…": "正在检查准备状态…", "最新版を確認": "检查更新", "💾 設定・データのバックアップ": "💾 设置与数据备份", "すべてエクスポート(zip)": "全部导出（zip）", "zipからインポート": "从 zip 导入", "その他": "其他", "サンプルをもう一度入れる": "恢复示例", "すべて削除する": "全部删除", "追加する": "添加", "置き換える": "替换", "インポート": "导入", "エクスポート": "导出", "言語": "语言", "画面に表示する言語": "界面显示语言", "日本語": "日语",
      "チームわけ": "分队", "🎪 チームわけ!": "🎪 分队！", "チームがえ": "更换队伍", "じぶんで チームを きめる": "自己分队", "よーい…": "预备…", "かち!": "胜利！", "かんせい!": "完成！", "ぽん!": "开始！", "ほんばんへ": "正式游戏", "めかくしモード": "蒙眼模式", "ぎゃくさいせい": "倒放", "ろくおん": "录音", "きいてみる": "试听", "ていし": "停止", "ことば": "词语", "べつの ことば": "其他词语"
    },
    "zh-Hant": {
      "みんなの ゲームパック": "大家的遊戲包", "みんなのゲームパック": "大家的遊戲包", "ゲームパック": "遊戲包", "つくる": "創作", "みる": "觀看", "あそぶ": "遊玩", "設定": "設定", "せってい": "設定", "もどる": "返回", "← もどる": "← 返回", "表紙へ戻る": "返回首頁", "つくる・みる・あそぶ": "創作、觀看或遊玩", "やることを えらぶ": "選擇要做的事", "あそびかたを えらぶ": "選擇玩法",
      "ひとりで": "單人", "ふたりで": "雙人", "みんなで": "大家一起", "ゲーム別": "全部遊戲", "みるだけ(オート)": "觀看（自動）", "れんしゅう": "練習", "2Pたいせん": "雙人對戰", "つくりかたから えらぶ": "選擇創作方式", "つくるものから えらぶ": "選擇創作內容", "クイズを つくる": "製作問答", "おえかき": "畫畫", "カメラ": "相機", "とりこみ": "匯入", "キャラクター": "角色", "はいけい": "背景", "４たくクイズ": "四選一問答",
      "キャラしょうかい": "角色畫廊", "びじゅつかん": "美術館", "みんなの せかい": "大家的世界", "かけっこ": "賽跑", "たまいれ": "投球入籃", "ドッヂボール": "躲避球", "リレー": "接力賽", "うんどうかい": "運動會", "ふくわらい": "拼臉遊戲", "じゃんけん": "剪刀石頭布", "かげえクイズ": "剪影問答", "さかさクイズ": "倒放詞語問答", "まちがいさがし": "找不同", "カードあわせ": "卡片配對", "おえかきパズル": "繪畫拼圖", "おえかきのたび": "繪畫冒險", "もぐらたたき": "打地鼠", "こえで ジャンプ": "聲音跳躍", "なわとび": "跳繩",
      "スタート!": "開始！", "ゲームかいし": "開始遊戲", "きめた！": "選好了！", "つぎ ▶": "下一步 ▶", "つぎへ →": "下一步 →", "もういちど": "再來一次", "やりなおす": "重新選擇", "やりなおし": "重做", "もどす": "復原", "おしまい!": "結束！", "けっかへ ▶": "查看結果 ▶", "こたえを みる": "查看答案", "ほぞん": "儲存", "✔ ほぞん": "✔ 儲存", "✔ 保存する": "✔ 儲存", "キャンセル": "取消", "✕ とじる": "✕ 關閉", "シャッフル": "隨機", "🎲 シャッフル": "🎲 隨機", "🏆 ランキング": "🏆 排名", "かんたん": "簡單", "ふつう": "普通", "むずかしい": "困難", "🔥 ガチンコ": "🔥 挑戰", "🌈 ゆるふわ": "🌈 輕鬆", "ものしりクイズ": "知識問答", "キャラクタークイズ": "角色問答",
      "なにを かく?": "畫什麼？", "どの かおで あそぶ?": "選擇一張臉", "さんかする キャラを えらんでね": "選擇角色", "はしる キャラを えらんでね": "選擇參賽角色", "たたかう キャラを えらんでね": "選擇參賽角色", "たまいれを する キャラを えらんでね": "選擇參賽角色", "きょうぎを えらんでね": "選擇項目", "だすのを えらんでね!": "選擇一個！", "あそびかたを えらんでね": "選擇玩法",
      "キャラクターの絵": "角色圖片", "キャラクターのぜんしん": "角色全身", "キャラクターのかお": "角色臉部", "はいけいの絵": "背景圖片", "もとそざい": "原始圖片", "ぜんしん": "全身", "かお": "臉部", "イラスト": "插圖", "ステージ": "場景", "しゅるい": "類型", "作品名": "作品名", "作者名": "作者名", "（任意）": "選填", "うごき": "動作", "こえ": "聲音", "かんせつ": "關節", "どうぐ": "工具", "🎨 どうぐ": "🎨 工具", "いろ": "顏色", "ふとさ": "粗細", "けしゴム": "橡皮擦", "ぬりつぶし": "填滿", "ぜんぶけす": "全部清除", "↻ かいてん": "↻ 旋轉", "↔ 左右はんてん": "↔ 左右翻轉",
      "👀 表示": "👀 顯示", "作者名を非表示": "隱藏作者名", "作品に作者名があることは、伏せ字で表示します": "用遮擋字元顯示作者名", "📱 オフライン・更新": "📱 離線與更新", "準備状況を確認しています…": "正在檢查準備狀態…", "最新版を確認": "檢查更新", "💾 設定・データのバックアップ": "💾 設定與資料備份", "すべてエクスポート(zip)": "全部匯出（zip）", "zipからインポート": "從 zip 匯入", "その他": "其他", "サンプルをもう一度入れる": "恢復範例", "すべて削除する": "全部刪除", "追加する": "新增", "置き換える": "取代", "インポート": "匯入", "エクスポート": "匯出", "言語": "語言", "画面に表示する言語": "介面顯示語言", "日本語": "日語",
      "チームわけ": "分隊", "🎪 チームわけ!": "🎪 分隊！", "チームがえ": "更換隊伍", "じぶんで チームを きめる": "自己分隊", "よーい…": "預備…", "かち!": "勝利！", "かんせい!": "完成！", "ぽん!": "開始！", "ほんばんへ": "正式遊戲", "めかくしモード": "蒙眼模式", "ぎゃくさいせい": "倒放", "ろくおん": "錄音", "きいてみる": "試聽", "ていし": "停止", "ことば": "詞語", "べつの ことば": "其他詞語"
    },
    de: {
      "みんなの ゲームパック": "Spielepaket für alle", "みんなのゲームパック": "Spielepaket für alle", "ゲームパック": "Spielepaket", "つくる": "Gestalten", "みる": "Ansehen", "あそぶ": "Spielen", "設定": "Einstellungen", "せってい": "Einstellungen", "もどる": "Zurück", "← もどる": "← Zurück", "表紙へ戻る": "Zur Startseite", "つくる・みる・あそぶ": "Gestalten, ansehen oder spielen", "やることを えらぶ": "Wähle aus", "あそびかたを えらぶ": "Spielart wählen",
      "ひとりで": "Allein", "ふたりで": "Zu zweit", "みんなで": "Gemeinsam", "ゲーム別": "Alle Spiele", "みるだけ(オート)": "Zuschauen (Auto)", "れんしゅう": "Üben", "2Pたいせん": "Duell zu zweit", "つくりかたから えらぶ": "Methode wählen", "つくるものから えらぶ": "Motiv wählen", "クイズを つくる": "Quiz erstellen", "おえかき": "Malen", "カメラ": "Kamera", "とりこみ": "Importieren", "キャラクター": "Figur", "はいけい": "Hintergrund", "４たくクイズ": "Quiz mit 4 Antworten",
      "キャラしょうかい": "Figurengalerie", "びじゅつかん": "Kunstgalerie", "みんなの せかい": "Unsere Welt", "かけっこ": "Wettrennen", "たまいれ": "Ballwurf", "ドッヂボール": "Völkerball", "リレー": "Staffellauf", "うんどうかい": "Sportfest", "ふくわらい": "Gesicht legen", "じゃんけん": "Schere Stein Papier", "かげえクイズ": "Schattenquiz", "さかさクイズ": "Rückwärtswort-Quiz", "まちがいさがし": "Fehler suchen", "カードあわせ": "Kartenpaare", "おえかきパズル": "Bilderpuzzle", "おえかきのたび": "Mal-Abenteuer", "もぐらたたき": "Maulwurfspiel", "こえで ジャンプ": "Stimmen-Sprung", "なわとび": "Seilspringen",
      "スタート!": "Start!", "ゲームかいし": "Spiel starten", "きめた！": "Fertig!", "つぎ ▶": "Weiter ▶", "つぎへ →": "Weiter →", "もういちど": "Noch einmal", "やりなおす": "Neu wählen", "やりなおし": "Wiederholen", "もどす": "Rückgängig", "おしまい!": "Geschafft!", "けっかへ ▶": "Ergebnis ▶", "こたえを みる": "Antwort zeigen", "ほぞん": "Speichern", "✔ ほぞん": "✔ Speichern", "✔ 保存する": "✔ Speichern", "キャンセル": "Abbrechen", "✕ とじる": "✕ Schließen", "シャッフル": "Mischen", "🎲 シャッフル": "🎲 Mischen", "🏆 ランキング": "🏆 Rangliste", "かんたん": "Leicht", "ふつう": "Normal", "むずかしい": "Schwer", "🔥 ガチンコ": "🔥 Herausforderung", "🌈 ゆるふわ": "🌈 Entspannt", "ものしりクイズ": "Wissensquiz", "キャラクタークイズ": "Figurenquiz",
      "なにを かく?": "Was malst du?", "どの かおで あそぶ?": "Wähle ein Gesicht", "さんかする キャラを えらんでね": "Figuren auswählen", "はしる キャラを えらんでね": "Läufer auswählen", "たたかう キャラを えらんでね": "Spieler auswählen", "たまいれを する キャラを えらんでね": "Spieler auswählen", "きょうぎを えらんでね": "Disziplinen wählen", "だすのを えらんでね!": "Wähle eins!", "あそびかたを えらんでね": "Spielart wählen",
      "キャラクターの絵": "Figurenbild", "キャラクターのぜんしん": "Ganze Figur", "キャラクターのかお": "Figurengesicht", "はいけいの絵": "Hintergrundbild", "もとそざい": "Originalbild", "ぜんしん": "Ganze Figur", "かお": "Gesicht", "イラスト": "Illustration", "ステージ": "Bühne", "しゅるい": "Art", "作品名": "Titel", "作者名": "Erstellt von", "（任意）": "Optional", "うごき": "Bewegung", "こえ": "Stimme", "かんせつ": "Gelenke", "どうぐ": "Werkzeuge", "🎨 どうぐ": "🎨 Werkzeuge", "いろ": "Farbe", "ふとさ": "Stärke", "けしゴム": "Radierer", "ぬりつぶし": "Füllen", "ぜんぶけす": "Alles löschen", "↻ かいてん": "↻ Drehen", "↔ 左右はんてん": "↔ Spiegeln",
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

  let language = localStorage.getItem(STORAGE_KEY) || "ja";
  if (!LOCALES[language]) language = "ja";
  const renderedText = new WeakMap();
  const sourceText = new WeakMap();
  const renderedAttrs = new WeakMap();
  const sourceAttrs = new WeakMap();

  function t(source) {
    if (language === "ja" || typeof source !== "string") return source;
    const direct = (PACKS[language] && PACKS[language][source]) || (EXTRA_PACKS[language] && EXTRA_PACKS[language][source]);
    if (direct) return direct;
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

  function init() {
    document.documentElement.lang = LOCALES[language].htmlLang;
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
