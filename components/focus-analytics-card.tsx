"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  Flame,
  CheckCircle2,
  Calendar,
  BarChart3,
  BookOpen,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Award,
  Sparkles,
} from "lucide-react";

type WeeklyDay = {
  day: string;
  date: string;
  minutes: number;
  isToday: boolean;
};

type AnalyticsData = {
  today: {
    focusMinutes: number;
    sessionsCount: number;
    answersCount: number;
    date: string;
  };
  weekly: {
    chart: WeeklyDay[];
    totalMinutes: number;
    goalMinutes: number;
    goalPct: number;
  };
  goals: {
    dailyFocusMinutes: number;
    dailySessions: number;
    dailyQuestions: number;
    weeklyFocusMinutes: number;
    focusMinutesPct: number;
    sessionsPct: number;
    questionsPct: number;
    dailyGoalMet: boolean;
  };
  gamification: {
    totalPoints: number;
    streak: number;
    longestStreak: number;
  };
  topicsStudied: {
    topicName: string;
    focusMinutes: number;
    sessionsCount: number;
  }[];
};

export function FocusAnalyticsCard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/focus-session");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to load focus analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="rounded-3xl border border-rule/80 bg-white p-6 sm:p-8 text-center text-xs text-muted">
        Loading focus analytics…
      </div>
    );
  }

  if (!data) return null;

  const maxWeeklyMinutes = Math.max(60, ...data.weekly.chart.map((d) => d.minutes));

  return (
    <div className="rounded-3xl border border-rule/80 bg-white p-6 sm:p-8 shadow-card space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-rule/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-terracotta/10 text-terracotta">
              <BarChart3 size={16} />
            </span>
            <p className="text-xs uppercase tracking-[0.2em] text-terracotta font-semibold">
              Deep Work & Focus Telemetry
            </p>
          </div>
          <h3 className="mt-2 font-serif text-2xl sm:text-3xl text-ink font-medium">
            Focus & Productivity Analytics
          </h3>
          <p className="mt-1 text-xs text-muted max-w-xl">
            Calculated strictly from verified completed focus blocks. Break periods and incomplete sessions are excluded.
          </p>
        </div>

        <Link
          href="/plan"
          className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-paper hover:bg-ink/90 active:scale-95 transition-all shadow-sm shrink-0"
        >
          <span>Open Focus Timer</span>
          <ArrowRight size={13} className="text-terracotta" />
        </Link>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-rule/80 bg-paper/40 p-4">
          <p className="text-[10px] uppercase font-bold text-muted tracking-wider">Today&apos;s Focus</p>
          <p className="font-serif text-3xl font-medium text-ink mt-1 flex items-center gap-1.5">
            {data.today.focusMinutes}
            <span className="text-sm font-sans text-muted">min</span>
          </p>
          <p className="text-[11px] text-muted mt-1">
            Goal: {data.goals.dailyFocusMinutes} min ({data.goals.focusMinutesPct}%)
          </p>
        </div>

        <div className="rounded-2xl border border-rule/80 bg-paper/40 p-4">
          <p className="text-[10px] uppercase font-bold text-terracotta tracking-wider">Completed Sprints</p>
          <p className="font-serif text-3xl font-medium text-terracotta mt-1 flex items-center gap-1.5">
            {data.today.sessionsCount}
            <span className="text-sm font-sans text-muted">blocks</span>
          </p>
          <p className="text-[11px] text-muted mt-1">
            Target: {data.goals.dailySessions} sessions ({data.goals.sessionsPct}%)
          </p>
        </div>

        <div className="rounded-2xl border border-rule/80 bg-paper/40 p-4">
          <p className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">Weekly Volume</p>
          <p className="font-serif text-3xl font-medium text-amber-700 mt-1 flex items-center gap-1.5">
            {data.weekly.totalMinutes}
            <span className="text-sm font-sans text-muted">min</span>
          </p>
          <p className="text-[11px] text-muted mt-1">
            Weekly target: {data.weekly.goalMinutes} min
          </p>
        </div>

        <div className="rounded-2xl border border-rule/80 bg-paper/40 p-4">
          <p className="text-[10px] uppercase font-bold text-forest tracking-wider">Active Streak</p>
          <p className="font-serif text-3xl font-medium text-forest mt-1 flex items-center gap-1.5">
            {data.gamification.streak}
            <span className="text-sm font-sans text-muted">days</span>
          </p>
          <p className="text-[11px] text-muted mt-1">
            Best streak: {data.gamification.longestStreak} days
          </p>
        </div>
      </div>

      {/* Weekly Study-Time Bar Chart */}
      <div className="rounded-2xl border border-rule/80 bg-white p-5">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-rule/60">
          <div>
            <h4 className="font-serif text-lg font-medium text-ink">Weekly Focus Trajectory (Mon–Sun)</h4>
            <p className="text-xs text-muted">Total focus minutes accumulated per day this week.</p>
          </div>
          <span className="text-xs font-mono font-bold text-terracotta bg-terracotta/10 px-2.5 py-1 rounded-full border border-terracotta/20">
            {data.weekly.totalMinutes} Min Total
          </span>
        </div>

        <div className="flex h-44 items-end gap-3 sm:gap-6 border-b border-rule/80 pb-2 px-2">
          {data.weekly.chart.map((d) => {
            const heightPct = Math.max(8, Math.round((d.minutes / maxWeeklyMinutes) * 100));

            return (
              <div key={d.day} className="flex flex-1 flex-col items-center justify-end h-full group">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-1.5 text-[10px] font-mono bg-ink text-paper px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
                  {d.minutes} min
                </div>
                <div
                  className={`w-full max-w-[2.5rem] rounded-t-xl transition-all duration-500 shadow-sm ${
                    d.isToday
                      ? "bg-gradient-to-t from-terracotta to-[#e2733d] ring-2 ring-terracotta/30"
                      : d.minutes > 0
                        ? "bg-gradient-to-t from-ink/80 to-ink/60"
                        : "bg-paper/80 border border-rule/60"
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
                <p className="mt-2 text-xs font-semibold text-ink">{d.day}</p>
                <p className="text-[10px] font-mono text-muted">{d.minutes}m</p>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-muted px-2">
          <span>Monday</span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-terracotta" />
            Today
          </span>
          <span>Sunday</span>
        </div>
      </div>

      {/* Topics Studied & Daily Goal Progress Split */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Topics Studied */}
        <div className="rounded-2xl border border-rule/80 bg-paper/30 p-5">
          <h4 className="font-serif text-base font-medium text-ink flex items-center gap-2">
            <BookOpen size={16} className="text-terracotta" />
            <span>Top Syllabus Topics Studied</span>
          </h4>
          <p className="text-xs text-muted mt-0.5 mb-3">
            Accumulated focus time across topic blocks.
          </p>

          <div className="space-y-2.5">
            {data.topicsStudied.map((t) => (
              <div
                key={t.topicName}
                className="rounded-xl border border-rule/60 bg-white p-3 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-semibold text-ink">{t.topicName}</p>
                  <p className="text-[10px] text-muted">{t.sessionsCount} focus session(s)</p>
                </div>
                <span className="font-mono font-bold text-ink bg-paper px-2 py-0.5 rounded border border-rule">
                  {t.focusMinutes} min
                </span>
              </div>
            ))}

            {!data.topicsStudied.length && (
              <div className="py-6 text-center text-xs text-muted">
                No topic study sessions recorded yet. Launch a Pomodoro block with a topic tag!
              </div>
            )}
          </div>
        </div>

        {/* Daily Goal Completion */}
        <div className="rounded-2xl border border-rule/80 bg-paper/30 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h4 className="font-serif text-base font-medium text-ink flex items-center gap-2">
                <CheckCircle2 size={16} className="text-forest" />
                <span>Today&apos;s Goal Progress</span>
              </h4>
              {data.goals.dailyGoalMet && (
                <span className="text-[10px] font-bold text-forest bg-forest/10 px-2 py-0.5 rounded-full border border-forest/20">
                  Target Achieved!
                </span>
              )}
            </div>
            <p className="text-xs text-muted mt-0.5 mb-3">
              Verified from active study sessions and completed quiz answers.
            </p>

            <div className="space-y-3">
              {/* Focus Minutes Goal */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold pb-1">
                  <span className="text-muted">Focus Duration</span>
                  <span className="font-mono text-ink">
                    {data.today.focusMinutes} / {data.goals.dailyFocusMinutes} min ({data.goals.focusMinutesPct}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-rule/50 overflow-hidden">
                  <div
                    className="h-full bg-terracotta rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, data.goals.focusMinutesPct)}%` }}
                  />
                </div>
              </div>

              {/* Sessions Goal */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold pb-1">
                  <span className="text-muted">Focus Sprints</span>
                  <span className="font-mono text-ink">
                    {data.today.sessionsCount} / {data.goals.dailySessions} ({data.goals.sessionsPct}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-rule/50 overflow-hidden">
                  <div
                    className="h-full bg-amber-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, data.goals.sessionsPct)}%` }}
                  />
                </div>
              </div>

              {/* Questions Goal */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold pb-1">
                  <span className="text-muted">Quiz Questions Attempted</span>
                  <span className="font-mono text-ink">
                    {data.today.answersCount} / {data.goals.dailyQuestions} ({data.goals.questionsPct}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-rule/50 overflow-hidden">
                  <div
                    className="h-full bg-forest rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, data.goals.questionsPct)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-rule/50 text-[11px] text-muted">
            Meeting all daily targets awards <span className="font-bold text-terracotta">+50 XP</span> towards your Scholar Rank.
          </div>
        </div>
      </div>
    </div>
  );
}
