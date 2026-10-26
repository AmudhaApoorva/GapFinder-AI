import { z } from "zod";
import { prisma } from "./db";
import { generateJson, generatePlain, hasGenerationKey } from "./ai";
import { retrieveChunks } from "./retrieve";
import { embedQuery } from "./embeddings";
import { SUPPORTED_LANGUAGES } from "./assistant";

export type TopicDiagnosis = {
  id: string;
  topicId: string;
  name: string;
  sourceRef: string;
  level: "strong" | "medium" | "weak" | "not_assessed";
  levelLabel: string;
  accuracy: number;
  attemptsCount: number;
  misses: string[];
  reason: string;
  lastRevisionDate?: string;
  priorityScore: number;
};

/**
 * Evaluates all topics for the authenticated user and generates an evidence-based diagnosis.
 */
export async function getTopicDiagnoses(userId: string): Promise<{
  diagnoses: TopicDiagnosis[];
  criticalGapsCount: number;
  developingCount: number;
  strongCount: number;
  notAssessedCount: number;
  disclaimer: string;
}> {
  const [topics, masteries, answers, planItems] = await Promise.all([
    prisma.topic.findMany({
      where: { userId },
      orderBy: { order: "asc" },
    }),
    prisma.topicMastery.findMany({
      where: { userId },
    }),
    prisma.answer.findMany({
      where: { attempt: { userId } },
      include: {
        question: { select: { topicId: true, prompt: true } },
      },
      orderBy: { attempt: { createdAt: "desc" } },
    }),
    prisma.planItem.findMany({
      where: { plan: { userId }, completed: true },
      select: { topicId: true, completedAt: true },
    }),
  ]);

  const answersByTopic = new Map<string, typeof answers>();
  for (const a of answers) {
    const tId = a.question.topicId;
    const list = answersByTopic.get(tId) ?? [];
    list.push(a);
    answersByTopic.set(tId, list);
  }

  const lastRevisionMap = new Map<string, string>();
  for (const p of planItems) {
    if (p.topicId && p.completedAt) {
      lastRevisionMap.set(p.topicId, p.completedAt.toISOString().slice(0, 10));
    }
  }

  const diagnoses: TopicDiagnosis[] = topics.map((topic) => {
    const m = masteries.find((x) => x.topicId === topic.id);
    const topicAnswers = answersByTopic.get(topic.id) ?? [];
    const attemptsCount = topicAnswers.length;

    let level: "strong" | "medium" | "weak" | "not_assessed" = "not_assessed";
    let levelLabel = "Not Assessed";
    let accuracy = 0;
    const misses: string[] = [];

    if (attemptsCount > 0) {
      const correct = topicAnswers.filter((a) => a.isCorrect).length;
      accuracy = Math.round((correct / attemptsCount) * 100);

      // Collect misses
      topicAnswers
        .filter((a) => !a.isCorrect)
        .slice(0, 3)
        .forEach((a) => misses.push(a.question.prompt.slice(0, 100)));

      if (accuracy >= 80) {
        level = "strong";
        levelLabel = "Mastered";
      } else if (accuracy >= 50) {
        level = "medium";
        levelLabel = "Developing";
      } else {
        level = "weak";
        levelLabel = "Critical Gap";
      }
    } else if (m) {
      accuracy = Math.round(m.accuracy * 100);
      level = m.level === "strong" ? "strong" : m.level === "medium" ? "medium" : "weak";
      levelLabel = level === "strong" ? "Mastered" : level === "medium" ? "Developing" : "Critical Gap";
    }

    const reason =
      level === "not_assessed"
        ? "Not assessed yet. Take a diagnostic drill to evaluate this concept."
        : m?.reason ||
          (level === "strong"
            ? `Solid grasp demonstrated (${accuracy}% accuracy across ${attemptsCount} questions).`
            : level === "medium"
              ? `Partial comprehension (${accuracy}% accuracy). Missed questions on key details.`
              : `High friction (${accuracy}% accuracy). Common struggles on ${misses[0] || "core definitions"}.`);

    const priorityScore =
      level === "weak" ? 100 - accuracy : level === "medium" ? 60 - accuracy : level === "not_assessed" ? 40 : 10;

    return {
      id: topic.id,
      topicId: topic.id,
      name: topic.name,
      sourceRef: topic.sourceRef,
      level,
      levelLabel,
      accuracy,
      attemptsCount,
      misses,
      reason,
      lastRevisionDate: lastRevisionMap.get(topic.id),
      priorityScore,
    };
  });

  // Sort by priority (weakest first)
  diagnoses.sort((a, b) => b.priorityScore - a.priorityScore);

  return {
    diagnoses,
    criticalGapsCount: diagnoses.filter((d) => d.level === "weak").length,
    developingCount: diagnoses.filter((d) => d.level === "medium").length,
    strongCount: diagnoses.filter((d) => d.level === "strong").length,
    notAssessedCount: diagnoses.filter((d) => d.level === "not_assessed").length,
    disclaimer:
      "Learning classifications are objective academic metrics calculated from recorded quiz answers and study activity, not medical or psychological evaluations.",
  };
}

