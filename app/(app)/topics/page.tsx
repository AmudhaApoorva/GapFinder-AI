import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { TopicExplorer } from "./topic-explorer";
import { Map } from "lucide-react";

export default async function TopicsPage() {
  const user = await requireUser();
  const topics = await prisma.topic.findMany({
    where: { userId: user.id },
    include: {
      mastery: {
        where: { userId: user.id },
        select: { level: true, accuracy: true, reason: true },
      },
    },
    orderBy: { order: "asc" },
  });

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-rule/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-terracotta/10 text-terracotta">
              <Map size={16} />
            </span>
            <p className="text-xs uppercase tracking-[0.2em] text-terracotta font-semibold">
              Syllabus Structure
            </p>
          </div>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-ink">Topic Taxonomy Map</h1>
          <p className="mt-1.5 text-sm text-muted max-w-2xl">
            Derived directly from your uploaded syllabus and notes. Every diagnostic quiz item, gap rating, and revision plan item is anchored to one of these nodes.
          </p>
        </div>
      </div>

      <TopicExplorer topics={topics} />
    </div>
  );
}
