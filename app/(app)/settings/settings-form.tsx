"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  Loader2,
  CheckCircle2,
  Globe2,
  Calendar,
  Clock,
  User,
  Volume2,
} from "lucide-react";

const LANGUAGES = [
  { code: "en", name: "English", native: "English" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", native: "മലയാളം" },
];

export function SettingsForm({
  initialUser,
}: {
  initialUser: {
    id: string;
    name: string;
    email: string;
    role: string;
    hoursPerDay: number;
    examDate: string | null;
    preferredLanguage: string;
  };
}) {
  const router = useRouter();
  const [name, setName] = useState(initialUser.name);
  const [hoursPerDay, setHoursPerDay] = useState(initialUser.hoursPerDay);
  const [examDate, setExamDate] = useState(initialUser.examDate ?? "");
  const [preferredLanguage, setPreferredLanguage] = useState(initialUser.preferredLanguage || "en");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          hoursPerDay,
          examDate,
          preferredLanguage,
        }),
      });
      if (res.ok) {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert("Could not update settings.");
      }
    } catch {
      alert("Network error updating settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Account Info Card */}
      <div className="rounded-3xl border border-rule/80 bg-white p-6 sm:p-8 shadow-card space-y-5">
        <h2 className="font-serif text-2xl text-ink font-medium pb-2 border-b border-rule/60 flex items-center gap-2">
          <User size={18} className="text-terracotta" />
          <span>Profile & Role</span>
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border border-rule/80 bg-paper/30 px-3.5 py-2.5 text-sm text-ink focus:border-terracotta focus:ring-1 focus:ring-terracotta focus:bg-white transition-all shadow-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              disabled
              value={initialUser.email}
              className="w-full rounded-xl border border-rule/60 bg-paper/70 px-3.5 py-2.5 text-sm text-muted cursor-not-allowed shadow-inner"
            />
          </div>
        </div>

        <div>
          <span className="text-xs text-muted">
            Workspace Role: <strong className="text-ink uppercase">{initialUser.role}</strong>
          </span>
        </div>
      </div>

      {/* Multilingual Learning & Voice Preferences */}
      <div className="rounded-3xl border border-rule/80 bg-white p-6 sm:p-8 shadow-card space-y-5">
        <h2 className="font-serif text-2xl text-ink font-medium pb-2 border-b border-rule/60 flex items-center gap-2">
          <Globe2 size={18} className="text-terracotta" />
          <span>Multilingual & Voice Settings</span>
        </h2>

        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
            Default Explanation Language
          </label>
          <p className="text-xs text-muted mb-2">
            The AI Study Assistant and Voice Studio will formulate grounded topic breakdowns in this language:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {LANGUAGES.map((lang) => (
              <button
                type="button"
                key={lang.code}
                onClick={() => setPreferredLanguage(lang.code)}
                className={`flex flex-col p-3 rounded-xl border text-left transition-all ${
                  preferredLanguage === lang.code
                    ? "border-terracotta bg-terracotta/10 text-terracotta shadow-sm font-semibold"
                    : "border-rule/80 bg-paper/20 hover:bg-paper/50 text-ink"
                }`}
              >
                <span className="font-semibold text-sm">{lang.name}</span>
                <span className="text-xs text-muted">{lang.native}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Revision Calendar Schedule */}
      <div className="rounded-3xl border border-rule/80 bg-white p-6 sm:p-8 shadow-card space-y-5">
        <h2 className="font-serif text-2xl text-ink font-medium pb-2 border-b border-rule/60 flex items-center gap-2">
          <Calendar size={18} className="text-terracotta" />
          <span>Study Plan Targets</span>
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
              Daily Hours Available
            </label>
            <input
              type="number"
              min={0.5}
              max={12}
              step={0.5}
              value={hoursPerDay}
              onChange={(e) => setHoursPerDay(Number(e.target.value))}
              required
              className="w-full rounded-xl border border-rule/80 bg-paper/30 px-3.5 py-2.5 text-sm text-ink focus:border-terracotta focus:ring-1 focus:ring-terracotta focus:bg-white transition-all shadow-sm"
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
              className="w-full rounded-xl border border-rule/80 bg-paper/30 px-3.5 py-2.5 text-sm text-ink focus:border-terracotta focus:ring-1 focus:ring-terracotta focus:bg-white transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-2">
        {saved ? (
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span>Preferences saved successfully!</span>
          </div>
        ) : (
          <div />
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-ink px-6 py-3 text-xs font-semibold text-paper hover:bg-ink/90 active:scale-95 transition-all disabled:opacity-50 shadow-sm"
        >
          {saving ? <Loader2 size={14} className="animate-spin text-terracotta" /> : <Save size={14} />}
          <span>{saving ? "Saving…" : "Save Preferences"}</span>
        </button>
      </div>
    </form>
  );
}
