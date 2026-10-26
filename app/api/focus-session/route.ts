import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { awardPoints, getFocusAnalytics } from "@/lib/gamification";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user;
    const analytics = await getFocusAnalytics(user.id);
    return NextResponse.json(analytics);
  } catch (err: any) {
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[FocusSession GET error]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user;
    const body = await req.json();

    const {
      sessionId,
      startTime,
      endTime,
      plannedMinutes = 25,
      actualDurationSeconds = 0,
      status = "completed",
      topicId,
      topicName,
    } = body;

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
    }

    const planned = Number(plannedMinutes) || 25;
    const actualSeconds = Math.max(0, Number(actualDurationSeconds) || 0);
    const durationMinutes = Math.round(actualSeconds / 60);

    // Verify completion criteria:
    // A session is only recorded as "completed" if at least 90% of the planned duration elapsed.
    const isActuallyCompleted =
      status === "completed" && actualSeconds >= planned * 60 * 0.9;
    const verifiedStatus = isActuallyCompleted ? "completed" : "abandoned";

    // Prevent recording 0-duration or near-zero accidental triggers (< 30 seconds)
    if (actualSeconds < 30) {
      return NextResponse.json({
        recorded: false,
        message: "Session too short to record (< 30 seconds).",
      });
    }

    // Check for duplicate submission using sessionId
    let focusRecord = await prisma.focusSession.findUnique({
      where: { id: sessionId },
    });

    if (!focusRecord) {
      focusRecord = await prisma.focusSession.create({
        data: {
          id: sessionId,
          userId: user.id,
          topicId: topicId || null,
          topicName: topicName || null,
          startTime: startTime ? new Date(startTime) : new Date(Date.now() - actualSeconds * 1000),
          endTime: endTime ? new Date(endTime) : new Date(),
          durationMinutes: Math.max(1, durationMinutes),
          plannedMinutes: planned,
          status: verifiedStatus,
        },
      });
    }

    let pointsAwarded = 0;

    // If genuinely completed, award focus session points
    if (verifiedStatus === "completed") {
      const awardRes = await awardPoints(
        user.id,
        "focus_session",
        sessionId,
        25,
        `Completed ${planned}-min focus session on ${topicName || "study materials"}.`,
      );
      pointsAwarded = awardRes.points;

      // Check if this fulfills today's daily focus challenge
      const today = new Date().toISOString().slice(0, 10);
      const focusChallenge = await prisma.dailyChallenge.findFirst({
        where: {
          userId: user.id,
          date: today,
          challengeKey: "focus_sprint",
          completed: false,
        },
      });

      if (focusChallenge) {
        await prisma.dailyChallenge.update({
          where: { id: focusChallenge.id },
          data: {
            currentCount: focusChallenge.currentCount + 1,
            completed: true,
            completedAt: new Date(),
          },
        });

        await awardPoints(
          user.id,
          "daily_challenge",
          focusChallenge.id,
          focusChallenge.points,
          `Completed daily challenge: ${focusChallenge.title}`,
        );
      }
    }

    return NextResponse.json({
      success: true,
      session: focusRecord,
      verifiedStatus,
      pointsAwarded,
    });
  } catch (err: any) {
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[FocusSession POST error]", err);
    return NextResponse.json({ error: "Failed to save focus session." }, { status: 500 });
  }
}
