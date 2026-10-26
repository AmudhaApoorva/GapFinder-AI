"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BookOpen,
  ClipboardCheck,
  FolderOpen,
  LayoutDashboard,
  LineChart,
  Map,
  MessageSquare,
  Route,
  Menu,
  X,
  LogOut,
  Zap,
  Mic,
  GraduationCap,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Student Sidebar Navigation links
const studentLinks = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/materials", label: "Study Materials", icon: FolderOpen },
  { href: "/topics", label: "Topic Map", icon: Map },
  { href: "/quiz", label: "Diagnostic Quiz", icon: ClipboardCheck },
  { href: "/report", label: "Learning Gaps", icon: BookOpen },
  { href: "/plan", label: "Revision Planner", icon: Route },
  { href: "/assistant", label: "AI Study Assistant", icon: MessageSquare },
  { href: "/voice", label: "Voice Learning", icon: Mic },
  { href: "/lecturer", label: "Ask My Lecturer", icon: GraduationCap },
  { href: "/progress", label: "Progress", icon: LineChart },
  { href: "/settings", label: "Settings", icon: Settings },
];

// Teacher Sidebar Navigation links
const teacherLinks = [
  { href: "/dashboard", label: "Diagnosis Overview", icon: LayoutDashboard },
  { href: "/materials", label: "Study Materials", icon: FolderOpen },
  { href: "/topics", label: "Syllabus Topic Map", icon: Map },
  { href: "/quiz", label: "Diagnostic Quizzes", icon: ClipboardCheck },
  { href: "/report", label: "Gap Report", icon: BookOpen },
  { href: "/plan", label: "Adaptive Plan", icon: Route },
  { href: "/assistant", label: "Explain This Topic", icon: MessageSquare },
  { href: "/progress", label: "Mastery & Progress", icon: LineChart },
  { href: "/students", label: "Students", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({
  children,
  name,
  role,
}: {
  children: React.ReactNode;
  name: string;
  role: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = role === "teacher" ? teacherLinks : studentLinks;

  const initials =
    name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "GF";

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[280px_1fr]">
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-rule/70 bg-[#161311] px-5 py-4 text-[#f3eee4] lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-terracotta text-white font-serif font-bold text-sm">
            G
          </span>
          <div>
            <p className="font-serif text-lg leading-none">GapFinder</p>
            <p className="text-[10px] uppercase tracking-wider text-[#d8cfc1]/70">
              {role === "teacher" ? "Teacher Portal" : "Student Hub"}
            </p>
          </div>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-[#f3eee4] hover:bg-white/10"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col justify-between border-r border-white/10 bg-[#14110e] text-[#f8f5ee] transition-transform duration-200 ease-in-out lg:static lg:w-full lg:translate-x-0 overflow-y-auto",
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full",
        )}
      >
        <div>
          {/* Logo Branding */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-terracotta to-clay text-white font-serif font-bold text-base shadow-sm group-hover:scale-105 transition-transform">
                G
              </span>
              <div>
                <p className="font-serif text-xl tracking-tight text-white flex items-center gap-1.5">
                  GapFinder AI
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#d8cfc1]/80 font-medium">
                  {role === "teacher" ? "Lecturer Dashboard" : "Student Dashboard"}
                </p>
              </div>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="rounded-lg p-1 text-[#f3eee4]/60 hover:text-white lg:hidden"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Action Pill for Students */}
          {role !== "teacher" && (
            <div className="px-4 pt-4 pb-1">
              <Link
                href="/quiz"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-terracotta to-[#d96e38] px-3 py-2.5 text-xs font-semibold text-white shadow-sm hover:brightness-110 transition-all active:scale-[0.98]"
              >
                <Zap size={14} className="fill-current" />
                <span>Take Diagnostic Quiz</span>
              </Link>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="grid gap-0.5 px-3 py-3">
            {links.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href + "/"));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3.5 py-2 text-xs font-medium transition-all",
                    active
                      ? "bg-white/10 text-white shadow-inner font-semibold"
                      : "text-[#f8f5ee]/70 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <Icon
                    size={16}
                    className={cn(
                      "transition-colors shrink-0",
                      active ? "text-terracotta" : "text-[#d8cfc1]/60 group-hover:text-[#f8f5ee]",
                    )}
                  />
                  <span className="truncate">{link.label}</span>
                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-terracotta shrink-0" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile Card & Sign Out */}
        <div className="border-t border-white/10 bg-black/20 p-4 mt-auto">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2a241f] to-[#3a322c] text-sm font-bold text-terracotta border border-white/10">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{name}</p>
              <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#d8cfc1]">
                {role}
              </span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              title="Sign Out"
              className="rounded-lg p-2 text-[#d8cfc1]/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="min-w-0 px-4 py-8 sm:px-8 lg:px-12 max-w-7xl">
        {children}
      </main>
    </div>
  );
}
