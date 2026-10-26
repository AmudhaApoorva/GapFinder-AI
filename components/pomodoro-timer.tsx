"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Settings,
  Volume2,
  VolumeX,
  Flame,
  Coffee,
  Sparkles,
  CheckCircle2,
  Clock,
  BookOpen,
} from "lucide-react";

export type SessionType = "focus" | "shortBreak" | "longBreak";

interface PomodoroTimerProps {
  initialTopic?: string;
  onSessionComplete?: (session: any) => void;
  compact?: boolean;
}

const STORAGE_KEY = "gapfinder_pomodoro_state_v1";

export function PomodoroTimer({
  initialTopic,
  onSessionComplete,
  compact = false,
}: PomodoroTimerProps) {
  // Configurable durations (in minutes)
  const [focusDuration, setFocusDuration] = useState(25);
  const [shortBreakDuration, setShortBreakDuration] = useState(5);
  const [longBreakDuration, setLongBreakDuration] = useState(15);

  // Timer state
  const [sessionType, setSessionType] = useState<SessionType>("focus");
  const [isRunning, setIsRunning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [activeTopic, setActiveTopic] = useState(initialTopic || "");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // References for timing accuracy across inactive tabs
  const targetEndTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentSessionIdRef = useRef<string>(crypto.randomUUID());
  const sessionStartTimeRef = useRef<number>(Date.now());
  const elapsedFocusSecondsRef = useRef<number>(0);

  // Web Audio chime for timer completion
  const playChime = useCallback(() => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.85);
    } catch {}
  }, [soundEnabled]);

  // Load saved state from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.sessionType) setSessionType(parsed.sessionType);
        if (parsed.focusDuration) setFocusDuration(parsed.focusDuration);
        if (parsed.shortBreakDuration) setShortBreakDuration(parsed.shortBreakDuration);
        if (parsed.longBreakDuration) setLongBreakDuration(parsed.longBreakDuration);
        if (parsed.activeTopic) setActiveTopic(parsed.activeTopic);

        if (parsed.isRunning && parsed.targetEndTime) {
          const now = Date.now();
          if (parsed.targetEndTime > now) {
            const rem = Math.round((parsed.targetEndTime - now) / 1000);
            setSecondsRemaining(rem);
            setIsRunning(true);
            targetEndTimeRef.current = parsed.targetEndTime;
            currentSessionIdRef.current = parsed.sessionId || crypto.randomUUID();
            sessionStartTimeRef.current = parsed.sessionStartTime || now;
            elapsedFocusSecondsRef.current = parsed.elapsedFocusSeconds || 0;
          } else {
            // Timer expired while away
            setSecondsRemaining(0);
            setIsRunning(false);
          }
        } else if (typeof parsed.secondsRemaining === "number") {
          setSecondsRemaining(parsed.secondsRemaining);
        }
      }
    } catch {}
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          sessionType,
          focusDuration,
          shortBreakDuration,
          longBreakDuration,
          isRunning,
          targetEndTime: targetEndTimeRef.current,
          secondsRemaining,
          activeTopic,
          sessionId: currentSessionIdRef.current,
          sessionStartTime: sessionStartTimeRef.current,
          elapsedFocusSeconds: elapsedFocusSecondsRef.current,
        }),
      );
    } catch {}
  }, [
    sessionType,
    focusDuration,
    shortBreakDuration,
    longBreakDuration,
    isRunning,
    secondsRemaining,
    activeTopic,
  ]);

  // Total duration of current session type in seconds
  const totalDurationSeconds =
    sessionType === "focus"
      ? focusDuration * 60
      : sessionType === "shortBreak"
        ? shortBreakDuration * 60
        : longBreakDuration * 60;

  // Record completed or abandoned session in backend
  const persistSession = useCallback(
    async (status: "completed" | "abandoned", secondsElapsed: number) => {
      if (sessionType !== "focus") return; // Breaks are not recorded as focus time
      if (secondsElapsed < 30) return; // Ignore accidental clicks (< 30 sec)

      try {
        const res = await fetch("/api/focus-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: currentSessionIdRef.current,
            startTime: new Date(sessionStartTimeRef.current).toISOString(),
            endTime: new Date().toISOString(),
            plannedMinutes: focusDuration,
            actualDurationSeconds: secondsElapsed,
            status,
            topicName: activeTopic || undefined,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (onSessionComplete) onSessionComplete(data);
        }
      } catch (err) {
        console.error("Failed to persist focus session:", err);
      }
    },
    [sessionType, focusDuration, activeTopic, onSessionComplete],
  );

  // Timer Tick Handler
  const handleTimerFinish = useCallback(async () => {
    setIsRunning(false);
    targetEndTimeRef.current = null;
    playChime();

    if (sessionType === "focus") {
      setNotification(`🎉 Great job! You completed a ${focusDuration}-minute focus sprint! Take a short break.`);
      await persistSession("completed", focusDuration * 60);

      // Auto switch to short break
      setSessionType("shortBreak");
      setSecondsRemaining(shortBreakDuration * 60);
      currentSessionIdRef.current = crypto.randomUUID();
      sessionStartTimeRef.current = Date.now();
      elapsedFocusSecondsRef.current = 0;
    } else {
      setNotification(`🔔 Break finished! Ready to begin your next focus session?`);
      setSessionType("focus");
      setSecondsRemaining(focusDuration * 60);
      currentSessionIdRef.current = crypto.randomUUID();
      sessionStartTimeRef.current = Date.now();
      elapsedFocusSecondsRef.current = 0;
    }

    setTimeout(() => setNotification(null), 8000);
  }, [
    sessionType,
    focusDuration,
    shortBreakDuration,
    playChime,
    persistSession,
  ]);

  // Main countdown loop with inactive-tab timestamp delta
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    if (!targetEndTimeRef.current) {
      targetEndTimeRef.current = Date.now() + secondsRemaining * 1000;
    }

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.round((targetEndTimeRef.current! - now) / 1000));

      setSecondsRemaining(diff);
      if (sessionType === "focus") {
        elapsedFocusSecondsRef.current += 1;
      }

      if (diff <= 0) {
        clearInterval(intervalRef.current!);
        handleTimerFinish();
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, secondsRemaining, sessionType, handleTimerFinish]);

  // Controls
  const toggleTimer = () => {
    if (isRunning) {
      // Pause
      setIsRunning(false);
      targetEndTimeRef.current = null;
    } else {
      // Start / Resume
      targetEndTimeRef.current = Date.now() + secondsRemaining * 1000;
      setIsRunning(true);
    }
  };

  const resetTimer = () => {
    if (isRunning && sessionType === "focus" && elapsedFocusSecondsRef.current >= 60) {
      // If abandoned halfway after at least 1 min, record as abandoned
      persistSession("abandoned", elapsedFocusSecondsRef.current);
    }

    setIsRunning(false);
    targetEndTimeRef.current = null;
    const dur =
      sessionType === "focus"
        ? focusDuration * 60
        : sessionType === "shortBreak"
          ? shortBreakDuration * 60
          : longBreakDuration * 60;
    setSecondsRemaining(dur);
    currentSessionIdRef.current = crypto.randomUUID();
    sessionStartTimeRef.current = Date.now();
    elapsedFocusSecondsRef.current = 0;
  };

  const switchMode = (mode: SessionType) => {
    if (isRunning && sessionType === "focus" && elapsedFocusSecondsRef.current >= 60) {
      persistSession("abandoned", elapsedFocusSecondsRef.current);
    }

    setIsRunning(false);
    targetEndTimeRef.current = null;
    setSessionType(mode);
    const dur =
      mode === "focus"
        ? focusDuration * 60
        : mode === "shortBreak"
          ? shortBreakDuration * 60
          : longBreakDuration * 60;
    setSecondsRemaining(dur);
    currentSessionIdRef.current = crypto.randomUUID();
    sessionStartTimeRef.current = Date.now();
    elapsedFocusSecondsRef.current = 0;
  };

  const skipBreak = () => {
    switchMode("focus");
  };

  // Format MM:SS
  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const timeString = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  // Progress percentage (0 to 100%)
  const elapsed = totalDurationSeconds - secondsRemaining;
  const progressPct = totalDurationSeconds > 0 ? Math.min(100, (elapsed / totalDurationSeconds) * 100) : 0;

  if (compact) {
    return (
      <div className="flex items-center gap-3 bg-black/40 px-3.5 py-2 rounded-xl border border-white/10 text-white font-mono">
        <span className="text-sm font-bold tracking-wider">{timeString}</span>
        <button
          onClick={toggleTimer}
          className="rounded-lg p-1.5 bg-terracotta text-white hover:brightness-110 active:scale-95 transition-all text-xs"
          title={isRunning ? "Pause" : "Start"}
        >
          {isRunning ? <Pause size={13} /> : <Play size={13} className="fill-current" />}
        </button>
        <button
          onClick={resetTimer}
          className="rounded-lg p-1.5 bg-white/10 text-[#d8cfc1] hover:text-white active:scale-95 transition-all text-xs"
          title="Reset"
        >
          <RotateCcw size={13} />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-rule/80 bg-gradient-to-br from-ink via-[#1d1713] to-[#261f1a] p-6 sm:p-7 text-paper shadow-card relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-terracotta/10 rounded-full blur-3xl pointer-events-none" />

      {/* Completion Notification Banner */}
      {notification && (
        <div className="mb-4 rounded-xl border border-terracotta/40 bg-terracotta/20 px-4 py-3 text-xs text-paper flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-terracotta shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-white/60 hover:text-white font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-terracotta/20 text-terracotta">
            {sessionType === "focus" ? (
              <Flame size={17} className="fill-current text-terracotta" />
            ) : (
              <Coffee size={17} className="text-amber-400" />
            )}
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#d8cfc1]">
              Pomodoro Focus Engine
            </p>
            <h3 className="font-serif text-lg font-medium text-paper">
              {sessionType === "focus"
                ? activeTopic
                  ? `Focus Block: ${activeTopic}`
                  : "Deep Study Sprint"
                : sessionType === "shortBreak"
                  ? "Short Recharging Break"
                  : "Long Restorative Break"}
            </h3>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-1 rounded-xl bg-black/40 p-1 border border-white/10 text-xs">
          <button
            onClick={() => switchMode("focus")}
            className={`rounded-lg px-2.5 py-1 transition-all ${
              sessionType === "focus"
                ? "bg-terracotta text-white font-semibold shadow-xs"
                : "text-[#d8cfc1]/70 hover:text-white"
            }`}
          >
            Focus ({focusDuration}m)
          </button>
          <button
            onClick={() => switchMode("shortBreak")}
            className={`rounded-lg px-2.5 py-1 transition-all ${
              sessionType === "shortBreak"
                ? "bg-amber-600 text-white font-semibold shadow-xs"
                : "text-[#d8cfc1]/70 hover:text-white"
            }`}
          >
            Short Break ({shortBreakDuration}m)
          </button>
          <button
            onClick={() => switchMode("longBreak")}
            className={`rounded-lg px-2.5 py-1 transition-all ${
              sessionType === "longBreak"
                ? "bg-amber-700 text-white font-semibold shadow-xs"
                : "text-[#d8cfc1]/70 hover:text-white"
            }`}
          >
            Long Break ({longBreakDuration}m)
          </button>
        </div>
      </div>

      {/* Main Digital Display Area */}
      <div className="py-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Digital Time & Progress Ring */}
        <div className="flex items-center gap-6">
          {/* Circular Progress Gauge */}
          <div className="relative h-28 w-28 sm:h-32 sm:w-32 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="7"
                fill="transparent"
              />
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                stroke={sessionType === "focus" ? "#c45c26" : "#d97706"}
                strokeWidth="7"
                fill="transparent"
                strokeDasharray="283"
                strokeDashoffset={283 - (283 * progressPct) / 100}
                strokeLinecap="round"
                className="transition-all duration-300 ease-linear"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="font-mono text-xs uppercase tracking-widest text-[#d8cfc1]/70">
                {sessionType === "focus" ? "FOCUS" : "BREAK"}
              </span>
              <span className="text-[11px] font-mono text-terracotta font-semibold">
                {Math.round(progressPct)}%
              </span>
            </div>
          </div>

          {/* Large Digital Digits */}
          <div>
            <div className="font-mono text-5xl sm:text-6xl font-bold tracking-tight text-white drop-shadow-sm">
              {timeString}
            </div>
            <p className="mt-1 text-xs text-[#d8cfc1]/70 flex items-center gap-1.5">
              <Clock size={13} />
              <span>
                {sessionType === "focus"
                  ? `${focusDuration} min planned · Break time excluded from stats`
                  : "Step away from screen, hydrate, and stretch"}
              </span>
            </p>
          </div>
        </div>

        {/* Primary Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={toggleTimer}
            className={`inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold transition-all active:scale-95 shadow-md ${
              isRunning
                ? "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                : "bg-gradient-to-r from-terracotta to-[#d96e38] text-white hover:brightness-110"
            }`}
          >
            {isRunning ? (
              <>
                <Pause size={17} />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play size={17} className="fill-current" />
                <span>{secondsRemaining < totalDurationSeconds ? "Resume" : "Start Focus"}</span>
              </>
            )}
          </button>

          <button
            onClick={resetTimer}
            className="rounded-2xl border border-white/10 bg-white/5 p-3.5 text-[#d8cfc1] hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            title="Reset timer to beginning"
          >
            <RotateCcw size={17} />
          </button>

          {sessionType !== "focus" && (
            <button
              onClick={skipBreak}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-xs font-semibold text-[#d8cfc1] hover:text-white hover:bg-white/10 active:scale-95 transition-all"
              title="Skip remaining break"
            >
              <SkipForward size={14} />
              <span>Skip Break</span>
            </button>
          )}

          <button
            onClick={() => setShowConfig(!showConfig)}
            className="rounded-2xl border border-white/10 bg-white/5 p-3.5 text-[#d8cfc1] hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            title="Configure durations"
          >
            <Settings size={17} />
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="rounded-2xl border border-white/10 bg-white/5 p-3.5 text-[#d8cfc1] hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            title={soundEnabled ? "Mute completion chime" : "Enable completion chime"}
          >
            {soundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
        </div>
      </div>

      {/* Optional Target Topic Selector / Input */}
      <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <BookOpen size={14} className="text-terracotta" />
          <span className="text-[#d8cfc1]">Topic Tag:</span>
          <input
            type="text"
            value={activeTopic}
            onChange={(e) => setActiveTopic(e.target.value)}
            placeholder="e.g. Computer Networks, SQL Joins..."
            className="rounded-lg bg-black/40 border border-white/10 px-2.5 py-1 text-xs text-white placeholder-white/40 focus:border-terracotta focus:outline-none w-48 sm:w-64"
          />
        </div>

        <span className="text-[11px] text-[#d8cfc1]/70">
          ✓ Accurate when tab is inactive · Auto-persisted
        </span>
      </div>

      {/* Configuration Drawer */}
      {showConfig && (
        <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in">
          <div>
            <label className="block text-[10px] uppercase font-bold text-[#d8cfc1] tracking-wider mb-1">
              Focus Duration (min)
            </label>
            <input
              type="number"
              min={1}
              max={60}
              value={focusDuration}
              onChange={(e) => {
                const val = Math.max(1, Math.min(60, Number(e.target.value) || 25));
                setFocusDuration(val);
                if (sessionType === "focus" && !isRunning) {
                  setSecondsRemaining(val * 60);
                }
              }}
              className="w-full rounded-xl bg-black/50 border border-white/10 px-3 py-1.5 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-[#d8cfc1] tracking-wider mb-1">
              Short Break (min)
            </label>
            <input
              type="number"
              min={1}
              max={30}
              value={shortBreakDuration}
              onChange={(e) => {
                const val = Math.max(1, Math.min(30, Number(e.target.value) || 5));
                setShortBreakDuration(val);
                if (sessionType === "shortBreak" && !isRunning) {
                  setSecondsRemaining(val * 60);
                }
              }}
              className="w-full rounded-xl bg-black/50 border border-white/10 px-3 py-1.5 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-[#d8cfc1] tracking-wider mb-1">
              Long Break (min)
            </label>
            <input
              type="number"
              min={1}
              max={45}
              value={longBreakDuration}
              onChange={(e) => {
                const val = Math.max(1, Math.min(45, Number(e.target.value) || 15));
                setLongBreakDuration(val);
                if (sessionType === "longBreak" && !isRunning) {
                  setSecondsRemaining(val * 60);
                }
              }}
              className="w-full rounded-xl bg-black/50 border border-white/10 px-3 py-1.5 text-xs text-white"
            />
          </div>
        </div>
      )}
    </div>
  );
}
