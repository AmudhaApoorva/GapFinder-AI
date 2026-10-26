import { prisma } from "./db";
import { chunkDocument } from "./chunk";
import { embedTexts } from "./embeddings";
import { generateJson, hasGenerationKey } from "./ai";
import { z } from "zod";

export async function ingestMaterial(input: {
  userId: string;
  title: string;
  kind: string;
  filename: string;
  mimeType: string;
  text: string;
  seeded?: boolean;
}) {
  const material = await prisma.material.create({
    data: {
      userId: input.userId,
      title: input.title,
      kind: input.kind,
      filename: input.filename,
      mimeType: input.mimeType,
      text: input.text,
      seeded: input.seeded ?? false,
    },
  });

  const chunks = chunkDocument(input.text, input.title);
  const embeddings = await embedTexts(chunks.map((c) => `${c.section}\n${c.content}`));

  await prisma.chunk.createMany({
    data: chunks.map((c, i) => ({
      materialId: material.id,
      section: c.section,
      content: c.content,
      index: c.index,
      embedding: JSON.stringify(embeddings?.[i] ?? []),
    })),
  });

  return material;
}

const topicSchema = z.object({
  topics: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      parentName: z.string().nullable(),
      sourceRef: z.string(),
    }),
  ),
});

function headingTopics(text: string, source: string) {
  const names = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^#{1,3} /.test(l) || /^\d+\.\d+/.test(l))
    .map((l) => l.replace(/^#{1,3} /, "").replace(/^\d+(\.\d+)*\s*/, "").trim())
    .filter((n) => n.length > 3 && n.length < 80);

  const unique = [...new Set(names)];
  return unique.slice(0, 16).map((name) => ({
    name,
    description: `Mapped from ${source}.`,
    parentName: null as string | null,
    sourceRef: source,
  }));
}

export async function rebuildTopicMap(userId: string) {
  const materials = await prisma.material.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  const syllabus = materials.find((m) => m.kind === "syllabus") ?? materials[0];
  if (!syllabus) return [];

  let topics =
    headingTopics(syllabus.text, syllabus.title).length >= 4
      ? headingTopics(syllabus.text, syllabus.title)
      : headingTopics(materials.map((m) => m.text).join("\n"), syllabus.title);

  if (hasGenerationKey()) {
    const generated = await generateJson(
      topicSchema,
      "You extract a syllabus topic map. Use only the provided text. Do not invent units that are not present. Keep 8 to 14 exam-relevant topics.",
      `Build a topic map from this syllabus and notes. Return concise names students would revise.\n\n${syllabus.text.slice(0, 12000)}`,
    );
    if (generated?.topics?.length) topics = generated.topics.slice(0, 14);
  }

  await prisma.planItem.deleteMany({ where: { plan: { userId } } });
  await prisma.revisionPlan.deleteMany({ where: { userId } });
  await prisma.topicMastery.deleteMany({ where: { userId } });
  await prisma.answer.deleteMany({ where: { attempt: { userId } } });
  await prisma.attempt.deleteMany({ where: { userId } });
  await prisma.question.deleteMany({ where: { quiz: { userId } } });
  await prisma.quiz.deleteMany({ where: { userId } });
  await prisma.topic.deleteMany({ where: { userId } });

  await prisma.topic.createMany({
    data: topics.map((t, order) => ({
      userId,
      name: t.name,
      description: t.description,
      parentName: t.parentName,
      sourceRef: t.sourceRef || syllabus.title,
      order,
    })),
  });

  return prisma.topic.findMany({ where: { userId }, orderBy: { order: "asc" } });
}
