import { formatRoomTime } from "../../utils/auctionRoom.utils";

export default function AuctionJoinPanel({
  isLoadingAuction,
  isHost,
  canJoinLiveAuction,
  normalizedAuctionStatus,
  auctionStartTime,
  isJoined,
  isJoining,
  isSocketConnected,
  onJoin,
  onGoLiveRoom,
}) {
  if (isLoadingAuction || isHost) {
    return null;
  }

  return (
    <div className="mt-5 rounded-2xl border border-brand-border bg-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <p className="font-display text-lg sm:text-xl text-brand-charcoal leading-tight">
          Join Live Auction to Place Bids
        </p>
        <p className="text-xs sm:text-sm text-brand-muted mt-1">
          {canJoinLiveAuction
            ? "Enter the room to activate real-time bidding and live updates."
            : normalizedAuctionStatus === "scheduled"
              ? `This auction starts ${formatRoomTime(auctionStartTime)}.`
              : `This auction is currently ${normalizedAuctionStatus}. Live join is unavailable.`}
        </p>
      </div>

      {!isJoined && canJoinLiveAuction ? (
        <button
          type="button"
          onClick={onJoin}
          disabled={isJoining || !isSocketConnected}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-charcoal text-white border border-brand-charcoal px-5 py-2.5 text-sm font-sans font-medium hover:bg-brand-dark transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isJoining ? "Joining..." : "Join Live Auction"}
        </button>
      ) : isJoined ? (
        <button
          type="button"
          onClick={onGoLiveRoom}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-green-600 text-white border border-green-600 px-5 py-2.5 text-sm font-sans font-medium hover:bg-green-700 transition-all duration-200"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-200 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
          </span>
          Live Room
        </button>
      ) : (
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-light/50 px-4 py-2 text-sm font-sans text-brand-muted">
          {normalizedAuctionStatus === "scheduled"
            ? `Starts ${formatRoomTime(auctionStartTime)}`
            : "Live room unavailable"}
        </div>
      )}
    </div>
  );
}
