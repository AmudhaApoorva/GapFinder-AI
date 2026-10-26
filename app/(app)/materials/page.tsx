import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { UploadForm, RebuildTopics } from "./upload-form";
import { MaterialList } from "./material-list";
import { FolderOpen } from "lucide-react";

export default async function MaterialsPage() {
  const user = await requireUser();
  const materials = await prisma.material.findMany({
    where: { userId: user.id },
    include: { _count: { select: { chunks: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-rule/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-terracotta/10 text-terracotta">
              <FolderOpen size={16} />
            </span>
            <p className="text-xs uppercase tracking-[0.2em] text-terracotta font-semibold">
              Grounding Corpus
            </p>
          </div>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-ink">Study Materials</h1>
          <p className="mt-1.5 text-sm text-muted max-w-2xl">
            GapFinder is strictly grounded in what you provide. Upload syllabus documents, lecture notes, textbook chapters, or past question papers.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.25fr_0.95fr] items-start">
        {/* Left Column: Interactive Material List */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl text-ink">Indexed Documents</h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-paper border border-rule text-muted">
              {materials.length} {materials.length === 1 ? "file" : "files"}
            </span>
          </div>
          <MaterialList initialMaterials={materials} />
        </div>

        {/* Right Column: Upload Forms & Actions */}
        <div className="grid gap-6">
          <UploadForm />
          <RebuildTopics />
        </div>
      </div>
    </div>
  );
}
