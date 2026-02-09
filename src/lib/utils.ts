import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface StreakItem {
  day?: string;
  completed?: boolean;
}

export function getLocalISOString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function calculateCurrentStreak(tasks: StreakItem[], schedule: StreakItem[]): number {
  // Combine all items
  const allItems = [...tasks, ...schedule];

  // Group by day (YYYY-MM-DD)
  const dailyStats: Record<string, { total: number; completed: number }> = {};

  allItems.forEach((item) => {
    if (!item.day) return;
    const date = item.day; // Assuming ISO YYYY-MM-DD

    if (!dailyStats[date]) {
      dailyStats[date] = { total: 0, completed: 0 };
    }

    dailyStats[date].total++;
    if (item.completed) {
      dailyStats[date].completed++;
    }
  });

  let streak = 0;

  // Start from today
  const today = new Date();

  // Check if today adds to the streak
  // If today is perfect (all done), count it.
  const todayISO = getLocalISOString(today);
  const todayStats = dailyStats[todayISO];

  if (todayStats && todayStats.total > 0 && todayStats.total === todayStats.completed) {
    streak++;
  } else {
    // If today is not perfect, we don't count it, but we don't break the streak from yesterday yet.
    // The streak is whatever we achieved up to yesterday.
  }

  // Iterate backwards from yesterday
  const checkDate = new Date(today);
  checkDate.setDate(checkDate.getDate() - 1);

  while (true) {
    const iso = getLocalISOString(checkDate);
    const stats = dailyStats[iso];

    if (stats && stats.total > 0 && stats.total === stats.completed) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // Break on the first imperfect/empty day found going backwards
      break;
    }
  }

  return streak;
}
