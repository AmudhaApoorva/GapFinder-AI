import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { SettingsForm } from "./settings-form";
import { Settings as SettingsIcon } from "lucide-react";

export default async function SettingsPage() {
  const user = await requireUser();
  const dbUser = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      hoursPerDay: true,
      examDate: true,
      preferredLanguage: true,
    },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="pb-6 border-b border-rule/60">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-terracotta/10 text-terracotta">
            <SettingsIcon size={16} />
          </span>
          <p className="text-xs uppercase tracking-[0.2em] text-terracotta font-semibold">
            Preferences & Profile
          </p>
        </div>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-ink">Settings</h1>
        <p className="mt-1.5 text-sm text-muted">
          Configure your default learning language, revision schedule targets, and voice preferences.
        </p>
      </div>

      <SettingsForm initialUser={dbUser} />
    </div>
  );
}
