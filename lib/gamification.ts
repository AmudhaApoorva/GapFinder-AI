import { prisma } from "./db";

export type BadgeDefinition = {
  key: string;
  title: string;
  description: string;
  icon: string;
  category: "focus" | "quiz" | "streak" | "mastery" | "consistency";
};

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    key: "first_focus",
    title: "Focus Pioneer",
    description: "Completed your first 25-minute Pomodoro focus sprint.",
    icon: "flame",
    category: "focus",
  },
  {
    key: "first_quiz",
    title: "Diagnostic Explorer",
    description: "Completed your first diagnostic or topic quiz.",
    icon: "award",
    category: "quiz",
  },
  {
    key: "three_day_streak",
    title: "Streak Master",
    description: "Maintained a 3-day active study streak.",
    icon: "zap",
    category: "streak",
  },
  {
    key: "goal_crusher",
    title: "Goal Crusher",
    description: "Achieved your configured daily learning goal.",
    icon: "target",
    category: "consistency",
  },
  {
    key: "gap_closer",
    title: "Gap Closer",
    description: "Turned an assessed weak learning gap into a developing or mastered topic.",
    icon: "shield-check",
    category: "mastery",
  },
  {
    key: "consistent_learner",
    title: "Dedicated Scholar",
    description: "Completed 5 verified deep focus study sessions.",
    icon: "clock",
    category: "focus",
  },
  {
    key: "revision_champion",
    title: "Revision Champion",
    description: "Completed 3 scheduled tasks from your adaptive revision plan.",
    icon: "book-open",
    category: "mastery",
  },
];

/**
 * Idempotently awards points to a user for a verified activity.
 * Prevents duplicate rewards for repeated calls.
 */
export async function awardPoints(
  userId: string,
  activityType:
    | "focus_session"
    | "daily_challenge"
    | "quiz_completion"
    | "correct_answer"
    | "review_mistake"
    | "goal_met",
  activityId: string,
  points: number,
  description: string,
): Promise<{ awarded: boolean; points: number }> {
  try {
    const existing = await prisma.rewardEvent.findUnique({
      where: {
        userId_activityType_activityId: {
          userId,
          activityType,
          activityId,
        },
      },
    });

    if (existing) {
      return { awarded: false, points: 0 };
    }

    await prisma.rewardEvent.create({
      data: {
        userId,
        activityType,
        activityId,
        points,
        description,
      },
    });

    // Check if any badges were unlocked by this activity
    await checkAndAwardBadges(userId);

    return { awarded: true, points };
  } catch (err) {
    console.error("[Gamification] awardPoints error:", err);
    return { awarded: false, points: 0 };
  }
}

/**
 * Evaluates verified database records to check and unlock badges.
 */
export async function checkAndAwardBadges(userId: string) {
  const [
    existingBadges,
    focusCount,
    attemptCount,
    streak,
    completedTasks,
    masteredTopics,
  ] = await Promise.all([
    prisma.userBadge.findMany({ where: { userId } }),
    prisma.focusSession.count({ where: { userId, status: "completed" } }),
    prisma.attempt.count({ where: { userId } }),
    calculateStreak(userId),
    prisma.planItem.count({ where: { plan: { userId }, completed: true } }),
    prisma.topicMastery.count({
      where: { userId, level: { in: ["strong", "medium"] } },
    }),
  ]);

  const earnedKeys = new Set(existingBadges.map((b) => b.badgeKey));
  const newAwards: { key: string; title: string; description: string; icon: string }[] = [];

  if (focusCount >= 1 && !earnedKeys.has("first_focus")) {
    const def = BADGE_DEFINITIONS.find((b) => b.key === "first_focus")!;
    newAwards.push(def);
  }

  if (focusCount >= 5 && !earnedKeys.has("consistent_learner")) {
    const def = BADGE_DEFINITIONS.find((b) => b.key === "consistent_learner")!;
    newAwards.push(def);
  }

  if (attemptCount >= 1 && !earnedKeys.has("first_quiz")) {
    const def = BADGE_DEFINITIONS.find((b) => b.key === "first_quiz")!;
    newAwards.push(def);
  }

  if (streak.currentStreak >= 3 && !earnedKeys.has("three_day_streak")) {
    const def = BADGE_DEFINITIONS.find((b) => b.key === "three_day_streak")!;
    newAwards.push(def);
  }

  if (completedTasks >= 3 && !earnedKeys.has("revision_champion")) {
    const def = BADGE_DEFINITIONS.find((b) => b.key === "revision_champion")!;
    newAwards.push(def);
  }

  if (masteredTopics >= 1 && !earnedKeys.has("gap_closer")) {
    const def = BADGE_DEFINITIONS.find((b) => b.key === "gap_closer")!;
    newAwards.push(def);
  }

  for (const b of newAwards) {
    try {
      await prisma.userBadge.create({
        data: {
          userId,
          badgeKey: b.key,
          title: b.title,
          description: b.description,
          icon: b.icon,
        },
      });
    } catch {}
  }
}

/**
 * Calculates current and longest study streak from verified activity records
 * (completed focus sessions, quiz attempts, and completed plan tasks).
 */