/**
 * Generates interactive study content for a weak topic:
 * - Simple explanation
 * - Real-life analogy / example
 * - Step-by-step breakdown
 * - Active recall question
 * - Flashcards
 * - Teach-back review
 * - Mistake-based practice
 */
export async function generateWeakTopicLearningModule(
  userId: string,
  topicId: string,
  mode:
    | "explain_simply"
    | "real_life_example"
    | "step_by_step"
    | "active_recall"
    | "flashcards"
    | "mistake_practice",
  language: string = "en",
) {
  const topic = await prisma.topic.findUniqueOrThrow({
    where: { id: topicId },
    include: {
      mastery: { where: { userId } },
    },
  });

  const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === language) ?? SUPPORTED_LANGUAGES[0];
  const langRule =
    language !== "en"
      ? `Generate the content fluently in ${langObj.name} (${langObj.native}), retaining key technical terms and keywords in English alongside translations.`
      : "Provide clear, student-friendly English.";

  // Fetch relevant syllabus chunks
  const queryEmbedding = await embedQuery(`${topic.name} ${topic.description}`);
  const chunks = await retrieveChunks(userId, topic.name, 3, queryEmbedding);
  const contextText = chunks.length
    ? chunks.map((c) => `[From ${c.title} - ${c.section}]: ${c.content}`).join("\n\n")
    : topic.description;

  const citations = chunks.map((c) => ({
    title: c.title,
    section: c.section,
    excerpt: c.content.slice(0, 200),
  }));

  // 1. Explain Simply
  if (mode === "explain_simply") {
    if (hasGenerationKey()) {
      const prompt = `Topic: "${topic.name}"
Syllabus Context:
${contextText}

Explain this concept in simple, beginner-friendly terms. Avoid unnecessary academic jargon.
Format with:
- Intuitive 1-sentence definition
- How it actually works in plain language
- Why it matters for your exams
${langRule}`;

      const res = await generatePlain(
        "You are an encouraging, world-class academic tutor skilled at simplifying complex concepts.",
        prompt,
      );
      if (res.text) {
        return {
          mode,
          topicName: topic.name,
          title: `Simple Explanation: ${topic.name}`,
          content: res.text,
          citations,
        };
      }
    }

    return {
      mode,
      topicName: topic.name,
      title: `Simple Explanation: ${topic.name}`,
      content: `### Intuitive Overview of ${topic.name}\n\n**${topic.name}** is a core syllabus concept in ${topic.sourceRef}.\n\nAt its heart, it organizes how data or instructions behave within the system so that tasks are completed reliably and without ambiguity.\n\n**Key Takeaway:** Think of ${topic.name} as a structured set of rules that ensures predictable, correct execution under exam conditions.`,
      citations,
    };
  }

  // 2. Real-Life Examples & Analogies
  if (mode === "real_life_example") {
    if (hasGenerationKey()) {
      const prompt = `Topic: "${topic.name}"
Syllabus Context:
${contextText}

Provide an everyday, highly relatable analogy or real-world example that makes "${topic.name}" instantly click for a student.
Show:
- The Everyday Analogy
- How the analogy maps to the technical concept
- Why this prevents common exam confusion
${langRule}`;

      const res = await generatePlain(
        "You are an expert tutor known for brilliant everyday analogies that demystify technical ideas.",
        prompt,
      );
      if (res.text) {
        return {
          mode,
          topicName: topic.name,
          title: `Real-Life Analogy: ${topic.name}`,
          content: res.text,
          citations,
        };
      }
    }

    return {
      mode,
      topicName: topic.name,
      title: `Real-Life Analogy: ${topic.name}`,
      content: `### Real-Life Analogy for ${topic.name}\n\nImagine an airport control tower managing airplane departures and landings. If every plane moved at will, collisions would occur.\n\nSimilarly, **${topic.name}** coordinates operations in ${topic.sourceRef} so that competing tasks or data streams never interfere with one another.\n\n**Connecting to the Exam:** Whenever you see an exam question about ${topic.name}, remember the control tower coordinating traffic step-by-step.`,
      citations,
    };
  }

  // 3. Step-by-Step Learning
  if (mode === "step_by_step") {
    if (hasGenerationKey()) {
      const prompt = `Topic: "${topic.name}"
Syllabus Context:
${contextText}

Break down "${topic.name}" into 4 concise, sequential micro-steps.
For each step, provide:
1. What happens
2. Why it happens
3. An exam tip or warning
${langRule}`;

      const res = await generatePlain(
        "You are a step-by-step pedagogy expert who breaks hard topics into bite-sized milestones.",
        prompt,
      );
      if (res.text) {
        return {
          mode,
          topicName: topic.name,
          title: `Step-by-Step Breakdown: ${topic.name}`,
          content: res.text,
          citations,
        };
      }
    }

    return {
      mode,
      topicName: topic.name,
      title: `Step-by-Step Breakdown: ${topic.name}`,
      content: `### Step-by-Step Breakdown: ${topic.name}\n\n1. **Step 1: Initialization & Prerequisites**\n   Before ${topic.name} begins, initial states and parameters must be verified.\n\n2. **Step 2: Core Processing & Execution**\n   The main logic processes inputs according to the established rules.\n\n3. **Step 3: Verification & Boundary Handling**\n   Checking edge conditions prevents runtime errors or infinite states.\n\n4. **Step 4: Output Delivery & State Finalization**\n   Results are returned or committed, maintaining consistency.`,
      citations,
    };
  }

  // 4. Interactive Active Recall
  if (mode === "active_recall") {
    if (hasGenerationKey()) {
      const schema = z.object({
        question: z.string(),
        hint: z.string(),
        idealAnswer: z.string(),
        keyPhrases: z.array(z.string()),
      });

      const prompt = `Topic: "${topic.name}"
Syllabus Context:
${contextText}

Create 1 targeted active recall test prompt for "${topic.name}" that assesses a critical concept.
Include an encouraging hint, the ideal model answer, and 3 key phrases that must be in a complete response.
${langRule}`;

      const res = await generateJson(
        schema,
        "You are an active recall assessment designer.",
        prompt,
      );

      if (res) {
        return {
          mode,
          topicName: topic.name,
          title: `Active Recall Drill: ${topic.name}`,
          recallData: res,
          citations,
        };
      }
    }

    return {
      mode,
      topicName: topic.name,
      title: `Active Recall Drill: ${topic.name}`,
      recallData: {
        question: `In your own words, state the definition of ${topic.name} and identify its primary purpose in ${topic.sourceRef}.`,
        hint: `Think about what problem ${topic.name} solves when designing or analyzing systems.`,
        idealAnswer: `${topic.name} provides a systematic mechanism to manage and structure operations, ensuring reliability, predictability, and compliance with syllabus standards.`,
        keyPhrases: [topic.name, "systematic mechanism", "predictability"],
      },
      citations,
    };
  }

  // 5. Flashcards
  if (mode === "flashcards") {
    if (hasGenerationKey()) {
      const schema = z.object({
        cards: z.array(
          z.object({
            front: z.string(),
            back: z.string(),
            tip: z.string(),
          }),
        ),
      });

      const prompt = `Topic: "${topic.name}"
Syllabus Context:
${contextText}

Generate 3 high-yield study flashcards for "${topic.name}".
Each card must have:
- Front: A clear question or term prompt
- Back: Concise, high-retention explanation
- Tip: A memorable exam mnemonic or key pitfall to avoid
${langRule}`;

      const res = await generateJson(schema, "You are an expert flashcard creator.", prompt);
      if (res && res.cards.length) {
        return {
          mode,
          topicName: topic.name,
          title: `Flashcards: ${topic.name}`,
          cards: res.cards,
          citations,
        };
      }
    }

    return {
      mode,
      topicName: topic.name,
      title: `Flashcards: ${topic.name}`,
      cards: [
        {
          front: `What is the core definition of ${topic.name}?`,
          back: `${topic.name} is a fundamental concept in ${topic.sourceRef} defining operational structures and reliable execution rules.`,
          tip: "Do not confuse this with related neighboring topics in the syllabus.",
        },
        {
          front: `What is the most frequent exam mistake students make regarding ${topic.name}?`,
          back: `Forgetting edge cases and assuming operations occur in an unstructured order.`,
          tip: "Always write down the step-by-step mechanism in your answers.",
        },
        {
          front: `Why is ${topic.name} critical in real-world systems?`,
          back: `It guarantees deterministic behavior and prevents errors during data processing.`,
          tip: "Include a 1-sentence real-world analogy for bonus marks.",
        },
      ],
      citations,
    };
  }

  // 6. Mistake-Based Practice
  const prompt = `Topic: "${topic.name}"
Syllabus Context:
${contextText}

Generate 2 practice questions targeting the most common misconceptions on "${topic.name}".
Provide question, correct answer, explanation, and why wrong answers tempt students.
${langRule}`;

  if (hasGenerationKey()) {
    const res = await generatePlain(
      "You are an examiner writing misconception-targeted questions.",
      prompt,
    );
    if (res.text) {
      return {
        mode,
        topicName: topic.name,
        title: `Misconception Practice: ${topic.name}`,
        content: res.text,
        citations,
      };
    }
  }

  return {
    mode,
    topicName: topic.name,
    title: `Misconception Practice: ${topic.name}`,
    content: `### Targeted Practice on ${topic.name}\n\n**Question 1:** Why is ${topic.name} chosen over naive approaches?\n\n*Solution:* Naive approaches fail when scale or complexity increases. ${topic.name} provides formal guarantees.\n\n**Question 2:** What happens if boundary conditions are omitted in ${topic.name}?\n\n*Solution:* The system may enter unverified or infinite states, leading to inconsistent outputs.`,
    citations,
  };
}
