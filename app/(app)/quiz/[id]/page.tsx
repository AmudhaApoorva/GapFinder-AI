import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { QuizForm } from "./quiz-form";
import { ArrowLeft, ClipboardCheck, ShieldCheck } from "lucide-react";

export default async function QuizSitPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const quiz = await prisma.quiz.findFirst({
    where: { id, userId: user.id },
    include: { questions: { include: { topic: true } } },
  });
  if (!quiz) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/quiz"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink transition-colors mb-4"
      >
        <ArrowLeft size={14} />
        <span>Back to Diagnostic Quizzes</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-rule/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-terracotta/10 text-terracotta">
              <ClipboardCheck size={16} />
            </span>
            <p className="text-xs uppercase tracking-[0.2em] text-terracotta font-semibold">
              Grounded Assessment
            </p>
          </div>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-ink font-medium">{quiz.title}</h1>
          <p className="mt-1.5 text-sm text-muted">
            Answer from memory. Every question is scored strictly against your uploaded syllabus & notes, preserving citations.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 shrink-0">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>Citation-Grounded</span>
        </div>
      </div>

      <QuizForm
        quizId={quiz.id}
        questions={quiz.questions.map((q) => ({
          id: q.id,
          prompt: q.prompt,
          type: q.type,
          options: JSON.parse(q.options) as string[],
          topic: q.topic.name,
        }))}
      />
    </div>
  );
}
