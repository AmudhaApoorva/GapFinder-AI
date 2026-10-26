import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { evaluateResponse } from "@/lib/quiz-engine";
import { rebuildMastery, buildPlan } from "@/lib/diagnosis";
import { daysUntil } from "@/lib/utils";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const quiz = await prisma.quiz.findFirst({
    where: { id, userId: session.user.id },
    include: { questions: true },
  });
  if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

  const body = await req.json();
  const responses = body.responses as { questionId: string; response: string }[];

  const evaluated = [];
  for (const question of quiz.questions) {
    const response = responses.find((r) => r.questionId === question.id)?.response ?? "";
    const result = await evaluateResponse(
      question.type,
      response,
      question.correctAnswer,
      question.explanation,
    );
    evaluated.push({
      questionId: question.id,
      response,
      isCorrect: result.isCorrect,
      feedback: result.feedback,
    });
  }

  const score = evaluated.filter((e) => e.isCorrect).length / Math.max(evaluated.length, 1);
  const attempt = await prisma.attempt.create({
    data: {
      quizId: quiz.id,
      userId: session.user.id,
      score,
      answers: { create: evaluated },
    },
  });

  await rebuildMastery(session.user.id, attempt.id);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  await buildPlan(session.user.id, user.hoursPerDay, daysUntil(user.examDate));

  // Gamification: Award quiz completion points & correct answer points idempotently
  const { awardPoints } = await import("@/lib/gamification");
  await awardPoints(
    session.user.id,
    "quiz_completion",
    attempt.id,
    20,
    `Completed quiz: ${quiz.title}`,
  );

  const correctCount = evaluated.filter((e) => e.isCorrect).length;
  if (correctCount > 0) {
    await awardPoints(
      session.user.id,
      "correct_answer",
      `${attempt.id}_correct`,
      correctCount * 5,
      `Answered ${correctCount} question(s) correctly in ${quiz.title}.`,
    );
  }

  // Fulfill today's daily quick drill challenge if pending
  const today = new Date().toISOString().slice(0, 10);
  const drillChallenge = await prisma.dailyChallenge.findFirst({
    where: {
      userId: session.user.id,
      date: today,
      challengeKey: "quick_drill",
      completed: false,
    },
  });

  if (drillChallenge) {
    await prisma.dailyChallenge.update({
      where: { id: drillChallenge.id },
      data: {
        currentCount: 1,
        completed: true,
        completedAt: new Date(),
      },
    });

    await awardPoints(
      session.user.id,
      "daily_challenge",
      drillChallenge.id,
      drillChallenge.points,
      `Completed daily challenge: ${drillChallenge.title}`,
    );
  }

  return NextResponse.json({ attemptId: attempt.id, score });
}
