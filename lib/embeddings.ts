export async function embedTexts(texts: string[]): Promise<number[][] | null> {
  const provider = process.env.EMBEDDING_PROVIDER || inferProvider();
  if (!provider || !texts.length) return null;

  try {
    if (provider === "openai" && process.env.OPENAI_API_KEY) {
      const res = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: texts,
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.data.map((d: { embedding: number[] }) => d.embedding);
    }

    if (provider === "google" && process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      const out: number[][] = [];
      for (const text of texts) {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "models/text-embedding-004",
              content: { parts: [{ text: text.slice(0, 8000) }] },
            }),
          },
        );
        if (!res.ok) return null;
        const data = await res.json();
        out.push(data.embedding.values);
      }
      return out;
    }
  } catch {
    return null;
  }

  return null;
}

export async function embedQuery(query: string) {
  const result = await embedTexts([query]);
  return result?.[0];
}

function inferProvider() {
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) return "google";
  return "";
}
