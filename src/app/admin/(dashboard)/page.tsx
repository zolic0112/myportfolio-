import { prisma } from "@/lib/prisma";
import ProjectManager from "./ProjectManager";

export default async function AdminPage() {
  const projects = await prisma.project.findMany({ orderBy: { order: "asc" } });
  return <ProjectManager initialProjects={projects} />;
}
