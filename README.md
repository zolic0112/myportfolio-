# 作品集網站

Next.js + TypeScript + Tailwind CSS 打造的個人作品集,內建一個簡單的管理後台(`/admin`),可以直接在介面上新增、編輯、刪除作品,不需要改程式碼。

## 開發

```bash
npm install
cp .env.example .env   # 填入自己的 ADMIN_PASSWORD / ADMIN_SESSION_SECRET
npm run prisma:migrate # 建立本機 SQLite 資料庫
npm run dev
```

開啟 http://localhost:3000 看前台,http://localhost:3000/admin 進管理後台(密碼就是 `.env` 裡的 `ADMIN_PASSWORD`)。

## 結構

- `src/app/` — 頁面與 API routes(App Router)
- `src/components/` — 前台區塊(Nav、Hero、Projects、Skills、Contact、Footer)
- `src/app/admin/` — 管理後台(登入頁 + 作品 CRUD 介面)
- `src/app/api/projects/` — 作品的 REST API(GET 公開,POST/PUT/DELETE 需登入)
- `src/lib/data.ts` — 個人資料(姓名、簡介、技能等靜態內容,直接編輯這個檔案)
- `prisma/schema.prisma` — 作品(Project)的資料庫結構
- `src/proxy.ts` — 保護 `/admin` 頁面與寫入類 API 的驗證邏輯

## 資料庫

本機開發用 SQLite(`prisma/dev.db`,已加入 `.gitignore`)。部署到 Vercel 等平台時:

1. 準備一個雲端 Postgres(例如 Vercel Postgres、Neon、Supabase)
2. 把 `prisma/schema.prisma` 的 `datasource.provider` 改成 `"postgresql"`
3. 設定環境變數 `DATABASE_URL` 指向該雲端資料庫
4. 執行 `npx prisma migrate deploy`

Prisma 的 Client API 不會因為換資料庫而改變,應用程式程式碼不需要更動。

## 管理後台驗證

目前是「單一密碼」模式:設定 `ADMIN_PASSWORD` 後即可登入,`ADMIN_SESSION_SECRET` 用來簽署 session cookie,請用 `openssl rand -hex 32` 產生一個夠長的隨機字串。
