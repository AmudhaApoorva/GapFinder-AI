"use client";

import { FormEvent, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Cite } from "@/components/cite";
import {
  Send,
  Loader2,
  Trash2,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Pause,
  Play,
  Globe2,
  ShieldCheck,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

export type Turn = {
  id: string;
  role: string;
  content: string;
  citations: { title: string; section: string; excerpt: string }[];
  sourceType?: "uploaded_materials" | "general_academic" | "evaluation";
  sourceLabel?: string;
  evaluation?: {
    isEvaluation: boolean;
    scoreOutOf10: number;
    verdict: "correct" | "partially_correct" | "needs_improvement" | "incorrect";
    misconceptions: string[];
    correctedAnswer: string;
    constructiveFeedback: string;
  };
  followUpQuestions?: string[];
};

export const LANGUAGES = [
  { code: "en", name: "English", native: "English", speechLang: "en-IN" },
  { code: "te", name: "Telugu", native: "తెలుగు", speechLang: "te-IN" },
  { code: "hi", name: "Hindi", native: "हिन्दी", speechLang: "hi-IN" },
  { code: "ta", name: "Tamil", native: "தமிழ்", speechLang: "ta-IN" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", speechLang: "kn-IN" },
  { code: "ml", name: "Malayalam", native: "മലയാളം", speechLang: "ml-IN" },
];

export function ChatBox({
  initial,
  suggestedPrompts,
}: {
  initial: Turn[];
  suggestedPrompts: string[];
}) {
  const searchParams = useSearchParams();
  const [turns, setTurns] = useState<Turn[]>(initial);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [language, setLanguage] = useState("en");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<"chat" | "evaluate">("chat");

  // Speech Recognition (Speech-to-Text) State
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Text-to-Speech State
  const [speakingTurnId, setSpeakingTurnId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Check speech recognition support
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
      }
    }
  }, []);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Auto-fill from query param (e.g. ?q=Explain...)
  useEffect(() => {
    const q = searchParams.get("q");
    if (q && q.trim()) {
      setInput(q.trim());
    }
  }, [searchParams]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  // Speech-to-Text toggle
  function toggleSpeechToText() {
    if (!speechSupported) {
      setSpeechNotice(
        "Browser speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.",
      );
      setTimeout(() => setSpeechNotice(null), 5000);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      const currentLang = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];
      recognition.lang = currentLang.speechLang;
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechNotice(`Listening in ${currentLang.name}... Speak now.`);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
        setSpeechNotice("Speech captured! You can review or edit before asking.");
        setTimeout(() => setSpeechNotice(null), 4000);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === "not-allowed") {
          setSpeechNotice("Microphone permission was denied. Please allow microphone access in your browser.");
        } else {
          setSpeechNotice("Speech recognition stopped. You can try speaking again.");
        }
        setTimeout(() => setSpeechNotice(null), 5000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Speech error", err);
      setIsListening(false);
      setSpeechNotice("Microphone could not be initialized.");
      setTimeout(() => setSpeechNotice(null), 4000);
    }
  }

  // Text-to-Speech toggle with Play / Pause / Stop controls
  function handlePlayAudio(turnId: string, text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      alert("Text-to-speech audio is not supported on this browser.");
      return;
    }

    // If currently speaking this turn and paused, resume
    if (speakingTurnId === turnId && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      return;
    }

    // If currently speaking this turn and playing, pause
    if (speakingTurnId === turnId && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      return;
    }

    // New audio playback
    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/\[\d+\]/g, "") // strip citation brackets
      .replace(/[*#_`]/g, " ") // strip markdown formatting characters for clean speech
      .replace(/\s+/g, " ")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const currentLang = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];
    utterance.lang = currentLang.speechLang;
    utterance.rate = 0.95;

    utterance.onend = () => {
      setSpeakingTurnId(null);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setSpeakingTurnId(null);
      setIsPaused(false);
    };

    setSpeakingTurnId(turnId);
    setIsPaused(false);
    window.speechSynthesis.speak(utterance);
  }

  function handleStopAudio() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeakingTurnId(null);
    setIsPaused(false);
  }

  async function handleAsk(questionText: string, modeOverride?: "chat" | "evaluate") {
    const q = questionText.trim();
    if (!q || busy) return;

    const requestMode = modeOverride || activeMode;
    setBusy(true);
    setInput("");
    const userTurn: Turn = {
      id: crypto.randomUUID(),
      role: "user",
      content: q,
      citations: [],
    };
    setTurns((prev) => [...prev, userTurn]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, language, mode: requestMode }),
      });
      const json = await res.json();
      if (res.ok) {
        setTurns((prev) => [...prev, json]);
      } else {
        setTurns((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: json.error ?? "Failed to retrieve an answer from your notes.",
            citations: [],
            sourceType: "general_academic",
            sourceLabel: "Assistant Notice",
          },
        ]);
      }
    } catch {
      setTurns((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Network error while connecting to the assistant. Please check your connection.",
          citations: [],
          sourceType: "general_academic",
          sourceLabel: "Connection Notice",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    handleAsk(input);
  }

  async function clearHistory() {
    if (!confirm("Clear this entire explain-topic chat session?")) return;
    try {
      const res = await fetch("/api/chat", { method: "DELETE" });
      if (res.ok) setTurns([]);
    } catch {
      alert("Error clearing chat history.");
    }
  }

  function copyAnswer(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const currentLangObj = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  return (
    <div className="mt-8 flex flex-col min-h-[620px] justify-between">
      {/* Top Action Bar: Modes, Language Selector, Clear Chat */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-rule/60">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center rounded-xl bg-paper p-1 border border-rule/80 text-xs">
            <button
              type="button"
              onClick={() => setActiveMode("chat")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeMode === "chat"
                  ? "bg-white text-ink shadow-xs font-semibold"
                  : "text-muted hover:text-ink"
              }`}
            >
              Ask Doubt / Concept
            </button>
            <button
              type="button"
              onClick={() => setActiveMode("evaluate")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeMode === "evaluate"
                  ? "bg-terracotta text-white shadow-xs font-semibold"
                  : "text-muted hover:text-ink"
              }`}
            >
              Evaluate My Answer
            </button>
          </div>

          {/* Multilingual Selector */}
          <div className="flex items-center gap-1.5 rounded-xl border border-rule/80 bg-white px-2.5 py-1 text-xs shadow-xs">
            <Globe2 size={13} className="text-terracotta shrink-0" />
            <span className="text-[11px] font-semibold text-muted">Language:</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent font-semibold text-ink text-xs focus:outline-none cursor-pointer"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name} ({l.native})
                </option>
              ))}
            </select>
          </div>
        </div>

        {turns.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-rose-600 transition-colors"
            title="Clear chat history"
          >
            <Trash2 size={13} />
            <span>Clear conversation</span>
          </button>
        )}
      </div>

      {/* Mode Banner / Instructions */}
      {activeMode === "evaluate" && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 flex items-start gap-2.5">
          <HelpCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Answer Evaluation Mode Active</p>
            <p className="mt-0.5 text-amber-800 leading-relaxed">
              Type or paste your answer to any question. The AI will evaluate your response, identify misconceptions or missing steps, provide the corrected model solution, and assign an accuracy score.
            </p>
          </div>
        </div>
      )}

      {/* Suggested Quick Prompt Pills */}
      {turns.length === 0 && (
        <div className="my-8 rounded-2xl border border-rule/80 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wider font-bold text-terracotta flex items-center gap-1.5">
            <Sparkles size={14} />
            <span>Suggested Academic Doubts & Diagnostics</span>
          </p>
          <p className="mt-1 text-xs text-muted">
            Click any prompt to ask the AI assistant for an explanation or answer evaluation in {currentLangObj.name}:
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleAsk(prompt, "chat")}
                className="flex items-center gap-1.5 rounded-xl border border-rule/80 bg-paper/50 px-3.5 py-2 text-xs font-medium text-ink hover:border-terracotta hover:bg-paper transition-all text-left shadow-xs active:scale-95"
              >
                <span>{prompt}</span>
                <ArrowRight size={12} className="text-terracotta shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 space-y-5 py-4 overflow-y-auto max-h-[640px]">
        {turns.map((turn) => {
          const isUser = turn.role === "user";
          const isSpeaking = speakingTurnId === turn.id;
          const isAudioPaused = isSpeaking && isPaused;

          const isGrounded = turn.sourceType === "uploaded_materials";
          const isEvaluation = turn.sourceType === "evaluation" || Boolean(turn.evaluation);

          return (
            <article
              key={turn.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              <div
                className={`rounded-2xl p-4 sm:p-5 text-sm leading-relaxed max-w-2xl shadow-sm ${
                  isUser
                    ? "bg-ink text-paper rounded-br-none ml-10"
                    : "border border-rule/80 bg-white text-ink rounded-bl-none mr-10"
                }`}
              >
                {/* Header Row */}
                <div className="flex items-center justify-between gap-4 pb-2 mb-2 border-b border-rule/50 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[11px] uppercase tracking-wider opacity-75">
                      {isUser ? "Your Academic Question" : "AI Study Assistant (Gemini)"}
                    </span>

                    {/* Source Distinction Badge */}
                    {!isUser && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          isGrounded
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : isEvaluation
                              ? "bg-purple-50 text-purple-800 border border-purple-200"
                              : "bg-blue-50 text-blue-800 border border-blue-200"
                        }`}
                      >
                        {isGrounded ? (
                          <>
                            <BookOpen size={10} className="text-emerald-600" />
                            <span>Grounded in Notes</span>
                          </>
                        ) : isEvaluation ? (
                          <>
                            <CheckCircle2 size={10} className="text-purple-600" />
                            <span>Evaluated Answer</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck size={10} className="text-blue-600" />
                            <span>General Academic AI</span>
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  {!isUser && (
                    <div className="flex items-center gap-2">
                      {/* Text-to-Speech Controls: Play/Pause/Stop */}
                      <div className="flex items-center gap-1 bg-paper/60 p-0.5 rounded-lg border border-rule/50">
                        <button
                          onClick={() => handlePlayAudio(turn.id, turn.content)}
                          className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md transition-all ${
                            isSpeaking && !isAudioPaused
                              ? "bg-terracotta text-white"
                              : "text-muted hover:text-ink hover:bg-white"
                          }`}
                          title={
                            isSpeaking
                              ? isAudioPaused
                                ? "Resume speaking"
                                : "Pause speaking"
                              : `Read aloud in ${currentLangObj.name} (Text-to-Speech)`
                          }
                        >
                          {isSpeaking ? (
                            isAudioPaused ? (
                              <Play size={12} />
                            ) : (
                              <Pause size={12} />
                            )
                          ) : (
                            <Volume2 size={12} />
                          )}
                          <span>
                            {isSpeaking ? (isAudioPaused ? "Resume" : "Pause") : "Listen"}
                          </span>
                        </button>

                        {isSpeaking && (
                          <button
                            onClick={handleStopAudio}
                            className="p-1 text-muted hover:text-rose-600 hover:bg-white rounded transition-colors"
                            title="Stop audio playback"
                          >
                            <VolumeX size={12} />
                          </button>
                        )}
                      </div>

                      {/* Copy Button */}
                      <button
                        onClick={() => copyAnswer(turn.id, turn.content)}
                        className="text-muted hover:text-ink flex items-center gap-1 text-[11px] p-1 rounded"
                        title="Copy response"
                      >
                        {copiedId === turn.id ? (
                          <>
                            <Check size={12} className="text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Response Text */}
                <p className="whitespace-pre-wrap">{turn.content}</p>

                {/* Grounding Citations Block (strictly when available) */}
                {!isUser && isGrounded && turn.citations?.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-rule/60 space-y-2">
                    <p className="text-[10px] uppercase font-bold text-terracotta tracking-wider flex items-center gap-1">
                      <BookOpen size={12} />
                      <span>Syllabus Grounding Citations ({turn.citations.length})</span>
                    </p>
                    <div className="grid gap-2">
                      {turn.citations.map((c, i) => (
                        <Cite key={i} {...c} />
                      ))}
                    </div>
                  </div>
                )}

                {/* General Academic Disclaimer (when not from notes) */}
                {!isUser && !isGrounded && !isEvaluation && (
                  <div className="mt-3 pt-2.5 border-t border-rule/40 text-[11px] text-muted flex items-center gap-1.5">
                    <ShieldCheck size={12} className="text-blue-600 shrink-0" />
                    <span>
                      Synthesized via Gemini Academic Model. Grounding citations are omitted because this topic was not found in your uploaded notes.
                    </span>
                  </div>
                )}

                {/* Follow-Up Question Chips */}
                {!isUser && turn.followUpQuestions && turn.followUpQuestions.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-rule/60">
                    <p className="text-[10px] uppercase font-bold text-muted tracking-wider mb-2 flex items-center gap-1">
                      <Sparkles size={11} className="text-terracotta" />
                      <span>Follow-Up & Practice Prompts</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {turn.followUpQuestions.map((q, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAsk(q, "chat")}
                          className="text-[11px] text-ink bg-paper/60 hover:bg-paper hover:border-terracotta border border-rule/70 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 text-left"
                        >
                          <span>{q}</span>
                          <ArrowRight size={10} className="text-terracotta shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </article>
          );
        })}

        {busy && (
          <article className="flex items-start">
            <div className="rounded-2xl border border-rule/80 bg-white p-4 text-xs text-muted flex items-center gap-3 shadow-sm mr-10">
              <Loader2 className="w-4 h-4 animate-spin text-terracotta" />
              <span>
                {activeMode === "evaluate"
                  ? `Evaluating answer and diagnosing misconceptions in ${currentLangObj.name}…`
                  : `Retrieving notes and generating response in ${currentLangObj.name}…`}
              </span>
            </div>
          </article>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Speech Notification Banner */}
      {speechNotice && (
        <div className="mb-2 rounded-xl bg-ink text-paper text-xs px-4 py-2 flex items-center justify-between shadow-md animate-fade-in">
          <span>{speechNotice}</span>
          <button
            onClick={() => setSpeechNotice(null)}
            className="text-paper/70 hover:text-white text-xs ml-3 font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Sticky Input Bar with Speech-to-Text */}
      <form onSubmit={onSubmit} className="sticky bottom-4 mt-4 flex items-center gap-2">
        <div className="relative flex-1">
          <input
            name="question"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isListening
                ? `Listening in ${currentLangObj.name}... Speak now...`
                : activeMode === "evaluate"
                  ? `Enter your drafted answer to evaluate in ${currentLangObj.name}…`
                  : `Ask any academic question in ${currentLangObj.name}…`
            }
            className={`w-full rounded-full border bg-white pl-5 pr-12 py-3.5 text-sm text-ink placeholder:text-muted/70 focus:border-terracotta focus:ring-1 focus:ring-terracotta focus:outline-none transition-all shadow-md ${
              isListening ? "border-rose-500 ring-2 ring-rose-300" : "border-rule/90"
            }`}
          />

          {/* Voice Speech-to-Text Mic Button */}
          <button
            type="button"
            onClick={toggleSpeechToText}
            title={
              isListening
                ? "Stop voice recording"
                : `Speak question in ${currentLangObj.name} (Speech-to-Text)`
            }
            className={`absolute right-2.5 top-2 rounded-full p-2 transition-all ${
              isListening
                ? "bg-rose-500 text-white animate-pulse"
                : "text-muted hover:text-ink hover:bg-paper"
            }`}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
        </div>

        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-terracotta to-[#d96e38] px-6 py-3.5 text-sm font-semibold text-white shadow-md hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          <span className="hidden sm:inline">
            {activeMode === "evaluate" ? "Evaluate" : "Ask AI"}
          </span>
        </button>
      </form>
    </div>
  );
}
