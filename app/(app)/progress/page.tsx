import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { ProgressView } from "./progress-view";
import { LineChart } from "lucide-react";

export default async function ProgressPage() {
  const user = await requireUser();
  const attempts = await prisma.attempt.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: { quiz: { select: { title: true } } },
  });

  const mastery = await prisma.topicMastery.findMany({
    where: { userId: user.id },
    include: { topic: { select: { id: true, name: true } } },
    orderBy: { accuracy: "asc" },
  });

  let teacherStudents: {
    id: string;
    name: string;
    mastery: {
      level: string;
      accuracy: number;
      topic: { name: string };
    }[];
  }[] = [];

  if (user.role === "teacher") {
    teacherStudents = await prisma.user.findMany({
      where: { role: "student" },
      include: {
        mastery: {
          include: { topic: { select: { name: true } } },
        },
      },
    });
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-rule/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-terracotta/10 text-terracotta">
              <LineChart size={16} />
            </span>
            <p className="text-xs uppercase tracking-[0.2em] text-terracotta font-semibold">
              Mastery Trajectory
            </p>
          </div>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-ink">
            {user.role === "teacher" ? "Class Diagnostic Heatmap" : "Progress & Mastery Analytics"}
          </h1>
          <p className="mt-1.5 text-sm text-muted max-w-2xl">
            {user.role === "teacher"
              ? "Identify syllabus friction points across the class roster to target group interventions."
              : "Track your diagnostic attempts over time. The revision plan adapts dynamically as weak topics are conquered."}
          </p>
        </div>
      </div>

      <ProgressView
        role={user.role}
        attempts={attempts}
        mastery={mastery}
        teacherStudents={teacherStudents}
      />
    </div>
  );
}
