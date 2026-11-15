import { config, collection, singleton, fields } from "@keystatic/core";

// Local mode edits files on disk (dev). Set NEXT_PUBLIC_KEYSTATIC_STORAGE=github
// in production so /keystatic commits straight to the repo.
const storage =
  process.env.NEXT_PUBLIC_KEYSTATIC_STORAGE === "github"
    ? ({
        kind: "github",
        repo: { owner: "zolic0112", name: "myportfolio-" },
      } as const)
    : ({ kind: "local" } as const);

// Translations live next to the Chinese source. `npm run translate` fills the
// empty ones by machine; tick "已校對" once a human has checked a language so
// the script never overwrites it.
const workTranslation = (lang: string) =>
  fields.object(
    {
      title: fields.text({ label: "標題" }),
      summary: fields.text({ label: "簡介", multiline: true }),
      role: fields.text({ label: "角色" }),
      body: fields.text({ label: "內文(純文字,空行分段)", multiline: true }),
      reviewed: fields.checkbox({ label: "已校對(沒勾 = 機翻未校對)" }),
    },
    { label: lang },
  );

const profileTranslation = (lang: string) =>
  fields.object(
    {
      title: fields.text({ label: "職稱" }),
      tagline: fields.text({ label: "一句話介紹", multiline: true }),
      reviewed: fields.checkbox({ label: "已校對(沒勾 = 機翻未校對)" }),
    },
    { label: lang },
  );

export default config({
  storage,
  ui: { brand: { name: "Portfolio" } },
  singletons: {
    profile: singleton({
      label: "個人資料",
      path: "content/profile",
      schema: {
        name: fields.text({ label: "名字" }),
        title: fields.text({ label: "職稱" }),
        tagline: fields.text({ label: "一句話介紹", multiline: true }),
        email: fields.text({ label: "Email" }),
        links: fields.array(
          fields.object({
            label: fields.text({ label: "名稱" }),
            url: fields.url({ label: "網址" }),
          }),
          {
            label: "社群連結",
            description: "Brain rot 面的假叉叉會隨機開其中一個(新分頁)",
            itemLabel: (p) => p.fields.label.value,
          },
        ),
        i18n: fields.object(
          {
            en: profileTranslation("English"),
            ja: profileTranslation("日本語"),
            es: profileTranslation("Español"),
          },
          { label: "翻譯", description: "留空會顯示中文。npm run translate 會自動填沒校對過的欄位" },
        ),
        sponsorUrl: fields.url({
          label: "贊助連結:國際(Ko-fi)",
          description: "Brain rot 面 Premium 訂閱頁的「國際」付款按鈕",
        }),
        sponsorUrlTw: fields.url({
          label: "贊助連結:台灣(綠界 ECPay)",
          description: "Premium 訂閱頁的「台灣」付款按鈕。兩個都留空的話,訂閱頁會說還沒設定",
        }),
      },
    }),
    reels: singleton({
      label: "Brain rot 短影音清單",
      path: "content/reels",
      schema: {
        videos: fields.array(
          fields.url({ label: "YouTube Shorts 網址" }),
          {
            label: "影片",
            description:
              "Reels 彈窗會隨機從這裡開始、上下滑逐支播放。清單是空的就不會出現這個彈窗。影片被刪會自動跳下一支,但請定期檢查。注意版權。",
            itemLabel: (p) => p.value ?? "",
          },
        ),
      },
    }),
  },
  collections: {
    works: collection({
      label: "作品",
      slugField: "title",
      path: "content/works/*",
      format: { contentField: "body" },
      columns: ["title", "category", "year"],
      schema: {
        title: fields.slug({ name: { label: "標題" } }),
        summary: fields.text({ label: "簡介", multiline: true }),
        category: fields.select({
          label: "類別",
          options: [
            { label: "遊戲", value: "game" },
            { label: "互動", value: "interactive" },
            { label: "影像", value: "video" },
            { label: "平面", value: "graphic" },
          ],
          defaultValue: "game",
        }),
        year: fields.integer({ label: "年份" }),
        role: fields.text({ label: "角色", description: "例如:企劃、美術、程式" }),
        cover: fields.image({
          label: "封面圖",
          directory: "public/images/works",
          publicPath: "/images/works/",
        }),
        tags: fields.array(fields.text({ label: "標籤" }), {
          label: "標籤",
          itemLabel: (p) => p.value,
        }),
        featured: fields.checkbox({
          label: "首頁代表作(bento)",
          description: "建議只勾 2–3 件",
        }),
        rotOnly: fields.checkbox({
          label: "隱藏款:只在 brain rot 面出現",
        }),
        order: fields.integer({ label: "排序(小的在前)", defaultValue: 0 }),
        video: fields.text({
          label: "影片網址",
          description: "YouTube / Vimeo 連結,或 /videos/xxx.mp4。可玩作品在手機不支援時也會改放這支",
        }),
        gallery: fields.array(
          fields.image({
            label: "圖片",
            directory: "public/images/works",
            publicPath: "/images/works/",
          }),
          { label: "圖片集" },
        ),
        embed: fields.conditional(
          fields.select({
            label: "可玩內容",
            options: [
              { label: "無", value: "none" },
              { label: "站內遊戲(src/games 註冊的 id)", value: "internal" },
              {
                label: "iframe(Unity WebGL / Godot / itch.io / 網頁互動)",
                value: "iframe",
              },
            ],
            defaultValue: "none",
          }),
          {
            none: fields.empty(),
            internal: fields.text({ label: "遊戲 id" }),
            iframe: fields.text({
              label: "網址",
              description: "例如 /games/my-game/index.html 或 itch.io 的嵌入網址",
            }),
          },
        ),
        mobilePlayable: fields.checkbox({
          label: "手機可玩",
          description: "沒勾的話,手機上改放影片",
          defaultValue: true,
        }),
        liveUrl: fields.url({ label: "外部連結(選填)" }),
        repoUrl: fields.url({ label: "原始碼(選填)" }),
        i18n: fields.object(
          {
            en: workTranslation("English"),
            ja: workTranslation("日本語"),
            es: workTranslation("Español"),
          },
          { label: "翻譯", description: "留空會顯示中文。npm run translate 會自動填沒校對過的欄位" },
        ),
        body: fields.markdoc({ label: "內文" }),
      },
    }),
  },
});