export async function calculateStreak(userId: string): Promise<{
  currentStreak: number;
  longestStreak: number;
  activityDates: string[];
}> {
  const [sessions, attempts, planItems] = await Promise.all([
    prisma.focusSession.findMany({
      where: { userId, status: "completed" },
      select: { createdAt: true },
    }),
    prisma.attempt.findMany({
      where: { userId },
      select: { createdAt: true },
    }),
    prisma.planItem.findMany({
      where: { plan: { userId }, completed: true, completedAt: { not: null } },
      select: { completedAt: true },
    }),
  ]);

  const datesSet = new Set<string>();

  for (const s of sessions) {
    datesSet.add(s.createdAt.toISOString().slice(0, 10));
  }
  for (const a of attempts) {
    datesSet.add(a.createdAt.toISOString().slice(0, 10));
  }
  for (const p of planItems) {
    if (p.completedAt) {
      datesSet.add(p.completedAt.toISOString().slice(0, 10));
    }
  }

  const sortedDates = [...datesSet].sort();
  if (!sortedDates.length) {
    return { currentStreak: 0, longestStreak: 0, activityDates: [] };
  }

  // Calculate longest streak
  let longest = 1;
  let currentRun = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]).getTime();
    const curr = new Date(sortedDates[i]).getTime();
    const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentRun++;
      if (currentRun > longest) longest = currentRun;
    } else if (diffDays > 1) {
      currentRun = 1;
    }
  }

  // Calculate active current streak relative to today
  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const hasToday = datesSet.has(todayStr);
  const hasYesterday = datesSet.has(yesterdayStr);

  let currentStreak = 0;
  if (hasToday || hasYesterday) {
    const anchor = hasToday ? todayStr : yesterdayStr;
    currentStreak = 1;
    let checkDate = new Date(anchor);

    while (true) {
      checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
      const str = checkDate.toISOString().slice(0, 10);
      if (datesSet.has(str)) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  return {
    currentStreak,
    longestStreak: Math.max(longest, currentStreak),
    activityDates: sortedDates,
  };
}

/**
 * Generates or retrieves today's Daily Learning Challenges based on
 * the student's identified weak topics, syllabus, and quiz history.
 */
export async function getOrCreateDailyChallenges(userId: string) {
  const today = new Date().toISOString().slice(0, 10);

  // Check if today's challenges already exist
  let challenges = await prisma.dailyChallenge.findMany({
    where: { userId, date: today },
    orderBy: { challengeKey: "asc" },
  });

  if (challenges.length > 0) {
    return challenges;
  }

  // Fetch weak topic for personalized challenge
  const [weakMastery, topics] = await Promise.all([
    prisma.topicMastery.findFirst({
      where: { userId, level: "weak" },
      include: { topic: true },
      orderBy: { accuracy: "asc" },
    }),
    prisma.topic.findMany({
      where: { userId },
      take: 2,
    }),
  ]);

  const targetTopic = weakMastery?.topic ?? topics[0] ?? null;

  const challengeTemplates = [
    {
      challengeKey: "focus_sprint",
      title: "Deep Focus Session",
      description: targetTopic
        ? `Complete a 25-minute Pomodoro focus block on "${targetTopic.name}".`
        : "Complete a 25-minute focused Pomodoro study sprint.",
      topicId: targetTopic?.id ?? null,
      topicName: targetTopic?.name ?? null,
      targetCount: 1,
      points: 30,
    },
    {
      challengeKey: "quick_drill",
      title: "Adaptive Concept Drill",
      description: targetTopic
        ? `Attempt a 5-question diagnostic drill targeting "${targetTopic.name}".`
        : "Complete a diagnostic practice quiz to test your recall.",
      topicId: targetTopic?.id ?? null,
      topicName: targetTopic?.name ?? null,
      targetCount: 1,
      points: 25,
    },
    {
      challengeKey: "concept_explanation",
      title: "Interactive Review",
      description: targetTopic
        ? `Explain or review the core principles of "${targetTopic.name}" using Explain This Topic.`
        : "Ask the AI assistant to break down a difficult syllabus topic.",
      topicId: targetTopic?.id ?? null,
      topicName: targetTopic?.name ?? null,
      targetCount: 1,
      points: 20,
    },
  ];

  for (const t of challengeTemplates) {
    try {
      await prisma.dailyChallenge.create({
        data: {
          userId,
          date: today,
          challengeKey: t.challengeKey,
          title: t.title,
          description: t.description,
          topicId: t.topicId,
          topicName: t.topicName,
          targetCount: t.targetCount,
          points: t.points,
        },
      });
    } catch {}
  }

  return prisma.dailyChallenge.findMany({
    where: { userId, date: today },
    orderBy: { challengeKey: "asc" },
  });
}

/**
 * Gets or creates study goals for the student.
 */
export async function getStudyGoals(userId: string) {
  let goal = await prisma.studyGoal.findUnique({
    where: { userId },
  });

  if (!goal) {
    goal = await prisma.studyGoal.create({
      data: {
        userId,
        dailyFocusMinutes: 50,
        dailySessions: 2,
        dailyQuestions: 5,
        weeklyFocusMinutes: 300,
      },
    });
  }

  return goal;
}

/**
 * Computes verified focus analytics for the student.
 */
export async function getFocusAnalytics(userId: string) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const now = new Date();

  // Start of current week (Monday)
  const currentDay = now.getDay(); // 0 is Sun, 1 is Mon
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const [
    allCompletedSessions,
    todaySessions,
    weekSessions,
    studyGoal,
    pointsRecords,
    userBadges,
    streakInfo,
    todayAnswersCount,
  ] = await Promise.all([
    prisma.focusSession.findMany({
      where: { userId, status: "completed" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.focusSession.findMany({
      where: {
        userId,
        status: "completed",
        createdAt: { gte: new Date(`${todayStr}T00:00:00.000Z`) },
      },
    }),
    prisma.focusSession.findMany({
      where: {
        userId,
        status: "completed",
        createdAt: { gte: monday, lte: sunday },
      },
    }),
    getStudyGoals(userId),
    prisma.rewardEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.userBadge.findMany({
      where: { userId },
      orderBy: { earnedAt: "desc" },
    }),
    calculateStreak(userId),
    prisma.answer.count({
      where: {
        attempt: {
          userId,
          createdAt: { gte: new Date(`${todayStr}T00:00:00.000Z`) },
        },
      },
    }),
  ]);

  // Today's focus minutes
  const todayFocusMinutes = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const todaySessionsCount = todaySessions.length;

  // Weekly study time chart by day (Mon to Sun)
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weeklyChart = daysOfWeek.map((dayLabel, index) => {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + index);
    const dayStr = dayDate.toISOString().slice(0, 10);

    const dayMinutes = weekSessions
      .filter((s) => s.createdAt.toISOString().slice(0, 10) === dayStr)
      .reduce((acc, s) => acc + s.durationMinutes, 0);

    return {
      day: dayLabel,
      date: dayStr,
      minutes: dayMinutes,
      isToday: dayStr === todayStr,
    };
  });

  // Topics studied (grouping focus minutes and attempts)
  const topicStats = new Map<string, { topicName: string; focusMinutes: number; sessionsCount: number }>();
  for (const s of allCompletedSessions) {
    const name = s.topicName || "General Study";
    const current = topicStats.get(name) ?? { topicName: name, focusMinutes: 0, sessionsCount: 0 };
    current.focusMinutes += s.durationMinutes;
    current.sessionsCount += 1;
    topicStats.set(name, current);
  }

  // Total points earned
  const totalPoints = pointsRecords.reduce((acc, r) => acc + r.points, 0);

  // Goal progress calculations
  const focusMinutesGoalPct = Math.min(100, Math.round((todayFocusMinutes / (studyGoal.dailyFocusMinutes || 50)) * 100));
  const sessionsGoalPct = Math.min(100, Math.round((todaySessionsCount / (studyGoal.dailySessions || 2)) * 100));
  const questionsGoalPct = Math.min(100, Math.round((todayAnswersCount / (studyGoal.dailyQuestions || 5)) * 100));
  const weeklyFocusMinutesTotal = weeklyChart.reduce((acc, d) => acc + d.minutes, 0);
  const weeklyGoalPct = Math.min(100, Math.round((weeklyFocusMinutesTotal / (studyGoal.weeklyFocusMinutes || 300)) * 100));

  const dailyGoalMet = focusMinutesGoalPct >= 100 && sessionsGoalPct >= 100 && questionsGoalPct >= 100;

  // If daily goal met today, award Goal Met points once
  if (dailyGoalMet) {
    await awardPoints(
      userId,
      "goal_met",
      `goal_${todayStr}`,
      50,
      `Achieved all daily study targets for ${todayStr}.`,
    );
  }

  return {
    today: {
      focusMinutes: todayFocusMinutes,
      sessionsCount: todaySessionsCount,
      answersCount: todayAnswersCount,
      date: todayStr,
    },
    weekly: {
      chart: weeklyChart,
      totalMinutes: weeklyFocusMinutesTotal,
      goalMinutes: studyGoal.weeklyFocusMinutes,
      goalPct: weeklyGoalPct,
    },
    goals: {
      dailyFocusMinutes: studyGoal.dailyFocusMinutes,
      dailySessions: studyGoal.dailySessions,
      dailyQuestions: studyGoal.dailyQuestions,
      weeklyFocusMinutes: studyGoal.weeklyFocusMinutes,
      focusMinutesPct: focusMinutesGoalPct,
      sessionsPct: sessionsGoalPct,
      questionsPct: questionsGoalPct,
      dailyGoalMet,
    },
    gamification: {
      totalPoints,
      streak: streakInfo.currentStreak,
      longestStreak: streakInfo.longestStreak,
      earnedBadges: userBadges,
      recentRewards: pointsRecords.slice(0, 8),
    },
    topicsStudied: [...topicStats.values()].sort((a, b) => b.focusMinutes - a.focusMinutes).slice(0, 6),
  };
}
