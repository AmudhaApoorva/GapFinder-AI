import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function masteryFromAccuracy(accuracy: number): "weak" | "medium" | "strong" {
  if (accuracy < 0.5) return "weak";
  if (accuracy < 0.8) return "medium";
  return "strong";
}

export function daysUntil(dateStr?: string | null) {
  if (!dateStr) return 21;
  const target = new Date(dateStr);
  const now = new Date();
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff);
}

export function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
