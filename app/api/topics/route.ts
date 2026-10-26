import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { rebuildTopicMap } from "@/lib/ingest";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const topics = await rebuildTopicMap(session.user.id);
  return NextResponse.json({ count: topics.length });
}
