export async function extractPdfText(buffer: Buffer) {
  const pdfParse = (await import("pdf-parse")).default as unknown as (
    data: Buffer,
  ) => Promise<{ text: string }>;
  const result = await pdfParse(buffer);
  return result.text || "";
}
