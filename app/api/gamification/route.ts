import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  BADGE_DEFINITIONS,
  calculateStreak,
  getOrCreateDailyChallenges,
  getStudyGoals,
  checkAndAwardBadges,
} from "@/lib/gamification";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user;

    // Check for any newly eligible badges before returning state
    await checkAndAwardBadges(user.id);

    const [
      challenges,
      goals,
      rewards,
      userBadges,
      streak,
    ] = await Promise.all([
      getOrCreateDailyChallenges(user.id),
      getStudyGoals(user.id),
      prisma.rewardEvent.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
      prisma.userBadge.findMany({
        where: { userId: user.id },
        orderBy: { earnedAt: "desc" },
      }),
      calculateStreak(user.id),
    ]);

    const totalPoints = rewards.reduce((acc, r) => acc + r.points, 0);
    const allTotal = await prisma.rewardEvent.aggregate({
      where: { userId: user.id },
      _sum: { points: true },
    });

    const earnedKeys = new Set(userBadges.map((b) => b.badgeKey));
    const allBadges = BADGE_DEFINITIONS.map((b) => ({
      ...b,
      unlocked: earnedKeys.has(b.key),
      earnedAt: userBadges.find((ub) => ub.badgeKey === b.key)?.earnedAt ?? null,
    }));

    return NextResponse.json({
      points: allTotal._sum.points || 0,
      streak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      badges: allBadges,
      challenges,
      goals,
      recentRewards: rewards,
    });
  } catch (err: any) {
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Gamification GET error]", err);
    return NextResponse.json({ error: "Failed to load gamification data." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user;
    const body = await req.json();

    const { action } = body;

    // Update study goals
    if (action === "update_goals") {
      const { dailyFocusMinutes, dailySessions, dailyQuestions, weeklyFocusMinutes } = body;

      const updated = await prisma.studyGoal.upsert({
        where: { userId: user.id },
        update: {
          dailyFocusMinutes: Number(dailyFocusMinutes) || 50,
          dailySessions: Number(dailySessions) || 2,
          dailyQuestions: Number(dailyQuestions) || 5,
          weeklyFocusMinutes: Number(weeklyFocusMinutes) || 300,
        },
        create: {
          userId: user.id,
          dailyFocusMinutes: Number(dailyFocusMinutes) || 50,
          dailySessions: Number(dailySessions) || 2,
          dailyQuestions: Number(dailyQuestions) || 5,
          weeklyFocusMinutes: Number(weeklyFocusMinutes) || 300,
        },
      });

      return NextResponse.json({ success: true, goals: updated });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Gamification POST error]", err);
    return NextResponse.json({ error: "Failed to process gamification request." }, { status: 500 });
  }
}
