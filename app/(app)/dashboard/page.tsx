import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { LevelBadge } from "@/components/badge";
import { GamificationHub } from "@/components/gamification-hub";
import { FocusAnalyticsCard } from "@/components/focus-analytics-card";
import {
  FolderOpen,
  Map as MapIcon,
  AlertTriangle,
  Award,
  ArrowRight,
  Zap,
  Calendar,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Users,
  Flame,
  Lightbulb,
  ShieldAlert,
  BarChart3,
  BookOpen,
} from "lucide-react";

export default async function DashboardPage() {
  const user = await requireUser();

  // -------------------------------------------------------------
  // TEACHER DASHBOARD VIEW
  // -------------------------------------------------------------
  if (user.role === "teacher") {
    const [students, topics, doubts] = await Promise.all([
      prisma.user.findMany({
        where: { role: "student" },
        include: {
          mastery: { include: { topic: true } },
          attempts: { orderBy: { createdAt: "desc" }, take: 4 },
          studentDoubts: { where: { status: "pending" } },
        },
      }),
      prisma.topic.findMany({ where: { userId: user.id } }),
      prisma.lecturerDoubt.findMany({
        where: { status: "pending" },
        include: { student: { select: { name: true } } },
        take: 5,
      }),
    ]);

    const totalDiagnosed = students.filter((s) => s.mastery.length > 0).length;

    // Identify students who need additional support (weak topics > 0 or avg score < 60%)
    const studentsNeedingSupport = students
      .map((s) => {
        const weakList = s.mastery.filter((m) => m.level === "weak");
        const avgScore =
          s.attempts.length > 0
            ? Math.round(
                (s.attempts.reduce((acc, a) => acc + a.score, 0) / s.attempts.length) * 100,
              )
            : null;
        return {
          ...s,
          weakTopics: weakList,
          avgScore,
          needsSupport: weakList.length > 0 || (avgScore !== null && avgScore < 60),
        };
      })
      .filter((s) => s.needsSupport);

    // Class-wide topic struggle frequency
    const topicStruggleMap = new Map<string, { name: string; count: number }>();
    for (const s of students) {
      for (const m of s.mastery) {
        if (m.level === "weak") {
          const current = topicStruggleMap.get(m.topic.name) ?? { name: m.topic.name, count: 0 };
          current.count += 1;
          topicStruggleMap.set(m.topic.name, current);
        }
      }
    }

    const topMisunderstood = [...topicStruggleMap.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return (
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div className="pb-4 border-b border-rule/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-terracotta/10 text-terracotta">
                <Users size={16} />
              </span>
              <p className="text-xs uppercase tracking-[0.2em] text-terracotta font-semibold">
                Teacher Analytics Portal
              </p>
            </div>
            <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-ink font-medium">
              Class Diagnostic & Intervention Hub
            </h1>
            <p className="mt-1.5 text-sm text-muted max-w-2xl">
              Monitor class-level learning gaps, track student intervention workflows, and review AI-powered pedagogical recommendations.
            </p>
          </div>

          <Link
            href="/progress"
            className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-xs font-semibold text-paper hover:bg-ink/90 active:scale-95 transition-all shadow-sm shrink-0"
          >
            <BarChart3 size={14} className="text-terracotta" />
            <span>Class Gap Heatmap</span>
          </Link>
        </div>

        {/* 4 Analytics Highlight Cards */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-rule/80 bg-white p-5 shadow-sm">
            <p className="text-[10px] uppercase font-bold text-muted tracking-wider">Class Size</p>
            <p className="font-serif text-3xl text-ink font-medium mt-1">{students.length} Students</p>
            <p className="text-[11px] text-muted mt-1">Enrolled roster</p>
          </div>
          <div className="rounded-2xl border border-rule/80 bg-white p-5 shadow-sm">
            <p className="text-[10px] uppercase font-bold text-forest tracking-wider">Diagnosed</p>
            <p className="font-serif text-3xl text-forest font-medium mt-1">{totalDiagnosed}</p>
            <p className="text-[11px] text-muted mt-1">Completed diagnostic tests</p>
          </div>
          <div className="rounded-2xl border border-rule/80 bg-white p-5 shadow-sm">
            <p className="text-[10px] uppercase font-bold text-terracotta tracking-wider">Needs Support</p>
            <p className="font-serif text-3xl text-terracotta font-medium mt-1">
              {studentsNeedingSupport.length}
            </p>
            <p className="text-[11px] text-muted mt-1">High-priority intervention</p>
          </div>
          <div className="rounded-2xl border border-rule/80 bg-white p-5 shadow-sm">
            <p className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">Pending Doubts</p>
            <p className="font-serif text-3xl text-amber-600 font-medium mt-1">{doubts.length}</p>
            <p className="text-[11px] text-muted mt-1">Awaiting your feedback</p>
          </div>
        </div>

        {/* AI-Powered Teaching Recommendations */}
        <section className="rounded-3xl border border-terracotta/30 bg-gradient-to-br from-terracotta/5 via-amber-50/40 to-white p-6 sm:p-7 shadow-card">
          <div className="flex items-center gap-2 text-terracotta font-semibold text-xs uppercase tracking-wider">
            <Sparkles size={16} />
            <span>AI-Powered Teaching Recommendations</span>
          </div>
          <h2 className="mt-2 font-serif text-2xl text-ink font-medium">
            Class Friction Points & Recommended Lesson Adjustments
          </h2>
          <p className="mt-1 text-xs text-muted max-w-2xl leading-relaxed">
            Synthesized from actual student diagnostic quiz outcomes across mapped syllabus units:
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {topMisunderstood.length > 0 ? (
              topMisunderstood.map((t, idx) => (
                <div
                  key={t.name}
                  className="rounded-2xl border border-rule/80 bg-white p-4 shadow-xs hover:border-terracotta/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-terracotta uppercase tracking-wider">
                      Priority #{idx + 1} Topic
                    </span>
                    <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                      {t.count} students struggling
                    </span>
                  </div>
                  <h3 className="mt-1 font-semibold text-sm text-ink">{t.name}</h3>
                  <p className="mt-1.5 text-xs text-muted leading-relaxed">
                    {idx === 0
                      ? "Commonly confused definitions and incomplete execution flow. Dedicate a 15-minute live step-by-step whiteboard walkthrough during next class."
                      : idx === 1
                        ? "Students stumble on application problems and edge cases. Assign targeted Foundational adaptive drills before moving to the next chapter."
                        : "Review syllabus core definitions and distinction from related units to reinforce retention."}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-rule/80 bg-white p-4 text-xs text-muted">
                Class performance is stable. Continue regular diagnostic assessments to identify emerging gaps.
              </div>
            )}

            <div className="rounded-2xl border border-dashed border-rule bg-paper/30 p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-forest uppercase tracking-wider flex items-center gap-1">
                  <Lightbulb size={13} />
                  <span>Proactive Intervention Tip</span>
                </span>
                <p className="mt-1.5 text-xs text-muted leading-relaxed">
                  Students answering in Foundational Adaptive Tier benefit most from short, 5-minute teach-back exercises and reviewing grounded citations.
                </p>
              </div>
              <Link
                href="/lecturer"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-terracotta hover:underline"
              >
                <span>Answer Pending Doubts ({doubts.length})</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </section>

        {/* Student Intervention Tracking Table */}
        <section className="rounded-3xl border border-rule/80 bg-white p-6 sm:p-7 shadow-card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-5 border-b border-rule/60">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert size={16} className="text-terracotta" />
                <h2 className="font-serif text-2xl text-ink font-medium">Student Intervention Tracker</h2>
              </div>
              <p className="text-xs text-muted mt-0.5">
                Identified learning gaps, recommended remedial actions, and progress status for students requiring support.
              </p>
            </div>
            <Link
              href="/students"
              className="text-xs font-semibold text-terracotta hover:underline inline-flex items-center gap-1"
            >
              <span>Full Student Profiles</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-rule/80 bg-paper/50 text-[11px] font-semibold text-muted uppercase tracking-wider">
                  <th className="p-3">Student</th>
                  <th className="p-3">Identified Learning Gap</th>
                  <th className="p-3">Avg Score</th>
                  <th className="p-3">Recommended Action</th>
                  <th className="p-3">Intervention Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule/60">
                {studentsNeedingSupport.length > 0 ? (
                  studentsNeedingSupport.map((s) => (
                    <tr key={s.id} className="hover:bg-paper/30 transition-colors">
                      <td className="p-3">
                        <p className="font-semibold text-xs text-ink">{s.name}</p>
                        <p className="text-[10px] text-muted font-mono">{s.email}</p>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {s.weakTopics.map((w) => (
                            <span
                              key={w.id}
                              className="text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md"
                            >
                              {w.topic.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 font-mono text-xs font-bold text-ink">
                        {s.avgScore !== null ? `${s.avgScore}%` : "—"}
                      </td>
                      <td className="p-3 text-xs text-muted max-w-xs">
                        {s.weakTopics.length > 1
                          ? "Schedule 1-on-1 concept clarification & assign foundational drills."
                          : "Review misconception explanation in Explain Tutor."}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          Action Needed
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-xs text-muted">
                      All diagnosed students are currently performing above the intervention threshold.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STUDENT DASHBOARD VIEW (PERSONALIZED LEARNING)
  // -------------------------------------------------------------
  const [materialsCount, topics, mastery, latestAttempt, plan, dbUser] = await Promise.all([
    prisma.material.count({ where: { userId: user.id } }),
    prisma.topic.findMany({ where: { userId: user.id }, orderBy: { order: "asc" } }),
    prisma.topicMastery.findMany({ where: { userId: user.id }, include: { topic: true } }),
    prisma.attempt.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.revisionPlan.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { items: { orderBy: [{ day: "asc" }, { priority: "asc" }] } },
    }),
    prisma.user.findUniqueOrThrow({ where: { id: user.id } }),
  ]);

  const weak = mastery.filter((m) => m.level === "weak");
  const strong = mastery.filter((m) => m.level === "strong");
  const nextItem = plan?.items.find((item) => !item.completed) ?? plan?.items[0];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-3xl border border-rule/80 bg-white p-6 sm:p-8 shadow-card relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-terracotta/10 via-amber-50 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-rule/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-terracotta bg-terracotta/10 px-2.5 py-1 rounded-full border border-terracotta/20">
                Personalized Learning Diagnosis
              </span>
              <span className="text-xs text-muted flex items-center gap-1 font-medium">
                <Calendar size={13} />
                Target Exam: {dbUser.examDate ?? "18 days"}
              </span>
            </div>
            <h1 className="mt-2.5 font-serif text-3xl sm:text-4xl text-ink font-medium">
              Where You Actually Stand
            </h1>
            <p className="mt-1.5 text-sm text-muted max-w-2xl leading-relaxed">
              GapFinder doesn&apos;t wait for a prompt. We diagnose your exact weaknesses from quiz answers and uploaded study notes, dynamically adapting quizzes to your learning curve.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/quiz"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-terracotta to-[#d96e38] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:brightness-110 active:scale-95 transition-all"
            >
              <Zap size={14} className="fill-current" />
              <span>Take Adaptive Quiz</span>
            </Link>
          </div>
        </div>

        {/* 4 Stat Highlights */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-paper/50 p-4 border border-rule/60">
            <p className="text-[10px] uppercase font-bold text-muted tracking-wider">Materials Indexed</p>
            <p className="font-serif text-3xl font-medium text-ink mt-1 flex items-center gap-2">
              {materialsCount}
              <FolderOpen size={16} className="text-muted" />
            </p>
            <p className="text-[11px] text-muted mt-1">Grounding syllabus & notes</p>
          </div>

          <div className="rounded-2xl bg-paper/50 p-4 border border-rule/60">
            <p className="text-[10px] uppercase font-bold text-muted tracking-wider">Topics Mapped</p>
            <p className="font-serif text-3xl font-medium text-ink mt-1 flex items-center gap-2">
              {topics.length}
              <MapIcon size={16} className="text-muted" />
            </p>
            <p className="text-[11px] text-muted mt-1">Syllabus concept nodes</p>
          </div>

          <div className="rounded-2xl bg-paper/50 p-4 border border-rule/60">
            <p className="text-[10px] uppercase font-bold text-terracotta tracking-wider">Critical Gaps</p>
            <p className="font-serif text-3xl font-medium text-terracotta mt-1 flex items-center gap-2">
              {weak.length}
              <AlertTriangle size={16} className="text-terracotta" />
            </p>
            <p className="text-[11px] text-muted mt-1">Requiring immediate attention</p>
          </div>

          <div className="rounded-2xl bg-paper/50 p-4 border border-rule/60">
            <p className="text-[10px] uppercase font-bold text-forest tracking-wider">Latest Score</p>
            <p className="font-serif text-3xl font-medium text-forest mt-1 flex items-center gap-2">
              {latestAttempt ? `${Math.round(latestAttempt.score * 100)}%` : "—"}
              <Award size={16} className="text-forest" />
            </p>
            <p className="text-[11px] text-muted mt-1">From most recent diagnostic</p>
          </div>
        </div>
      </div>

      {/* Main Two-Column Section: Weak Gaps & Adaptive Revision Plan */}
      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.85fr] items-start">
        {/* Left Column: Strengths & Weaknesses */}
        <section className="rounded-3xl border border-rule/80 bg-white p-6 sm:p-7 shadow-card space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-rule/60">
            <div>
              <h2 className="font-serif text-2xl text-ink font-medium">Topic-Wise Learning Diagnosis</h2>
              <p className="text-xs text-muted">
                Strengths, weaknesses, and learning gaps calibrated from your quiz responses.
              </p>
            </div>
            <Link href="/report" className="text-xs font-semibold text-terracotta hover:underline">
              Full Gap Report →
            </Link>
          </div>

          {/* Weak Gaps Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-700">
                Critical Knowledge Gaps ({weak.length})
              </h3>
            </div>

            <ul className="grid gap-3">
              {(weak.length ? weak : mastery.slice(0, 3)).map((item) => (
                <li
                  key={item.id}
                  className="rounded-2xl border border-rose-200/80 bg-rose-50/30 p-4 hover:border-terracotta/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-sm text-ink">{item.topic.name}</p>
                    <LevelBadge level={item.level} />
                  </div>
                  <p className="mt-1.5 text-xs text-muted leading-relaxed">{item.reason}</p>

                  <div className="mt-3 pt-2.5 border-t border-rule/40 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-muted font-mono">
                      Adaptive Difficulty: Foundation Tier
                    </span>
                    <div className="flex items-center gap-3">
                      <Link
                        href="/report"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink hover:text-terracotta transition-colors"
                      >
                        <Sparkles size={11} className="text-terracotta" />
                        <span>Interactive Studio</span>
                      </Link>
                      <Link
                        href={`/assistant?q=${encodeURIComponent(`Explain this weak gap in "${item.topic.name}": ${item.reason}`)}`}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-terracotta hover:underline"
                      >
                        <MessageSquare size={11} />
                        <span>Explain with AI</span>
                      </Link>
                    </div>
                  </div>
                </li>
              ))}

              {!mastery.length && (
                <div className="py-6 text-center text-muted">
                  <p className="text-xs">Take an adaptive diagnostic quiz to evaluate your topics.</p>
                  <Link href="/quiz" className="mt-2 inline-block text-xs font-semibold text-terracotta">
                    Take Quiz Now →
                  </Link>
                </div>
              )}
            </ul>
          </div>

          {/* Mastered Strengths Section */}
          {strong.length > 0 && (
            <div className="pt-4 border-t border-rule/50">
              <div className="flex items-center gap-2 mb-3">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Mastered Strengths ({strong.length})
                </h3>
              </div>

              <div className="grid gap-2">
                {strong.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/40 px-3.5 py-2 text-xs"
                  >
                    <span className="font-medium text-ink">{item.topic.name}</span>
                    <span className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      {Math.round(item.accuracy * 100)}% Accuracy
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Right Column: Personalized Revision Planner */}
        <section className="rounded-3xl bg-gradient-to-br from-ink to-[#221c17] p-6 sm:p-7 text-paper shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-terracotta font-semibold text-xs uppercase tracking-wider">
              <Flame size={14} className="fill-current" />
              <span>Personalized Revision Planner</span>
            </div>
            <h2 className="mt-2 font-serif text-2xl text-paper font-medium">
              {nextItem ? nextItem.topicName : "Calibrate Revision Plan"}
            </h2>

            {nextItem ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm leading-relaxed text-[#d8cfc1]">{nextItem.activity}</p>
                <div className="flex items-center gap-3 text-xs text-paper/80 pt-2">
                  <span className="bg-white/10 px-2.5 py-1 rounded-md">Day {nextItem.day}</span>
                  <span className="bg-white/10 px-2.5 py-1 rounded-md">{nextItem.minutes} minutes</span>
                  <LevelBadge level={nextItem.priority} />
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-[#d8cfc1]">
                Complete your diagnostic quiz to unlock an adaptive, day-by-day revision schedule prioritizing weak topics.
              </p>
            )}
          </div>

          <div className="mt-8 pt-4 border-t border-white/10 flex flex-wrap gap-2.5">
            <Link
              href="/plan"
              className="rounded-xl bg-terracotta px-4 py-2 text-xs font-semibold text-white hover:brightness-110 active:scale-95 transition-all shadow-sm"
            >
              Open Revision Plan
            </Link>
            <Link
              href="/quiz"
              className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-paper hover:bg-white/10 active:scale-95 transition-all"
            >
              Adaptive Quiz
            </Link>
          </div>
        </section>
      </div>

      {/* Gamified Study Zone: Daily Challenges, Badges, Streaks & Rewards */}
      <GamificationHub />

      {/* Focus & Productivity Analytics: Weekly Chart, Today's Focus & Goals */}
      <FocusAnalyticsCard />
    </div>
  );
}
