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

export type Project = {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  link?: string;
  repo?: string;
  image?: string;
};

export const projects: Project[] = [
  {
    slug: "project-one",
    title: "專案一",
    description: "在這裡簡短描述這個專案解決的問題與你的角色。",
    tags: ["Next.js", "TypeScript", "Tailwind"],
    link: "",
    repo: "",
  },
  {
    slug: "project-two",
    title: "專案二",
    description: "在這裡簡短描述這個專案解決的問題與你的角色。",
    tags: ["React", "Node.js"],
    link: "",
    repo: "",
  },
];

export type SkillGroup = {
  category: string;
  items: string[];
};

export const skills: SkillGroup[] = [
  { category: "語言 / 框架", items: ["TypeScript", "React", "Next.js"] },
  { category: "樣式", items: ["Tailwind CSS", "CSS Modules"] },
  { category: "工具", items: ["Git", "Figma", "Vercel"] },
];
