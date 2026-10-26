import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

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

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const material = await prisma.material.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!material) return NextResponse.json({ error: "Material not found" }, { status: 404 });

  await prisma.chunk.deleteMany({ where: { materialId: id } });
  await prisma.material.delete({ where: { id } });

  return NextResponse.json({ success: true, id });
}
