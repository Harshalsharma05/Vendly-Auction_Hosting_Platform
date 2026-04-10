import { formatCurrency } from "../../utils/auctionRoom.utils";

export default function AuctionItemControlsPanel({
  item,
  sourceItem,
  sourceItemId,
  isHost,
  isJoined,
  isLiveItem,
  isCoolingDown,
  cooldownSecondsLeft,
  isPlacingBid,
  isBidControlsDisabled,
  bidInputValue,
  onBidInputChange,
  onBid,
  currentHighestBid,
  highestBidderName,
  bidCount,
  minimumSuggestedBid,
  itemStatus,
  isItemLocked,
  isEditFormOpen,
  isUpdatingItem,
  isDeleteConfirmOpen,
  isDeletingItem,
  itemEditForm,
  onToggleEditItemForm,
  onToggleDeleteItemConfirm,
  onDeleteItem,
  onEditItemInputChange,
  onUpdateItemDetails,
  onCloseEditItemForm,
  selectedStatus,
  statusOptions,
  onStatusInputChange,
  isStatusUpdateDisabled,
  onUpdateItemStatus,
}) {
  if (item.sold && !isHost) {
    return null;
  }

  return (
    <div className="rounded-xl border border-brand-border bg-white p-3 sm:p-4">
      <div className="space-y-1 mb-3">
        <p className="text-[11px] sm:text-xs font-sans text-brand-muted truncate">
          Current Highest Bid: {formatCurrency(currentHighestBid)}
        </p>
        <p className="text-[11px] sm:text-xs font-sans text-brand-muted truncate">
          Bidder: {highestBidderName}
        </p>
        <p className="text-[11px] sm:text-xs font-sans text-brand-muted">
          Total Bids: {bidCount}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="text-[11px] sm:text-xs font-sans text-brand-muted">
          Minimum Next Bid: {formatCurrency(minimumSuggestedBid)}
        </p>
        <p className="text-[11px] sm:text-xs font-sans text-brand-muted">
          Status: {itemStatus}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          min={minimumSuggestedBid}
          step={sourceItem?.bidIncrement || 1}
          disabled={!isJoined || !isLiveItem || isCoolingDown}
          value={bidInputValue}
          onChange={(event) =>
            onBidInputChange(sourceItemId, event.target.value)
          }
          placeholder={`${minimumSuggestedBid}`}
          className="flex-1 min-w-0 rounded-full border border-brand-border bg-white px-4 py-2 text-sm text-brand-charcoal placeholder:text-brand-muted/80 outline-none focus:border-brand-charcoal"
        />
        <button
          type="button"
          onClick={() => onBid(sourceItem)}
          disabled={isBidControlsDisabled}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-charcoal text-white border border-brand-charcoal px-4 py-2 text-xs sm:text-sm font-sans font-medium hover:bg-brand-dark transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPlacingBid
            ? "Placing..."
            : isCoolingDown
              ? `Wait ${cooldownSecondsLeft}s`
              : "Place Bid"}
        </button>
      </div>

      {isCoolingDown && (
        <p className="text-[11px] sm:text-xs font-sans text-brand-muted mt-2">
          Cooldown active - {cooldownSecondsLeft}s remaining
        </p>
      )}

      {!isJoined && (
        <p className="text-[11px] sm:text-xs font-sans text-brand-muted mt-2">
          Join the live room to enable bidding controls.
        </p>
      )}

      {isHost && (
        <p className="text-[11px] sm:text-xs font-sans text-brand-muted mt-2">
          Host accounts cannot place bids in this auction.
        </p>
      )}

      {isJoined && !isLiveItem && (
        <p className="text-[11px] sm:text-xs font-sans text-brand-muted mt-2">
          This item will become bid-enabled once it is live.
        </p>
      )}

      {isHost && (
        <div className="mt-3 border-t border-brand-border pt-3">
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              type="button"
              onClick={() => onToggleEditItemForm(sourceItem)}
              disabled={isItemLocked || isUpdatingItem || isDeletingItem}
              className="inline-flex items-center justify-center rounded-full bg-white text-brand-charcoal border border-brand-charcoal px-4 py-2 text-xs sm:text-sm font-sans font-medium hover:bg-brand-light transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEditFormOpen ? "Hide Edit" : "Edit Item"}
            </button>

            {!isDeleteConfirmOpen && (
              <button
                type="button"
                onClick={() => onToggleDeleteItemConfirm(sourceItemId, true)}
                disabled={isItemLocked || isUpdatingItem || isDeletingItem}
                className="inline-flex items-center justify-center rounded-full bg-white text-brand-charcoal border border-brand-charcoal px-4 py-2 text-xs sm:text-sm font-sans font-medium hover:bg-brand-light transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete Item
              </button>
            )}
          </div>

          {isItemLocked && (
            <p className="text-[11px] sm:text-xs font-sans text-brand-muted mb-3">
              Live or sold items cannot be edited or deleted.
            </p>
          )}

          {isDeleteConfirmOpen && (
            <div className="mb-3 rounded-xl border border-brand-border bg-brand-light/40 p-3">
              <p className="text-[11px] sm:text-xs font-sans text-brand-muted">
                Delete this item permanently?
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onDeleteItem(sourceItem)}
                  disabled={isDeletingItem || isItemLocked}
                  className="inline-flex items-center justify-center rounded-full bg-brand-charcoal text-white border border-brand-charcoal px-4 py-2 text-xs sm:text-sm font-sans font-medium hover:bg-brand-dark transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeletingItem ? "Deleting..." : "Confirm Delete"}
                </button>
                <button
                  type="button"
                  onClick={() => onToggleDeleteItemConfirm(sourceItemId, false)}
                  disabled={isDeletingItem}
                  className="inline-flex items-center justify-center rounded-full bg-white text-brand-charcoal border border-brand-charcoal px-4 py-2 text-xs sm:text-sm font-sans font-medium hover:bg-brand-light transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Keep Item
                </button>
              </div>
            </div>
          )}

          {isEditFormOpen && (
            <div className="mb-3 rounded-xl border border-brand-border bg-brand-light/40 p-3">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] sm:text-xs font-sans text-brand-muted">
                    Title
                  </label>
                  <input
                    type="text"
                    value={itemEditForm.title}
                    onChange={(event) =>
                      onEditItemInputChange(
                        sourceItemId,
                        "title",
                        event.target.value,
                      )
                    }
                    disabled={isUpdatingItem || isItemLocked}
                    className="rounded-2xl border border-brand-border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-rust/20 focus:border-brand-rust/40"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] sm:text-xs font-sans text-brand-muted">
                    Description
                  </label>
                  <textarea
                    value={itemEditForm.description}
                    onChange={(event) =>
                      onEditItemInputChange(
                        sourceItemId,
                        "description",
                        event.target.value,
                      )
                    }
                    disabled={isUpdatingItem || isItemLocked}
                    rows={3}
                    className="rounded-2xl border border-brand-border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-rust/20 focus:border-brand-rust/40"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] sm:text-xs font-sans text-brand-muted">
                      Starting Price
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={itemEditForm.startingPrice}
                      onChange={(event) =>
                        onEditItemInputChange(
                          sourceItemId,
                          "startingPrice",
                          event.target.value,
                        )
                      }
                      disabled={isUpdatingItem || isItemLocked}
                      className="rounded-2xl border border-brand-border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-rust/20 focus:border-brand-rust/40"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] sm:text-xs font-sans text-brand-muted">
                      Bid Increment
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={itemEditForm.bidIncrement}
                      onChange={(event) =>
                        onEditItemInputChange(
                          sourceItemId,
                          "bidIncrement",
                          event.target.value,
                        )
                      }
                      disabled={isUpdatingItem || isItemLocked}
                      className="rounded-2xl border border-brand-border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-rust/20 focus:border-brand-rust/40"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] sm:text-xs font-sans text-brand-muted">
                    Image URLs
                  </label>
                  <input
                    type="text"
                    value={itemEditForm.imageUrls}
                    onChange={(event) =>
                      onEditItemInputChange(
                        sourceItemId,
                        "imageUrls",
                        event.target.value,
                      )
                    }
                    disabled={isUpdatingItem || isItemLocked}
                    className="rounded-2xl border border-brand-border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-rust/20 focus:border-brand-rust/40"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateItemDetails(sourceItem)}
                    disabled={isUpdatingItem || isItemLocked}
                    className="inline-flex items-center justify-center rounded-full bg-brand-charcoal text-white border border-brand-charcoal px-4 py-2 text-xs sm:text-sm font-sans font-medium hover:bg-brand-dark transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdatingItem ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onCloseEditItemForm(sourceItemId)}
                    disabled={isUpdatingItem}
                    className="inline-flex items-center justify-center rounded-full bg-white text-brand-charcoal border border-brand-charcoal px-4 py-2 text-xs sm:text-sm font-sans font-medium hover:bg-brand-light transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel Edit
                  </button>
                </div>
              </div>
            </div>
          )}

          <p className="text-[11px] sm:text-xs font-sans text-brand-muted mb-2">
            Host Item Status Control
          </p>
          <div className="flex items-center gap-2">
            <select
              value={selectedStatus}
              onChange={(event) =>
                onStatusInputChange(sourceItemId, event.target.value)
              }
              className="flex-1 min-w-0 rounded-full border border-brand-border bg-white px-4 py-2 text-sm text-brand-charcoal outline-none focus:border-brand-charcoal"
            >
              {statusOptions.map((statusOption) => (
                <option key={statusOption} value={statusOption}>
                  {statusOption.charAt(0).toUpperCase()}
                  {statusOption.slice(1)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => onUpdateItemStatus(sourceItem)}
              disabled={isStatusUpdateDisabled}
              className="inline-flex items-center justify-center rounded-full bg-white text-brand-charcoal border border-brand-charcoal px-4 py-2 text-xs sm:text-sm font-sans font-medium hover:bg-brand-light transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isStatusUpdateDisabled ? "Saving..." : "Update"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
