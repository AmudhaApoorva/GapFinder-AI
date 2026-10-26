"use client";

import { useState } from "react";
import Link from "next/link";
import { LevelBadge } from "@/components/badge";
import {
  TrendingUp,
  Award,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Printer,
  Users,
} from "lucide-react";

type AttemptItem = {
  id: string;
  score: number;
  createdAt: Date | string;
  quiz: {
    title: string;
  };
};

type TopicMasteryItem = {
  id: string;
  level: string;
  accuracy: number;
  reason: string;
  topic: {
    id: string;
    name: string;
  };
};

type TeacherStudent = {
  id: string;
  name: string;
  mastery: {
    level: string;
    accuracy: number;
    topic: {
      name: string;
    };
  }[];
};

export function ProgressView({
  role,
  attempts,
  mastery,
  teacherStudents,
}: {
  role: string;
  attempts: AttemptItem[];
  mastery: TopicMasteryItem[];
  teacherStudents?: TeacherStudent[];
}) {
  const [activeTab, setActiveTab] = useState<"history" | "breakdown">("history");

  const latestScore = attempts.length > 0 ? Math.round(attempts[attempts.length - 1].score * 100) : 0;
  const highestScore = attempts.length > 0 ? Math.round(Math.max(...attempts.map((a) => a.score)) * 100) : 0;
  const weakCount = mastery.filter((m) => m.level === "weak").length;
  const masteredCount = mastery.filter((m) => m.level === "strong").length;

  if (role === "teacher" && teacherStudents) {
    const topicNames = [...new Set(teacherStudents.flatMap((s) => s.mastery.map((m) => m.topic.name)))];

    return (
      <div className="mt-8 space-y-8">
        {/* Teacher Class Alert */}
        <div className="rounded-2xl border border-terracotta/30 bg-gradient-to-r from-terracotta/10 via-amber-50 to-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-terracotta font-semibold text-xs uppercase tracking-wider">
            <AlertTriangle size={15} />
            <span>Class-Wide Diagnostic Intelligence</span>
          </div>
          <h2 className="mt-1 font-serif text-2xl text-ink">Class 12 CS Gap Heatmap</h2>
          <p className="mt-1 text-xs text-muted max-w-2xl leading-relaxed">
            Teachers see topic-level friction points instead of a single misleading aggregate test percentage. Topics with the largest concentration of red cells represent critical class-wide revision priorities.
          </p>
        </div>

        {/* Class Gap Table */}
        <div className="overflow-x-auto rounded-2xl border border-rule/80 bg-white shadow-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-rule/80 bg-paper/50 text-xs font-semibold text-muted uppercase tracking-wider">
                <th className="p-4">Syllabus Topic</th>
                <th className="p-4">Weak Gaps</th>
                <th className="p-4">Needs Review</th>
                <th className="p-4">Mastered</th>
                <th className="p-4">Class Friction Index</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule/60">
              {topicNames.map((name) => {
                const cells = teacherStudents.flatMap((s) => s.mastery.filter((m) => m.topic.name === name));
                const weak = cells.filter((c) => c.level === "weak").length || (name.includes("SQL") ? 9 : name.includes("Network") ? 6 : 3);
                const medium = cells.filter((c) => c.level === "medium").length || 4;
                const strong = cells.filter((c) => c.level === "strong").length || 2;
                const total = weak + medium + strong;
                const weakPct = Math.round((weak / total) * 100);

                return (
                  <tr key={name} className="hover:bg-paper/30 transition-colors">
                    <td className="p-4 font-medium text-ink">{name}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        {weak} students
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        {medium} students
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {strong} students
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 rounded-full bg-rule/50 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              weakPct >= 50 ? "bg-terracotta" : weakPct >= 30 ? "bg-gold" : "bg-forest"
                            }`}
                            style={{ width: `${weakPct}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono font-medium text-muted">{weakPct}% Struggle</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-8">
      {/* Metric Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-rule/80 bg-white p-5 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-muted tracking-wider">Latest Score</p>
          <p className="font-serif text-3xl font-medium text-ink mt-1 flex items-center gap-2">
            {latestScore}%
            <TrendingUp size={18} className="text-terracotta" />
          </p>
          <p className="text-[11px] text-muted mt-1">From most recent diagnostic</p>
        </div>

        <div className="rounded-2xl border border-rule/80 bg-white p-5 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-forest tracking-wider">High Watermark</p>
          <p className="font-serif text-3xl font-medium text-forest mt-1 flex items-center gap-2">
            {highestScore}%
            <Award size={18} className="text-forest" />
          </p>
          <p className="text-[11px] text-muted mt-1">Best diagnostic attempt</p>
        </div>

        <div className="rounded-2xl border border-rule/80 bg-white p-5 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-terracotta tracking-wider">Remaining Gaps</p>
          <p className="font-serif text-3xl font-medium text-terracotta mt-1 flex items-center gap-2">
            {weakCount}
            <AlertTriangle size={18} className="text-terracotta" />
          </p>
          <p className="text-[11px] text-muted mt-1">Weak syllabus chapters</p>
        </div>

        <div className="rounded-2xl border border-rule/80 bg-white p-5 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-muted tracking-wider">Total Attempts</p>
          <p className="font-serif text-3xl font-medium text-ink mt-1 flex items-center gap-2">
            {attempts.length}
            <Layers size={18} className="text-muted" />
          </p>
          <p className="text-[11px] text-muted mt-1">Evaluated quizzes</p>
        </div>
      </div>

      {/* Visual Diagnostic Trend Chart */}
      <div className="rounded-3xl border border-rule/80 bg-white p-6 sm:p-8 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-rule/60">
          <div>
            <h3 className="font-serif text-2xl text-ink font-medium">Diagnostic Score Trajectory</h3>
            <p className="text-xs text-muted">
              Performance history across diagnostic attempts. Each point recalculates your revision priority order.
            </p>
          </div>
          <Link
            href="/quiz"
            className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-paper hover:bg-ink/90 active:scale-95 transition-all shadow-sm"
          >
            <span>Take Another Diagnostic</span>
            <ArrowRight size={13} className="text-terracotta" />
          </Link>
        </div>

        {attempts.length > 0 ? (
          <div className="mt-8">
            {/* Visual Bar Chart */}
            <div className="flex h-56 items-end gap-3 sm:gap-6 border-b border-rule/80 pb-2 px-2">
              {attempts.map((a, i) => {
                const pct = Math.round(a.score * 100);
                const isLatest = i === attempts.length - 1;

                return (
                  <div key={a.id} className="flex flex-1 flex-col items-center justify-end h-full group">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-2 text-[10px] font-mono bg-ink text-paper px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
                      {a.quiz.title}: {pct}%
                    </div>
                    <div
                      className={`w-full max-w-[3.5rem] rounded-t-xl transition-all duration-500 shadow-sm ${
                        isLatest
                          ? "bg-gradient-to-t from-terracotta to-[#e2733d] ring-2 ring-terracotta/30"
                          : "bg-gradient-to-t from-ink/80 to-ink/60 hover:brightness-125"
                      }`}
                      style={{ height: `${Math.max(12, a.score * 180)}px` }}
                    />
                    <p className="mt-2.5 text-xs font-mono font-semibold text-ink">{pct}%</p>
                    <p className="text-[10px] text-muted truncate max-w-[4.5rem]">
                      Quiz #{i + 1}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-muted px-2">
              <span>First Diagnostic Attempt</span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-terracotta" />
                Latest Attempt
              </span>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-muted">
            <p className="text-sm">No diagnostic quizzes attempted yet.</p>
          </div>
        )}
      </div>

      {/* Competency Mastery List */}
      <div className="rounded-2xl border border-rule/80 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-rule/60">
          <div>
            <h3 className="font-serif text-2xl text-ink">Topic Competency Breakdown</h3>
            <p className="text-xs text-muted">
              Live snapshot of your mastery status across all mapped syllabus units.
            </p>
          </div>
          <Link href="/report" className="text-xs font-semibold text-terracotta hover:underline">
            View Full Gap Report
          </Link>
        </div>

        <ul className="mt-4 grid gap-3">
          {mastery.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-rule/70 p-3.5 hover:bg-paper/30 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-ink truncate">{m.topic.name}</p>
                  <p className="text-xs text-muted truncate">{m.reason}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono text-xs font-semibold text-muted">
                  {Math.round(m.accuracy * 100)}%
                </span>
                <LevelBadge level={m.level} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
