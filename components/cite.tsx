export function Cite({
  title,
  section,
  excerpt,
}: {
  title: string;
  section: string;
  excerpt: string;
}) {
  return (
    <figure className="rounded-xl border border-rule bg-white/70 p-3 text-sm">
      <figcaption className="font-medium text-ink">
        {title} <span className="text-muted">· {section}</span>
      </figcaption>
      <blockquote className="mt-1 text-muted">“{excerpt}”</blockquote>
    </figure>
  );
}
