import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      hoursPerDay: true,
      examDate: true,
      preferredLanguage: true,
    },
  });

  return NextResponse.json(user);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = String(body.name ?? "").trim();
  const hoursPerDay = Number(body.hoursPerDay ?? 2);
  const examDate = String(body.examDate ?? "");
  const preferredLanguage = String(body.preferredLanguage ?? "en");

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: name || undefined,
      hoursPerDay: hoursPerDay > 0 ? hoursPerDay : 2,
      examDate: examDate || null,
      preferredLanguage,
    },
  });

  return NextResponse.json({
    success: true,
    user: {
      id: updated.id,
      name: updated.name,
      hoursPerDay: updated.hoursPerDay,
      examDate: updated.examDate,
      preferredLanguage: updated.preferredLanguage,
    },
  });
}
