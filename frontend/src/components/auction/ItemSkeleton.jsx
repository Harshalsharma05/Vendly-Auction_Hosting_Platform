export default function ItemSkeleton({ keyId }) {
  return (
    <article key={keyId} className="group relative flex flex-col">
      <div
        className="relative w-full rounded-xl overflow-hidden bg-brand-light animate-pulse"
        style={{ aspectRatio: "3/4" }}
      />
      <div className="pt-3 space-y-2">
        <div className="h-4 w-4/5 bg-brand-light rounded animate-pulse" />
        <div className="h-3 w-3/5 bg-brand-light rounded animate-pulse" />
      </div>
    </article>
  );
}
