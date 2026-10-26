export type TextChunk = {
  section: string;
  content: string;
  index: number;
};

const TARGET = 700;
const OVERLAP = 90;

export function chunkDocument(text: string, fallbackTitle: string): TextChunk[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  const headingSplit = normalized.split(/\n(?=#{1,3} )/);
  const pieces: { section: string; body: string }[] = [];

  for (const block of headingSplit) {
    const lines = block.trim().split("\n");
    const first = lines[0] ?? fallbackTitle;
    const isHeading = /^#{1,3} /.test(first);
    const section = isHeading
      ? first.replace(/^#{1,3} /, "").trim()
      : fallbackTitle;
    const body = (isHeading ? lines.slice(1) : lines).join("\n").trim();
    if (body) pieces.push({ section, body });
    else if (isHeading) pieces.push({ section, body: first });
  }

  const chunks: TextChunk[] = [];
  let index = 0;

  for (const piece of pieces) {
    const paras = piece.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    let buffer = "";
    for (const para of paras) {
      if ((buffer + "\n\n" + para).length > TARGET && buffer) {
        chunks.push({ section: piece.section, content: buffer.trim(), index });
        index += 1;
        buffer = buffer.slice(-OVERLAP) + "\n\n" + para;
      } else {
        buffer = buffer ? buffer + "\n\n" + para : para;
      }
    }
    if (buffer.trim()) {
      chunks.push({ section: piece.section, content: buffer.trim(), index });
      index += 1;
    }
  }

  return chunks.length ? chunks : [{ section: fallbackTitle, content: normalized.slice(0, TARGET), index: 0 }];
}
