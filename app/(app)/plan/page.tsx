import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { PlanView } from "./plan-view";
import { Route } from "lucide-react";

export default async function PlanPage() {
  const user = await requireUser();
  const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  const plan = await prisma.revisionPlan.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        orderBy: [{ day: "asc" }, { priority: "asc" }],
      },
    },
  });

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-rule/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-terracotta/10 text-terracotta">
              <Route size={16} />
            </span>
            <p className="text-xs uppercase tracking-[0.2em] text-terracotta font-semibold">
              Adaptive Revision
            </p>
          </div>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-ink">Revision Plan</h1>
          <p className="mt-1.5 text-sm text-muted max-w-2xl">
            Prioritized by your diagnostic quiz gaps and time remaining until exam day. Track daily task completion and sprint through weak areas.
          </p>
        </div>
      </div>

      <PlanView
        plan={plan}
        initialHours={dbUser.hoursPerDay}
        initialExamDate={dbUser.examDate}
      />
    </div>
  );
}
