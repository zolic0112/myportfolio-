# 互動作品集

Next.js 16 + Tailwind CSS 4 + Keystatic。內容存成 repo 裡的檔案(不需要資料庫),網站本身是一個互動作品:有可拖曳的桌寵,可以觸發主題切換和小遊戲。

## 開發

```bash
npm install
npm run dev
```

- 前台:http://localhost:3000
- 內容後台:http://localhost:3000/keystatic(本機模式直接改 `content/` 裡的檔案)

## 架構

```
content/                 作品與個人資料(Keystatic 管理的 .mdoc / .yaml)
keystatic.config.ts      內容欄位定義
src/app/(site)/          前台頁面(首頁、/works/[slug])
src/app/keystatic/       後台 UI(獨立 layout,沒有桌寵)
src/interactive/         互動層:全域 store、桌寵、遊戲彈窗
src/games/               站內小遊戲(React 元件,依需求載入)
public/games/            獨立建置的遊戲,用 iframe 嵌入
```

### 互動層

`src/interactive/store.ts` 是全站共享狀態(目前主題、正在玩的遊戲)。桌寵、作品頁或之後任何特效都透過它互相觸發。例如桌寵呼叫 `launchGame(id)` 就會跳出遊戲。

- **新增主題**:在 `globals.css` 加一組 `[data-theme="xxx"]` 色彩變數,並把名稱加進 `store.ts` 的 `THEMES`。切換主題時會用 View Transitions API 播放動畫。
- **新增桌寵行為**:編輯 `DesktopPet.tsx` 裡的 `actions` 陣列。
- **換桌寵造型**:替換 `DesktopPet.tsx` 裡的 placeholder SVG(可以換成圖片、Lottie、Rive 等)。

### 放遊戲 / 應用的兩種方式

1. **站內遊戲**:在 `src/games/<id>/index.tsx` 寫 React 元件,到 `src/games/registry.ts` 註冊。桌寵和作品頁都能啟動它。
2. **獨立作品**:把已經 build 好的輸出(Vite、Phaser、Unity WebGL 等)放到 `public/games/<名稱>/`,在後台把作品的嵌入方式設成 iframe,網址填 `/games/<名稱>/index.html`。

## 部署(Vercel)

1. 在 Vercel 匯入此 repo
2. 依 [Keystatic GitHub mode 說明](https://keystatic.com/docs/github-mode) 建立 GitHub App,並設定它要求的環境變數
3. 設定 `NEXT_PUBLIC_KEYSTATIC_STORAGE=github`

之後線上的 `/keystatic` 會用 GitHub 登入,儲存時直接 commit 到 repo,Vercel 會自動重新部署。
