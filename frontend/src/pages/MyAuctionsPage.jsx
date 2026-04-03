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
    description: auction?.description || "Hosted auction room",
    status,
    startLabel: formatStartTime(auction?.startTime),
    image: auction?.coverImage || auction?.image || FALLBACK_AUCTION_IMAGE,
  };
}

function getRequestErrorMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    fallbackMessage
  );
}

function AuctionGridCard({
  auction,
  onOpen,
  onCancel,
  onDelete,
  onToggleDeleteConfirm,
  isDeleteConfirming,
  isCancelling,
  isDeleting,
}) {
  const statusLabel = `${auction.status.charAt(0).toUpperCase()}${auction.status.slice(1)}`;
  const isUpcoming = auction.status === "scheduled";
  const canCancel = ["draft", "scheduled"].includes(auction.status);
  const canDelete = auction.status === "draft";

  return (
    <article
      className={[
        "rounded-2xl border border-brand-border bg-white overflow-hidden transition-all duration-200",
        "hover:shadow-lg hover:-translate-y-0.5",
        isUpcoming ? "opacity-75" : "",
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

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onOpen(auction.id)}
            className="inline-flex items-center justify-center rounded-full bg-brand-charcoal text-white border border-brand-charcoal px-4 py-2 text-xs sm:text-sm font-sans font-medium hover:bg-brand-dark transition-all duration-200"
          >
            Open Auction
          </button>

          {canCancel && (
            <button
              type="button"
              onClick={() => onCancel(auction)}
              disabled={isCancelling || isDeleting}
              className="inline-flex items-center justify-center rounded-full bg-white text-brand-charcoal border border-brand-charcoal px-4 py-2 text-xs sm:text-sm font-sans font-medium hover:bg-brand-light transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCancelling ? "Cancelling..." : "Cancel"}
            </button>
          )}

          {canDelete && !isDeleteConfirming && (
            <button
              type="button"
              onClick={() => onToggleDeleteConfirm(auction.id, true)}
              disabled={isCancelling || isDeleting}
              className="inline-flex items-center justify-center rounded-full bg-white text-brand-charcoal border border-brand-charcoal px-4 py-2 text-xs sm:text-sm font-sans font-medium hover:bg-brand-light transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete
            </button>
          )}
        </div>

        {canDelete && isDeleteConfirming && (
          <div className="mt-3 rounded-xl border border-brand-border bg-brand-light/40 p-3">
            <p className="text-[11px] sm:text-xs text-brand-muted">
              Delete this draft auction permanently?
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onDelete(auction)}
                disabled={isDeleting || isCancelling}
                className="inline-flex items-center justify-center rounded-full bg-brand-charcoal text-white border border-brand-charcoal px-4 py-2 text-xs sm:text-sm font-sans font-medium hover:bg-brand-dark transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </button>
              <button
                type="button"
                onClick={() => onToggleDeleteConfirm(auction.id, false)}
                disabled={isDeleting || isCancelling}
                className="inline-flex items-center justify-center rounded-full bg-white text-brand-charcoal border border-brand-charcoal px-4 py-2 text-xs sm:text-sm font-sans font-medium hover:bg-brand-light transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Keep Auction
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

export default function MyAuctionsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [auctions, setAuctions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirmById, setDeleteConfirmById] = useState({});
  const [isCancellingById, setIsCancellingById] = useState({});
  const [isDeletingById, setIsDeletingById] = useState({});

  useEffect(() => {
    let isMounted = true;

    async function fetchMyAuctions() {
      setIsLoading(true);

      try {
        const response = await axiosInstance.get(
          "/auctions/client/my-auctions",
        );
        const payload = response?.data?.data;
        const allAuctions = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.auctions)
            ? payload.auctions
            : [];

        if (isMounted) {
          setAuctions(allAuctions.map(mapAuctionCard));
        }
      } catch (error) {
        if (isMounted) {
          setAuctions([]);

          const statusCode = Number(error?.response?.status || 0);
          if (statusCode === 401) {
            toast.error("Please login to view your auctions.");
          } else if (statusCode === 403) {
            toast.error("Only client accounts can access My Auctions.");
          } else {
            toast.error("Unable to load your auctions right now.");
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    if (isAuthenticated) {
      fetchMyAuctions();
    } else {
      setIsLoading(false);
      setAuctions([]);
    }

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const handleToggleDeleteConfirm = (auctionId, nextValue) => {
    setDeleteConfirmById((previousState) => ({
      ...previousState,
      [auctionId]: Boolean(nextValue),
    }));
  };

  const handleCancelAuction = async (auction) => {
    if (!auction?.id) {
      toast.error("Unable to cancel this auction.");
      return;
    }

    setIsCancellingById((previousState) => ({
      ...previousState,
      [auction.id]: true,
    }));

    try {
      await axiosInstance.patch(`/auctions/${auction.id}`, {
        status: "cancelled",
      });

      setAuctions((previousAuctions) =>
        previousAuctions.filter((entry) => entry.id !== auction.id),
      );
      toast.success("Auction cancelled successfully.");
    } catch (error) {
      toast.error(
        getRequestErrorMessage(error, "Unable to cancel this auction right now."),
      );
    } finally {
      setIsCancellingById((previousState) => ({
        ...previousState,
        [auction.id]: false,
      }));
    }
  };

  const handleDeleteAuction = async (auction) => {
    if (!auction?.id) {
      toast.error("Unable to delete this auction.");
      return;
    }

    setIsDeletingById((previousState) => ({
      ...previousState,
      [auction.id]: true,
    }));

    try {
      await axiosInstance.delete(`/auctions/${auction.id}`);

      setAuctions((previousAuctions) =>
        previousAuctions.filter((entry) => entry.id !== auction.id),
      );
      setDeleteConfirmById((previousState) => ({
        ...previousState,
        [auction.id]: false,
      }));
      toast.success("Auction deleted successfully.");
    } catch (error) {
      toast.error(
        getRequestErrorMessage(error, "Unable to delete this auction right now."),
      );
    } finally {
      setIsDeletingById((previousState) => ({
        ...previousState,
        [auction.id]: false,
      }));
    }
  };

  const groupedAuctions = useMemo(
    () => ({
      live: auctions.filter((auction) => auction.status === "live"),
      scheduled: auctions.filter((auction) => auction.status === "scheduled"),
      ended: auctions.filter((auction) => auction.status === "ended"),
      draft: auctions.filter((auction) => auction.status === "draft"),
      other: auctions.filter(
        (auction) =>
          !["live", "scheduled", "ended", "draft"].includes(auction.status),
      ),
    }),
    [auctions],
  );

  const allSections = [
    { title: "Live", items: groupedAuctions.live },
    { title: "Scheduled", items: groupedAuctions.scheduled },
    { title: "Draft", items: groupedAuctions.draft },
    { title: "Ended", items: groupedAuctions.ended },
    { title: "Other", items: groupedAuctions.other },
  ];

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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl sm:text-4xl text-brand-charcoal leading-tight">
                  My Auctions
                </h1>
                <p className="text-sm sm:text-base text-brand-muted mt-2 max-w-3xl">
                  {user?.name
                    ? `${user.name}, manage your hosted auctions by status.`
                    : "Manage your hosted auctions by status."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/create-auction")}
                className="inline-flex items-center justify-center rounded-full bg-brand-charcoal text-white border border-brand-charcoal px-5 py-2.5 text-sm font-sans font-medium hover:bg-brand-dark transition-all duration-200"
              >
                Create Auction
              </button>
            </div>
          </div>

          {!isAuthenticated ? (
            <div className="mt-8 rounded-2xl border border-brand-border bg-brand-light/40 p-6 text-sm text-brand-muted">
              Please login with a client account to view your hosted auctions.
            </div>
          ) : (
            allSections.map((section) => (
              <section key={section.title} className="pt-8">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h2 className="font-display text-2xl sm:text-3xl text-brand-charcoal">
                    {section.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-brand-muted">
                    {section.items.length} auction
                    {section.items.length === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
                  {isLoading &&
                    section.title === "Live" &&
                    Array.from({ length: 6 }).map((_, index) => (
                      <div
                        key={`my-auction-skeleton-${index}`}
                        className="h-56 rounded-2xl bg-brand-light animate-pulse"
                      />
                    ))}

                  {!isLoading &&
                    section.items.map((auction) => (
                      <AuctionGridCard
                        key={auction.id}
                        auction={auction}
                        onOpen={(id) => navigate(`/auction/${id}`)}
                        onCancel={handleCancelAuction}
                        onDelete={handleDeleteAuction}
                        onToggleDeleteConfirm={handleToggleDeleteConfirm}
                        isDeleteConfirming={Boolean(deleteConfirmById[auction.id])}
                        isCancelling={Boolean(isCancellingById[auction.id])}
                        isDeleting={Boolean(isDeletingById[auction.id])}
                      />
                    ))}

                  {!isLoading && section.items.length === 0 && (
                    <div className="col-span-full rounded-2xl border border-brand-border bg-brand-light/40 p-6 text-sm text-brand-muted">
                      No {section.title.toLowerCase()} auctions yet.
                    </div>
                  )}
                </div>
              </section>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
