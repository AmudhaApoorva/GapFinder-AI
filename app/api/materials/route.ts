import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ingestMaterial } from "@/lib/ingest";
import { extractPdfText } from "@/lib/pdf";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (id) {
    const material = await prisma.material.findFirst({
      where: { id, userId: session.user.id },
      include: {
        chunks: {
          orderBy: { index: "asc" },
          select: { id: true, section: true, content: true, index: true },
        },
      },
    });
    if (!material) return NextResponse.json({ error: "Material not found" }, { status: 404 });
    return NextResponse.json(material);
  }

  const materials = await prisma.material.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(materials);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let title = "";
  let kind = "notes";
  let filename = "pasted-content.txt";
  let mimeType = "text/plain";
  let text = "";

  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await req.json();
    title = String(body.title ?? "").trim();
    kind = String(body.kind ?? "notes");
    text = String(body.text ?? "").trim();
    filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "material"}.md`;
    mimeType = "text/markdown";
  } else {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const pastedText = String(form.get("text") ?? "").trim();
    title = String(form.get("title") ?? "").trim();
    kind = String(form.get("kind") ?? "notes");

    if (file && file.size > 0) {
      if (file.size > 8 * 1024 * 1024) {
        return NextResponse.json({ error: "File too large (8 MB limit)." }, { status: 400 });
      }
      filename = file.name;
      mimeType = file.type || "text/plain";
      const buffer = Buffer.from(await file.arrayBuffer());
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        text = await extractPdfText(buffer);
      } else {
        text = buffer.toString("utf8");
      }
    } else if (pastedText) {
      text = pastedText;
      filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "notes"}.md`;
      mimeType = "text/markdown";
    }
  }

  if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });
  if (text.trim().length < 30) {
    return NextResponse.json(
      { error: "Content must have at least 30 characters of readable text." },
      { status: 400 },
    );
  }

  const material = await ingestMaterial({
    userId: session.user.id,
    title,
    kind,
    filename,
    mimeType,
    text,
  });

  const chunks = await prisma.chunk.count({ where: { materialId: material.id } });
  return NextResponse.json({ id: material.id, title: material.title, chunks });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let id = req.nextUrl.searchParams.get("id");
  if (!id) {
    try {
      const body = await req.json();
      id = body?.id;
    } catch {
      // ignore
    }
  }

  if (!id) return NextResponse.json({ error: "Missing material id" }, { status: 400 });

  const material = await prisma.material.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!material) return NextResponse.json({ error: "Material not found" }, { status: 404 });

  await prisma.chunk.deleteMany({ where: { materialId: id } });
  await prisma.material.delete({ where: { id } });

  return NextResponse.json({ success: true, id });
}
