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
  PopupExtras.tsx           小遊戲型彈窗(抓狗 / 驗證碼)、Reels 型彈窗
  Hatch.tsx                 「我放棄 😭」與靜音鈕(陽春 HTML)
  PremiumModal.tsx          惡搞訂閱頁(信任制,存在 localStorage)
  sound.ts                  WebAudio 合成音效,無版權素材
src/lib/i18n.tsx            四語:UI 字串、<T> 元件、語言偵測 script
scripts/translate.mjs       把 content/ 裡缺的翻譯補上
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
- 停在作品卡或彈窗標題列上時常會坐下來;跳到別的卡片時偶爾會鑽到頁面後面,只從格子縫隙看得到。偶爾會叫,累了會哀一聲。
- 開籠:點一下,或把門閂往旁邊拖(手機)。
- 鍵盤使用者:Brain rot 面對籠子按 Enter 會把狗叫回來。
- 隱藏款作品(`rotOnly`)在高冷面連直接開網址都只會看到「被關起來了」。
- 尊重「減少動態效果」:狗不亂跑、不逃、沒有轉場與彩紙。

### 作品欄位

標題、簡介、類別(遊戲/互動/影像/平面)、年份、角色、封面、圖片集、影片網址(YouTube/Vimeo/mp4)、可玩內容(站內遊戲或 iframe)、手機可玩、首頁代表作(bento)、隱藏款(只在 brain rot 面出現)。


### 四語(中 / 英 / 日 / 西)

- 沒有語言路由:每段要翻的文字在 DOM 裡各語言一份,由 `<html data-lang>` 決定顯示哪一份。`layout.tsx` 裡的 inline script 在第一次繪製前決定語言(記住的選擇 → 瀏覽器語言 → 英文),所以不會閃,頁面也維持靜態。導覽列有手動切換鈕。
- 只翻正經內容(導覽、功能 UI、作品標題與說明)。Brain rot 垃圾刻意不翻。UI 字串在 `src/lib/i18n.tsx`。
- 作品與個人資料在後台各有「翻譯」欄位(English / 日本語 / Español),留空就顯示中文。每個語言有「已校對」勾選。
- **自動翻譯**:內容一有變動(例如在線上後台存檔),`.github/workflows/translate.yml` 會在 GitHub 的主機上跑開源模型 M2M100(MIT 授權),把還沒校對、還空著的欄位翻好再 commit 回來。不需要金鑰,也不用錢。只在預設分支上執行。已校對的語言不會被動到。

  本機也可以手動跑(第一次會下載幾百 MB 的模型):

  ```bash
  npm run translate
  ```

  `--force` 重翻所有未校對的,`--dry` 只列出缺什麼。M2M100 的品質只算堪用,口語和專有名詞常翻錯,翻完請到後台檢查並勾「已校對」。要換引擎改 `scripts/translate.mjs` 的 `translateText()`,或設 `TRANSLATE_MODEL`。

### 贊助(Premium 訂閱頁)

後台個人資料有兩個連結:國際(Ko-fi)與台灣(綠界)。訂閱頁會列出有填的那幾個讓訪客選;信任制,不驗證付款。

### Reels 彈窗

後台的「Brain rot 短影音清單」填 YouTube Shorts 網址才會出現(清單是空的就不會跳)。一次只載入當前一支,上下滑 / 滾輪 / ▲▼ 切換,影片失效或播完自動跳下一支。

## 需要你提供的東西

- 籠子正式造型(目前是程式畫的暫代版)
- 實際作品內容與封面
- 素材:後台「Brain rot 素材」填 YouTube Shorts 網址(Reels 彈窗)和迷因圖(迷因彈窗),清單是空的那種彈窗就不會出現。注意版權
- 贊助連結(Ko-fi、綠界)

## 部署(Vercel)

1. 在 Vercel 匯入此 repo
2. 依 [Keystatic GitHub mode 說明](https://keystatic.com/docs/github-mode) 建立 GitHub App,並設定它要求的環境變數
3. 設定 `NEXT_PUBLIC_KEYSTATIC_STORAGE=github`
