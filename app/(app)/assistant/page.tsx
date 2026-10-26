import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { ChatBox } from "./chat-box";
import { MessageSquare, ShieldCheck } from "lucide-react";

export default async function AssistantPage() {
  const user = await requireUser();
  const [turns, mastery] = await Promise.all([
    prisma.chatTurn.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      take: 40,
    }),
    prisma.topicMastery.findMany({
      where: { userId: user.id },
      include: { topic: true },
      orderBy: { accuracy: "asc" },
    }),
  ]);

  const weakTopics = mastery.filter((m) => m.level === "weak").map((m) => m.topic.name);
  const defaultPrompts = [
    "Explain the difference between local and global scope in Python functions.",
    "Why does Cartesian product differ from a Natural Join in SQL?",
    "What are the key trade-offs between Star topology and Bus topology?",
    "How does recursion work with base cases, and what causes infinite recursion?",
  ];

  const suggestedPrompts = weakTopics.length > 0
    ? weakTopics.slice(0, 4).map((name) => `Explain the core concepts and common exam pitfalls of "${name}".`)
    : defaultPrompts;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-rule/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-terracotta/10 text-terracotta">
              <MessageSquare size={16} />
            </span>
            <p className="text-xs uppercase tracking-[0.2em] text-terracotta font-semibold">
              Grounded Explain Tutor
            </p>
          </div>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-ink">Explain This Topic</h1>
          <p className="mt-1.5 text-sm text-muted max-w-2xl">
            Ask any question regarding your syllabus or notes. The assistant is strictly bound to your uploaded materials and will not hallucinate outside context.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 shrink-0">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>Hallucination-Protected</span>
        </div>
      </div>

      <Suspense fallback={<div className="p-8 text-center text-muted">Loading assistant…</div>}>
        <ChatBox
          initial={turns.map((t) => {
            let citations: { title: string; section: string; excerpt: string }[] = [];
            let sourceType: "uploaded_materials" | "general_academic" | "evaluation" = "uploaded_materials";
            let sourceLabel: string = "Grounded in Uploaded Material";
            let evaluation: any = undefined;
            let followUpQuestions: string[] | undefined = undefined;

            try {
              const parsed = JSON.parse(t.citations);
              if (Array.isArray(parsed)) {
                citations = parsed;
              } else if (parsed && typeof parsed === "object") {
                citations = parsed.citations || [];
                sourceType = parsed.sourceType || "uploaded_materials";
                sourceLabel = parsed.sourceLabel || "Grounded in Uploaded Material";
                evaluation = parsed.evaluation;
                followUpQuestions = parsed.followUpQuestions;
              }
            } catch {
              citations = [];
            }

            return {
              id: t.id,
              role: t.role,
              content: t.content,
              citations,
              sourceType,
              sourceLabel,
              evaluation,
              followUpQuestions,
            };
          })}
          suggestedPrompts={suggestedPrompts}
        />
      </Suspense>
    </div>
  );
}
