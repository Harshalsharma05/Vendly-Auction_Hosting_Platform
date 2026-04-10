function formatCountdown(remainingMs) {
  const safeMs = Math.max(0, Number(remainingMs) || 0);
  const totalSeconds = Math.ceil(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getExtensionSeconds(extended) {
  if (typeof extended === "number" && Number.isFinite(extended)) {
    return Math.max(0, Math.round(extended));
  }

  if (
    extended &&
    typeof extended === "object" &&
    typeof extended.seconds === "number" &&
    Number.isFinite(extended.seconds)
  ) {
    return Math.max(0, Math.round(extended.seconds));
  }

  return null;
}

export default function FinalCallBanner({
  isFinalCall,
  remainingMs,
  extended,
}) {
  if (!isFinalCall) {
    return null;
  }

  const countdown = formatCountdown(remainingMs);
  const isUrgent = Number(remainingMs) < 10_000;
  const isVeryUrgent = Number(remainingMs) < 5_000;
  const extensionSeconds = getExtensionSeconds(extended);
  const hasExtensionLabel = Boolean(extended);

  // Dynamically increase the pulse animation speed based on time left
  let animationStyle = "none";
  if (isUrgent) {
    // Uses Tailwind's native "pulse" keyframe, but overrides the duration
    animationStyle = isVeryUrgent 
      ? "pulse 0.4s cubic-bezier(0.4, 0, 0.6, 1) infinite"  // Super fast for last 5s
      : "pulse 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite"; // Fast for last 10s
  }

  return (
    <div className="relative w-full rounded-2xl sm:rounded-[28px] border-2 border-[#7C3A2D] bg-[#2d2f2f] p-6 sm:p-8 text-[#F7F5F2] overflow-hidden shadow-[0_0_30px_rgba(124,58,45,0.25)]">
      
      {/* Subtle bottom glow effect inside the card */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#7C3A2D]/20 to-transparent pointer-events-none" />

      <div className="relative flex flex-col items-center justify-center gap-3">
        
        {/* Warning Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#7C3A2D]/50 bg-[#7C3A2D]/20 px-4 py-1.5 text-xs sm:text-sm font-sans font-semibold tracking-widest uppercase">
          <span className="w-2 h-2 rounded-full bg-[#7C3A2D] animate-ping" />
          Final Call
        </div>

        {/* Massive Center Timer */}
        <div
          className="font-display text-5xl sm:text-7xl font-bold tracking-tight tabular-nums mt-2"
          style={{ animation: animationStyle }}
          aria-live="assertive"
        >
          {countdown}
        </div>

        {/* Extension Label Container (Fixed height to prevent layout shift) */}
        <div className="mt-2 min-h-[28px] flex items-center justify-center">
          <span
            className={[
              "inline-flex items-center rounded-full bg-[#1A1A1A] border border-[#E8E8E8]/20 px-3 py-1",
              "text-[11px] sm:text-xs font-sans font-medium text-[#F7F5F2]",
              "transition-all duration-500",
              hasExtensionLabel
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-2 pointer-events-none",
            ].join(" ")}
          >
            {extensionSeconds !== null
              ? `+${extensionSeconds}s Extended`
              : "+Extended"}
          </span>
        </div>

      </div>
    </div>
  );
}