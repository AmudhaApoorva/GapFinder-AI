import { z } from "zod";
import { prisma } from "./db";
import { generateJson, hasGenerationKey } from "./ai";
import { retrieveChunks } from "./retrieve";
import { embedQuery } from "./embeddings";

const quizSchema = z.object({
  questions: z.array(
    z.object({
      prompt: z.string(),
      type: z.enum(["mcq", "short"]),
      options: z.array(z.string()).default([]),
      correctAnswer: z.string(),
      explanation: z.string(),
    }),
  ),
});

function extractKeyPhrase(text: string) {
  const sentences = text
    .replace(/```[\s\S]*?```/g, " ")
    .split(/(?<=[.?:])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40 && s.length < 220 && !s.startsWith("#"));
  return sentences[0] ?? text.slice(0, 160);
}

function heuristicQuestions(
  topicName: string,
  section: string,
  title: string,
  excerpt: string,
) {
  const sentence = extractKeyPhrase(excerpt);
  const words = sentence.split(" ").filter((w) => w.length > 5);
  const blank = words[Math.min(2, words.length - 1)] ?? topicName;
  const stem = sentence.replace(blank, "______");
  return [
    {
      prompt: `From ${section}: ${stem}`,
      type: "mcq" as const,
      options: [blank.replace(/[^a-zA-Z0-9]/g, ""), topicName, "None of these", "All of these"].slice(0, 4),
      correctAnswer: blank.replace(/[^a-zA-Z0-9]/g, "") || blank,
      explanation: `Grounded in ${title} (${section}): ${sentence}`,
    },
    {
      prompt: `In one or two sentences, explain this idea from your notes on ${topicName}: "${sentence.slice(0, 140)}"`,
      type: "short" as const,
      options: [],
      correctAnswer: sentence,
      explanation: `A complete answer should mention the same idea as ${title} — ${section}.`,
    },
  ];
}

