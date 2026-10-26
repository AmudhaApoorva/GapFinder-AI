"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  Sparkles,
  LayoutList,
  Eye,
  AlertCircle,
} from "lucide-react";

type Q = {
  id: string;
  prompt: string;
  type: string;
  options: string[];
  topic: string;
};

export function QuizForm({ quizId, questions }: { quizId: string; questions: Q[] }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"step" | "all">("step");
  const [busy, setBusy] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(mins).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const answeredCount = Object.keys(answers).filter((k) => answers[k]?.trim()).length;
  const progressPct = Math.round((answeredCount / Math.max(questions.length, 1)) * 100);

  const currentQ = questions[currentIndex] ?? questions[0];

  function handleAnswer(questionId: string, val: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: val }));
  }

  async function submitQuiz(e?: FormEvent) {
    if (e) e.preventDefault();

    if (answeredCount < questions.length) {
      const confirmIncomplete = confirm(
        `You have answered ${answeredCount} of ${questions.length} questions. Submit anyway for diagnostic scoring?`,
      );
      if (!confirmIncomplete) return;
    }

    setBusy(true);
    const responses = questions.map((q) => ({
      questionId: q.id,
      response: answers[q.id] ?? "",
    }));

    try {
      const res = await fetch(`/api/quiz/${quizId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses }),
      });
      if (res.ok) {
        router.push("/report");
      } else {
        alert("Evaluation failed. Please try submitting again.");
        setBusy(false);
      }
    } catch {
      alert("Network error while submitting diagnosis.");
      setBusy(false);
    }
  }

  return (
    <div className="mt-6">
      {/* Quiz Top Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-rule/80 bg-white p-4 shadow-sm">
        {/* Progress & Answered */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-terracotta/10 text-terracotta flex items-center justify-center font-bold text-xs font-mono">
            {answeredCount}/{questions.length}
          </div>
          <div>
            <p className="text-xs font-semibold text-ink">
              {answeredCount} of {questions.length} Answered
            </p>
            <div className="mt-1 w-28 h-1.5 rounded-full bg-rule/50 overflow-hidden">
              <div
                className="h-full bg-terracotta transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Timer & View Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono bg-paper px-3 py-1.5 rounded-lg border border-rule text-muted">
            <Clock size={13} className="text-terracotta" />
            <span>{formatTimer(secondsElapsed)}</span>
          </div>

          <div className="flex rounded-lg bg-paper p-0.5 border border-rule">
            <button
              type="button"
              onClick={() => setViewMode("step")}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                viewMode === "step" ? "bg-white text-ink shadow-sm font-semibold" : "text-muted hover:text-ink"
              }`}
            >
              Step View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("all")}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                viewMode === "all" ? "bg-white text-ink shadow-sm font-semibold" : "text-muted hover:text-ink"
              }`}
            >
              All Questions
            </button>
          </div>
        </div>
      </div>

      {/* Question Selector Strip */}
      <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-2">
        {questions.map((q, i) => {
          const isAnswered = Boolean(answers[q.id]?.trim());
          const isCurrent = i === currentIndex && viewMode === "step";
          return (
            <button
              key={q.id}
              onClick={() => {
                setCurrentIndex(i);
                if (viewMode === "all") {
                  document.getElementById(`q-${q.id}`)?.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold transition-all ${
                isCurrent
                  ? "bg-terracotta text-white shadow-sm ring-2 ring-terracotta/40"
                  : isAnswered
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-white border border-rule text-muted hover:border-ink/40"
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* STEP-BY-STEP MODE */}
      {viewMode === "step" && currentQ && (
        <div className="mt-6 rounded-2xl border border-rule/80 bg-white p-6 sm:p-8 shadow-card">
          <div className="flex items-center justify-between pb-4 border-b border-rule/60">
            <span className="text-xs uppercase tracking-wider font-semibold text-terracotta">
              Question {currentIndex + 1} of {questions.length} • {currentQ.topic}
            </span>
            <span className="text-xs text-muted font-medium uppercase tracking-wider">
              {currentQ.type === "mcq" ? "Multiple Choice" : "Short Answer"}
            </span>
          </div>

          <h3 className="mt-4 font-serif text-xl sm:text-2xl text-ink leading-snug">
            {currentQ.prompt}
          </h3>

          {/* MCQ Option Cards */}
          {currentQ.type === "mcq" ? (
            <div className="mt-6 grid gap-3">
              {currentQ.options.map((opt, optIndex) => {
                const letter = String.fromCharCode(65 + optIndex);
                const isSelected = answers[currentQ.id] === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleAnswer(currentQ.id, opt)}
                    className={`flex items-center gap-3.5 rounded-xl border p-4 text-left transition-all ${
                      isSelected
                        ? "border-terracotta bg-terracotta/5 shadow-sm ring-1 ring-terracotta"
                        : "border-rule/80 bg-paper/20 hover:bg-paper hover:border-rule"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                        isSelected
                          ? "bg-terracotta text-white"
                          : "bg-paper text-muted border border-rule"
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="text-sm font-medium text-ink leading-relaxed flex-1">
                      {opt}
                    </span>
                    {isSelected && (
                      <CheckCircle2 size={16} className="text-terracotta shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-6">
              <label className="block text-xs text-muted font-medium mb-1">
                Your Answer (Explain in 1-2 sentences using concepts from your notes)
              </label>
              <textarea
                rows={4}
                value={answers[currentQ.id] ?? ""}
                onChange={(e) => handleAnswer(currentQ.id, e.target.value)}
                placeholder="Write your explanation grounded in your notes..."
                className="w-full rounded-xl border border-rule/80 bg-paper/30 p-3.5 text-sm text-ink focus:border-terracotta focus:ring-1 focus:ring-terracotta focus:bg-white transition-all shadow-sm"
              />
              <p className="mt-1 text-right text-[10px] text-muted">
                {(answers[currentQ.id] ?? "").length} characters
              </p>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="mt-8 pt-4 border-t border-rule/60 flex items-center justify-between">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rule px-4 py-2 text-xs font-semibold text-ink hover:bg-paper disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={15} />
              <span>Previous</span>
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-paper hover:bg-ink/90 active:scale-95 transition-all"
              >
                <span>Next Question</span>
                <ChevronRight size={15} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => submitQuiz()}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-terracotta to-[#d96e38] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:brightness-110 active:scale-95 transition-all disabled:opacity-60"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                <span>Submit Diagnosis</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ALL QUESTIONS SHEET VIEW */}
      {viewMode === "all" && (
        <div className="mt-6 space-y-6">
          {questions.map((q, i) => (
            <fieldset
              key={q.id}
              id={`q-${q.id}`}
              className="rounded-2xl border border-rule/80 bg-white p-6 shadow-card"
            >
              <div className="flex items-center justify-between pb-3 border-b border-rule/60 text-xs">
                <span className="font-semibold text-terracotta">
                  {i + 1}. {q.topic}
                </span>
                <span className="text-muted uppercase font-medium">
                  {q.type === "mcq" ? "Multiple Choice" : "Short Answer"}
                </span>
              </div>
              <p className="mt-3 font-serif text-lg font-medium text-ink">{q.prompt}</p>

              {q.type === "mcq" ? (
                <div className="mt-4 grid gap-2.5">
                  {q.options.map((opt, optIndex) => {
                    const letter = String.fromCharCode(65 + optIndex);
                    const isSelected = answers[q.id] === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleAnswer(q.id, opt)}
                        className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                          isSelected
                            ? "border-terracotta bg-terracotta/5 ring-1 ring-terracotta"
                            : "border-rule/80 bg-paper/20 hover:bg-paper"
                        }`}
                      >
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                            isSelected
                              ? "bg-terracotta text-white"
                              : "bg-paper text-muted border border-rule"
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="text-sm text-ink">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <textarea
                  rows={3}
                  value={answers[q.id] ?? ""}
                  onChange={(e) => handleAnswer(q.id, e.target.value)}
                  placeholder="Explain from your notes..."
                  className="mt-4 w-full rounded-xl border border-rule/80 bg-paper/30 p-3 text-sm text-ink focus:border-terracotta focus:ring-1 focus:ring-terracotta focus:bg-white transition-all shadow-sm"
                />
              )}
            </fieldset>
          ))}
        </div>
      )}

      {/* Bottom Sticky Submit Bar */}
      <div className="sticky bottom-4 mt-8 flex items-center justify-between gap-4 rounded-2xl glass-dark px-6 py-4 text-paper shadow-2xl">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-terracotta" />
          <span className="text-xs text-[#d8cfc1]">
            {answeredCount} of {questions.length} questions answered
          </span>
        </div>

        <button
          onClick={() => submitQuiz()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-terracotta px-6 py-2.5 text-xs font-semibold text-white hover:brightness-110 active:scale-95 transition-all disabled:opacity-60 shadow-glow"
        >
          {busy ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Evaluating against sources…</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Submit & Generate Report</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
