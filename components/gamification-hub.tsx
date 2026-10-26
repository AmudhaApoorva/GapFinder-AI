"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Award,
  Zap,
  Target,
  Flame,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  Trophy,
  Calendar,
  Clock,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  RotateCcw,
} from "lucide-react";

type BadgeItem = {
  key: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  unlocked: boolean;
  earnedAt: string | null;
};

type ChallengeItem = {
  id: string;
  challengeKey: string;
  title: string;
  description: string;
  topicId: string | null;
  topicName: string | null;
  targetCount: number;
  currentCount: number;
  completed: boolean;
  points: number;
};

type StudyGoalData = {
  dailyFocusMinutes: number;
  dailySessions: number;
  dailyQuestions: number;
  weeklyFocusMinutes: number;
};

type RewardEventItem = {
  id: string;
  activityType: string;
  points: number;
  description: string;
  createdAt: string;
};

export function GamificationHub({
  initialPoints = 0,
  initialStreak = 0,
}: {
  initialPoints?: number;
  initialStreak?: number;
}) {
  const [points, setPoints] = useState(initialPoints);
  const [streak, setStreak] = useState(initialStreak);
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [goals, setGoals] = useState<StudyGoalData>({
    dailyFocusMinutes: 50,
    dailySessions: 2,
    dailyQuestions: 5,
    weeklyFocusMinutes: 300,
  });
  const [recentRewards, setRecentRewards] = useState<RewardEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"challenges" | "badges" | "goals" | "history">("challenges");
  const [editingGoals, setEditingGoals] = useState(false);
  const [goalInputs, setGoalInputs] = useState<StudyGoalData>(goals);
  const [savingGoals, setSavingGoals] = useState(false);

  // Fetch gamification status
  async function loadGamification() {
    try {
      const res = await fetch("/api/gamification");
      if (res.ok) {
        const data = await res.json();
        setPoints(data.points);
        setStreak(data.streak);
        setBadges(data.badges || []);
        setChallenges(data.challenges || []);
        if (data.goals) {
          setGoals(data.goals);
          setGoalInputs(data.goals);
        }
        setRecentRewards(data.recentRewards || []);
      }
    } catch (err) {
      console.error("Failed to fetch gamification data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGamification();
  }, []);

  async function handleSaveGoals(e: React.FormEvent) {
    e.preventDefault();
    setSavingGoals(true);
    try {
      const res = await fetch("/api/gamification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_goals",
          ...goalInputs,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setGoals(data.goals);
        setEditingGoals(false);
      }
    } catch {
      alert("Failed to update study goals.");
    } finally {
      setSavingGoals(false);
    }
  }

  const earnedBadges = badges.filter((b) => b.unlocked);
  const lockedBadges = badges.filter((b) => !b.unlocked);

  // Level computation (each level = 100 points)
  const currentLevel = Math.floor(points / 100) + 1;
  const pointsInCurrentLevel = points % 100;

  return (
    <div className="rounded-3xl border border-rule/80 bg-white p-6 sm:p-8 shadow-card space-y-6">
      {/* Top Banner: Points, Streak, Level Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-rule/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-terracotta/10 text-terracotta">
              <Trophy size={16} />
            </span>
            <p className="text-xs uppercase tracking-[0.2em] text-terracotta font-semibold">
              Learning Mastery & Rewards
            </p>
          </div>
          <h2 className="mt-2 font-serif text-3xl text-ink font-medium">Study Zone & Gamification</h2>
          <p className="mt-1 text-xs text-muted max-w-xl">
            Earn verified points, maintain consecutive daily study streaks, unlock achievement badges, and conquer your daily challenges.
          </p>
        </div>

        {/* Highlight Stats Pill */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Points Badge */}
          <div className="rounded-2xl bg-paper/60 border border-rule/70 p-3.5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-terracotta to-[#d96e38] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted tracking-wider">Total Points</p>
              <p className="font-serif text-2xl font-bold text-ink">{points} pts</p>
            </div>
          </div>

          {/* Streak Badge */}
          <div className="rounded-2xl bg-paper/60 border border-rule/70 p-3.5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <Flame size={18} className="fill-current" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted tracking-wider">Study Streak</p>
              <p className="font-serif text-2xl font-bold text-ink">{streak} Days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Level Progress Bar */}
      <div className="rounded-2xl bg-paper/40 border border-rule/60 p-4">
        <div className="flex items-center justify-between text-xs font-semibold pb-1.5">
          <span className="text-ink flex items-center gap-1.5">
            <Award size={14} className="text-terracotta" />
            <span>Scholar Rank: Level {currentLevel}</span>
          </span>
          <span className="text-muted font-mono">
            {pointsInCurrentLevel} / 100 XP to Level {currentLevel + 1}
          </span>
        </div>
        <div className="h-2 rounded-full bg-rule/50 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-terracotta to-[#d96e38] transition-all duration-500 rounded-full"
            style={{ width: `${Math.max(4, pointsInCurrentLevel)}%` }}
          />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule/60 pb-3">
        <div className="flex items-center gap-1.5 rounded-xl bg-paper p-1 border border-rule/80 text-xs">
          <button
            onClick={() => setActiveTab("challenges")}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
              activeTab === "challenges"
                ? "bg-ink text-paper shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            Daily Challenges ({challenges.filter((c) => c.completed).length}/{challenges.length})
          </button>
          <button
            onClick={() => setActiveTab("badges")}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
              activeTab === "badges"
                ? "bg-ink text-paper shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            Badges ({earnedBadges.length}/{badges.length})
          </button>
          <button
            onClick={() => setActiveTab("goals")}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
              activeTab === "goals"
                ? "bg-ink text-paper shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            Learning Goals
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
              activeTab === "history"
                ? "bg-ink text-paper shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            Points History
          </button>
        </div>

        <button
          onClick={loadGamification}
          className="text-xs text-muted hover:text-ink flex items-center gap-1"
          title="Refresh statistics"
        >
          <RotateCcw size={12} />
          <span>Sync Status</span>
        </button>
      </div>

      {/* Tab 1: Daily Learning Challenges */}
      {activeTab === "challenges" && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Calibrated dynamically to your weak topics, syllabus notes, and revision plan.</span>
            <span className="font-semibold text-terracotta">Points awarded only on verification.</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {challenges.map((c) => (
              <div
                key={c.id}
                className={`rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                  c.completed
                    ? "border-emerald-200 bg-emerald-50/40"
                    : "border-rule/80 bg-paper/20 hover:border-terracotta/40"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                        c.completed
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-terracotta/10 text-terracotta border border-terracotta/20"
                      }`}
                    >
                      +{c.points} XP
                    </span>
                    {c.completed ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                        <CheckCircle2 size={13} />
                        Done
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted font-medium">Pending</span>
                    )}
                  </div>

                  <h4 className="mt-2.5 font-semibold text-sm text-ink">{c.title}</h4>
                  <p className="mt-1 text-xs text-muted leading-relaxed">{c.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-rule/50">
                  {c.completed ? (
                    <div className="text-[11px] font-medium text-emerald-800 flex items-center gap-1">
                      <span>✓ Completed today</span>
                    </div>
                  ) : (
                    <Link
                      href={
                        c.challengeKey === "focus_sprint"
                          ? "/plan"
                          : c.challengeKey === "quick_drill"
                            ? `/quiz${c.topicId ? `?topicId=${c.topicId}` : ""}`
                            : `/assistant${c.topicName ? `?q=Explain ${encodeURIComponent(c.topicName)} in simple words` : ""}`
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-terracotta hover:underline"
                    >
                      <span>Start Challenge</span>
                      <ArrowRight size={12} />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!challenges.length && (
            <div className="py-8 text-center text-muted text-xs">
              Loading today&apos;s personalized challenges…
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Achievement Badges */}
      {activeTab === "badges" && (
        <div className="space-y-6">
          {/* Earned Badges */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-3 flex items-center gap-1.5">
              <CheckCircle2 size={14} />
              <span>Earned Achievements ({earnedBadges.length})</span>
            </h4>
            <div className="grid gap-3 sm:grid-cols-3">
              {earnedBadges.map((b) => (
                <div
                  key={b.key}
                  className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                      <Award size={18} />
                    </div>
                    <div>
                      <h5 className="font-semibold text-xs text-ink">{b.title}</h5>
                      <span className="text-[10px] text-emerald-700 font-medium">Unlocked</span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted leading-relaxed">{b.description}</p>
                </div>
              ))}
              {!earnedBadges.length && (
                <div className="col-span-3 py-6 text-center text-xs text-muted">
                  No badges unlocked yet. Complete your first focus session or quiz to earn your first badge!
                </div>
              )}
            </div>
          </div>

          {/* Locked Badges */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-3 flex items-center gap-1.5">
              <Lock size={14} />
              <span>Available to Unlock ({lockedBadges.length})</span>
            </h4>
            <div className="grid gap-3 sm:grid-cols-3">
              {lockedBadges.map((b) => (
                <div
                  key={b.key}
                  className="rounded-2xl border border-rule/80 bg-paper/20 p-4 opacity-75 hover:opacity-100 transition-opacity"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rule/70 text-muted">
                      <Lock size={16} />
                    </div>
                    <div>
                      <h5 className="font-semibold text-xs text-ink">{b.title}</h5>
                      <span className="text-[10px] text-muted">Locked</span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted leading-relaxed">
                    <span className="font-semibold text-ink">Requirement: </span>
                    {b.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Configurable Learning Goals */}
      {activeTab === "goals" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-rule/60">
            <div>
              <h4 className="font-serif text-xl text-ink font-medium">Daily & Weekly Study Targets</h4>
              <p className="text-xs text-muted">
                Configure personalized goals. Progress is verified from genuine focus records and quiz answers.
              </p>
            </div>
            <button
              onClick={() => setEditingGoals(!editingGoals)}
              className="rounded-xl border border-rule bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:bg-paper transition-all"
            >
              {editingGoals ? "Cancel" : "Edit Targets"}
            </button>
          </div>

          {editingGoals ? (
            <form onSubmit={handleSaveGoals} className="grid gap-4 sm:grid-cols-2 p-4 rounded-2xl bg-paper/30 border border-rule/70">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                  Daily Focus Minutes
                </label>
                <input
                  type="number"
                  min={10}
                  max={480}
                  value={goalInputs.dailyFocusMinutes}
                  onChange={(e) =>
                    setGoalInputs({ ...goalInputs, dailyFocusMinutes: Number(e.target.value) || 50 })
                  }
                  className="w-full rounded-xl border border-rule bg-white px-3 py-2 text-sm text-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                  Daily Focus Sessions Count
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={goalInputs.dailySessions}
                  onChange={(e) =>
                    setGoalInputs({ ...goalInputs, dailySessions: Number(e.target.value) || 2 })
                  }
                  className="w-full rounded-xl border border-rule bg-white px-3 py-2 text-sm text-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                  Daily Quiz Questions
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={goalInputs.dailyQuestions}
                  onChange={(e) =>
                    setGoalInputs({ ...goalInputs, dailyQuestions: Number(e.target.value) || 5 })
                  }
                  className="w-full rounded-xl border border-rule bg-white px-3 py-2 text-sm text-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                  Weekly Focus Minutes
                </label>
                <input
                  type="number"
                  min={30}
                  max={2400}
                  value={goalInputs.weeklyFocusMinutes}
                  onChange={(e) =>
                    setGoalInputs({ ...goalInputs, weeklyFocusMinutes: Number(e.target.value) || 300 })
                  }
                  className="w-full rounded-xl border border-rule bg-white px-3 py-2 text-sm text-ink"
                />
              </div>

              <div className="col-span-2 pt-2">
                <button
                  type="submit"
                  disabled={savingGoals}
                  className="rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-paper hover:bg-ink/90 active:scale-95 transition-all"
                >
                  {savingGoals ? "Saving Targets…" : "Save New Targets"}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-rule/70 bg-paper/40 p-4">
                <p className="text-[10px] uppercase font-bold text-muted tracking-wider">Daily Focus</p>
                <p className="font-serif text-2xl text-ink font-medium mt-1">
                  {goals.dailyFocusMinutes} min
                </p>
                <p className="text-[11px] text-muted mt-1">Target focus time</p>
              </div>

              <div className="rounded-2xl border border-rule/70 bg-paper/40 p-4">
                <p className="text-[10px] uppercase font-bold text-muted tracking-wider">Daily Sessions</p>
                <p className="font-serif text-2xl text-ink font-medium mt-1">
                  {goals.dailySessions} Sprints
                </p>
                <p className="text-[11px] text-muted mt-1">Pomodoro blocks</p>
              </div>

              <div className="rounded-2xl border border-rule/70 bg-paper/40 p-4">
                <p className="text-[10px] uppercase font-bold text-muted tracking-wider">Daily Questions</p>
                <p className="font-serif text-2xl text-ink font-medium mt-1">
                  {goals.dailyQuestions} Items
                </p>
                <p className="text-[11px] text-muted mt-1">Recall questions</p>
              </div>

              <div className="rounded-2xl border border-rule/70 bg-paper/40 p-4">
                <p className="text-[10px] uppercase font-bold text-muted tracking-wider">Weekly Budget</p>
                <p className="font-serif text-2xl text-ink font-medium mt-1">
                  {goals.weeklyFocusMinutes} min
                </p>
                <p className="text-[11px] text-muted mt-1">Mon–Sun study target</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Points Audit Log */}
      {activeTab === "history" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Points awarded strictly on verified server activity. No fabricated counters.</span>
            <span className="font-mono text-ink font-semibold">Total: {points} XP</span>
          </div>

          <div className="rounded-2xl border border-rule/80 overflow-hidden divide-y divide-rule/50">
            {recentRewards.map((r) => (
              <div key={r.id} className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-paper/30 transition-colors">
                <div>
                  <p className="font-semibold text-ink">{r.description}</p>
                  <p className="text-[10px] text-muted font-mono">
                    {new Date(r.createdAt).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span className="font-mono font-bold text-terracotta bg-terracotta/10 px-2.5 py-1 rounded-full border border-terracotta/20 shrink-0">
                  +{r.points} XP
                </span>
              </div>
            ))}

            {!recentRewards.length && (
              <div className="p-8 text-center text-xs text-muted">
                No activity rewards recorded yet. Complete a Pomodoro sprint or answer quiz questions to earn points!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
