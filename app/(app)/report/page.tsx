import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { ReportView } from "./report-view";
import { BookOpen } from "lucide-react";

export default async function ReportPage() {
  const user = await requireUser();
  const [mastery, attempt] = await Promise.all([
    prisma.topicMastery.findMany({
      where: { userId: user.id },
      include: {
        topic: { select: { id: true, name: true, sourceRef: true } },
      },
      orderBy: { accuracy: "asc" },
    }),
    prisma.attempt.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        quiz: { select: { title: true } },
        answers: {
          include: {
            question: {
              include: {
                topic: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-rule/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-terracotta/10 text-terracotta">
              <BookOpen size={16} />
            </span>
            <p className="text-xs uppercase tracking-[0.2em] text-terracotta font-semibold">
              Diagnostic Intelligence
            </p>
          </div>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-ink">Syllabus Gap Report</h1>
          <p className="mt-1.5 text-sm text-muted max-w-2xl">
            Topic ratings are computed from diagnostic evaluation outcomes. Each score carries an exact reason grounded in your notes rather than arbitrary percentages.
          </p>
        </div>
      </div>

      <ReportView mastery={mastery} attempt={attempt} />
    </div>
  );
}
