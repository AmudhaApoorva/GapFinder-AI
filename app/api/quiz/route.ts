import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateQuiz } from "@/lib/quiz-engine";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let topicId: string | undefined = undefined;
  let title: string | undefined = undefined;

  try {
    const body = await req.json().catch(() => ({}));
    if (body.topicId) topicId = String(body.topicId);
    if (body.title) title = String(body.title);
  } catch {
    // Body optional
  }

  try {
    const quiz = await generateQuiz(session.user.id, { topicId, title });
    return NextResponse.json({ id: quiz.id, title: quiz.title });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Quiz generation failed" },
      { status: 400 },
    );
  }
}
