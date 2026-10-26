import { prisma } from "./db";
import { parseJson } from "./utils";

export type RetrievedChunk = {
  id: string;
  content: string;
  section: string;
  title: string;
  kind: string;
  score: number;
};

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function bm25Score(query: string, doc: string) {
  const q = tokenize(query);
  const d = tokenize(doc);
  if (!q.length || !d.length) return 0;
  const tf = new Map<string, number>();
  for (const t of d) tf.set(t, (tf.get(t) ?? 0) + 1);
  let score = 0;
  const avg = d.length;
  const k1 = 1.5;
  const b = 0.75;
  for (const term of q) {
    const f = tf.get(term) ?? 0;
    if (!f) continue;
    const idf = Math.log(1 + 1 / (1 + f));
    score += (idf * (f * (k1 + 1))) / (f + k1 * (1 - b + (b * d.length) / Math.max(avg, 1)));
  }
  return score;
}

function cosine(a: number[], b: number[]) {
  if (!a.length || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export async function retrieveChunks(
  userId: string,
  query: string,
  k = 6,
  queryEmbedding?: number[],
): Promise<RetrievedChunk[]> {
  const chunks = await prisma.chunk.findMany({
    where: { material: { userId } },
    include: { material: true },
  });

  const ranked = chunks.map((chunk) => {
    const embedding = parseJson<number[]>(chunk.embedding, []);
    const lexical = bm25Score(query, `${chunk.section} ${chunk.content} ${chunk.material.title}`);
    const vector =
      queryEmbedding && embedding.length ? cosine(queryEmbedding, embedding) * 8 : 0;
    return {
      id: chunk.id,
      content: chunk.content,
      section: chunk.section,
      title: chunk.material.title,
      kind: chunk.material.kind,
      score: lexical + vector,
    };
  });

  return ranked.sort((a, b) => b.score - a.score).slice(0, k).filter((c) => c.score > 0);
}

export function formatContext(chunks: RetrievedChunk[]) {
  return chunks
    .map(
      (c, i) =>
        `[${i + 1}] ${c.title} — ${c.section}\n${c.content}`,
    )
    .join("\n\n");
}
