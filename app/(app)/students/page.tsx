import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, AlertTriangle, CheckCircle2, MessageSquare, ArrowRight, Award } from "lucide-react";

export default async function StudentsPage() {
  const user = await requireUser();
  if (user.role !== "teacher") {
    redirect("/dashboard");
  }

  const [students, doubts] = await Promise.all([
    prisma.user.findMany({
      where: { role: "student" },
      include: {
        mastery: { include: { topic: true } },
        attempts: { select: { score: true } },
        _count: { select: { materials: true, quizzes: true, studentDoubts: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.lecturerDoubt.findMany({
      where: { status: "pending" },
      include: { student: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-rule/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-terracotta/10 text-terracotta">
              <Users size={16} />
            </span>
            <p className="text-xs uppercase tracking-[0.2em] text-terracotta font-semibold">
              Roster & Diagnosis
            </p>
          </div>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-ink">Class Students</h1>
          <p className="mt-1.5 text-sm text-muted max-w-2xl">
            Track individual student gap diagnostics, overall syllabus accuracy, and answer pending academic inquiries.
          </p>
        </div>

        <Link
          href="/lecturer"
          className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-xs font-semibold text-paper hover:bg-ink/90 active:scale-95 transition-all shadow-sm"
        >
          <MessageSquare size={14} className="text-terracotta" />
          <span>Pending Doubts ({doubts.length})</span>
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-rule/80 bg-white p-5 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-muted tracking-wider">Enrolled Students</p>
          <p className="font-serif text-3xl font-medium text-ink mt-1">{students.length}</p>
          <p className="text-[11px] text-muted mt-1">Class 12 Computer Science</p>
        </div>

        <div className="rounded-2xl border border-rule/80 bg-white p-5 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-forest tracking-wider">Active Diagnosed</p>
          <p className="font-serif text-3xl font-medium text-forest mt-1">
            {students.filter((s) => s.attempts.length > 0).length}
          </p>
          <p className="text-[11px] text-muted mt-1">Completed diagnostic quizzes</p>
        </div>

        <div className="rounded-2xl border border-rule/80 bg-white p-5 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-terracotta tracking-wider">Unresolved Doubts</p>
          <p className="font-serif text-3xl font-medium text-terracotta mt-1">{doubts.length}</p>
          <p className="text-[11px] text-muted mt-1">Awaiting lecturer clarification</p>
        </div>
      </div>

      {/* Students Roster */}
      <div className="rounded-3xl border border-rule/80 bg-white p-6 shadow-card">
        <h2 className="font-serif text-2xl text-ink font-medium pb-4 border-b border-rule/60">
          Student Performance Profiles
        </h2>

        <div className="divide-y divide-rule/60">
          {students.map((student) => {
            const weakCount = student.mastery.filter((m) => m.level === "weak").length;
            const strongCount = student.mastery.filter((m) => m.level === "strong").length;
            const avgScore =
              student.attempts.length > 0
                ? Math.round(
                    (student.attempts.reduce((acc, a) => acc + a.score, 0) / student.attempts.length) * 100,
                  )
                : null;

            return (
              <div
                key={student.id}
                className="py-5 flex flex-col gap-3"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-base text-ink">{student.name}</h3>
                      <span className="text-xs font-mono text-muted bg-paper px-2 py-0.5 rounded border border-rule/60">
                        {student.email}
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-1 flex items-center gap-3">
                      <span>{student.attempts.length} Diagnostic Quizzes</span>
                      <span>•</span>
                      <span>{student._count.materials} Uploaded Materials</span>
                      <span>•</span>
                      <span>{student._count.studentDoubts} Doubts Asked</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    {avgScore !== null ? (
                      <div className="text-right">
                        <span className="text-xs text-muted block">Avg Score</span>
                        <span className="font-mono text-base font-bold text-ink">{avgScore}%</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted bg-paper px-2.5 py-1 rounded-full border border-rule">
                        Not Diagnosed
                      </span>
                    )}

                    <div className="flex items-center gap-1.5">
                      {weakCount > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle size={12} />
                          {weakCount} Critical Gaps
                        </span>
                      )}
                      {strongCount > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={12} />
                          {strongCount} Mastered
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Intervention Tracking Row */}
                {weakCount > 0 && (
                  <div className="mt-1 rounded-2xl bg-paper/40 p-3.5 border border-rule/70 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-semibold text-ink flex items-center gap-1.5">
                        <span className="text-terracotta font-bold uppercase tracking-wider text-[10px]">
                          Intervention Gaps:
                        </span>
                        {student.mastery
                          .filter((m) => m.level === "weak")
                          .map((m) => m.topic.name)
                          .join(", ")}
                      </p>
                      <p className="text-muted text-[11px]">
                        Recommended Action: Assign Foundational Adaptive Drill on weak topics and review student misconceptions.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        Intervention Active
                      </span>
                      <Link
                        href="/lecturer"
                        className="text-[11px] font-semibold text-terracotta hover:underline"
                      >
                        Clarify Doubts →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
