import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";

export function LevelBadge({ level }: { level: string }) {
  const norm = level?.toLowerCase() ?? "unrated";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide shadow-sm",
        norm === "weak" && "weak",
        norm === "medium" && "medium",
        norm === "strong" && "strong",
        !["weak", "medium", "strong"].includes(norm) && "bg-rule/60 text-muted border border-rule",
      )}
    >
      {norm === "weak" && <AlertTriangle className="w-3.5 h-3.5 text-terracotta" />}
      {norm === "medium" && <Clock className="w-3.5 h-3.5 text-gold" />}
      {norm === "strong" && <CheckCircle2 className="w-3.5 h-3.5 text-forest" />}
      <span className="capitalize">{norm === "weak" ? "Weak Gap" : norm === "medium" ? "Review" : norm === "strong" ? "Mastered" : norm}</span>
    </span>
  );
}

