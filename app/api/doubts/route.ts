import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role === "teacher") {
    const doubts = await prisma.lecturerDoubt.findMany({
      include: {
        student: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(doubts);
  }

  const doubts = await prisma.lecturerDoubt.findMany({
    where: { studentId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(doubts);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const subject = String(body.subject ?? "").trim();
  const question = String(body.question ?? "").trim();
  const topicName = String(body.topicName ?? "").trim() || null;

  if (!subject || !question) {
    return NextResponse.json({ error: "Subject and question are required." }, { status: 400 });
  }

  const doubt = await prisma.lecturerDoubt.create({
    data: {
      studentId: session.user.id,
      subject,
      question,
      topicName,
      status: "pending",
    },
  });

  return NextResponse.json(doubt);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "teacher") {
    return NextResponse.json({ error: "Only lecturers/teachers can reply to doubts." }, { status: 403 });
  }

  const body = await req.json();
  const id = String(body.id ?? "");
  const reply = String(body.reply ?? "").trim();
  const status = body.status === "pending" ? "pending" : "resolved";

  if (!id || !reply) {
    return NextResponse.json({ error: "Doubt ID and reply text are required." }, { status: 400 });
  }

  const updated = await prisma.lecturerDoubt.update({
    where: { id },
    data: {
      reply,
      repliedAt: new Date(),
      status,
    },
  });

  return NextResponse.json(updated);
}
