"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Trash2,
  Eye,
  Filter,
  Search,
  BookOpen,
  Layers,
  Sparkles,
  X,
  FileCheck,
} from "lucide-react";

type MaterialItem = {
  id: string;
  title: string;
  kind: string;
  filename: string;
  seeded: boolean;
  createdAt: Date | string;
  _count: { chunks: number };
};

type ChunkDetail = {
  id: string;
  section: string;
  content: string;
  index: number;
};

export function MaterialList({ initialMaterials }: { initialMaterials: MaterialItem[] }) {
  const router = useRouter();
  const [materials, setMaterials] = useState(initialMaterials);
  const [filterKind, setFilterKind] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState<{
    title: string;
    kind: string;
    chunks: ChunkDetail[];
  } | null>(null);
  const [loadingChunks, setLoadingChunks] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = materials.filter((m) => {
    const matchKind = filterKind === "all" || m.kind === filterKind;
    const matchSearch =
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.filename.toLowerCase().includes(search.toLowerCase());
    return matchKind && matchSearch;
  });

  async function inspectChunks(id: string) {
    setLoadingChunks(true);
    try {
      const res = await fetch(`/api/materials?id=${id}`);
      if (res.ok) {
        const json = await res.json();
        setSelectedMaterial({
          title: json.title,
          kind: json.kind,
          chunks: json.chunks ?? [],
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingChunks(false);
    }
  }

  async function deleteMaterial(id: string, title: string) {
    if (!confirm(`Are you sure you want to delete "${title}" and its indexed chunks?`)) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/materials?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setMaterials((prev) => prev.filter((m) => m.id !== id));
        router.refresh();
      } else {
        alert("Could not delete this material.");
      }
    } catch {
      alert("Error deleting material.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mt-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search materials by title or filename…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-rule/80 bg-white pl-10 pr-4 py-2 text-sm focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All" },
            { id: "syllabus", label: "Syllabus" },
            { id: "notes", label: "Notes" },
            { id: "textbook", label: "Textbooks" },
            { id: "past_paper", label: "Past Papers" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterKind(tab.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${
                filterKind === tab.id
                  ? "bg-ink text-paper shadow-sm"
                  : "bg-white border border-rule text-muted hover:border-ink/40"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Materials Grid / List */}
      <ul className="mt-4 grid gap-3">
        {filtered.map((m) => (
          <li
            key={m.id}
            className="rounded-2xl border border-rule/80 bg-white p-4 shadow-sm hover:shadow-card transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-paper border border-rule/60 text-ink">
                  <FileText size={18} className="text-terracotta" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-paper text-terracotta border border-terracotta/20">
                      {m.kind.replace("_", " ")}
                    </span>
                    {m.seeded && (
                      <span className="text-[10px] font-medium text-muted bg-rule/40 px-2 py-0.5 rounded-md">
                        Preloaded Demo
                      </span>
                    )}
                  </div>
                  <h2 className="mt-1 font-semibold text-ink text-base">{m.title}</h2>
                  <p className="text-xs text-muted mt-0.5 flex items-center gap-2">
                    <span>{m.filename}</span>
                    <span>•</span>
                    <span className="font-medium text-ink">{m._count.chunks} chunks</span>
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => inspectChunks(m.id)}
                  title="Inspect Chunks"
                  className="flex items-center gap-1 rounded-lg border border-rule/70 px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-paper transition-colors"
                >
                  <Eye size={13} className="text-muted" />
                  <span className="hidden sm:inline">Inspect</span>
                </button>
                <button
                  onClick={() => deleteMaterial(m.id, m.title)}
                  disabled={deletingId === m.id}
                  title="Delete Material"
                  className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </li>
        ))}

        {!filtered.length && (
          <div className="rounded-2xl border border-dashed border-rule bg-white/50 p-8 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-muted/60" />
            <p className="mt-2 text-sm font-medium text-ink">No study materials match your search.</p>
            <p className="mt-1 text-xs text-muted">Upload a new document or change the active filter.</p>
          </div>
        )}
      </ul>

      {/* Chunks Inspector Modal */}
      {selectedMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl border border-rule">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-rule/80 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-terracotta font-semibold">
                  {selectedMaterial.kind.replace("_", " ")}
                </p>
                <h3 className="font-serif text-xl font-medium text-ink">{selectedMaterial.title}</h3>
                <p className="text-xs text-muted">{selectedMaterial.chunks.length} chunks indexed for RAG</p>
              </div>
              <button
                onClick={() => setSelectedMaterial(null)}
                className="rounded-full p-1.5 text-muted hover:bg-paper hover:text-ink transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chunks List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {selectedMaterial.chunks.map((chunk) => (
                <article
                  key={chunk.id}
                  className="rounded-xl border border-rule/80 bg-paper/50 p-4 text-xs font-mono"
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-rule/60 text-muted">
                    <span className="font-semibold text-ink font-sans">
                      Chunk #{chunk.index + 1} — {chunk.section}
                    </span>
                    <span className="text-[10px] uppercase font-sans">ID: {chunk.id.slice(-6)}</span>
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed text-ink/90 font-sans text-xs">
                    {chunk.content}
                  </p>
                </article>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-rule/80 px-6 py-3 bg-paper/40 flex justify-end">
              <button
                onClick={() => setSelectedMaterial(null)}
                className="rounded-full bg-ink px-4 py-2 text-xs font-medium text-paper hover:opacity-90 transition-opacity"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
