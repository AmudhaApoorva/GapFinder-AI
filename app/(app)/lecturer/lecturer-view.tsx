"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  Loader2,
  Clock,
  CheckCircle2,
  HelpCircle,
  MessageSquare,
  GraduationCap,
  Sparkles,
  User,
  Plus,
} from "lucide-react";

type DoubtItem = {
  id: string;
  studentId: string;
  subject: string;
  question: string;
  topicName: string | null;
  reply: string | null;
  repliedAt: Date | string | null;
  status: string;
  createdAt: Date | string;
  student?: {
    id: string;
    name: string;
    email: string;
  };
};

export function LecturerCommunicationView({
  role,
  initialDoubts,
  topics,
}: {
  role: string;
  initialDoubts: DoubtItem[];
  topics: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [doubts, setDoubts] = useState<DoubtItem[]>(initialDoubts);
  const [showForm, setShowForm] = useState(false);

  // New doubt state
  const [subject, setSubject] = useState("");
  const [topicName, setTopicName] = useState("");
  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Teacher reply state
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [replyingId, setReplyingId] = useState<string | null>(null);

  async function handleSendDoubt(e: FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !question.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/doubts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, question, topicName }),
      });
      const data = await res.json();
      if (res.ok) {
        setDoubts((prev) => [data, ...prev]);
        setSubject("");
        setQuestion("");
        setTopicName("");
        setShowForm(false);
        router.refresh();
      } else {
        alert(data.error ?? "Failed to send doubt.");
      }
    } catch {
      alert("Network error sending question to lecturer.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTeacherReply(doubtId: string) {
    const replyText = replyTextMap[doubtId]?.trim();
    if (!replyText) return;

    setReplyingId(doubtId);
    try {
      const res = await fetch("/api/doubts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: doubtId, reply: replyText, status: "resolved" }),
      });
      const data = await res.json();
      if (res.ok) {
        setDoubts((prev) =>
          prev.map((d) => (d.id === doubtId ? { ...d, reply: replyText, status: "resolved", repliedAt: new Date() } : d)),
        );
        setReplyTextMap((prev) => ({ ...prev, [doubtId]: "" }));
        router.refresh();
      } else {
        alert(data.error ?? "Failed to submit clarification.");
      }
    } catch {
      alert("Error submitting lecturer reply.");
    } finally {
      setReplyingId(null);
    }
  }

  return (
    <div className="mt-8 space-y-8">
      {/* Student CTA to post a doubt */}
      {role !== "teacher" && (
        <div className="rounded-3xl border border-rule/80 bg-white p-6 sm:p-8 shadow-card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-rule/60">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-terracotta bg-terracotta/10 px-2.5 py-1 rounded-full border border-terracotta/20">
                Direct Lecturer Help
              </span>
              <h2 className="mt-2 font-serif text-2xl sm:text-3xl text-ink font-medium">
                Got a doubt in your syllabus?
              </h2>
              <p className="mt-1 text-xs text-muted max-w-xl">
                Submit your specific conceptual question. Your lecturer will review it and post an authoritative reply directly to your dashboard.
              </p>
            </div>

            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-terracotta to-[#d96e38] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:brightness-110 active:scale-95 transition-all"
            >
              <Plus size={15} />
              <span>{showForm ? "Close Form" : "Send Academic Doubt"}</span>
            </button>
          </div>

          {/* Form */}
          {showForm && (
            <form onSubmit={handleSendDoubt} className="mt-6 space-y-4 pt-2">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                    Subject / Short Title
                  </label>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    placeholder="e.g. Scope resolution in nested Python functions"
                    className="w-full rounded-xl border border-rule/80 bg-paper/30 px-3.5 py-2.5 text-sm text-ink focus:border-terracotta focus:ring-1 focus:ring-terracotta focus:bg-white transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                    Related Syllabus Topic (Optional)
                  </label>
                  <select
                    value={topicName}
                    onChange={(e) => setTopicName(e.target.value)}
                    className="w-full rounded-xl border border-rule/80 bg-paper/30 px-3.5 py-2.5 text-sm text-ink focus:border-terracotta focus:ring-1 focus:ring-terracotta focus:bg-white transition-all shadow-sm"
                  >
                    <option value="">-- General / Whole Syllabus --</option>
                    {topics.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                  Describe Your Question in Detail
                </label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  required
                  rows={4}
                  placeholder="Explain exactly where you are experiencing difficulty or why a specific step is confusing…"
                  className="w-full rounded-xl border border-rule/80 bg-paper/30 p-3.5 text-sm text-ink focus:border-terracotta focus:ring-1 focus:ring-terracotta focus:bg-white transition-all shadow-sm"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-muted hover:bg-paper"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !subject.trim() || !question.trim()}
                  className="flex items-center gap-2 rounded-xl bg-ink px-5 py-2.5 text-xs font-semibold text-paper hover:bg-ink/90 active:scale-95 transition-all disabled:opacity-50 shadow-sm"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin text-terracotta" /> : <Send size={14} />}
                  <span>Submit Question to Lecturer</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Doubts Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-rule/60">
          <h3 className="font-serif text-2xl text-ink">
            {role === "teacher" ? "Class Academic Doubts" : "Your Submitted Doubts & Lecturer Replies"}
          </h3>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-paper border border-rule text-muted">
            {doubts.length} {doubts.length === 1 ? "question" : "questions"}
          </span>
        </div>

        <div className="grid gap-4">
          {doubts.map((doubt) => {
            const isResolved = doubt.status === "resolved" && Boolean(doubt.reply);

            return (
              <article
                key={doubt.id}
                className={`rounded-2xl border bg-white p-6 shadow-sm hover:shadow-card transition-all ${
                  isResolved ? "border-emerald-200" : "border-rule/80"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-rule/60">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-serif text-lg font-medium text-ink">{doubt.subject}</span>
                    {doubt.topicName && (
                      <span className="text-[10px] font-semibold bg-paper text-terracotta border border-terracotta/20 px-2 py-0.5 rounded-md">
                        {doubt.topicName}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        isResolved
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {isResolved ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                      <span>{isResolved ? "Clarified by Lecturer" : "Pending Lecturer Reply"}</span>
                    </span>
                    <span className="text-[11px] text-muted">
                      {new Date(doubt.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                </div>

                {/* Student info for Teacher */}
                {role === "teacher" && doubt.student && (
                  <div className="mb-2 text-xs text-muted flex items-center gap-1.5">
                    <User size={13} className="text-terracotta" />
                    <span>From: <strong className="text-ink">{doubt.student.name}</strong> ({doubt.student.email})</span>
                  </div>
                )}

                {/* Question */}
                <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{doubt.question}</p>

                {/* Lecturer Reply Section */}
                {doubt.reply ? (
                  <div className="mt-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80 p-4">
                    <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-emerald-200/50">
                      <div className="flex items-center gap-1.5 text-emerald-900 font-semibold text-xs">
                        <GraduationCap size={15} className="text-emerald-700" />
                        <span>Lecturer Clarification</span>
                      </div>
                      {doubt.repliedAt && (
                        <span className="text-[10px] text-emerald-800/80">
                          {new Date(doubt.repliedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed whitespace-pre-wrap">
                      {doubt.reply}
                    </p>
                  </div>
                ) : (
                  role === "teacher" && (
                    /* Inline reply form for Teacher */
                    <div className="mt-4 pt-3 border-t border-rule/60">
                      <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                        Post Lecturer Clarification
                      </label>
                      <textarea
                        rows={3}
                        value={replyTextMap[doubt.id] ?? ""}
                        onChange={(e) =>
                          setReplyTextMap((prev) => ({ ...prev, [doubt.id]: e.target.value }))
                        }
                        placeholder="Write your explanation and pedagogical guidance here…"
                        className="w-full rounded-xl border border-rule/80 bg-paper/30 p-3 text-xs text-ink focus:border-terracotta focus:ring-1 focus:ring-terracotta focus:bg-white transition-all shadow-sm"
                      />
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => handleTeacherReply(doubt.id)}
                          disabled={replyingId === doubt.id || !replyTextMap[doubt.id]?.trim()}
                          className="flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-paper hover:bg-ink/90 active:scale-95 transition-all disabled:opacity-50 shadow-sm"
                        >
                          {replyingId === doubt.id ? (
                            <Loader2 size={13} className="animate-spin text-terracotta" />
                          ) : (
                            <Send size={13} />
                          )}
                          <span>Send Reply to Student</span>
                        </button>
                      </div>
                    </div>
                  )
                )}
              </article>
            );
          })}

          {!doubts.length && (
            <div className="rounded-2xl border border-dashed border-rule bg-white/60 p-10 text-center">
              <HelpCircle className="mx-auto h-8 w-8 text-muted/60" />
              <h4 className="mt-2 font-serif text-lg text-ink font-medium">No doubts submitted yet</h4>
              <p className="mt-1 text-xs text-muted max-w-md mx-auto">
                {role === "teacher"
                  ? "Students have not submitted any questions yet. They will appear here for review."
                  : "Whenever you encounter a confusing concept in your syllabus, submit it to your lecturer for assistance."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
