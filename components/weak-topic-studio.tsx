"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Cite } from "@/components/cite";
import {
  Sparkles,
  BookOpen,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  Layers,
  Flame,
  Globe2,
  Mic,
  MicOff,
  Send,
  Loader2,
  ArrowRight,
  ShieldCheck,
  X,
} from "lucide-react";
import { LANGUAGES } from "@/app/(app)/assistant/chat-box";

type LearningMode =
  | "explain_simply"
  | "real_life_example"
  | "step_by_step"
  | "active_recall"
  | "flashcards"
  | "teach_back"
  | "mistake_practice";

interface WeakTopicStudioProps {
  topicId: string;
  topicName: string;
  sourceRef?: string;
  reason?: string;
  accuracy?: number;
  onClose?: () => void;
}

export function WeakTopicStudio({
  topicId,
  topicName,
  sourceRef = "Syllabus Notes",
  reason = "Identified as a critical knowledge gap needing review.",
  accuracy = 40,
  onClose,
}: WeakTopicStudioProps) {
  const [activeMode, setActiveMode] = useState<LearningMode>("explain_simply");
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(false);
  const [moduleData, setModuleData] = useState<any>(null);

  // Teach-back state
  const [teachBackInput, setTeachBackInput] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<any>(null);

  // Active recall user response state
  const [userRecallAnswer, setUserRecallAnswer] = useState("");
  const [revealedRecall, setRevealedRecall] = useState(false);

  // Flashcard flip state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Audio state (Text-to-Speech)
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Speech-to-Text state for Teach-Back mode
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Fetch module content when mode or language changes
  const fetchModule = useCallback(async (modeToFetch: LearningMode, langToFetch: string) => {
    if (modeToFetch === "teach_back") return; // Handled separately
    setLoading(true);
    setModuleData(null);
    setRevealedRecall(false);
    setUserRecallAnswer("");
    setIsFlipped(false);
    setCurrentCardIndex(0);

    try {
      const res = await fetch("/api/weak-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId,
          mode: modeToFetch,
          language: langToFetch,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setModuleData(data);
      }
    } catch (err) {
      console.error("Failed to fetch weak topic module:", err);
    } finally {
      setLoading(false);
    }
  }, [topicId]);

  useEffect(() => {
    fetchModule(activeMode, language);
  }, [activeMode, language, fetchModule]);

  // Audio Playback
  function handlePlayAudio(textToSpeak: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (isSpeaking && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      return;
    }
    if (isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = textToSpeak
      .replace(/\[\d+\]/g, "")
      .replace(/[*#_`]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const curLang = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];
    utterance.lang = curLang.speechLang;
    utterance.rate = 0.95;

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    setIsSpeaking(true);
    setIsPaused(false);
    window.speechSynthesis.speak(utterance);
  }

  function handleStopAudio() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
  }

  // Speech-to-Text Toggle for Teach-Back
  function toggleSpeechToText() {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      const curLang = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];
      recognition.lang = curLang.speechLang;
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setTeachBackInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  }

  // Handle Teach-Back Submission
  async function submitTeachBack(e: React.FormEvent) {
    e.preventDefault();
    if (!teachBackInput.trim() || evaluating) return;
    setEvaluating(true);
    setEvalResult(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: `Evaluate my understanding of ${topicName}: ${teachBackInput}`,
          language,
          mode: "evaluate",
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setEvalResult(json);
      }
    } catch (err) {
      console.error("Teach-back evaluation error:", err);
    } finally {
      setEvaluating(false);
    }
  }

  return (
    <div className="rounded-3xl border border-terracotta/40 bg-gradient-to-br from-white via-amber-50/20 to-white p-6 sm:p-8 shadow-card relative overflow-hidden">
      {/* Close button if rendered in modal */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-full p-2 text-muted hover:text-ink hover:bg-paper transition-colors"
          title="Close Studio"
        >
          <X size={18} />
        </button>
      )}

      {/* Header */}
      <div className="pb-5 border-b border-rule/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-terracotta/10 text-terracotta">
              <Sparkles size={16} />
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-terracotta bg-terracotta/10 px-2.5 py-0.5 rounded-full border border-terracotta/20">
              Interactive Gap Studio
            </span>
            <span className="text-xs text-muted font-mono">{sourceRef}</span>
          </div>
          <h3 className="mt-2 font-serif text-3xl text-ink font-medium">{topicName}</h3>
          <p className="mt-1 text-xs text-muted max-w-2xl leading-relaxed">
            <span className="font-semibold text-terracotta">Diagnostic Finding: </span>
            {reason} (Demonstrated Accuracy: {accuracy}%)
          </p>
        </div>

        {/* Language selector & audio controls */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-paper/60 px-2.5 py-1.5 rounded-xl border border-rule/70 text-xs">
            <Globe2 size={13} className="text-terracotta" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent font-medium text-ink focus:outline-none cursor-pointer"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name} ({l.native})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              if (moduleData?.content) handlePlayAudio(moduleData.content);
              else if (moduleData?.recallData)
                handlePlayAudio(
                  `${moduleData.recallData.question}. Hint: ${moduleData.recallData.hint}`,
                );
            }}
            className="flex items-center gap-1.5 rounded-xl bg-ink px-3 py-1.5 text-xs font-semibold text-paper hover:bg-ink/90 active:scale-95 transition-all shadow-xs"
            title="Read explanation aloud"
          >
            {isSpeaking ? (
              <>
                <Pause size={13} />
                <span>{isPaused ? "Resume Audio" : "Pause"}</span>
              </>
            ) : (
              <>
                <Volume2 size={13} className="text-terracotta" />
                <span>Listen</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mode Selector Pill Strip */}
      <div className="mt-5 flex flex-wrap items-center gap-2 pb-4 border-b border-rule/50 text-xs font-semibold">
        {[
          { id: "explain_simply", label: "Explain Simply", icon: Lightbulb },
          { id: "real_life_example", label: "Real-Life Example", icon: Sparkles },
          { id: "step_by_step", label: "Step-by-Step", icon: Layers },
          { id: "active_recall", label: "Active Recall", icon: HelpCircle },
          { id: "flashcards", label: "Flashcards", icon: BookOpen },
          { id: "teach_back", label: "Teach-Back Mode", icon: ShieldCheck },
          { id: "mistake_practice", label: "Targeted Practice", icon: CheckCircle2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeMode === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveMode(tab.id as LearningMode)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 transition-all ${
                active
                  ? "bg-terracotta text-white shadow-xs font-bold"
                  : "bg-paper/60 border border-rule/80 text-muted hover:border-ink/40 hover:text-ink"
              }`}
            >
              <Icon size={13} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Mode Content Area */}
      <div className="mt-6 min-h-[260px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted text-xs">
            <Loader2 className="animate-spin text-terracotta mb-2" size={24} />
            <span>Calibrating learning module for {topicName}…</span>
          </div>
        ) : (
          <div>
            {/* 1. Explain Simply, 2. Real-Life Example, 3. Step-by-Step, 6. Mistake Practice */}
            {moduleData?.content && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-rule/70 bg-white p-6 shadow-xs leading-relaxed text-sm text-ink/90 whitespace-pre-line">
                  {moduleData.content}
                </div>

                {moduleData.citations && moduleData.citations.length > 0 && (
                  <div className="pt-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2">
                      Grounded Syllabus Citations:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {moduleData.citations.map((c: any, i: number) => (
                        <Cite
                          key={i}
                          title={c.title}
                          section={c.section}
                          excerpt={c.excerpt}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. Active Recall Mode */}
            {activeMode === "active_recall" && moduleData?.recallData && (
              <div className="rounded-2xl border border-rule/80 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700">
                  <HelpCircle size={15} />
                  <span>Active Recall Test</span>
                </div>

                <h4 className="font-serif text-xl text-ink font-medium">
                  {moduleData.recallData.question}
                </h4>

                <p className="text-xs text-muted italic bg-paper/60 p-3 rounded-xl border border-rule/50">
                  💡 <strong>Hint:</strong> {moduleData.recallData.hint}
                </p>

                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                    Your Answer (Test your memory before looking):
                  </label>
                  <textarea
                    rows={3}
                    value={userRecallAnswer}
                    onChange={(e) => setUserRecallAnswer(e.target.value)}
                    placeholder="Type your explanation here..."
                    className="w-full rounded-xl border border-rule bg-paper/20 p-3 text-sm text-ink focus:border-terracotta focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setRevealedRecall(!revealedRecall)}
                    className="rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-paper hover:bg-ink/90 active:scale-95 transition-all"
                  >
                    {revealedRecall ? "Hide Model Solution" : "Reveal Model Solution"}
                  </button>
                </div>

                {revealedRecall && (
                  <div className="mt-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2 animate-in fade-in">
                    <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      Ideal Model Answer:
                    </p>
                    <p className="text-sm text-ink leading-relaxed">
                      {moduleData.recallData.idealAnswer}
                    </p>
                    <div className="pt-2 flex items-center gap-2 text-xs text-muted">
                      <span className="font-semibold text-ink">Key phrases to verify:</span>
                      {moduleData.recallData.keyPhrases.map((kp: string, i: number) => (
                        <span
                          key={i}
                          className="bg-white border border-emerald-200 px-2 py-0.5 rounded-md font-mono text-[11px] text-emerald-900"
                        >
                          {kp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 5. Flashcards Mode */}
            {activeMode === "flashcards" && moduleData?.cards && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>
                    Card {currentCardIndex + 1} of {moduleData.cards.length}
                  </span>
                  <span>Click card to flip front / back</span>
                </div>

                {/* Flip Card */}
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className={`min-h-[200px] cursor-pointer rounded-3xl border p-8 flex flex-col justify-between transition-all duration-300 shadow-sm ${
                    isFlipped
                      ? "border-emerald-300 bg-emerald-50/40 text-ink"
                      : "border-rule/80 bg-white hover:border-terracotta/40"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted">
                    <span>{isFlipped ? "ANSWER / EXPLANATION" : "QUESTION / PROMPT"}</span>
                    <span className="text-terracotta">Click to flip ↻</span>
                  </div>

                  <div className="my-auto py-4 text-center">
                    <p className="font-serif text-xl sm:text-2xl text-ink font-medium">
                      {isFlipped
                        ? moduleData.cards[currentCardIndex].back
                        : moduleData.cards[currentCardIndex].front}
                    </p>
                    {isFlipped && moduleData.cards[currentCardIndex].tip && (
                      <p className="mt-3 text-xs text-emerald-800 italic">
                        Tip: {moduleData.cards[currentCardIndex].tip}
                      </p>
                    )}
                  </div>

                  <div className="text-center text-[11px] text-muted font-medium">
                    {isFlipped ? "✓ Concept recalled" : "Think of the answer, then click to check"}
                  </div>
                </div>

                {/* Card Nav Controls */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    disabled={currentCardIndex === 0}
                    onClick={() => {
                      setCurrentCardIndex((prev) => Math.max(0, prev - 1));
                      setIsFlipped(false);
                    }}
                    className="rounded-xl border border-rule bg-white px-3.5 py-1.5 text-xs font-semibold text-ink hover:bg-paper disabled:opacity-40"
                  >
                    ← Previous
                  </button>

                  <button
                    disabled={currentCardIndex === moduleData.cards.length - 1}
                    onClick={() => {
                      setCurrentCardIndex((prev) => Math.min(moduleData.cards.length - 1, prev + 1));
                      setIsFlipped(false);
                    }}
                    className="rounded-xl bg-ink px-4 py-1.5 text-xs font-semibold text-paper hover:bg-ink/90 disabled:opacity-40"
                  >
                    Next Card →
                  </button>
                </div>
              </div>
            )}

            {/* 6. Teach-Back Mode */}
            {activeMode === "teach_back" && (
              <div className="rounded-2xl border border-rule/80 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-terracotta">
                  <ShieldCheck size={16} />
                  <span>Feynman Technique: Teach-Back Mode</span>
                </div>

                <h4 className="font-serif text-xl text-ink font-medium">
                  Explain &quot;{topicName}&quot; as if teaching it to a classmate
                </h4>
                <p className="text-xs text-muted leading-relaxed">
                  Studies show explaining a concept in your own words creates deep retention. The AI evaluator will diagnose your explanation, detect missing details, and provide constructive feedback.
                </p>

                <form onSubmit={submitTeachBack} className="space-y-3">
                  <div className="relative">
                    <textarea
                      rows={4}
                      value={teachBackInput}
                      onChange={(e) => setTeachBackInput(e.target.value)}
                      placeholder={`Explain ${topicName} in simple words, including how it works and an example...`}
                      className="w-full rounded-2xl border border-rule bg-paper/20 p-4 text-sm text-ink focus:border-terracotta focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={toggleSpeechToText}
                      className={`absolute right-3 bottom-3.5 rounded-xl p-2 transition-all ${
                        isListening
                          ? "bg-rose-500 text-white animate-pulse"
                          : "bg-paper border border-rule text-muted hover:text-ink"
                      }`}
                      title={isListening ? "Stop listening" : "Speak your explanation"}
                    >
                      {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted">
                      {isListening ? "Listening… speak now." : "You can speak or type your answer."}
                    </span>

                    <button
                      type="submit"
                      disabled={evaluating || !teachBackInput.trim()}
                      className="inline-flex items-center gap-2 rounded-xl bg-terracotta px-5 py-2.5 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-50 active:scale-95 transition-all shadow-sm"
                    >
                      {evaluating ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Evaluating…</span>
                        </>
                      ) : (
                        <>
                          <Send size={13} />
                          <span>Evaluate My Explanation</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Evaluation Results */}
                {evalResult?.evaluation && (
                  <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                        Diagnostic Evaluation
                      </span>
                      <span className="font-mono text-sm font-bold text-ink bg-white px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Score: {evalResult.evaluation.scoreOutOf10}/10
                      </span>
                    </div>

                    {evalResult.evaluation.misconceptions?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-rose-800 mb-1">
                          Missing Concepts / Misconceptions:
                        </p>
                        <ul className="text-xs text-rose-900/90 list-disc list-inside space-y-0.5">
                          {evalResult.evaluation.misconceptions.map((m: string, i: number) => (
                            <li key={i}>{m}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {evalResult.evaluation.correctedAnswer && (
                      <div>
                        <p className="text-xs font-semibold text-emerald-900 mb-1">
                          Corrected Model Explanation:
                        </p>
                        <p className="text-xs text-ink/90 leading-relaxed bg-white p-3 rounded-xl border border-emerald-200/80">
                          {evalResult.evaluation.correctedAnswer}
                        </p>
                      </div>
                    )}

                    {evalResult.evaluation.constructiveFeedback && (
                      <p className="text-xs text-muted italic">
                        Feedback: {evalResult.evaluation.constructiveFeedback}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="mt-8 pt-4 border-t border-rule/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="text-muted">
          ⚖️ Learning classifications are evidence-based metrics from diagnostic answers.
        </span>

        <div className="flex items-center gap-2">
          <Link
            href={`/quiz?topicId=${topicId}`}
            className="rounded-xl border border-rule bg-white px-3.5 py-2 font-semibold text-ink hover:bg-paper transition-all"
          >
            Take 5-Question Drill
          </Link>
          <Link
            href={`/assistant?q=Explain ${encodeURIComponent(topicName)} in simple words`}
            className="inline-flex items-center gap-1 rounded-xl bg-terracotta px-4 py-2 font-semibold text-white hover:brightness-110 active:scale-95 transition-all shadow-sm"
          >
            <span>Ask Tutor More</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
