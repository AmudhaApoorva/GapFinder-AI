"use client";

import { useState, useEffect, useRef } from "react";
import { Cite } from "@/components/cite";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Globe2,
  Loader2,
  BookOpen,
  Send,
  ArrowRight,
  Headphones,
} from "lucide-react";

const LANGUAGES = [
  { code: "en", name: "English", native: "English", speechLang: "en-IN" },
  { code: "te", name: "Telugu", native: "తెలుగు", speechLang: "te-IN" },
  { code: "hi", name: "Hindi", native: "हिन्दी", speechLang: "hi-IN" },
  { code: "ta", name: "Tamil", native: "தமிழ்", speechLang: "ta-IN" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", speechLang: "kn-IN" },
  { code: "ml", name: "Malayalam", native: "മലയാളം", speechLang: "ml-IN" },
];

export function VoiceLearningStudio({
  topics,
  weakTopics,
}: {
  topics: { id: string; name: string; description: string }[];
  weakTopics: string[];
}) {
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [spokenText, setSpokenText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [loadingAnswer, setLoadingAnswer] = useState(false);

  const [currentExplanation, setCurrentExplanation] = useState<{
    topic: string;
    content: string;
    citations: { title: string; section: string; excerpt: string }[];
  } | null>(null);

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Speech-to-Text Recognition
  function toggleListening() {
    if (!speechSupported) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      const currentLang = LANGUAGES.find((l) => l.code === selectedLanguage) ?? LANGUAGES[0];
      recognition.lang = currentLang.speechLang;
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSpokenText(transcript);
        setIsListening(false);
        // Automatically request grounded explanation
        askVoiceQuestion(transcript);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  }

  // Ask Voice Question
  async function askVoiceQuestion(text: string) {
    if (!text.trim() || loadingAnswer) return;
    setLoadingAnswer(true);

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, language: selectedLanguage }),
      });
      const data = await res.json();
      if (res.ok) {
        const explanation = {
          topic: text,
          content: data.content,
          citations: data.citations ?? [],
        };
        setCurrentExplanation(explanation);
        // Auto play audio of explanation
        playTextToSpeech(data.content);
      } else {
        alert(data.error ?? "Failed to synthesize voice explanation.");
      }
    } catch {
      alert("Network error fetching voice explanation.");
    } finally {
      setLoadingAnswer(false);
    }
  }

  // Text-to-Speech Output
  function playTextToSpeech(text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/\[\d+\]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const currentLang = LANGUAGES.find((l) => l.code === selectedLanguage) ?? LANGUAGES[0];
    utterance.lang = currentLang.speechLang;
    utterance.rate = 0.95;

    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
  }

  function stopAudio() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  }

  return (
    <div className="mt-8 space-y-8">
      {/* Top Controls: Language Picker & Voice State */}
      <div className="rounded-3xl border border-rule/80 bg-white p-6 sm:p-8 shadow-card relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-rule/60">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-terracotta bg-terracotta/10 px-2.5 py-1 rounded-full border border-terracotta/20">
              Interactive Voice AI
            </span>
            <h2 className="mt-2 font-serif text-2xl sm:text-3xl text-ink font-medium">
              Talk & Listen in Your Preferred Language
            </h2>
            <p className="mt-1 text-xs text-muted max-w-xl">
              Tap the microphone to speak your question aloud, or pick a weak topic to hear a customized audio lecture based strictly on your notes.
            </p>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-2 rounded-2xl border border-rule/80 bg-paper/60 p-2 text-xs">
            <Globe2 size={16} className="text-terracotta ml-1" />
            <select
              value={selectedLanguage}
              onChange={(e) => {
                setSelectedLanguage(e.target.value);
                if (currentExplanation) {
                  askVoiceQuestion(currentExplanation.topic);
                }
              }}
              className="bg-transparent font-semibold text-ink text-xs focus:outline-none cursor-pointer pr-2"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name} ({l.native})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Central Voice Recording Hub */}
        <div className="py-8 flex flex-col items-center justify-center text-center">
          <button
            type="button"
            onClick={toggleListening}
            className={`relative flex h-24 w-24 items-center justify-center rounded-full shadow-lg transition-all active:scale-95 ${
              isListening
                ? "bg-rose-500 text-white ring-8 ring-rose-200 animate-pulse scale-105"
                : "bg-gradient-to-br from-terracotta to-[#d96e38] text-white hover:brightness-110"
            }`}
          >
            {isListening ? <MicOff size={36} /> : <Mic size={36} />}
            {isListening && (
              <span className="absolute -bottom-7 whitespace-nowrap text-xs font-bold text-rose-600 animate-pulse">
                Listening… Speak now
              </span>
            )}
          </button>

          <p className="mt-8 text-sm font-medium text-ink">
            {isListening
              ? "Listening to your voice… Say your question clearly"
              : "Click the mic to speak your academic question"}
          </p>
          <p className="mt-1 text-xs text-muted">
            Language:{" "}
            <span className="font-semibold text-ink">
              {LANGUAGES.find((l) => l.code === selectedLanguage)?.name} (
              {LANGUAGES.find((l) => l.code === selectedLanguage)?.native})
            </span>
          </p>

          {/* Manual Input Fallback */}
          <div className="mt-6 flex w-full max-w-lg items-center gap-2">
            <input
              value={spokenText}
              onChange={(e) => setSpokenText(e.target.value)}
              placeholder="Or type an academic concept to explain aloud…"
              className="flex-1 rounded-full border border-rule/80 bg-paper/30 px-4 py-2.5 text-xs text-ink focus:border-terracotta focus:ring-1 focus:ring-terracotta focus:bg-white transition-all shadow-sm"
            />
            <button
              onClick={() => askVoiceQuestion(spokenText)}
              disabled={!spokenText.trim() || loadingAnswer}
              className="rounded-full bg-ink px-4 py-2.5 text-xs font-semibold text-paper hover:bg-ink/90 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {loadingAnswer ? <Loader2 size={13} className="animate-spin text-terracotta" /> : <Send size={13} />}
              <span>Listen</span>
            </button>
          </div>
        </div>
      </div>

      {/* Audio Lecture Player / Active Explanation Card */}
      {currentExplanation && (
        <div className="rounded-3xl border border-rule/80 bg-white p-6 sm:p-8 shadow-card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-rule/60">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-terracotta/10 text-terracotta flex items-center justify-center">
                <Headphones size={20} />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-terracotta tracking-wider">
                  Audio Explanation Output
                </span>
                <h3 className="font-serif text-xl sm:text-2xl text-ink font-medium">
                  {currentExplanation.topic}
                </h3>
              </div>
            </div>

            {/* Audio Controls */}
            <div className="flex items-center gap-2">
              {isPlayingAudio ? (
                <button
                  onClick={stopAudio}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:brightness-110 active:scale-95 transition-all"
                >
                  <VolumeX size={14} />
                  <span>Pause Audio</span>
                </button>
              ) : (
                <button
                  onClick={() => playTextToSpeech(currentExplanation.content)}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-terracotta to-[#d96e38] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:brightness-110 active:scale-95 transition-all"
                >
                  <Volume2 size={14} />
                  <span>Read Aloud</span>
                </button>
              )}
            </div>
          </div>

          <div className="mt-5 text-sm sm:text-base leading-relaxed text-ink whitespace-pre-wrap bg-paper/40 p-5 rounded-2xl border border-rule/50">
            {currentExplanation.content}
          </div>

          {/* Citations */}
          {currentExplanation.citations.length > 0 && (
            <div className="mt-5 pt-4 border-t border-rule/60 space-y-2">
              <p className="text-[10px] uppercase font-bold text-terracotta tracking-wider">
                Auditory Grounding Citations ({currentExplanation.citations.length})
              </p>
              <div className="grid gap-2">
                {currentExplanation.citations.map((c, i) => (
                  <Cite key={i} {...c} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* One-Click Quick Audio Drills for Weak Topics */}
      <div className="rounded-2xl border border-rule/80 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-rule/60">
          <div>
            <h3 className="font-serif text-2xl text-ink">One-Click Audio Recaps</h3>
            <p className="text-xs text-muted">
              Listen to concise audio recaps of your identified weak syllabus chapters.
            </p>
          </div>
          <span className="text-xs text-muted font-mono">{topics.length} Syllabus Units</span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {topics.map((t) => {
            const isWeak = weakTopics.includes(t.name);
            return (
              <button
                key={t.id}
                onClick={() =>
                  askVoiceQuestion(`Explain the key concepts, formulas, and pitfalls of "${t.name}".`)
                }
                className={`flex items-start justify-between p-4 rounded-xl border text-left transition-all active:scale-95 ${
                  isWeak
                    ? "border-terracotta/40 bg-paper/40 hover:bg-paper"
                    : "border-rule/80 bg-white hover:bg-paper/30"
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    {isWeak && (
                      <span className="text-[9px] uppercase font-bold tracking-wider text-terracotta bg-terracotta/10 px-2 py-0.5 rounded-full">
                        Gap Target
                      </span>
                    )}
                    <span className="text-xs font-semibold text-ink">{t.name}</span>
                  </div>
                  <p className="text-[11px] text-muted mt-1 line-clamp-2">{t.description}</p>
                </div>
                <div className="h-7 w-7 rounded-lg bg-paper flex items-center justify-center text-terracotta shrink-0 ml-2">
                  <Play size={12} className="fill-current" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
