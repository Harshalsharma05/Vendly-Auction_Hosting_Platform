export default function AuctionAddItemForm({
  isHost,
  isOpen,
  addItemForm,
  isSubmittingNewItem,
  onSubmit,
  onInputChange,
  onCancel,
}) {
  if (!isHost || !isOpen) {
    return null;
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 rounded-[28px] border border-brand-border bg-white p-6 sm:p-8"
    >
      <div className="flex flex-col gap-5">
        <div>
          <h3 className="font-display text-2xl text-brand-charcoal leading-tight">
            Add Auction Item
          </h3>
          <p className="text-sm text-brand-muted mt-2">
            Create a new item for this auction room.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-sans text-brand-charcoal font-medium">
              Title
            </label>
            <input
              type="text"
              value={addItemForm.title}
              onChange={(event) => onInputChange("title", event.target.value)}
              disabled={isSubmittingNewItem}
              className="rounded-2xl border border-brand-border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-rust/20 focus:border-brand-rust/40"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-sans text-brand-charcoal font-medium">
              Image URLs
            </label>
            <input
              type="text"
              value={addItemForm.imageUrls}
              onChange={(event) =>
                onInputChange("imageUrls", event.target.value)
              }
              disabled={isSubmittingNewItem}
              placeholder="https://image-1.jpg, https://image-2.jpg"
              className="rounded-2xl border border-brand-border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-rust/20 focus:border-brand-rust/40"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-sans text-brand-charcoal font-medium">
            Description
          </label>
          <textarea
            value={addItemForm.description}
            onChange={(event) =>
              onInputChange("description", event.target.value)
            }
            disabled={isSubmittingNewItem}
            rows={4}
            className="rounded-2xl border border-brand-border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-rust/20 focus:border-brand-rust/40"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-sans text-brand-charcoal font-medium">
              Starting Price
            </label>
            <input
              type="number"
              min={0}
              step={1}
              value={addItemForm.startingPrice}
              onChange={(event) =>
                onInputChange("startingPrice", event.target.value)
              }
              disabled={isSubmittingNewItem}
              className="rounded-2xl border border-brand-border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-rust/20 focus:border-brand-rust/40"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-sans text-brand-charcoal font-medium">
              Bid Increment
            </label>
            <input
              type="number"
              min={0}
              step={1}
              value={addItemForm.bidIncrement}
              onChange={(event) =>
                onInputChange("bidIncrement", event.target.value)
              }
              disabled={isSubmittingNewItem}
              className="rounded-2xl border border-brand-border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-rust/20 focus:border-brand-rust/40"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={isSubmittingNewItem}
            className="inline-flex items-center justify-center rounded-full bg-brand-charcoal text-white border border-brand-charcoal px-5 py-2.5 text-sm font-sans font-medium hover:bg-brand-dark transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmittingNewItem ? "Adding..." : "Save Item"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmittingNewItem}
            className="inline-flex items-center justify-center rounded-full bg-white text-brand-charcoal border border-brand-charcoal px-5 py-2.5 text-sm font-sans font-medium hover:bg-brand-light transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
