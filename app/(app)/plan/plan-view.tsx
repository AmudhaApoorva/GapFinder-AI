"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LevelBadge } from "@/components/badge";
import { PomodoroTimer } from "@/components/pomodoro-timer";
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  MessageSquare,
  AlertTriangle,
  Flame,
  Check,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

type PlanItemData = {
  id: string;
  topicId: string | null;
  topicName: string;
  day: number;
  minutes: number;
  priority: string;
  activity: string;
  why: string;
  completed: boolean;
};

type PlanData = {
  id: string;
  hoursAvailable: number;
  daysUntilExam: number;
  summary: string;
  items: PlanItemData[];
};

export function PlanView({
  plan,
  initialHours,
  initialExamDate,
}: {
  plan: PlanData | null;
  initialHours: number;
  initialExamDate: string | null;
}) {
  const router = useRouter();
  const [items, setItems] = useState<PlanItemData[]>(plan?.items ?? []);
  const [hoursPerDay, setHoursPerDay] = useState(initialHours);
  const [examDate, setExamDate] = useState(initialExamDate ?? "");
  const [rebuilding, setRebuilding] = useState(false);

  // Focus Timer State (25 min session)
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [activeTaskTitle, setActiveTaskTitle] = useState<string | null>(null);

  // Handle task completion toggle
  async function toggleComplete(itemId: string, currentVal: boolean) {
    const newVal = !currentVal;
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, completed: newVal } : item)),
    );

    try {
      await fetch("/api/plan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId, completed: newVal }),
      });
    } catch {
      // Revert on error
      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, completed: currentVal } : item)),
      );
    }
  }

  // Handle plan regeneration
  async function handleRebuild(e: React.FormEvent) {
    e.preventDefault();
    setRebuilding(true);
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hoursPerDay, examDate }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        alert("Could not update plan.");
      }
    } catch {
      alert("Error building revision plan.");
    } finally {
      setRebuilding(false);
    }
  }

  // Timer controls
  const toggleTimer = (taskName?: string) => {
    if (taskName) setActiveTaskTitle(taskName);
    setTimerRunning(!timerRunning);
  };

  const resetTimer = () => {
    setTimerRunning(false);
    setTimerSeconds(25 * 60);
  };

  // Group items by Day
  const byDay = new Map<number, PlanItemData[]>();
  for (const item of items) {
    const list = byDay.get(item.day) ?? [];
    list.push(item);
    byDay.set(item.day, list);
  }

  const completedCount = items.filter((i) => i.completed).length;
  const totalTasks = items.length;
  const overallPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  return (
    <div className="mt-8 space-y-8">
      {/* Plan Header Card */}
      <div className="rounded-3xl border border-rule/80 bg-white p-6 sm:p-8 shadow-card relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-rule/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-terracotta bg-terracotta/10 px-2.5 py-1 rounded-full border border-terracotta/20">
                Grounded Revision Strategy
              </span>
              <span className="text-xs text-muted flex items-center gap-1">
                <Calendar size={13} />
                {plan?.daysUntilExam ?? 18} days to exam
              </span>
            </div>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl text-ink font-medium">
              Daily Target: {plan?.hoursAvailable ?? 2} Hours / Day
            </h2>
            <p className="mt-1.5 text-sm text-muted max-w-2xl leading-relaxed">
              {plan?.summary ??
                "Priority order built directly from diagnostic quiz weaknesses. Critical gaps receive early revision blocks."}
            </p>
          </div>

          {/* Progress Dial Strip */}
          <div className="flex items-center gap-4 bg-paper/60 p-4 rounded-2xl border border-rule/70 shrink-0">
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-muted tracking-wider">Plan Progress</p>
              <p className="font-serif text-2xl font-medium text-ink">
                {completedCount} / {totalTasks}
              </p>
              <p className="text-[11px] text-muted">{overallPct}% Completed</p>
            </div>
            <div className="relative h-14 w-14 flex items-center justify-center">
              <svg className="w-14 h-14 -rotate-90">
                <circle
                  cx="28"
                  cy="28"
                  r="22"
                  stroke="#d8cfc1"
                  strokeWidth="5"
                  fill="transparent"
                />
                <circle
                  cx="28"
                  cy="28"
                  r="22"
                  stroke="#c45c26"
                  strokeWidth="5"
                  fill="transparent"
                  strokeDasharray="138"
                  strokeDashoffset={138 - (138 * overallPct) / 100}
                  className="transition-all duration-500 ease-out"
                />
              </svg>
              <span className="absolute text-xs font-mono font-bold text-ink">
                {overallPct}%
              </span>
            </div>
          </div>
        </div>

        {/* Schedule Customizer Form */}
        <form onSubmit={handleRebuild} className="mt-6 flex flex-wrap items-end gap-3 pt-2">
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
              Hours / Day Available
            </label>
            <input
              type="number"
              min={0.5}
              max={12}
              step={0.5}
              value={hoursPerDay}
              onChange={(e) => setHoursPerDay(Number(e.target.value))}
              className="w-36 rounded-xl border border-rule/80 bg-paper/30 px-3 py-2 text-sm text-ink focus:border-terracotta focus:ring-1 focus:ring-terracotta"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
              Target Exam Date
            </label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="rounded-xl border border-rule/80 bg-paper/30 px-3 py-2 text-sm text-ink focus:border-terracotta focus:ring-1 focus:ring-terracotta"
            />
          </div>

          <button
            type="submit"
            disabled={rebuilding}
            className="rounded-xl bg-ink px-4 py-2.5 text-xs font-semibold text-paper hover:bg-ink/90 active:scale-95 transition-all shadow-sm disabled:opacity-50"
          >
            {rebuilding ? "Re-aligning Plan…" : "Recalibrate Schedule"}
          </button>
        </form>
      </div>

      {/* Enhanced Pomodoro Focus Timer */}
      <PomodoroTimer initialTopic={activeTaskTitle || undefined} />

      {/* Daily Revision Timeline */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-2xl text-ink">Timeline & Action Tasks</h3>
          <span className="text-xs text-muted font-medium">
            Check off items as you finish revising each topic
          </span>
        </div>

        {[...byDay.entries()].map(([day, dayItems]) => {
          const dayCompleted = dayItems.filter((i) => i.completed).length;
          const dayTotalMinutes = dayItems.reduce((acc, i) => acc + i.minutes, 0);

          return (
            <section
              key={day}
              className="rounded-2xl border border-rule/80 bg-white p-6 shadow-sm hover:shadow-card transition-all"
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-rule/60">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-ink text-paper font-serif font-bold text-sm">
                    {day}
                  </span>
                  <div>
                    <h4 className="font-serif text-xl font-medium text-ink">Day {day} Revision</h4>
                    <p className="text-xs text-muted">
                      Total budget: {dayTotalMinutes} minutes · {dayCompleted} of {dayItems.length} completed
                    </p>
                  </div>
                </div>

                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    dayCompleted === dayItems.length
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-paper text-muted border border-rule"
                  }`}
                >
                  {dayCompleted === dayItems.length ? "Day Complete" : `${dayCompleted}/${dayItems.length} Done`}
                </span>
              </div>

              {/* Day Tasks */}
              <ul className="grid gap-3">
                {dayItems.map((item) => (
                  <li
                    key={item.id}
                    className={`rounded-xl border p-4 transition-all ${
                      item.completed
                        ? "border-emerald-200 bg-emerald-50/40 opacity-75"
                        : "border-rule/80 bg-paper/20 hover:bg-paper/40"
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleComplete(item.id, item.completed)}
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                          item.completed
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "border-rule bg-white hover:border-terracotta"
                        }`}
                        title="Mark task completed"
                      >
                        {item.completed && <Check size={12} strokeWidth={3} />}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p
                            className={`font-semibold text-sm ${
                              item.completed ? "line-through text-muted" : "text-ink"
                            }`}
                          >
                            {item.topicName}
                          </p>
                          <div className="flex items-center gap-2">
                            <LevelBadge level={item.priority} />
                            <span className="text-xs font-mono font-medium text-muted bg-white px-2 py-0.5 rounded border border-rule/60">
                              {item.minutes} min
                            </span>
                          </div>
                        </div>

                        <p
                          className={`mt-1.5 text-xs leading-relaxed ${
                            item.completed ? "line-through text-muted/70" : "text-ink/90"
                          }`}
                        >
                          {item.activity}
                        </p>

                        <p className="mt-1 text-[11px] text-muted italic">
                          Why: {item.why}
                        </p>

                        {/* Quick action bar */}
                        <div className="mt-3 pt-2.5 border-t border-rule/40 flex items-center justify-between text-xs">
                          <button
                            type="button"
                            onClick={() => toggleTimer(item.topicName)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted hover:text-terracotta transition-colors"
                          >
                            <Play size={11} className="text-terracotta fill-current" />
                            <span>Focus Sprint</span>
                          </button>

                          <Link
                            href={`/assistant?q=${encodeURIComponent(`Explain this topic for my Day ${day} revision: ${item.topicName}. Specifically address this gap: ${item.why}`)}`}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-terracotta hover:underline"
                          >
                            <MessageSquare size={11} />
                            <span>Ask AI for Study Notes</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        {!items.length && (
          <div className="rounded-2xl border border-dashed border-rule bg-white p-8 text-center">
            <Calendar className="mx-auto h-8 w-8 text-muted/60" />
            <h4 className="mt-2 font-serif text-lg text-ink font-medium">No revision plan generated yet</h4>
            <p className="mt-1 text-xs text-muted">
              Complete a diagnostic quiz to calibrate weak topics into an adaptive schedule.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
