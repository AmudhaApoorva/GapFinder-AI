"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LevelBadge } from "@/components/badge";
import {
  Map,
  Search,
  MessageSquare,
  Zap,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ArrowRight,
  Loader2,
} from "lucide-react";

type TopicData = {
  id: string;
  name: string;
  description: string;
  parentName: string | null;
  sourceRef: string;
  order: number;
  mastery: {
    level: string;
    accuracy: number;
    reason: string;
  }[];
};

export function TopicExplorer({ topics }: { topics: TopicData[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [drillingTopicId, setDrillingTopicId] = useState<string | null>(null);

  const weakCount = topics.filter((t) => t.mastery[0]?.level === "weak").length;
  const mediumCount = topics.filter((t) => t.mastery[0]?.level === "medium").length;
  const strongCount = topics.filter((t) => t.mastery[0]?.level === "strong").length;
  const unratedCount = topics.filter((t) => !t.mastery[0] || t.mastery[0].level === "unrated").length;

  const filtered = topics.filter((t) => {
    const level = t.mastery[0]?.level ?? "unrated";
    const matchesFilter = filter === "all" || level === filter;
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.sourceRef.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  async function startTopicDrill(topicId: string, topicName: string) {
    setDrillingTopicId(topicId);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, title: `Drill: ${topicName}` }),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        router.push(`/quiz/${data.id}`);
      } else {
        alert(data.error ?? "Failed to generate topic drill.");
        setDrillingTopicId(null);
      }
    } catch {
      alert("Error starting quiz drill.");
      setDrillingTopicId(null);
    }
  }

  return (
    <div className="mt-8">
      {/* Metric summary banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setFilter("all")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filter === "all"
              ? "bg-ink text-paper border-ink shadow-sm"
              : "bg-white border-rule/80 hover:border-ink/30"
          }`}
        >
          <p className="text-[10px] uppercase font-bold tracking-wider opacity-70">Total Topics</p>
          <p className="font-serif text-3xl font-medium mt-1">{topics.length}</p>
        </button>

        <button
          onClick={() => setFilter("weak")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filter === "weak"
              ? "bg-terracotta text-white border-terracotta shadow-sm"
              : "bg-white border-rule/80 hover:border-terracotta/40"
          }`}
        >
          <p className="text-[10px] uppercase font-bold tracking-wider text-terracotta opacity-90">
            Critical Gaps
          </p>
          <p className="font-serif text-3xl font-medium mt-1 flex items-center gap-1.5">
            {weakCount}
            <AlertTriangle size={18} className="text-terracotta shrink-0" />
          </p>
        </button>

        <button
          onClick={() => setFilter("medium")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filter === "medium"
              ? "bg-[#6d4e12] text-white border-[#6d4e12] shadow-sm"
              : "bg-white border-rule/80 hover:border-gold/40"
          }`}
        >
          <p className="text-[10px] uppercase font-bold tracking-wider text-gold opacity-90">
            Needs Review
          </p>
          <p className="font-serif text-3xl font-medium mt-1 flex items-center gap-1.5">
            {mediumCount}
            <Clock size={18} className="text-gold shrink-0" />
          </p>
        </button>

        <button
          onClick={() => setFilter("strong")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filter === "strong"
              ? "bg-forest text-white border-forest shadow-sm"
              : "bg-white border-rule/80 hover:border-forest/40"
          }`}
        >
          <p className="text-[10px] uppercase font-bold tracking-wider text-forest opacity-90">
            Mastered
          </p>
          <p className="font-serif text-3xl font-medium mt-1 flex items-center gap-1.5">
            {strongCount}
            <CheckCircle2 size={18} className="text-forest shrink-0" />
          </p>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative mt-6">
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-muted" />
        <input
          type="text"
          placeholder="Filter topics by name, concept, or syllabus unit…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-rule/80 bg-white pl-10 pr-4 py-2.5 text-sm focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-all shadow-sm"
        />
      </div>

      {/* Topic Cards List */}
      <ol className="mt-6 grid gap-4">
        {filtered.map((topic, i) => {
          const m = topic.mastery[0];
          const level = m?.level ?? "unrated";
          const accuracyPct = m ? Math.round(m.accuracy * 100) : null;
          const isDrilling = drillingTopicId === topic.id;

          return (
            <li
              key={topic.id}
              className="rounded-2xl border border-rule/80 bg-white p-5 shadow-sm hover:shadow-card transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-semibold text-muted bg-paper px-2 py-0.5 rounded-md border border-rule/60">
                      Unit {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-xs text-muted">
                      Source: <span className="font-medium text-ink">{topic.sourceRef}</span>
                    </span>
                  </div>
                  <h2 className="font-serif text-2xl text-ink font-medium">{topic.name}</h2>
                  <p className="text-sm text-muted leading-relaxed max-w-3xl">{topic.description}</p>

                  {/* Accuracy Bar if evaluated */}
                  {accuracyPct !== null ? (
                    <div className="pt-2 max-w-md">
                      <div className="flex items-center justify-between text-xs font-medium mb-1">
                        <span className="text-muted">Diagnostic Accuracy</span>
                        <span className="font-semibold text-ink">{accuracyPct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-rule/50 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            level === "weak"
                              ? "bg-terracotta"
                              : level === "medium"
                                ? "bg-gold"
                                : "bg-forest"
                          }`}
                          style={{ width: `${Math.max(6, accuracyPct)}%` }}
                        />
                      </div>
                      {m?.reason && (
                        <p className="mt-2 text-xs text-muted/90 bg-paper/60 p-2.5 rounded-lg border border-rule/50">
                          <span className="font-semibold text-ink">Diagnosis: </span>
                          {m.reason}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted pt-1 italic">
                      Not diagnosed yet. Take a quiz to evaluate your mastery on this node.
                    </p>
                  )}
                </div>

                {/* Right Column: Level Badge & Quick Actions */}
                <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-3 shrink-0">
                  <LevelBadge level={level} />

                  <div className="flex items-center gap-2 pt-2 sm:pt-0">
                    <Link
                      href={`/assistant?q=${encodeURIComponent(`Explain the core concepts and common exam pitfalls of "${topic.name}" from our syllabus notes.`)}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rule/80 px-3 py-1.5 text-xs font-medium text-ink hover:bg-paper transition-colors"
                      title="Explain this topic with citations"
                    >
                      <MessageSquare size={13} className="text-terracotta" />
                      <span>Explain</span>
                    </Link>

                    <button
                      onClick={() => startTopicDrill(topic.id, topic.name)}
                      disabled={isDrilling}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-3 py-1.5 text-xs font-semibold text-paper hover:bg-ink/90 active:scale-95 transition-all disabled:opacity-60"
                      title="Generate a targeted quiz for this topic"
                    >
                      {isDrilling ? (
                        <Loader2 size={13} className="animate-spin text-terracotta" />
                      ) : (
                        <Zap size={13} className="text-terracotta fill-current" />
                      )}
                      <span>Drill Topic</span>
                    </button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}

        {!filtered.length && (
          <div className="rounded-2xl border border-dashed border-rule bg-white p-8 text-center">
            <Map className="mx-auto h-8 w-8 text-muted/60" />
            <p className="mt-2 text-sm font-medium text-ink">No topics matched your search criteria.</p>
            <p className="mt-1 text-xs text-muted">Clear the filter or rebuild your topic taxonomy.</p>
          </div>
        )}
      </ol>
    </div>
  );
}
