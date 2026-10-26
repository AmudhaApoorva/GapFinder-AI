import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildPlan } from "@/lib/diagnosis";
import { daysUntil } from "@/lib/utils";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const hoursPerDay = Number(body.hoursPerDay ?? 2);
  const examDate = String(body.examDate ?? "");
  await prisma.user.update({
    where: { id: session.user.id },
    data: { examDate: examDate || null, hoursPerDay },
  });
  const plan = await buildPlan(session.user.id, hoursPerDay, daysUntil(examDate));
  return NextResponse.json({ id: plan.id });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const id = String(body.id ?? "");
  const completed = Boolean(body.completed);

  if (!id) return NextResponse.json({ error: "Missing item id" }, { status: 400 });

  const item = await prisma.planItem.findFirst({
    where: { id, plan: { userId: session.user.id } },
  });
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  const updated = await prisma.planItem.update({
    where: { id },
    data: {
      completed,
      completedAt: completed ? new Date() : null,
    },
  });

  if (completed) {
    const { awardPoints } = await import("@/lib/gamification");
    await awardPoints(
      session.user.id,
      "review_mistake",
      `plan_item_${id}`,
      10,
      `Completed revision task: ${item.topicName}`,
    );
  }

  return NextResponse.json(updated);
}
