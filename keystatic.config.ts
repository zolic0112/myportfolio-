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
        sponsorUrl: fields.url({
          label: "贊助連結(Ko-fi / Buy Me a Coffee / PayPal)",
          description: "Brain rot 面的 Premium 方案按鈕會開這個網址",
        }),
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
        body: fields.markdoc({ label: "內文" }),
      },
    }),
  },
});
