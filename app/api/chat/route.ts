import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { answerFromMaterials } from "@/lib/assistant";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const question = String(body.question ?? "").trim();
    const language = String(body.language ?? "en");
    const mode = (body.mode === "evaluate" ? "evaluate" : "chat") as "chat" | "evaluate";

    if (!question) return NextResponse.json({ error: "Question required" }, { status: 400 });

    // Fetch student's recent conversation context for multi-turn conversational memory
    const previousTurns = await prisma.chatTurn.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 6,
    });

    const history = previousTurns
      .reverse()
      .map((t) => ({ role: t.role, content: t.content }));

    // Record student's user turn in isolated chat history
    await prisma.chatTurn.create({
      data: {
        userId: session.user.id,
        role: "user",
        content: question,
        citations: JSON.stringify({ mode, language }),
      },
    });

    // Call assistant with RAG + Gemini general academic fallback + evaluation
    const result = await answerFromMaterials(
      session.user.id,
      question,
      language,
      history,
      mode,
    );

    // Store assistant turn with structured metadata in citations column
    const saved = await prisma.chatTurn.create({
      data: {
        userId: session.user.id,
        role: "assistant",
        content: result.content,
        citations: JSON.stringify({
          citations: result.citations,
          sourceType: result.sourceType,
          sourceLabel: result.sourceLabel,
          evaluation: result.evaluation,
          followUpQuestions: result.followUpQuestions,
        }),
      },
    });

    return NextResponse.json({
      id: saved.id,
      role: "assistant",
      content: result.content,
      citations: result.citations,
      sourceType: result.sourceType,
      sourceLabel: result.sourceLabel,
      evaluation: result.evaluation,
      followUpQuestions: result.followUpQuestions,
    });
  } catch (err: any) {
    console.error("[Chat Route Error]:", err);
    return NextResponse.json(
      { error: err?.message || "An unexpected error occurred while processing your request." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.chatTurn.deleteMany({ where: { userId: session.user.id } });
  return NextResponse.json({ success: true });
}