export async function generateQuiz(
  userId: string,
  options?: { topicId?: string; title?: string },
) {
  const topics = await prisma.topic.findMany({
    where: { userId },
    include: { mastery: { where: { userId } } },
    orderBy: { order: "asc" },
  });
  if (!topics.length) throw new Error("Build a topic map before generating a quiz.");

  let selected: typeof topics = [];
  let quizTitle = options?.title;

  if (options?.topicId) {
    const single = topics.find((t) => t.id === options.topicId);
    if (!single) throw new Error("Topic not found.");
    selected = [single];
    quizTitle = quizTitle || `Topic Drill: ${single.name}`;
  } else {
    // Smart prioritization: prioritize weak topics first, then unrated/medium
    const sorted = [...topics].sort((a, b) => {
      const aLevel = a.mastery[0]?.level ?? "unrated";
      const bLevel = b.mastery[0]?.level ?? "unrated";
      const weights: Record<string, number> = { weak: 0, unrated: 1, medium: 2, strong: 3 };
      return (weights[aLevel] ?? 2) - (weights[bLevel] ?? 2);
    });
    selected = sorted.slice(0, 8);
    quizTitle =
      quizTitle ||
      `Diagnostic ${new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`;
  }

  const queryEmbedding = await embedQuery(selected.map((t) => t.name).join("; "));
  const created = await prisma.quiz.create({
    data: {
      userId,
      title: quizTitle,
      topicId: options?.topicId ?? null,
    },
  });

  const isSingleDrill = Boolean(options?.topicId);

  for (const topic of selected) {
    const topicMastery = topic.mastery[0];
    const accuracy = topicMastery?.accuracy ?? 0;
    const currentLevel = topicMastery?.level ?? "unrated";

    // Adaptive Difficulty Tier:
    // Foundation (<50% or weak): core definitions, basic syntax, guided hints
    // Intermediate (50-80% or medium): code output, conceptual differences, application
    // Advanced (>80% or strong): multi-step synthesis, edge cases, trade-offs
    const adaptiveTier =
      currentLevel === "weak" || accuracy < 0.5
        ? "Foundation"
        : currentLevel === "strong" || accuracy >= 0.8
          ? "Advanced"
          : "Intermediate";

    const chunks = await retrieveChunks(
      userId,
      `${topic.name} ${topic.description}`,
      isSingleDrill ? 6 : 4,
      queryEmbedding,
    );
    const top = chunks[0];
    if (!top) continue;

    type QuizItem = {
      prompt: string;
      type: "mcq" | "short";
      options: string[];
      correctAnswer: string;
      explanation: string;
    };
    let questions: QuizItem[] = heuristicQuestions(topic.name, top.section, top.title, top.content);

    if (hasGenerationKey()) {
      const count = isSingleDrill ? 4 : 2;
      const tierGuideline =
        adaptiveTier === "Foundation"
          ? "Target difficulty: FOUNDATION. Focus on core definitions, basic mechanics, syntax building blocks, and direct conceptual identification. Avoid obscure tricks."
          : adaptiveTier === "Advanced"
            ? "Target difficulty: ADVANCED. Focus on multi-step reasoning, tricky edge cases, output tracing, and synthesizing concepts under exam constraints."
            : "Target difficulty: INTERMEDIATE. Focus on practical application, code comprehension, and distinguishing similar ideas.";

      const generated = await generateJson(
        quizSchema,
        `You write adaptive exam questions ONLY from the retrieved notes. Every question must be answerable from the context.
${tierGuideline}
Include a short citation-backed explanation. Do not use outside knowledge. Prefer CBSE-style wording. Create ${count} questions: ${isSingleDrill ? "2-3 MCQs with 4 options and 1-2 short answers" : "one MCQ with 4 options and one short answer"}.`,
        `Topic: ${topic.name} (Student Adaptive Tier: ${adaptiveTier})\nRetrieved context:\n${chunks.map((c, i) => `[${i + 1}] ${c.title} / ${c.section}\n${c.content}`).join("\n\n")}`,
      );
      if (generated?.questions?.length) {
        questions = generated.questions.slice(0, count).map((q) => ({
          prompt: `[${adaptiveTier}] ${q.prompt}`,
          type: q.type,
          options: q.type === "mcq" ? (q.options ?? []).slice(0, 4) : [],
          correctAnswer: q.correctAnswer,
          explanation: `[Adaptive Level: ${adaptiveTier}] ${q.explanation}`,
        }));
      }
    }

    await prisma.question.createMany({
      data: questions.map((q) => ({
        quizId: created.id,
        topicId: topic.id,
        prompt: q.prompt,
        type: q.type,
        options: JSON.stringify(q.options),
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        citationTitle: top.title,
        citationSection: top.section,
        citationExcerpt: top.content.slice(0, 280),
      })),
    });
  }

  return prisma.quiz.findUniqueOrThrow({
    where: { id: created.id },
    include: { questions: { include: { topic: true } } },
  });
}

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function overlapScore(answer: string, expected: string) {
  const a = new Set(normalize(answer).split(" ").filter((w) => w.length > 3));
  const b = new Set(normalize(expected).split(" ").filter((w) => w.length > 3));
  if (!a.size || !b.size) return 0;
  let hit = 0;
  for (const w of a) if (b.has(w)) hit += 1;
  return hit / b.size;
}

export async function evaluateResponse(
  type: string,
  response: string,
  correct: string,
  explanation: string,
) {
  if (type === "mcq") {
    const ok = normalize(response) === normalize(correct);
    return {
      isCorrect: ok,
      feedback: ok
        ? `Correct. ${explanation}`
        : `Not quite. The expected choice was "${correct}". ${explanation}`,
    };
  }

  const score = overlapScore(response, `${correct} ${explanation}`);
  const isCorrect = score >= 0.35 && normalize(response).split(" ").length >= 4;

  if (hasGenerationKey()) {
    const judged = await generateJson(
      z.object({
        isCorrect: z.boolean(),
        feedback: z.string(),
      }),
      "You are a strict but fair board examiner. Judge using the source explanation only. If the student missed a key term from the notes, mark incorrect. Explain why in two sentences and cite the idea, not the internet.",
      `Expected idea: ${correct}\nTeacher explanation: ${explanation}\nStudent answer: ${response}`,
    );
    if (judged) return judged;
  }

  return {
    isCorrect,
    feedback: isCorrect
      ? `Your answer covers the key idea. ${explanation}`
      : `The notes expect this idea: ${correct}. ${explanation}`,
  };
}
