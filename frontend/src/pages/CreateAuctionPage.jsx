import { Link } from "react-router-dom";

export default function CreateAuctionPage() {
  return (
    <main className="pt-23 min-h-screen bg-white">
      <section className="px-6 lg:px-10 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="mb-5">
            <Link
              to="/my-auctions"
              className="text-[12px] font-sans text-brand-muted hover:text-brand-charcoal underline underline-offset-2 transition-colors duration-150"
            >
              Back to My Auctions
            </Link>
          </div>

          <div className="rounded-[28px] border border-brand-border bg-white p-6 sm:p-8">
            <h1 className="font-display text-3xl sm:text-4xl text-brand-charcoal leading-tight">
              Create Auction
            </h1>
            <p className="text-sm sm:text-base text-brand-muted mt-2 max-w-2xl">
              Auction creation form will be implemented in the next step.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
