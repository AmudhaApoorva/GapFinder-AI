import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { VoiceLearningStudio } from "./voice-studio";
import { Mic, Volume2 } from "lucide-react";

export default async function VoiceLearningPage() {
  const user = await requireUser();
  const [topics, mastery] = await Promise.all([
    prisma.topic.findMany({
      where: { userId: user.id },
      orderBy: { order: "asc" },
    }),
    prisma.topicMastery.findMany({
      where: { userId: user.id },
      include: { topic: true },
      orderBy: { accuracy: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-rule/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-terracotta/10 text-terracotta">
              <Mic size={16} />
            </span>
            <p className="text-xs uppercase tracking-[0.2em] text-terracotta font-semibold">
              Auditory Learning
            </p>
          </div>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-ink">Voice Learning Studio</h1>
          <p className="mt-1.5 text-sm text-muted max-w-2xl">
            Ask academic doubts via speech-to-text input, and listen to explanations read aloud with text-to-speech across 6 languages.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold bg-paper px-3 py-1.5 rounded-full border border-rule text-muted">
          <Volume2 size={14} className="text-terracotta" />
          <span>Speech Recognition & Synthesis</span>
        </div>
      </div>

      <VoiceLearningStudio
        topics={topics.map((t) => ({ id: t.id, name: t.name, description: t.description }))}
        weakTopics={mastery.filter((m) => m.level === "weak").map((m) => m.topic.name)}
      />
    </div>
  );
}
