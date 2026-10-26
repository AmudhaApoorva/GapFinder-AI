"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Sparkles,
  User,
  GraduationCap,
  BookOpen,
  Volume2,
  Globe2,
} from "lucide-react";

export function WelcomeAuth({ defaultMode = "signin" }: { defaultMode?: "signin" | "signup" }) {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">(defaultMode);

  // Sign In state
  const [email, setEmail] = useState("judge@gapfinder.ai");
  const [password, setPassword] = useState("Demo@123");

  // Sign Up state
  const [name, setName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupRole, setSignupRole] = useState<"student" | "teacher">("student");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 1-Click Demo Fill
  const fillDemo = (role: "student" | "teacher") => {
    setMode("signin");
    if (role === "student") {
      setEmail("judge@gapfinder.ai");
      setPassword("Demo@123");
    } else {
      setEmail("teacher@gapfinder.ai");
      setPassword("Demo@123");
    }
    setError("");
  };

  async function onSignInSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Those credentials were not accepted. Please check your email and password, or use 1-click demo login below.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function onSignUpSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: signupEmail,
          password: signupPassword,
          role: signupRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create account. Please try again.");
        setLoading(false);
        return;
      }

      // Auto sign in after sign up
      const loginResult = await signIn("credentials", {
        email: signupEmail,
        password: signupPassword,
        redirect: false,
      });
      setLoading(false);
      if (loginResult?.error) {
        setMode("signin");
        setEmail(signupEmail);
        setPassword(signupPassword);
        setError("Account created! Please sign in with your credentials.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred during registration. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-12 bg-paper/30">
      {/* LEFT SPLIT-SCREEN: Realistic illustration of girl & boy carrying books, GapFinder AI Logo & Tagline */}
      <div className="relative lg:col-span-6 xl:col-span-7 flex flex-col justify-between overflow-hidden p-8 sm:p-12 text-white border-r border-rule/60">
        {/* Background Image Container */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/students-welcome.jpg"
            alt="Girl and boy college students carrying textbooks in hands"
            fill
            priority
            className="object-cover object-center filter brightness-[0.88] contrast-[1.05]"
          />
          {/* Gradients to ensure exceptional readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#120f0d] via-[#120f0d]/50 to-black/35" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#120f0d]/80 via-transparent to-black/30" />
        </div>

        {/* Top: Logo & Live Status */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-terracotta to-clay text-white font-serif font-bold text-xl shadow-lg ring-2 ring-white/20">
              G
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-white drop-shadow-md">
                  GapFinder AI
                </span>
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#e8ded1] font-semibold">
                Syllabus-Grounded Diagnostic Intelligence
              </p>
            </div>
          </div>

          <div className="hidden sm:inline-flex items-center gap-2 rounded-full bg-black/40 backdrop-blur-md px-3.5 py-1.5 text-xs text-[#f3ede3] border border-white/15">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Zero Hallucinations</span>
          </div>
        </div>

        {/* Center / Bottom: Tagline & Value Propositions */}
        <div className="relative z-10 my-auto py-12 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-terracotta/90 backdrop-blur-md px-3.5 py-1 text-xs font-semibold text-white shadow-sm mb-4 border border-white/20">
            <Sparkles size={13} />
            <span>Find What You Missed First</span>
          </div>

          <blockquote className="font-serif text-3xl sm:text-5xl leading-[1.15] text-[#fbf8f3] drop-shadow-lg font-normal">
            “Students cannot ask about a gap{" "}
            <span className="italic text-terracotta font-serif font-medium underline decoration-terracotta/40">
              they do not know they have.
            </span>”
          </blockquote>

          <p className="mt-5 text-sm sm:text-base text-[#ded3c3] leading-relaxed drop-shadow">
            Most study tools wait for questions. GapFinder maps your syllabus, tests your notes, uncovers topic gaps, and delivers adaptive revision in English, Telugu, Hindi, Tamil, Kannada, and Malayalam.
          </p>

          {/* Quick Feature Badges */}
          <div className="mt-6 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-black/40 backdrop-blur-md px-3 py-1.5 text-[#f5eee6] border border-white/15">
              <Globe2 size={13} className="text-terracotta" />
              <span>6 Indian Languages</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-black/40 backdrop-blur-md px-3 py-1.5 text-[#f5eee6] border border-white/15">
              <Volume2 size={13} className="text-emerald-400" />
              <span>Voice Speech & Audio</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-black/40 backdrop-blur-md px-3 py-1.5 text-[#f5eee6] border border-white/15">
              <GraduationCap size={13} className="text-amber-400" />
              <span>Ask My Lecturer</span>
            </span>
          </div>
        </div>

        {/* Footer Pill */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/15 text-xs text-[#d8cfc1]/90">
          <span>CBSE Class 12 CS & University Curricula Ready</span>
          <span>Adaptive Retrieval-Augmented Generation</span>
        </div>
      </div>

      {/* RIGHT SPLIT-SCREEN: Tabbed Sign In and Sign Up Forms */}
      <div className="lg:col-span-6 xl:col-span-5 flex items-center justify-center p-6 sm:p-10 lg:p-12">
        <div className="w-full max-w-md">
          {/* Card Container */}
          <div className="rounded-3xl border border-rule/80 bg-white p-7 sm:p-9 shadow-card">
            {/* Tab Switcher */}
            <div className="flex rounded-2xl bg-paper/70 p-1.5 border border-rule/70 mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError("");
                }}
                className={`flex-1 rounded-xl py-2.5 text-xs font-semibold transition-all ${
                  mode === "signin"
                    ? "bg-white text-ink shadow-sm font-bold"
                    : "text-muted hover:text-ink"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError("");
                }}
                className={`flex-1 rounded-xl py-2.5 text-xs font-semibold transition-all ${
                  mode === "signup"
                    ? "bg-white text-ink shadow-sm font-bold"
                    : "text-muted hover:text-ink"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Header info */}
            <div>
              <h1 className="font-serif text-3xl font-medium text-ink">
                {mode === "signin" ? "Welcome Back" : "Create Account"}
              </h1>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                {mode === "signin"
                  ? "Access your diagnostic syllabus workspace and adaptive study plan."
                  : "Start identifying knowledge gaps and master your curriculum."}
              </p>
            </div>

            {/* Quick 1-Click Demo Profiles (Shown in both tabs for convenience) */}
            <div className="mt-5 rounded-2xl bg-paper/60 p-3.5 border border-rule/70 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase font-bold text-muted tracking-wider">
                  Instant 1-Click Demo Login
                </p>
                <span className="text-[10px] text-terracotta font-semibold">Preloaded</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillDemo("student")}
                  className={`flex items-center justify-between rounded-xl border p-2.5 text-left text-xs transition-all ${
                    email === "judge@gapfinder.ai" && mode === "signin"
                      ? "border-terracotta bg-white font-semibold text-terracotta shadow-sm"
                      : "border-rule/70 bg-white/80 text-ink hover:bg-white"
                  }`}
                >
                  <div>
                    <p className="font-semibold text-ink">Student Demo</p>
                    <p className="text-[10px] text-muted">Asha Rao (CS 12)</p>
                  </div>
                  {email === "judge@gapfinder.ai" && mode === "signin" && (
                    <Check size={14} className="text-terracotta" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => fillDemo("teacher")}
                  className={`flex items-center justify-between rounded-xl border p-2.5 text-left text-xs transition-all ${
                    email === "teacher@gapfinder.ai" && mode === "signin"
                      ? "border-terracotta bg-white font-semibold text-terracotta shadow-sm"
                      : "border-rule/70 bg-white/80 text-ink hover:bg-white"
                  }`}
                >
                  <div>
                    <p className="font-semibold text-ink">Teacher Demo</p>
                    <p className="text-[10px] text-muted">Meera Iyer (Class)</p>
                  </div>
                  {email === "teacher@gapfinder.ai" && mode === "signin" && (
                    <Check size={14} className="text-terracotta" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <p className="mt-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 leading-relaxed">
                {error}
              </p>
            )}

            {/* SIGN IN FORM */}
            {mode === "signin" ? (
              <form onSubmit={onSignInSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    className="w-full rounded-xl border border-rule/80 bg-paper/30 px-3.5 py-2.5 text-sm text-ink focus:border-terracotta focus:ring-1 focus:ring-terracotta focus:bg-white transition-all shadow-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    required
                    placeholder="student@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <input
                    className="w-full rounded-xl border border-rule/80 bg-paper/30 px-3.5 py-2.5 text-sm text-ink focus:border-terracotta focus:ring-1 focus:ring-terracotta focus:bg-white transition-all shadow-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    required
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-terracotta to-[#d96e38] py-3 text-sm font-semibold text-white shadow-sm hover:brightness-110 active:scale-95 transition-all disabled:opacity-60"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                  <span>{loading ? "Opening Workspace…" : "Sign In & Launch Workspace"}</span>
                </button>
              </form>
            ) : (
              /* SIGN UP FORM */
              <form onSubmit={onSignUpSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    className="w-full rounded-xl border border-rule/80 bg-paper/30 px-3.5 py-2.5 text-sm text-ink focus:border-terracotta focus:ring-1 focus:ring-terracotta focus:bg-white transition-all shadow-sm"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    className="w-full rounded-xl border border-rule/80 bg-paper/30 px-3.5 py-2.5 text-sm text-ink focus:border-terracotta focus:ring-1 focus:ring-terracotta focus:bg-white transition-all shadow-sm"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    type="email"
                    required
                    placeholder="rahul@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                    Create Password
                  </label>
                  <input
                    className="w-full rounded-xl border border-rule/80 bg-paper/30 px-3.5 py-2.5 text-sm text-ink focus:border-terracotta focus:ring-1 focus:ring-terracotta focus:bg-white transition-all shadow-sm"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    type="password"
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                    I am registering as:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSignupRole("student")}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold transition-all ${
                        signupRole === "student"
                          ? "border-terracotta bg-terracotta/10 text-terracotta shadow-sm font-bold"
                          : "border-rule/80 bg-paper/30 text-muted hover:text-ink"
                      }`}
                    >
                      <User size={13} />
                      <span>Student</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignupRole("teacher")}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold transition-all ${
                        signupRole === "teacher"
                          ? "border-terracotta bg-terracotta/10 text-terracotta shadow-sm font-bold"
                          : "border-rule/80 bg-paper/30 text-muted hover:text-ink"
                      }`}
                    >
                      <GraduationCap size={13} />
                      <span>Lecturer / Teacher</span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-terracotta to-[#d96e38] py-3 text-sm font-semibold text-white shadow-sm hover:brightness-110 active:scale-95 transition-all disabled:opacity-60"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                  <span>{loading ? "Creating Account…" : "Create Account & Start Learning"}</span>
                </button>
              </form>
            )}

            {/* Footer switcher note */}
            <div className="mt-6 pt-4 border-t border-rule/60 text-center">
              <p className="text-xs text-muted">
                {mode === "signin" ? (
                  <>
                    New student or lecturer?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("signup");
                        setError("");
                      }}
                      className="font-semibold text-terracotta hover:underline"
                    >
                      Create an account
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("signin");
                        setError("");
                      }}
                      className="font-semibold text-terracotta hover:underline"
                    >
                      Sign In here
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
