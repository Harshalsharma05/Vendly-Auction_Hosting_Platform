import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../lib/axios";
import { useAuth } from "../context/AuthContext";

const FALLBACK_AUCTION_IMAGE =
  "https://images.unsplash.com/photo-1579546929662-711aa81148cf?w=700&q=80";

function formatStartTime(startTime) {
  if (!startTime) {
    return "Start time to be announced";
  }

  const parsedDate = new Date(startTime);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Start time to be announced";
  }

  return parsedDate.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function mapAuctionCard(auction, index) {
  const status = (auction?.status || "scheduled").toLowerCase();

  return {
    id: auction?._id || auction?.id || `auction-${index}`,
    title: auction?.title || "Untitled Auction",
    description: auction?.description || "Premium auction room",
    status,
    startLabel: formatStartTime(auction?.startTime),
    image: auction?.coverImage || auction?.image || FALLBACK_AUCTION_IMAGE,
  };
}

function AuctionGridSkeleton({ keyId, faded = false }) {
  return (
    <article
      key={keyId}
      className={[
        "rounded-2xl border border-brand-border bg-white overflow-hidden",
        faded ? "opacity-65" : "",
      ].join(" ")}
    >
      <div className="h-40 sm:h-44 bg-brand-light animate-pulse" />
      <div className="p-4 space-y-2">
        <div className="h-5 w-3/4 bg-brand-light rounded animate-pulse" />
        <div className="h-3 w-full bg-brand-light rounded animate-pulse" />
        <div className="h-3 w-1/2 bg-brand-light rounded animate-pulse" />
      </div>
    </article>
  );
}

function AuctionGridCard({ auction, faded = false, onOpen }) {
  const statusLabel = `${auction.status.charAt(0).toUpperCase()}${auction.status.slice(1)}`;

  return (
    <article
      className={[
        "rounded-2xl border border-brand-border bg-white overflow-hidden transition-all duration-200",
        "hover:shadow-lg hover:-translate-y-0.5",
        faded ? "opacity-65" : "",
      ].join(" ")}
    >
      <div className="relative h-40 sm:h-44">
        <img
          src={auction.image}
          alt={auction.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/45 via-black/10 to-transparent" />
        <div className="absolute top-3 right-3 rounded-full border border-brand-border bg-white/90 px-2.5 py-1 text-[11px] text-brand-charcoal">
          {statusLabel}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-display text-lg text-brand-charcoal leading-tight line-clamp-2">
          {auction.title}
        </h3>
        <p className="mt-1 text-xs sm:text-sm text-brand-muted line-clamp-2">
          {auction.description}
        </p>
        <p className="mt-3 text-[11px] sm:text-xs text-brand-muted">
          Starts: {auction.startLabel}
        </p>

        <div className="mt-4">
          <button
            type="button"
            onClick={() => onOpen(auction.id)}
            className="inline-flex items-center justify-center rounded-full bg-brand-charcoal text-white border border-brand-charcoal px-4 py-2 text-xs sm:text-sm font-sans font-medium hover:bg-brand-dark transition-all duration-200"
          >
            {auction.status === "live" ? "Enter Auction" : "View Auction"}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function LiveAuctionsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [auctions, setAuctions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const openAuctionWithGuard = (id) => {
    if (!isAuthenticated) {
      toast.error("Please log in to view auction rooms.");
      navigate("/auth");
      return;
    }
    navigate(`/auction/${id}`);
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchAuctions() {
      setIsLoading(true);

      try {
        const response = await axiosInstance.get("/auctions");
        const payload = response?.data?.data;
        const allAuctions = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.auctions)
            ? payload.auctions
            : [];

        if (isMounted) {
          setAuctions(allAuctions.map(mapAuctionCard));
        }
      } catch {
        if (isMounted) {
          setAuctions([]);
          toast.error("Unable to fetch auction listings right now.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchAuctions();

    return () => {
      isMounted = false;
    };
  }, []);

  const liveAuctions = useMemo(
    () => auctions.filter((auction) => auction.status === "live"),
    [auctions],
  );

  const upcomingAuctions = useMemo(
    () => auctions.filter((auction) => auction.status === "scheduled"),
    [auctions],
  );

  return (
    <main className="pt-23 min-h-screen bg-white">
      <section className="px-6 lg:px-10 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-5">
            <Link
              to="/"
              className="text-[12px] font-sans text-brand-muted hover:text-brand-charcoal underline underline-offset-2 transition-colors duration-150"
            >
              Back to Home
            </Link>
          </div>

          <div className="rounded-[28px] border border-brand-border bg-white p-5 sm:p-6 lg:p-8">
            <h1 className="font-display text-3xl sm:text-4xl text-brand-charcoal leading-tight">
              Live Auctions
            </h1>
            <p className="text-sm sm:text-base text-brand-muted mt-2 max-w-3xl">
              Discover active rooms first, then explore upcoming drops below.
            </p>
          </div>

          <section className="pt-8">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="font-display text-2xl sm:text-3xl text-brand-charcoal">
                Live Now
              </h2>
              <p className="text-xs sm:text-sm text-brand-muted">
                {liveAuctions.length} running
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
              {isLoading &&
                Array.from({ length: 6 }).map((_, index) => (
                  <AuctionGridSkeleton
                    key={`live-skeleton-${index}`}
                    keyId={`live-skeleton-${index}`}
                  />
                ))}

              {!isLoading &&
                liveAuctions.map((auction) => (
                  <AuctionGridCard
                    key={auction.id}
                    auction={auction}
                    onOpen={openAuctionWithGuard}
                  />
                ))}

              {!isLoading && liveAuctions.length === 0 && (
                <div className="col-span-full rounded-2xl border border-brand-border bg-brand-light/40 p-6 text-sm text-brand-muted">
                  No auctions are live right now.
                </div>
              )}
            </div>
          </section>

          <section className="pt-10">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="font-display text-2xl sm:text-3xl text-brand-charcoal">
                Upcoming Auctions
              </h2>
              <p className="text-xs sm:text-sm text-brand-muted">
                {upcomingAuctions.length} scheduled
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
              {isLoading &&
                Array.from({ length: 6 }).map((_, index) => (
                  <AuctionGridSkeleton
                    key={`upcoming-skeleton-${index}`}
                    keyId={`upcoming-skeleton-${index}`}
                    faded
                  />
                ))}

              {!isLoading &&
                upcomingAuctions.map((auction) => (
                  <AuctionGridCard
                    key={auction.id}
                    auction={auction}
                    faded
                    onOpen={openAuctionWithGuard}
                  />
                ))}

              {!isLoading && upcomingAuctions.length === 0 && (
                <div className="col-span-full rounded-2xl border border-brand-border bg-brand-light/40 p-6 text-sm text-brand-muted">
                  No upcoming auctions are scheduled right now.
                </div>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
