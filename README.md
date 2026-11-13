# 互動作品集:高冷面 × Brain rot 面

Next.js 16 + Tailwind CSS 4 + Keystatic。設計決定見 [`docs/handoff/DESIGN-BRIEF.md`](docs/handoff/DESIGN-BRIEF.md)。

網站有兩種人格,共用同一份 DOM、同一批作品:

- **高冷面**(每次進站的預設):太空黑、玻璃卡片、細襯線標題、全靜音。右下角浮著一個籠子,Space Dog 關在裡面。
- **Brain rot 面**:訪客打開籠子 → 狗衝出來、彩紙炸開 → 整頁變成 Win95 / GeoCities / deep-fried。垃圾彈窗、迷因音效、到處亂跑的像素狗。把狗抓回籠子才會變回來。

## 開發

```bash
npm install
npm run dev
```

- 前台:http://localhost:3000
- 內容後台:http://localhost:3000/keystatic(本機模式直接改 `content/` 裡的檔案)

## 架構

```
content/                    作品與個人資料(Keystatic 管理)
keystatic.config.ts         內容欄位定義
docs/handoff/               設計交接包(Brief、角色 SVG、原型)
src/app/(site)/globals.css  兩套皮:[data-persona="cool"|"rot"] 重新定義 skin-* class
src/components/             版面:Hero、Bento(代表作)、WorksBrowser(篩選網格)、WorkCard、WorkMedia
src/interactive/            互動層(在 layout 掛一次,換頁不會重來)
  store.ts                  人格、切換流程(release / capture)、彈窗、Premium、靜音
  pet/rig.ts                Space Dog 骨架資料(支點、父子關係、路徑,取自 parts SVG)
  pet/filters.ts            像素化量化與病毒模式的故障效果
  pet/engine.ts             物理、行為(亂跑/逃跑/體力/被抓)、姿勢、繪製
  SpaceDog.tsx / Cage.tsx   狗與籠子的 React 外殼
  FxLayer.tsx               彩紙、亂彈 emoji、彩虹游標尾巴、吸回籠子
  Popups.tsx                垃圾彈窗排程與各種彈窗、迴紋針小幫手
  Hatch.tsx                 「我放棄 😭」與靜音鈕(陽春 HTML)
  PremiumModal.tsx          惡搞訂閱頁(信任制,存在 localStorage)
  sound.ts                  WebAudio 合成音效,無版權素材
src/games/                  站內小遊戲(React 元件,依需求載入)
public/games/               獨立建置的遊戲,用 iframe 嵌入
```

### 換皮的規則

元件只用 Tailwind 排版,外觀一律用 `skin-*` class(`skin-card`、`skin-h1`、`skin-chip`…)。兩面的樣子都在 `globals.css` 裡,以 `[data-persona]` 切換。只在某一面出現的東西加 `cool-only` / `rot-only`。

### Space Dog

- 狗活在整個視窗座標裡,可以站在地板,或任何有 `data-perch` 的元素上緣(作品卡、彈窗標題列)。
- 畫在一張跟著狗移動的小 canvas 上(不是全螢幕 canvas)。高冷面是平滑向量;Brain rot 面每格 4px、12fps、三色量化,加病毒模式隨機故障。
- 抓狗是體力制:滑鼠靠近牠會逃、會假動作;追幾秒後牠會喘氣流汗(可以抓)。手機沒有懸停,改成每次撲空扣體力。
- 抓著靠近籠子,籠子會發光開門,放開就吸進去。
- 鍵盤使用者:Brain rot 面對籠子按 Enter 會把狗叫回來。
- 尊重「減少動態效果」:狗不亂跑、不逃、沒有轉場與彩紙。

### 作品欄位

標題、簡介、類別(遊戲/互動/影像/平面)、年份、角色、封面、圖片集、影片網址(YouTube/Vimeo/mp4)、可玩內容(站內遊戲或 iframe)、手機可玩、首頁代表作(bento)、隱藏款(只在 brain rot 面出現)。

個人資料的「贊助連結」會用在 Premium 方案按鈕。

## 還沒做(對照 Brief)

- 四語(中英日西)與上傳時自動翻譯
- 小遊戲型、Reels 型彈窗
- 撞籠子以外的籠內躁動細節、衝出籠子/被吸回的專屬動作、爬牆
- 籠子正式造型(目前是程式畫的暫代版)
- 上線用素材(迷因圖、音效、短影音清單)

## 部署(Vercel)

1. 在 Vercel 匯入此 repo
2. 依 [Keystatic GitHub mode 說明](https://keystatic.com/docs/github-mode) 建立 GitHub App,並設定它要求的環境變數
3. 設定 `NEXT_PUBLIC_KEYSTATIC_STORAGE=github`
