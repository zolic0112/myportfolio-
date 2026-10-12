import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: { order: "asc" },
  });
  return NextResponse.json(projects);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";

  if (!title || !description) {
    return NextResponse.json(
      { error: "title 與 description 為必填" },
      { status: 400 },
    );
  }

  const last = await prisma.project.findFirst({ orderBy: { order: "desc" } });

  const project = await prisma.project.create({
    data: {
      title,
      description,
      tags: typeof body.tags === "string" ? body.tags.trim() : "",
      link: body.link || null,
      repo: body.repo || null,
      image: body.image || null,
      order: (last?.order ?? -1) + 1,
    },
  });

  return NextResponse.json(project, { status: 201 });
}
