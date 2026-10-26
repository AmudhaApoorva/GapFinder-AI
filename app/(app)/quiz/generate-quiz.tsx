"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Loader2, Sparkles, Target, ChevronDown } from "lucide-react";

type TopicOption = {
  id: string;
  name: string;
};

export function GenerateQuiz({ topics }: { topics?: TopicOption[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");

  async function createQuiz(topicId?: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(topicId ? { topicId } : {}),
      });
      const json = await res.json();
      if (res.ok && json.id) {
        setOpenModal(false);
        router.push(`/quiz/${json.id}`);
      } else {
        alert(json.error ?? "Could not generate quiz");
      }
    } catch {
      alert("Error generating quiz");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => createQuiz()}
          disabled={busy}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-terracotta to-[#d96e38] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-110 active:scale-95 transition-all disabled:opacity-60"
        >
          {busy ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Generating Items…</span>
            </>
          ) : (
            <>
              <Zap size={16} className="fill-current" />
              <span>New Diagnostic Quiz</span>
            </>
          )}
        </button>

        {topics && topics.length > 0 && (
          <button
            onClick={() => setOpenModal(true)}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-xl border border-rule/90 bg-white px-3.5 py-2.5 text-sm font-medium text-ink hover:bg-paper transition-all shadow-sm"
          >
            <Target size={15} className="text-terracotta" />
            <span>Targeted Drill</span>
            <ChevronDown size={14} className="text-muted" />
          </button>
        )}
      </div>

      {/* Targeted Drill Selection Modal */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-rule">
            <h3 className="font-serif text-2xl text-ink">Targeted Topic Drill</h3>
            <p className="mt-1 text-xs text-muted">
              Focus specifically on an individual unit or weak topic to test targeted concept mastery.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                Select Syllabus Unit
              </label>
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="w-full rounded-xl border border-rule/90 bg-paper/40 p-2.5 text-sm text-ink focus:border-terracotta focus:ring-1 focus:ring-terracotta"
              >
                <option value="">-- Choose a topic to drill --</option>
                {topics?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-medium text-muted hover:bg-paper"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => createQuiz(selectedTopicId || undefined)}
                disabled={busy || !selectedTopicId}
                className="flex items-center gap-2 rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-paper hover:bg-ink/90 disabled:opacity-50"
              >
                {busy && <Loader2 size={13} className="animate-spin text-terracotta" />}
                <span>Start Drill</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
