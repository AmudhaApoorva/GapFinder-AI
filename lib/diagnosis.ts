import { z } from "zod";
import { prisma } from "./db";
import { generateJson, hasGenerationKey } from "./ai";
import { masteryFromAccuracy } from "./utils";

export async function rebuildMastery(userId: string, attemptId: string) {
  const attempt = await prisma.attempt.findUniqueOrThrow({
    where: { id: attemptId },
    include: {
      answers: { include: { question: { include: { topic: true } } } },
    },
  });

  const byTopic = new Map<
    string,
    { name: string; correct: number; total: number; misses: string[] }
  >();

  for (const answer of attempt.answers) {
    const topic = answer.question.topic;
    const row = byTopic.get(topic.id) ?? {
      name: topic.name,
      correct: 0,
      total: 0,
      misses: [],
    };
    row.total += 1;
    if (answer.isCorrect) row.correct += 1;
    else row.misses.push(answer.question.prompt.slice(0, 120));
    byTopic.set(topic.id, row);
  }

  for (const [topicId, row] of byTopic) {
    const accuracy = row.total ? row.correct / row.total : 0;
    const level = masteryFromAccuracy(accuracy);
    const reason =
      level === "strong"
        ? `Answered ${row.correct}/${row.total} correctly. Keep a short recap only.`
        : `Accuracy ${(accuracy * 100).toFixed(0)}% on ${row.name}. Missed: ${row.misses.slice(0, 2).join(" | ") || "incomplete answers"}.`;

    await prisma.topicMastery.upsert({
      where: { userId_topicId: { userId, topicId } },
      update: { level, accuracy, reason },
      create: { userId, topicId, level, accuracy, reason },
    });
  }

  if (hasGenerationKey()) {
    const snapshot = [...byTopic.entries()].map(([id, row]) => ({
      id,
      ...row,
    }));
    const polished = await generateJson(
      z.object({
        items: z.array(z.object({ topicId: z.string(), reason: z.string() })),
      }),
      "Write a short diagnostic reason for each topic using only the quiz outcomes. No generic advice. Mention what the student got wrong.",
      JSON.stringify(snapshot),
    );
    if (polished) {
      for (const item of polished.items) {
        await prisma.topicMastery.updateMany({
          where: { userId, topicId: item.topicId },
          data: { reason: item.reason },
        });
      }
    }
  }
}

export async function buildPlan(userId: string, hoursPerDay: number, daysUntilExam: number) {
  const mastery = await prisma.topicMastery.findMany({
    where: { userId },
    include: { topic: true },
  });
  const topics = await prisma.topic.findMany({ where: { userId }, orderBy: { order: "asc" } });

  const rows = topics.map((topic) => {
    const m = mastery.find((x) => x.topicId === topic.id);
    const level = m?.level ?? "medium";
    const minutes = level === "weak" ? 50 : level === "medium" ? 30 : 15;
    return {
      topic,
      level,
      minutes,
      reason: m?.reason ?? "Not diagnosed yet — treat as medium priority until a quiz is taken.",
    };
  });

  rows.sort((a, b) => {
    const rank = { weak: 0, medium: 1, strong: 2 } as const;
    return rank[a.level as keyof typeof rank] - rank[b.level as keyof typeof rank];
  });

  const dailyCap = Math.max(30, Math.round(hoursPerDay * 60));
  const items: {
    topicId: string;
    topicName: string;
    day: number;
    minutes: number;
    priority: string;
    activity: string;
    why: string;
  }[] = [];

  let day = 1;
  let used = 0;
  for (const row of rows) {
    if (day > daysUntilExam) break;
    if (used + row.minutes > dailyCap) {
      day += 1;
      used = 0;
    }
    if (day > daysUntilExam) break;
    const activity =
      row.level === "weak"
        ? "Re-read cited notes, then 8 retrieval questions, then a 10-minute recap."
        : row.level === "medium"
          ? "Mixed practice from past-paper style items and a short teach-back."
          : "Spaced recap: 5 flash facts and 1 past-paper item.";
    items.push({
      topicId: row.topic.id,
      topicName: row.topic.name,
      day,
      minutes: row.minutes,
      priority: row.level,
      activity,
      why: row.reason,
    });
    used += row.minutes;
  }

  let summary = `Focus the next ${Math.min(daysUntilExam, items.at(-1)?.day ?? daysUntilExam)} day(s) on weak topics first. ${hoursPerDay} hour(s)/day budget.`;
  if (hasGenerationKey()) {
    const generated = await generateJson(
      z.object({ summary: z.string() }),
      "Write a 3-sentence revision plan summary for a Class 12 student. Be specific about weak topics. Do not invent topics.",
      JSON.stringify({ daysUntilExam, hoursPerDay, items }),
    );
    if (generated?.summary) summary = generated.summary;
  }

  await prisma.revisionPlan.deleteMany({ where: { userId } });
  const plan = await prisma.revisionPlan.create({
    data: {
      userId,
      hoursAvailable: hoursPerDay,
      daysUntilExam,
      summary,
      items: { create: items },
    },
    include: { items: { orderBy: { day: "asc" } } },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { hoursPerDay },
  });

  return plan;
}
