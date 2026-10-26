import { generateJson, generatePlain, hasGenerationKey } from "./ai";
import { formatContext, retrieveChunks } from "./retrieve";
import { embedQuery } from "./embeddings";
import { z } from "zod";

export const SUPPORTED_LANGUAGES: {
  code: string;
  name: string;
  native: string;
  speechLang: string;
}[] = [
  { code: "en", name: "English", native: "English", speechLang: "en-IN" },
  { code: "te", name: "Telugu", native: "తెలుగు", speechLang: "te-IN" },
  { code: "hi", name: "Hindi", native: "हिन्दी", speechLang: "hi-IN" },
  { code: "ta", name: "Tamil", native: "தமிழ்", speechLang: "ta-IN" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", speechLang: "kn-IN" },
  { code: "ml", name: "Malayalam", native: "മലയാളം", speechLang: "ml-IN" },
];

export type Citation = {
  title: string;
  section: string;
  excerpt: string;
};

export type EvaluationData = {
  isEvaluation: boolean;
  scoreOutOf10: number;
  verdict: "correct" | "partially_correct" | "needs_improvement" | "incorrect";
  misconceptions: string[];
  correctedAnswer: string;
  constructiveFeedback: string;
};

export type AssistantResult = {
  content: string;
  sourceType: "uploaded_materials" | "general_academic" | "evaluation";
  sourceLabel: string;
  citations: Citation[];
  evaluation?: EvaluationData;
  followUpQuestions: string[];
};

const evaluationSchema = z.object({
  scoreOutOf10: z.number().min(0).max(10),
  verdict: z.enum(["correct", "partially_correct", "needs_improvement", "incorrect"]),
  explanationSummary: z.string(),
  misconceptions: z.array(z.string()),
  correctedAnswer: z.string(),
  constructiveFeedback: z.string(),
  followUpQuestions: z.array(z.string()).default([]),
});

function isEchoOfQuestion(answer: string, question: string): boolean {
  const normA = answer.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const normQ = question.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  return normA === normQ || normA === `${normQ}isafundamentalconceptinacademiccurricula`;
}

export async function answerFromMaterials(
  userId: string,
  question: string,
  language: string = "en",
  history: { role: string; content: string }[] = [],
  mode: "chat" | "evaluate" = "chat",
): Promise<AssistantResult> {
  const cleanQuestion = question.trim();
  const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === language) ?? SUPPORTED_LANGUAGES[0];

  const langInstruction =
    language !== "en"
      ? `Explain clearly, fluently, and naturally in ${langObj.name} (${langObj.native}). Retain key technical terms, syntax keywords, and formulas in English alongside translations (e.g. 'Recursion (రికర్శన్)' or 'Binary Search (द्वి-ఆధారీ శోధన)'). Formulate the pedagogical explanation, examples, and feedback in ${langObj.name}.`
      : "Provide a clear, student-friendly pedagogical explanation in English with definitions, step-by-step breakdown, examples, and important points.";

  const historyContext = history.length
    ? `\n\nRecent Conversation History:\n${history
        .slice(-6)
        .map((h) => `${h.role === "user" ? "Student" : "Assistant"}: ${h.content}`)
        .join("\n")}`
    : "";

  const isEvaluateRequest =
    mode === "evaluate" ||
    cleanQuestion.toLowerCase().startsWith("evaluate:") ||
    cleanQuestion.toLowerCase().startsWith("evaluate my answer:") ||
    cleanQuestion.toLowerCase().startsWith("check my answer:");

  // =========================================================================
  // 1. Answer Evaluation Pipeline
  // =========================================================================
  if (isEvaluateRequest) {
    const rawStudentContent = cleanQuestion
      .replace(/^(evaluate:|evaluate my answer:|check my answer:)/i, "")
      .trim();

    if (!hasGenerationKey()) {
      return {
        content: `⚠️ **AI Evaluation Service Notice**\n\nThe AI evaluator requires a Gemini API key. Please configure \`GEMINI_API_KEY\` in your \`.env\` file to evaluate student answers, detect misconceptions, and receive score breakdowns.`,
        sourceType: "evaluation",
        sourceLabel: "Evaluation Service Unavailable",
        citations: [],
        evaluation: {
          isEvaluation: true,
          scoreOutOf10: 0,
          verdict: "needs_improvement",
          misconceptions: ["AI Evaluation API key not configured"],
          correctedAnswer: "Please configure your GEMINI_API_KEY to evaluate student answers.",
          constructiveFeedback: "Set your API key in .env to unlock real-time AI answer evaluation.",
        },
        followUpQuestions: [
          "How do I configure my Gemini API key?",
          "Explain this topic step-by-step from basics to advanced.",
        ],
      };
    }

    const evaluationPrompt = `Student submitted response for evaluation:
"${rawStudentContent}"
${historyContext}

Evaluate this student answer thoroughly:
1. Check conceptual accuracy and completeness against rigorous academic standards.
2. Identify specific misconceptions, flaws, or missing keywords.
3. Explain why the answer is incorrect, incomplete, or partially correct.
4. Formulate the ideal corrected answer with step-by-step clarity.
5. Provide encouraging, constructive feedback and 2 follow-up practice prompts.
Language instruction: ${langInstruction}`;

    const evalResult = await generateJson(
      evaluationSchema,
      `You are an expert academic evaluator and examiner. Evaluate the student's answer fairly and constructively. Always diagnose misconceptions, provide the model solution, and assign an objective score. Never repeat the student's answer as your response.`,
      evaluationPrompt,
    );

    if (evalResult) {
      const formattedContent = `${evalResult.explanationSummary}

**Diagnostic Breakdown:**
• **Score:** ${evalResult.scoreOutOf10}/10 (${evalResult.verdict.replace("_", " ").toUpperCase()})
• **Identified Misconceptions / Incompleteness:**
${evalResult.misconceptions.map((m) => `  - ${m}`).join("\n")}

**Corrected Model Answer:**
${evalResult.correctedAnswer}

**Constructive Feedback for Improvement:**
${evalResult.constructiveFeedback}`;

      return {
        content: formattedContent,
        sourceType: "evaluation",
        sourceLabel: "Answer Evaluation & Misconceptions Breakdown",
        citations: [],
        evaluation: {
          isEvaluation: true,
          scoreOutOf10: evalResult.scoreOutOf10,
          verdict: evalResult.verdict,
          misconceptions: evalResult.misconceptions,
          correctedAnswer: evalResult.correctedAnswer,
          constructiveFeedback: evalResult.constructiveFeedback,
        },
        followUpQuestions:
          evalResult.followUpQuestions && evalResult.followUpQuestions.length > 0
            ? evalResult.followUpQuestions
            : [
                `Can you explain this concept step-by-step with an example?`,
                `Would you like to try another practice question on this topic?`,
              ],
      };
    }

    return {
      content: `⚠️ **Evaluation Error**\n\nUnable to complete the answer evaluation due to an AI model generation error. Please try submitting again or check your Gemini API key.`,
      sourceType: "evaluation",
      sourceLabel: "Evaluation Error",
      citations: [],
      followUpQuestions: ["Try submitting your answer again."],
    };
  }

  // =========================================================================
  // 2. Retrieval from Uploaded Study Materials (RAG)
  // =========================================================================
  const STOP_WORDS = new Set([
    "what", "explain", "difference", "between", "how", "why", "when", "where", "which",
    "the", "and", "for", "with", "from", "about", "does", "can", "you", "tell", "give",
    "write", "this", "that", "these", "those", "is", "are", "was", "were", "in", "on",
    "at", "to", "of", "a", "an", "detail", "briefly", "short", "simple", "words", "example",
    "please", "help", "describe", "discuss", "concept", "meaning", "define", "definition",
    "topic", "study", "notes", "material", "materials", "syllabus", "textbook"
  ]);

  const significantKeywords = cleanQuestion
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  // Check if query is a natural greeting
  const isGreeting = /^(hi|hello|hey|greetings|good\s+(morning|afternoon|evening|day))[\s!.]*$/i.test(cleanQuestion);

  if (isGreeting) {
    if (hasGenerationKey()) {
      const greetingPrompt = `Student greeting: "${cleanQuestion}"
${historyContext}
Respond warmly, helpfully, and concisely as GapFinder's AI Study Assistant.
Introduce yourself briefly and ask what academic concept, syllabus chapter, or practice question they'd like to explore today.
${langInstruction}`;
      const genRes = await generatePlain(
        "You are GapFinder's AI Study Assistant. Welcome the student warmly, encouragingly, and briefly. Never repeat the greeting back as a definition.",
        greetingPrompt,
        0.5,
      );
      if (genRes.text && !isEchoOfQuestion(genRes.text, cleanQuestion)) {
        return {
          content: genRes.text,
          sourceType: "general_academic",
          sourceLabel: "AI Study Assistant",
          citations: [],
          followUpQuestions: [
            "Explain machine learning in simple words.",
            "What are the key trade-offs between Star and Bus topology?",
            "How do I take a diagnostic quiz on my weak topics?",
          ],
        };
      }
    }

    const greetingText =
      language === "te"
        ? "నమస్కారం! 👋 నేను మీ గ్యాప్‌ఫైండర్ (GapFinder) AI స్టడీ అసిస్టెంట్‌ని. మీ సిలబస్ టాపిక్‌లు సులభంగా నేర్చుకోవడానికి మరియు ప్రాక్టీస్ ప్రశ్నలను మూല్యాంకనం చేయడానికి నేను సిద్ధంగా ఉన్నాను. ఈరోజు మీరు ఏ టాపిక్ నేర్చుకోవాలనుకుంటున్నారు?"
        : language === "hi"
          ? "नमस्ते! 👋 मैं आपका GapFinder AI स्टडी असिस्टेंट हूँ। आपके सिलेबस के विषयों को समझने, शंकाओं को दूर करने और क्विज़ का अभ्यास करने में मैं आपकी मदद कर सकता हूँ। आज आप क्या पढ़ना चाहेंगे?"
          : language === "ta"
            ? "வணக்கம்! 👋 நான் உங்கள் GapFinder AI படிப்பு உதவியாளர். உங்கள் பாடத்திட்ட தலைப்புகளை எளிதாக புரிந்துகொள்ள நான் உங்களுக்கு உதவுகிறேன். இன்று நாம் எதைப் பற்றி படிக்கலாம்?"
            : language === "kn"
              ? "ನಮಸ್ಕಾರ! 👋 ನಾನು ನಿಮ್ಮ GapFinder AI ಸ್ಟಡಿ ಅಸಿಸ್ಟೆಂಟ್. ನಿಮ್ಮ ಪಠ್ಯಕ್ರಮದ ವಿಷಯಗಳನ್ನು ಸುಲಭವಾಗಿ ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ನಾನು ಇಲ್ಲಿದ್ದೇನೆ. ಇಂದು ನೀವು ಯಾವ ವಿಷಯವನ್ನು ಕಲಿಯಲು ಬಯಸುತ್ತೀರಿ?"
              : language === "ml"
                ? "നമസ്കാരം! 👋 ഞാൻ നിങ്ങളുടെ GapFinder AI സ്റ്റഡി അസിസ്റ്റന്റാണ്. നിങ്ങളുടെ സിലബസ് വിഷയങ്ങൾ എളുപ്പത്തിൽ പഠിക്കാൻ ഞാൻ നിങ്ങളെ സഹായിക്കും. ഇന്ന് എന്ത് വിഷയമാണ് പഠിക്കേണ്ടത്?"
                : "Hello! 👋 I'm your GapFinder AI Study Assistant. I'm here to help you master your syllabus concepts, answer doubts with genuine citations from your uploaded notes, and evaluate your practice answers. What topic would you like to explore today?";

    return {
      content: greetingText,
      sourceType: "general_academic",
      sourceLabel: "AI Study Assistant",
      citations: [],
      followUpQuestions: [
        "Explain machine learning in simple words.",
        "What are the key trade-offs between Star and Bus topology?",
        "Evaluate my answer on recursion.",
      ],
    };
  }

  const embedding = await embedQuery(cleanQuestion);
  const chunks = await retrieveChunks(userId, cleanQuestion, 5, embedding);

  // Stricter check for genuine grounding:
  // Must have a good score AND at least one significant non-stopword keyword must appear in the chunk text/title/section
  const topChunkMatchesKeyword =
    chunks.length > 0 &&
    significantKeywords.length > 0 &&
    significantKeywords.some((kw) => {
      const docText = `${chunks[0].title} ${chunks[0].section} ${chunks[0].content}`.toLowerCase();
      return docText.includes(kw);
    });

  const isGroundedInMaterial = chunks.length > 0 && chunks[0].score >= 1.0 && topChunkMatchesKeyword;

  if (isGroundedInMaterial) {
    const context = formatContext(chunks);

    if (hasGenerationKey()) {
      const systemPrompt = `You are GapFinder's AI Study Assistant powered by Google Gemini.
Answer the student's question strictly grounded in the retrieved syllabus context below.
- Never repeat the student's question as the answer.
- Cite sources as [1], [2], etc., matching the provided document chunks.
- Explain concepts from basic to advanced levels in simple, student-friendly language.
- Structure your response:
  1. Overview & Core Definition (simple terms)
  2. Step-by-Step Detailed Breakdown
  3. Real-world or Code Example (if applicable)
  4. Key Points to Remember for Exams
  5. 1 Practice Question
- If the retrieved context only partially answers the question, state what is in the material and acknowledge the boundary.
- Do NOT fabricate facts or document sources.

${langInstruction}`;

      const userPrompt = `Student Academic Question: ${cleanQuestion}
${historyContext}

Retrieved Grounded Context from Student Study Materials:
${context}

Provide the grounded explanation. At the end, on a new line prefixed with "FOLLOW_UPS:", list 3 short follow-up questions or practice mini-quiz prompts separated by " | ".`;

      const genRes = await generatePlain(systemPrompt, userPrompt);
      if (genRes.text && !isEchoOfQuestion(genRes.text, cleanQuestion)) {
        let content = genRes.text;
        let followUps = [
          `How does ${chunks[0].section} compare with related concepts?`,
          `Give an exam-style practice question on ${chunks[0].title}.`,
          `Can you break this down step-by-step with an example?`,
        ];

        if (content.includes("FOLLOW_UPS:")) {
          const parts = content.split("FOLLOW_UPS:");
          content = parts[0].trim();
          const items = parts[1]
            .split("|")
            .map((s) => s.trim())
            .filter(Boolean);
          if (items.length) followUps = items.slice(0, 3);
        }

        return {
          content,
          sourceType: "uploaded_materials",
          sourceLabel: "Grounded in Uploaded Study Materials",
          citations: chunks.map((c) => ({
            title: c.title,
            section: c.section,
            excerpt: c.content.slice(0, 240),
          })),
          followUpQuestions: followUps,
        };
      }
    }

    // If generation key is not configured or failed, provide the grounded excerpts directly
    // WITHOUT repeating the question
    return {
      content: `### Grounded Notes Excerpt\n\nFrom your study materials for **${chunks[0].title}** (${chunks[0].section}):\n\n${chunks[0].content}\n\n*(Note: Configure \`GEMINI_API_KEY\` in your \`.env\` for full AI-synthesized explanations).*`,
      sourceType: "uploaded_materials",
      sourceLabel: "Grounded in Uploaded Study Materials",
      citations: chunks.map((c) => ({
        title: c.title,
        section: c.section,
        excerpt: c.content.slice(0, 240),
      })),
      followUpQuestions: [
        `Explain this excerpt in simple words.`,
        `Give an exam question based on this topic.`,
      ],
    };
  }

  // =========================================================================
  // 3. General Academic Question (Gemini AI)
  // When question is NOT found in uploaded materials, provide general academic explanation
  // CLEARLY DISTINGUISH FROM UPLOADED NOTES and NEVER FABRICATE CITATIONS
  // NEVER RETURN THE USER'S QUESTION AS THE ANSWER
  // =========================================================================
  if (hasGenerationKey()) {
    const generalSystemPrompt = `You are GapFinder's AI Study Assistant powered by Google Gemini.
The student asked an academic question that is NOT present in their uploaded study documents.
Provide a thorough, high-quality, and pedagogically sound general academic explanation.

Guidelines:
- CRITICAL: Never repeat or echo the student's question as the answer.
- Explain concepts from basic to advanced levels using simple, student-friendly language.
- Structure your response clearly:
  1. Concept Definition & Intuitive Summary (simple words)
  2. Step-by-Step Explanation & Mechanics (how it works)
  3. Concrete Example (real-world analogy, formula, or code snippet)
  4. Important Exam Points & Common Misconceptions
  5. 1 Practice Question for self-testing
- Never invent or fabricate document citations or false source files.

${langInstruction}`;

    const generalUserPrompt = `Academic Question: ${cleanQuestion}
${historyContext}

Explain this topic thoroughly. At the end, on a new line prefixed with "FOLLOW_UPS:", list 3 short follow-up questions or mini-quiz prompts separated by " | ".`;

    const genRes = await generatePlain(generalSystemPrompt, generalUserPrompt);
    if (genRes.text && !isEchoOfQuestion(genRes.text, cleanQuestion)) {
      let content = genRes.text;
      let generalFollowUps = [
        `Can you provide another real-world analogy for this?`,
        `What are the most common exam questions on this topic?`,
        `Can you test me with a 2-question quick quiz?`,
      ];

      if (content.includes("FOLLOW_UPS:")) {
        const parts = content.split("FOLLOW_UPS:");
        content = parts[0].trim();
        const items = parts[1]
          .split("|")
          .map((s) => s.trim())
          .filter(Boolean);
        if (items.length) generalFollowUps = items.slice(0, 3);
      }

      return {
        content,
        sourceType: "general_academic",
        sourceLabel: "General Academic Knowledge (Gemini AI)",
        citations: [], // Strictly empty — never fabricate citations
        followUpQuestions: generalFollowUps,
      };
    }

    if (genRes.error) {
      return {
        content: `⚠️ **AI Generation Error**\n\n${genRes.error}\n\nPlease check your \`GEMINI_API_KEY\` in your \`.env\` file or verify network connectivity.`,
        sourceType: "general_academic",
        sourceLabel: "Gemini API Error",
        citations: [],
        followUpQuestions: ["Retry your question."],
      };
    }
  }

  // Missing API Key / No AI Provider Configured Error Message
  // NEVER silently return the user's question or hardcoded fake answers
  return {
    content: `⚠️ **Gemini API Key Required**\n\nTo answer general academic questions like **"${cleanQuestion}"** outside your uploaded study notes, a Google Gemini API key is required.\n\n### How to setup:\n1. Get your free API key at **[Google AI Studio](https://aistudio.google.com/)**.\n2. Add it to your \`.env\` file:\n   \`\`\`env\n   GEMINI_API_KEY="your-gemini-api-key-here"\n   \`\`\`\n3. Restart the application and ask your question again.`,
    sourceType: "general_academic",
    sourceLabel: "API Key Required",
    citations: [],
    followUpQuestions: [
      "How do I upload study materials to ask questions grounded in my syllabus?",
      "Where can I get a Gemini API key?",
    ],
  };
}
