export default function RoomHeaderSkeleton() {
  return (
    <div className="rounded-[28px] border border-brand-border overflow-hidden bg-white">
      <div className="h-52 sm:h-64 w-full bg-brand-light animate-pulse" />
      <div className="p-6 lg:p-8 space-y-3">
        <div className="h-7 w-2/3 bg-brand-light rounded animate-pulse" />
        <div className="h-4 w-1/2 bg-brand-light rounded animate-pulse" />
        <div className="h-4 w-1/3 bg-brand-light rounded animate-pulse" />
      </div>
    </div>
  );
}
