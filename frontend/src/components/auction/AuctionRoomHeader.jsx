import SocketStatusBadge from "../ui/SocketStatusBadge";
import { formatRoomTime } from "../../utils/auctionRoom.utils";

export default function AuctionRoomHeader({
  auction,
  statusLabel,
  isSocketConnected,
  hasTimingRules,
  finalCallDuration,
  antiSnipingExtension,
  bidCooldown,
  fallbackAuctionImage,
}) {
  return (
    <div className="rounded-[28px] border border-brand-border overflow-hidden bg-white">
      <div className="relative h-52 sm:h-64">
        <img
          src={auction?.coverImage || auction?.image || fallbackAuctionImage}
          alt={auction?.title || "Auction room"}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/45 via-black/20 to-transparent" />
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <SocketStatusBadge isConnected={isSocketConnected} />
          <div className="rounded-full bg-white/90 border border-brand-border px-3 py-1 text-xs text-brand-charcoal">
            {statusLabel}
          </div>
        </div>
      </div>

      <div className="p-6 lg:p-8">
        <h1 className="font-display text-3xl sm:text-4xl text-brand-charcoal leading-tight mb-3">
          {auction?.title || "Auction Room"}
        </h1>
        <p className="text-sm sm:text-base text-brand-muted max-w-3xl">
          {auction?.description || "Welcome to this live auction room."}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-brand-muted">
          <span>Starts: {formatRoomTime(auction?.startTime)}</span>
          <span>Ends: {formatRoomTime(auction?.endTime)}</span>
        </div>

        {hasTimingRules && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-brand-border bg-brand-light/50 px-3 py-1 text-[11px] sm:text-xs font-sans text-brand-charcoal">
              Final Call: {finalCallDuration}s
            </span>
            <span className="inline-flex items-center rounded-full border border-brand-border bg-brand-light/50 px-3 py-1 text-[11px] sm:text-xs font-sans text-brand-charcoal">
              Anti-Snipe: +{antiSnipingExtension}s
            </span>
            <span className="inline-flex items-center rounded-full border border-brand-border bg-brand-light/50 px-3 py-1 text-[11px] sm:text-xs font-sans text-brand-charcoal">
              Bid Cooldown: {bidCooldown}s
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
