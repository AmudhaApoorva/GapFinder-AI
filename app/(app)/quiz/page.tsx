import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { GenerateQuiz } from "./generate-quiz";
import { ClipboardCheck, ArrowRight, Award, CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";

export default async function QuizPage() {
  const user = await requireUser();
  const [quizzes, topics] = await Promise.all([
    prisma.quiz.findMany({
      where: { userId: user.id },
      include: {
        _count: { select: { questions: true, attempts: true } },
        attempts: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.topic.findMany({
      where: { userId: user.id },
      select: { id: true, name: true },
      orderBy: { order: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-rule/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-terracotta/10 text-terracotta">
              <ClipboardCheck size={16} />
            </span>
            <p className="text-xs uppercase tracking-[0.2em] text-terracotta font-semibold">
              Assessment Engine
            </p>
          </div>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-ink">Diagnostic Quizzes</h1>
          <p className="mt-1.5 text-sm text-muted max-w-2xl">
            Questions are generated strictly from retrieved chunks of your syllabus, notes, and past papers. Every question retains a verified citation.
          </p>
        </div>
        <GenerateQuiz topics={topics} />
      </div>

      {/* Quizzes List */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-2xl text-ink">Assessment History</h2>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-paper border border-rule text-muted">
            {quizzes.length} {quizzes.length === 1 ? "quiz" : "quizzes"}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {quizzes.map((quiz) => {
            const lastAttempt = quiz.attempts[0];
            const scorePct = lastAttempt ? Math.round(lastAttempt.score * 100) : null;

            return (
              <div
                key={quiz.id}
                className="flex flex-col justify-between rounded-2xl border border-rule/80 bg-white p-5 shadow-sm hover:shadow-card transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted font-medium">
                      {new Date(quiz.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    {scorePct !== null ? (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          scorePct >= 70
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : scorePct >= 50
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        <Award size={12} />
                        Score: {scorePct}%
                      </span>
                    ) : (
                      <span className="text-xs text-muted bg-paper px-2 py-0.5 rounded-full border border-rule">
                        Pending
                      </span>
                    )}
                  </div>

                  <h3 className="mt-2 font-serif text-xl font-medium text-ink">{quiz.title}</h3>
                  <p className="mt-1 text-xs text-muted flex items-center gap-2">
                    <span>{quiz._count.questions} questions</span>
                    <span>•</span>
                    <span>{quiz._count.attempts} attempt(s)</span>
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-rule/60 flex items-center justify-between">
                  {lastAttempt ? (
                    <Link
                      href="/report"
                      className="text-xs font-medium text-terracotta hover:underline"
                    >
                      View Report Breakdown
                    </Link>
                  ) : (
                    <span className="text-xs text-muted">Ready to begin</span>
                  )}

                  <Link
                    href={`/quiz/${quiz.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-paper hover:bg-ink/90 active:scale-95 transition-all shadow-sm"
                  >
                    <span>{lastAttempt ? "Retake Quiz" : "Sit This Quiz"}</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            );
          })}

          {!quizzes.length && (
            <div className="col-span-2 rounded-2xl border border-dashed border-rule bg-white/60 p-12 text-center">
              <ClipboardCheck className="mx-auto h-10 w-10 text-muted/60" />
              <h3 className="mt-3 font-serif text-xl text-ink">No diagnostic quizzes yet</h3>
              <p className="mt-1 text-sm text-muted max-w-md mx-auto">
                Generate your first grounded diagnostic quiz to identify your weak syllabus topics.
              </p>
              <div className="mt-5 flex justify-center">
                <GenerateQuiz topics={topics} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
