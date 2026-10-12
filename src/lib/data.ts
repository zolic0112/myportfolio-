export const profile = {
  name: "你的名字",
  title: "前端工程師 / 設計師",
  tagline: "打造簡潔、實用且有溫度的數位體驗。",
  email: "you@example.com",
  location: "Taiwan",
  social: {
    github: "https://github.com/yourname",
    linkedin: "https://linkedin.com/in/yourname",
    twitter: "",
  },
};

// Project content now lives in the database (see prisma/schema.prisma) and
// is managed via /admin, not here.

export type SkillGroup = {
  category: string;
  items: string[];
};

export const skills: SkillGroup[] = [
  { category: "語言 / 框架", items: ["TypeScript", "React", "Next.js"] },
  { category: "樣式", items: ["Tailwind CSS", "CSS Modules"] },
  { category: "工具", items: ["Git", "Figma", "Vercel"] },
];
