import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { LecturerCommunicationView } from "./lecturer-view";
import { GraduationCap } from "lucide-react";

export default async function LecturerPage() {
  const user = await requireUser();

  const [doubts, topics] = await Promise.all([
    prisma.lecturerDoubt.findMany({
      where: user.role === "teacher" ? {} : { studentId: user.id },
      include: {
        student: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.topic.findMany({
      where: { userId: user.id },
      select: { id: true, name: true },
      orderBy: { order: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-rule/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-terracotta/10 text-terracotta">
              <GraduationCap size={16} />
            </span>
            <p className="text-xs uppercase tracking-[0.2em] text-terracotta font-semibold">
              Academic Support
            </p>
          </div>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-ink">Ask My Lecturer</h1>
          <p className="mt-1.5 text-sm text-muted max-w-2xl">
            {user.role === "teacher"
              ? "Review questions submitted by your students, post official clarifications, and track resolution."
              : "Directly communicate academic doubts to your lecturer and view their personalized pedagogical replies."}
          </p>
        </div>
      </div>

      <LecturerCommunicationView
        role={user.role}
        initialDoubts={doubts}
        topics={topics}
      />
    </div>
  );
}
