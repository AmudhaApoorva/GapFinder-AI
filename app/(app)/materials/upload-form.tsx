"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  MapPin,
} from "lucide-react";

export function UploadForm() {
  const router = useRouter();
  const [tab, setTab] = useState<"file" | "paste">("file");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);
  const [fileName, setFileName] = useState("");
  const [pastedText, setPastedText] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    setBusy(true);
    setStatus({ type: "info", msg: "Extracting content, chunking sections, and generating vectors…" });

    try {
      const res = await fetch("/api/materials", { method: "POST", body: data });
      const json = await res.json();
      if (!res.ok) {
        setStatus({ type: "error", msg: json.error ?? "Failed to ingest material." });
        setBusy(false);
        return;
      }
      setStatus({
        type: "success",
        msg: `Successfully indexed "${json.title}" into ${json.chunks} RAG chunks.`,
      });
      form.reset();
      setFileName("");
      setPastedText("");
      router.refresh();
    } catch {
      setStatus({ type: "error", msg: "Network error while uploading." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-rule/80 bg-white p-6 shadow-card">
      <div className="flex items-center justify-between pb-3 border-b border-rule/60">
        <div>
          <h2 className="font-serif text-2xl text-ink">Add study material</h2>
          <p className="text-xs text-muted mt-0.5">Syllabus, notes, or textbook extracts</p>
        </div>
        {/* Tab switch */}
        <div className="flex rounded-lg bg-paper p-1 border border-rule/60">
          <button
            type="button"
            onClick={() => setTab("file")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
              tab === "file" ? "bg-white text-ink shadow-sm font-semibold" : "text-muted hover:text-ink"
            }`}
          >
            File
          </button>
          <button
            type="button"
            onClick={() => setTab("paste")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
              tab === "paste" ? "bg-white text-ink shadow-sm font-semibold" : "text-muted hover:text-ink"
            }`}
          >
            Paste Text
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-3.5">
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider">Document Title</label>
          <input
            name="title"
            required
            placeholder="e.g. CBSE Unit 1 - Computational Thinking"
            className="mt-1 w-full rounded-xl border border-rule/80 bg-paper/30 px-3.5 py-2.5 text-sm focus:border-terracotta focus:ring-1 focus:ring-terracotta focus:bg-white transition-all shadow-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider">Material Kind</label>
          <select
            name="kind"
            className="mt-1 w-full rounded-xl border border-rule/80 bg-paper/30 px-3.5 py-2.5 text-sm focus:border-terracotta focus:ring-1 focus:ring-terracotta focus:bg-white transition-all shadow-sm"
          >
            <option value="syllabus">Syllabus (defines topic map)</option>
            <option value="notes">Class Notes / Summary</option>
            <option value="textbook">Textbook Chapter</option>
            <option value="past_paper">Past Paper / Examiner Key</option>
          </select>
        </div>

        {tab === "file" ? (
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider">
              File Attachment (.pdf, .md, .txt)
            </label>
            <label className="mt-1 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-rule/90 bg-paper/40 p-4 text-center cursor-pointer hover:border-terracotta/60 hover:bg-paper transition-all">
              <Upload className="h-6 w-6 text-muted mb-1" />
              <span className="text-xs font-medium text-ink">
                {fileName ? fileName : "Click to browse or drop file here"}
              </span>
              <span className="text-[10px] text-muted mt-0.5">PDF or Markdown files up to 8 MB</span>
              <input
                name="file"
                type="file"
                accept=".pdf,.txt,.md,.markdown"
                required={tab === "file"}
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center">
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider">
                Paste Content / Markdown
              </label>
              <span className="text-[10px] text-muted">{pastedText.length} characters</span>
            </div>
            <textarea
              name="text"
              rows={5}
              required={tab === "paste"}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste chapters, headings, key points, or notes directly here…"
              className="mt-1 w-full rounded-xl border border-rule/80 bg-paper/30 p-3 text-xs leading-relaxed font-mono focus:border-terracotta focus:ring-1 focus:ring-terracotta focus:bg-white transition-all shadow-sm"
            />
          </div>
        )}

        <button
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-ink py-2.5 px-4 text-sm font-semibold text-paper hover:bg-ink/90 active:scale-[0.99] transition-all disabled:opacity-60 shadow-sm"
        >
          {busy ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-terracotta" />
              <span>Ingesting and Vectorizing…</span>
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 text-terracotta" />
              <span>Ingest & Index Document</span>
            </>
          )}
        </button>

        {status && (
          <div
            className={`flex items-start gap-2 rounded-xl p-3 text-xs leading-relaxed ${
              status.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : status.type === "error"
                  ? "bg-rose-50 text-rose-800 border border-rose-200"
                  : "bg-amber-50 text-amber-800 border border-amber-200"
            }`}
          >
            {status.type === "success" && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />}
            {status.type === "error" && <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />}
            {status.type === "info" && <Loader2 className="w-4 h-4 shrink-0 animate-spin text-amber-600 mt-0.5" />}
            <span className="flex-1">{status.msg}</span>
          </div>
        )}
      </div>
    </form>
  );
}

export function RebuildTopics() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  async function run() {
    if (
      !confirm(
        "Rebuilding the topic map will sync with your latest uploaded syllabus and reset prior quiz attempts for a fresh diagnosis. Continue?",
      )
    ) {
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/topics", { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        setStatus({
          type: "success",
          msg: `Successfully extracted and mapped ${json.count} topics from your syllabus.`,
        });
        router.refresh();
      } else {
        setStatus({ type: "error", msg: json.error ?? "Failed to rebuild topic map." });
      }
    } catch {
      setStatus({ type: "error", msg: "Network error while connecting to server." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-rule/90 bg-white/60 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-terracotta/10 text-terracotta">
          <MapPin size={16} />
        </div>
        <div className="flex-1">
          <h3 className="font-serif text-lg text-ink">Rebuild Topic Taxonomy</h3>
          <p className="mt-1 text-xs text-muted leading-relaxed">
            Parses syllabus markdown headings to construct fresh diagnosis nodes. Use this whenever you add or modify a syllabus file.
          </p>

          <button
            onClick={run}
            disabled={busy}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-ink/80 px-3.5 py-1.5 text-xs font-semibold text-ink hover:bg-ink hover:text-paper transition-all disabled:opacity-50"
          >
            <RefreshCw size={13} className={busy ? "animate-spin" : ""} />
            <span>{busy ? "Parsing syllabus headings…" : "Rebuild Topic Map"}</span>
          </button>

          {status && (
            <div
              className={`mt-3 flex items-center gap-2 rounded-lg p-2.5 text-xs ${
                status.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {status.type === "success" ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              )}
              <span>{status.msg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
