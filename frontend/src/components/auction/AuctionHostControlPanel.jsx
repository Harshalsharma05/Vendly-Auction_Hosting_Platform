import SubmissionReviewPanel from "./SubmissionReviewPanel";

export default function AuctionHostControlPanel({
  isLoadingAuction,
  isHost,
  auctionId,
  socket,
  normalizedAuctionStatus,
  isStartingAuction,
  isAdvancingItem,
  isEndingAuction,
  onOpenViewPanel,
  onStartAuction,
  onNextItem,
  onEndAuction,
  enableFinalCallPreview,
  finalCallPreview,
  onStartFinalCallPreview,
  onExtendFinalCallPreview,
  onResetFinalCallPreview,
  pendingSubmissionCount,
  isSubmissionReviewOpen,
  onToggleSubmissionReview,
}) {
  if (isLoadingAuction || !isHost) {
    return null;
  }

  return (
    <div className="mt-5 rounded-2xl border border-brand-border bg-white p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="font-display text-lg sm:text-xl text-brand-charcoal leading-tight">
            Host Control Panel
          </p>
          <p className="text-xs sm:text-sm text-brand-muted mt-1">
            Manage auction flow for all connected participants.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenViewPanel}
            className="inline-flex items-center justify-center rounded-full bg-white text-brand-charcoal border border-brand-charcoal px-4 py-2 text-xs sm:text-sm font-sans font-medium hover:bg-brand-light transition-all duration-200"
          >
            Open View Panel
          </button>

          <button
            type="button"
            onClick={onStartAuction}
            disabled={isStartingAuction || normalizedAuctionStatus === "ended"}
            className="inline-flex items-center justify-center rounded-full bg-brand-charcoal text-white border border-brand-charcoal px-4 py-2 text-xs sm:text-sm font-sans font-medium hover:bg-brand-dark transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStartingAuction ? "Starting..." : "Start Auction"}
          </button>

          <button
            type="button"
            onClick={onNextItem}
            disabled={isAdvancingItem || normalizedAuctionStatus !== "live"}
            className="inline-flex items-center justify-center rounded-full bg-white text-brand-charcoal border border-brand-charcoal px-4 py-2 text-xs sm:text-sm font-sans font-medium hover:bg-brand-light transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAdvancingItem ? "Switching..." : "Next Item"}
          </button>

          <button
            type="button"
            onClick={onEndAuction}
            disabled={isEndingAuction || normalizedAuctionStatus === "ended"}
            className="inline-flex items-center justify-center rounded-full bg-[#7f1d1d] text-[#fee2e2] border border-[#b91c1c] px-4 py-2 text-xs sm:text-sm font-sans font-medium hover:bg-[#991b1b] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEndingAuction ? "Ending..." : "End Auction"}
          </button>
        </div>
      </div>

      {enableFinalCallPreview && (
        <div className="mt-4 rounded-xl border border-dashed border-brand-border bg-brand-light/30 p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs sm:text-sm font-sans text-brand-muted">
              Final Call UI Test (Dev-only)
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onStartFinalCallPreview}
                className="inline-flex items-center justify-center rounded-full bg-brand-charcoal text-white border border-brand-charcoal px-3 py-1.5 text-[11px] sm:text-xs font-sans font-medium hover:bg-brand-dark transition-all duration-200"
              >
                Test Final Call (30s)
              </button>
              <button
                type="button"
                onClick={onExtendFinalCallPreview}
                disabled={!finalCallPreview.active}
                className="inline-flex items-center justify-center rounded-full bg-white text-brand-charcoal border border-brand-charcoal px-3 py-1.5 text-[11px] sm:text-xs font-sans font-medium hover:bg-brand-light transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Extend +10s
              </button>
              <button
                type="button"
                onClick={onResetFinalCallPreview}
                className="inline-flex items-center justify-center rounded-full bg-white text-brand-charcoal border border-brand-border px-3 py-1.5 text-[11px] sm:text-xs font-sans font-medium hover:bg-brand-light transition-all duration-200"
              >
                Reset Test
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-brand-border bg-brand-light/20 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="font-display text-base sm:text-lg text-brand-charcoal leading-tight">
              Pending Submissions
            </p>
            <p className="text-xs sm:text-sm text-brand-muted mt-1">
              Review participant-submitted items and decide whether to add them
              to the auction.
            </p>
          </div>

          <button
            type="button"
            onClick={onToggleSubmissionReview}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-charcoal text-white border border-brand-charcoal px-4 py-2 text-xs sm:text-sm font-sans font-medium hover:bg-brand-dark transition-all duration-200 whitespace-nowrap"
          >
            <span
              className={[
                "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-sans",
                pendingSubmissionCount > 0
                  ? "bg-white text-brand-charcoal"
                  : "bg-brand-dark text-white",
              ].join(" ")}
            >
              {pendingSubmissionCount}
            </span>
            {isSubmissionReviewOpen
              ? "Hide Pending Submissions"
              : "Pending Submissions"}
          </button>
        </div>

        <div className={isSubmissionReviewOpen ? "mt-4" : "hidden"}>
          <SubmissionReviewPanel auctionId={auctionId} socket={socket} />
        </div>
      </div>
    </div>
  );
}
