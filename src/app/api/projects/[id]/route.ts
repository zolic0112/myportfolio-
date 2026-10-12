import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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

  try {
    const project = await prisma.project.update({
      where: { id },
      data: {
        title,
        description,
        tags: typeof body.tags === "string" ? body.tags.trim() : "",
        link: body.link || null,
        repo: body.repo || null,
        image: body.image || null,
        ...(typeof body.order === "number" ? { order: body.order } : {}),
      },
    });
    return NextResponse.json(project);
  } catch {
    return NextResponse.json({ error: "找不到專案" }, { status: 404 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "找不到專案" }, { status: 404 });
  }
}
