import SubmitItemForm from "./SubmitItemForm";

export default function AuctionSubmitItemPanel({
  isHost,
  normalizedAuctionStatus,
  isSubmitFormOpen,
  onToggleSubmitForm,
  auctionId,
  onSubmitSuccess,
}) {
  if (isHost || !["live", "scheduled"].includes(normalizedAuctionStatus)) {
    return null;
  }

  return (
    <div className="mt-6 rounded-[28px] border border-brand-border bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-display text-xl sm:text-2xl text-brand-charcoal leading-tight">
              Submit an Item
            </h3>
            <p className="text-sm text-brand-muted mt-1">
              Send an item to the host for review without leaving the auction
              room.
            </p>
          </div>

          <button
            type="button"
            onClick={onToggleSubmitForm}
            className="inline-flex items-center justify-center rounded-full bg-brand-charcoal text-white border border-brand-charcoal px-4 py-2 text-xs sm:text-sm font-sans font-medium hover:bg-brand-dark transition-all duration-200 whitespace-nowrap"
          >
            {isSubmitFormOpen ? "Hide Submission Form" : "Submit Item to Auction"}
          </button>
        </div>

        {isSubmitFormOpen && (
          <SubmitItemForm auctionId={auctionId} onSuccess={onSubmitSuccess} />
        )}
      </div>
    </div>
  );
}
