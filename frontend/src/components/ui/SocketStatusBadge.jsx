export default function SocketStatusBadge({ isConnected }) {
  const dotClass = isConnected ? "bg-emerald-500" : "bg-red-500 animate-pulse";

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-white/90 px-3 py-1 text-xs font-sans text-brand-charcoal shadow-sm">
      <span className="relative flex h-2.5 w-2.5">
        <span
          className={[
            "absolute inline-flex h-full w-full rounded-full opacity-70",
            isConnected ? "bg-emerald-400 animate-ping" : "bg-red-400",
          ].join(" ")}
        />
        <span
          className={[
            "relative inline-flex h-2.5 w-2.5 rounded-full",
            dotClass,
          ].join(" ")}
        />
      </span>
      <span>{isConnected ? "Live" : "Reconnecting..."}</span>
    </span>
  );
}
