"use client";

import { useState } from "react";
import Link from "next/link";
import { LevelBadge } from "@/components/badge";
import { Cite } from "@/components/cite";
import { WeakTopicStudio } from "@/components/weak-topic-studio";
import {
  Printer,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Clock,
  CheckCircle2,
  MessageSquare,
  Zap,
  Filter,
  Check,
  X,
  FileText,
  Calendar,
} from "lucide-react";

type TopicMasteryItem = {
  id: string;
  topicId: string;
  level: string;
  accuracy: number;
  reason: string;
  topic: {
    id: string;
    name: string;
    sourceRef: string;
  };
};

type AttemptDetail = {
  id: string;
  score: number;
  createdAt: Date | string;
  quiz: {
    title: string;
  };
  answers: {
    id: string;
    response: string;
    isCorrect: boolean;
    feedback: string;
    question: {
      id: string;
      prompt: string;
      type: string;
      correctAnswer: string;
      citationTitle: string;
      citationSection: string;
      citationExcerpt: string;
      topic: {
        id: string;
        name: string;
      };
    };
  }[];
};

export function ReportView({
  mastery,
  attempt,
}: {
  mastery: TopicMasteryItem[];
  attempt: AttemptDetail | null;
}) {
  const [filterGap, setFilterGap] = useState<string>("all");
  const [questionFilter, setQuestionFilter] = useState<"all" | "missed">("missed");
  const [selectedStudioTopic, setSelectedStudioTopic] = useState<TopicMasteryItem | null>(null);

  const weakCount = mastery.filter((m) => m.level === "weak").length;
  const mediumCount = mastery.filter((m) => m.level === "medium").length;
  const strongCount = mastery.filter((m) => m.level === "strong").length;

  const avgAccuracy =
    mastery.length > 0
      ? Math.round((mastery.reduce((acc, m) => acc + m.accuracy, 0) / mastery.length) * 100)
      : attempt
        ? Math.round(attempt.score * 100)
        : 0;

  const filteredMastery = mastery.filter((m) => {
    if (filterGap === "all") return true;
    return m.level === filterGap;
  });

  const filteredAnswers = attempt?.answers.filter((a) => {
    if (questionFilter === "all") return true;
    return !a.isCorrect;
  }) ?? [];

  return (
    <div className="mt-8 space-y-10">
      {/* Executive Summary Card */}
      <div className="rounded-3xl border border-rule/80 bg-white p-6 sm:p-8 shadow-card overflow-hidden relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-terracotta/10 via-amber-100/20 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-rule/60">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-terracotta bg-terracotta/10 px-2.5 py-1 rounded-full border border-terracotta/20">
              Diagnostic Readiness Assessment
            </span>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl text-ink font-medium">
              Overall Exam Preparedness: {avgAccuracy}%
            </h2>
            <p className="mt-1.5 text-sm text-muted max-w-xl">
              {weakCount > 0
                ? `You have ${weakCount} critical knowledge gap${weakCount > 1 ? "s" : ""} requiring prioritized attention before your target exam.`
                : "Strong conceptual baseline across all tested syllabus chapters. Continue with spaced reinforcement."}
            </p>
          </div>

          {/* Print & Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 no-print">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-paper/60 px-3.5 py-2 text-xs font-semibold text-ink hover:bg-paper transition-all"
            >
              <Printer size={14} className="text-muted" />
              <span>Print / Export PDF</span>
            </button>

            <Link
              href="/plan"
              className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-paper hover:bg-ink/90 active:scale-95 transition-all shadow-sm"
            >
              <span>View Revision Plan</span>
              <ArrowRight size={13} className="text-terracotta" />
            </Link>
          </div>
        </div>

        {/* Quick Gap Stats Strip */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-paper/50 p-4 border border-rule/60">
            <p className="text-[10px] uppercase font-bold text-muted tracking-wider">Average Accuracy</p>
            <p className="font-serif text-2xl text-ink font-medium mt-1">{avgAccuracy}%</p>
            <div className="mt-2 h-1.5 rounded-full bg-rule/50 overflow-hidden">
              <div
                className="h-full bg-terracotta transition-all duration-500"
                style={{ width: `${avgAccuracy}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl bg-paper/50 p-4 border border-rule/60">
            <p className="text-[10px] uppercase font-bold text-terracotta tracking-wider">Weak Topics</p>
            <p className="font-serif text-2xl text-terracotta font-medium mt-1 flex items-center gap-1.5">
              {weakCount}
              <AlertTriangle size={16} />
            </p>
            <p className="text-[11px] text-muted mt-1">Priority revision targets</p>
          </div>

          <div className="rounded-2xl bg-paper/50 p-4 border border-rule/60">
            <p className="text-[10px] uppercase font-bold text-gold tracking-wider">Needs Review</p>
            <p className="font-serif text-2xl text-gold font-medium mt-1 flex items-center gap-1.5">
              {mediumCount}
              <Clock size={16} />
            </p>
            <p className="text-[11px] text-muted mt-1">Partial recall</p>
          </div>

          <div className="rounded-2xl bg-paper/50 p-4 border border-rule/60">
            <p className="text-[10px] uppercase font-bold text-forest tracking-wider">Mastered</p>
            <p className="font-serif text-2xl text-forest font-medium mt-1 flex items-center gap-1.5">
              {strongCount}
              <CheckCircle2 size={16} />
            </p>
            <p className="text-[11px] text-muted mt-1">Consistent accuracy</p>
          </div>
        </div>
      </div>

      {/* Topic Mastery Breakdown */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rule/60">
          <div>
            <h3 className="font-serif text-2xl text-ink">Topic-by-Topic Diagnosis</h3>
            <p className="text-xs text-muted">
              Weak, review, and mastered classifications with specific reasoning from missed ideas.
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-1.5 no-print">
            {[
              { id: "all", label: `All (${mastery.length})` },
              { id: "weak", label: `Weak (${weakCount})` },
              { id: "medium", label: `Review (${mediumCount})` },
              { id: "strong", label: `Mastered (${strongCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterGap(tab.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                  filterGap === tab.id
                    ? "bg-ink text-paper shadow-sm"
                    : "bg-white border border-rule text-muted hover:border-ink/40"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-3.5">
          {filteredMastery.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-rule/80 bg-white p-5 shadow-sm hover:shadow-card transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted font-mono">{item.topic.sourceRef}</span>
                  </div>
                  <h4 className="font-serif text-xl text-ink font-medium mt-0.5">{item.topic.name}</h4>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-sm font-semibold text-ink">
                    {Math.round(item.accuracy * 100)}%
                  </span>
                  <LevelBadge level={item.level} />
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-rule/50">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    item.level === "weak"
                      ? "bg-terracotta"
                      : item.level === "medium"
                        ? "bg-gold"
                        : "bg-forest"
                  }`}
                  style={{ width: `${Math.max(6, Math.round(item.accuracy * 100))}%` }}
                />
              </div>

              {/* Diagnosis Reason */}
              <p className="mt-3 text-xs leading-relaxed text-muted bg-paper/60 p-3 rounded-xl border border-rule/50">
                <span className="font-semibold text-ink">Diagnostic Finding: </span>
                {item.reason}
              </p>

              {/* Action Toolbar */}
              <div className="mt-3.5 pt-3 border-t border-rule/50 flex flex-wrap items-center justify-end gap-2 no-print">
                <button
                  type="button"
                  onClick={() => setSelectedStudioTopic(item)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-terracotta px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110 active:scale-95 transition-all shadow-xs"
                >
                  <Sparkles size={13} />
                  <span>Interactive Studio</span>
                </button>

                <Link
                  href={`/assistant?q=${encodeURIComponent(`I scored ${Math.round(item.accuracy * 100)}% on "${item.topic.name}". Explain why I missed these concepts: ${item.reason}`)}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rule bg-white px-3 py-1.5 text-xs font-medium text-ink hover:bg-paper transition-colors"
                >
                  <MessageSquare size={13} className="text-terracotta" />
                  <span>Explain This Gap</span>
                </Link>

                <Link
                  href="/plan"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-paper px-3 py-1.5 text-xs font-semibold text-ink hover:bg-rule/40 transition-colors"
                >
                  <span>See In Plan</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Latest Attempt Item-by-Item Review */}
      {attempt && (
        <section className="pt-6 border-t border-rule/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-semibold text-terracotta">
                  Item Review
                </span>
                <span className="text-xs text-muted">
                  {new Date(attempt.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <h3 className="font-serif text-2xl text-ink font-medium mt-0.5">
                {attempt.quiz.title} · Score: {Math.round(attempt.score * 100)}%
              </h3>
            </div>

            <div className="flex items-center gap-1.5 no-print">
              <button
                onClick={() => setQuestionFilter("missed")}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                  questionFilter === "missed"
                    ? "bg-terracotta text-white shadow-sm"
                    : "bg-white border border-rule text-muted hover:border-terracotta/40"
                }`}
              >
                Missed Items Only
              </button>
              <button
                onClick={() => setQuestionFilter("all")}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                  questionFilter === "all"
                    ? "bg-ink text-paper shadow-sm"
                    : "bg-white border border-rule text-muted hover:border-ink/40"
                }`}
              >
                All Items ({attempt.answers.length})
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-4">
            {filteredAnswers.map((answer, i) => (
              <article
                key={answer.id}
                className={`rounded-2xl border p-5 shadow-sm transition-all ${
                  answer.isCorrect
                    ? "border-emerald-200 bg-white"
                    : "border-terracotta/40 bg-white"
                }`}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-rule/50 text-xs">
                  <span className="font-semibold text-muted">
                    Topic: {answer.question.topic.name}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold text-[11px] ${
                      answer.isCorrect
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-rose-50 text-rose-800 border border-rose-200"
                    }`}
                  >
                    {answer.isCorrect ? <Check size={12} /> : <X size={12} />}
                    {answer.isCorrect ? "Correct" : "Needs Review"}
                  </span>
                </div>

                <p className="font-medium text-ink text-sm sm:text-base leading-snug">
                  {answer.question.prompt}
                </p>

                <div className="mt-3 rounded-xl bg-paper/60 p-3 text-xs space-y-1.5 border border-rule/50">
                  <p>
                    <span className="font-semibold text-muted">Your response: </span>
                    <span className={answer.isCorrect ? "text-emerald-900 font-medium" : "text-rose-950 font-medium"}>
                      {answer.response || "(No response recorded)"}
                    </span>
                  </p>
                  <p className="text-muted leading-relaxed">
                    <span className="font-semibold text-ink">Examiner feedback: </span>
                    {answer.feedback}
                  </p>
                </div>

                {/* Citation */}
                <div className="mt-3 pt-2">
                  <Cite
                    title={answer.question.citationTitle}
                    section={answer.question.citationSection}
                    excerpt={answer.question.citationExcerpt}
                  />
                </div>
              </article>
            ))}

            {!filteredAnswers.length && (
              <div className="rounded-2xl border border-dashed border-rule bg-white p-6 text-center text-xs text-muted">
                No items match this filter.
              </div>
            )}
          </div>
        </section>
      )}

      {/* Interactive Weak Topic Studio Modal */}
      {selectedStudioTopic && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4 overflow-y-auto flex items-center justify-center animate-in fade-in">
          <div className="w-full max-w-4xl my-8">
            <WeakTopicStudio
              topicId={selectedStudioTopic.topicId}
              topicName={selectedStudioTopic.topic.name}
              sourceRef={selectedStudioTopic.topic.sourceRef}
              reason={selectedStudioTopic.reason}
              accuracy={Math.round(selectedStudioTopic.accuracy * 100)}
              onClose={() => setSelectedStudioTopic(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
