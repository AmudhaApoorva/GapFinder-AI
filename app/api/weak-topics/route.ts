import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTopicDiagnoses, generateWeakTopicLearningModule } from "@/lib/weak-topics";
import { awardPoints } from "@/lib/gamification";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user;
    const result = await getTopicDiagnoses(user.id);
    return NextResponse.json(result);
  } catch (err: any) {
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[WeakTopics GET error]", err);
    return NextResponse.json({ error: "Failed to load topic diagnoses." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user;
    const body = await req.json();

    const { topicId, mode, language = "en" } = body;

    if (!topicId || !mode) {
      return NextResponse.json({ error: "topicId and mode are required." }, { status: 400 });
    }

    const result = await generateWeakTopicLearningModule(user.id, topicId, mode, language);

    // If reviewing a concept, check if it fulfills today's concept_explanation challenge
    const today = new Date().toISOString().slice(0, 10);
    const challenge = await prisma.dailyChallenge.findFirst({
      where: {
        userId: user.id,
        date: today,
        challengeKey: "concept_explanation",
        completed: false,
      },
    });

    if (challenge) {
      await prisma.dailyChallenge.update({
        where: { id: challenge.id },
        data: {
          currentCount: 1,
          completed: true,
          completedAt: new Date(),
        },
      });

      await awardPoints(
        user.id,
        "daily_challenge",
        challenge.id,
        challenge.points,
        `Completed daily challenge: ${challenge.title}`,
      );
    }

    return NextResponse.json(result);
  } catch (err: any) {
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[WeakTopics POST error]", err);
    return NextResponse.json({ error: "Failed to generate learning module." }, { status: 500 });
  }
}
