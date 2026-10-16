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
          { label: "社群連結", itemLabel: (p) => p.fields.label.value },
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
      columns: ["title", "category"],
      schema: {
        title: fields.slug({ name: { label: "標題" } }),
        summary: fields.text({ label: "簡介", multiline: true }),
        category: fields.select({
          label: "類型",
          options: [
            { label: "小遊戲", value: "game" },
            { label: "Web 應用", value: "app" },
            { label: "視覺設計", value: "design" },
          ],
          defaultValue: "game",
        }),
        cover: fields.image({
          label: "封面圖",
          directory: "public/images/works",
          publicPath: "/images/works/",
        }),
        tags: fields.array(fields.text({ label: "標籤" }), {
          label: "標籤",
          itemLabel: (p) => p.value,
        }),
        order: fields.integer({ label: "排序(小的在前)", defaultValue: 0 }),
        embed: fields.conditional(
          fields.select({
            label: "互動嵌入方式",
            options: [
              { label: "無", value: "none" },
              { label: "站內遊戲(src/games 註冊的 id)", value: "internal" },
              { label: "iframe(public/games/... 或外部網址)", value: "iframe" },
            ],
            defaultValue: "none",
          }),
          {
            none: fields.empty(),
            internal: fields.text({ label: "遊戲 id" }),
            iframe: fields.text({
              label: "網址",
              description: "例如 /games/my-game/index.html",
            }),
          },
        ),
        liveUrl: fields.url({ label: "外部連結(選填)" }),
        repoUrl: fields.url({ label: "原始碼(選填)" }),
        body: fields.markdoc({ label: "內文" }),
      },
    }),
  },
});
