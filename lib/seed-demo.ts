import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { ingestMaterial, rebuildTopicMap } from "./ingest";
import { generateQuiz, evaluateResponse } from "./quiz-engine";
import { rebuildMastery, buildPlan } from "./diagnosis";

const DEMO_EMAIL = "judge@gapfinder.ai";
const TEACHER_EMAIL = "teacher@gapfinder.ai";
const DEMO_PASSWORD = "Demo@123";

function sampleFiles() {
  const dir = path.join(process.cwd(), "content", "sample");
  return [
    { file: "syllabus.md", title: "CBSE Class 12 CS syllabus extract", kind: "syllabus" },
    { file: "notes-functions.md", title: "Notes: Functions, scope, recursion", kind: "notes" },
    { file: "notes-files-sql.md", title: "Notes: File handling and SQL", kind: "notes" },
    { file: "notes-networks.md", title: "Notes: Computer networks", kind: "textbook" },
    { file: "past-paper.md", title: "Sample past paper + examiner notes", kind: "past_paper" },
  ].map((item) => ({
    ...item,
    text: fs.readFileSync(path.join(dir, item.file), "utf8"),
  }));
}

export async function ensureDemoData() {
  const existing = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (existing) {
    const count = await prisma.material.count({ where: { userId: existing.id } });
    if (count > 0) return existing;
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const examDate = new Date();
  examDate.setDate(examDate.getDate() + 18);

  const student =
    existing ??
    (await prisma.user.create({
      data: {
        name: "Asha Rao",
        email: DEMO_EMAIL,
        passwordHash,
        role: "student",
        hoursPerDay: 2,
        examDate: examDate.toISOString().slice(0, 10),
      },
    }));

  await prisma.user.upsert({
    where: { email: TEACHER_EMAIL },
    update: {},
    create: {
      name: "Meera Iyer",
      email: TEACHER_EMAIL,
      passwordHash,
      role: "teacher",
      hoursPerDay: 1,
    },
  });

  for (const file of sampleFiles()) {
    await ingestMaterial({
      userId: student.id,
      title: file.title,
      kind: file.kind,
      filename: file.file,
      mimeType: "text/markdown",
      text: file.text,
      seeded: true,
    });
  }

  await rebuildTopicMap(student.id);
  const quiz = await generateQuiz(student.id);
  const questions = quiz.questions;

  const scripted = questions.map((q, i) => {
    if (q.type === "mcq") {
      const options = JSON.parse(q.options) as string[];
      const wrong = options.find((o) => o !== q.correctAnswer) ?? "";
      const miss = i % 3 !== 0;
      return {
        questionId: q.id,
        response: miss ? wrong : q.correctAnswer,
      };
    }
    const miss = i % 2 === 0;
    return {
      questionId: q.id,
      response: miss ? "I am not sure about this topic yet." : q.correctAnswer,
    };
  });

  const evaluated = [];
  for (const item of scripted) {
    const q = questions.find((x) => x.id === item.questionId)!;
    const result = await evaluateResponse(q.type, item.response, q.correctAnswer, q.explanation);
    evaluated.push({ ...item, ...result });
  }

  const correct = evaluated.filter((e) => e.isCorrect).length;
  const attempt = await prisma.attempt.create({
    data: {
      quizId: quiz.id,
      userId: student.id,
      score: questions.length ? correct / questions.length : 0,
      answers: {
        create: evaluated.map((e) => ({
          questionId: e.questionId,
          response: e.response,
          isCorrect: e.isCorrect,
          feedback: e.feedback,
        })),
      },
    },
  });

  await rebuildMastery(student.id, attempt.id);
  await buildPlan(student.id, 2, 18);
  return student;
}

export async function seedUserWithDemoCorpus(userId: string) {
  for (const file of sampleFiles()) {
    await ingestMaterial({
      userId,
      title: file.title,
      kind: file.kind,
      filename: file.file,
      mimeType: "text/markdown",
      text: file.text,
      seeded: true,
    });
  }
  await rebuildTopicMap(userId);
}

