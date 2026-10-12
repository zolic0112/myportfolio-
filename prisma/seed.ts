import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.project.count();
  if (count > 0) return;

  await prisma.project.createMany({
    data: [
      {
        title: "專案一",
        description: "在這裡簡短描述這個專案解決的問題與你的角色。",
        tags: "Next.js,TypeScript,Tailwind",
        order: 0,
      },
      {
        title: "專案二",
        description: "在這裡簡短描述這個專案解決的問題與你的角色。",
        tags: "React,Node.js",
        order: 1,
      },
    ],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
