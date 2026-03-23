import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../lib/axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

function formatCurrency(value) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return "$0";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(numeric);
}

function formatBidTime(value) {
  if (!value) {
    return "--";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "--";
  }

  return parsedDate.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function mapMyBidEntry(entry, index) {
  const auction = entry?.auctionId || {};
  const item = entry?.itemId || {};

  return {
    id: entry?._id || `my-bid-${index}`,
    auctionId:
      typeof auction === "string" ? auction : auction?._id || "unknown-auction",
    auctionTitle:
      typeof auction === "object" && auction?.title
        ? auction.title
        : "Auction Room",
    itemId: typeof item === "string" ? item : item?._id || "unknown-item",
    itemTitle:
      typeof item === "object" && item?.title ? item.title : "Auction Item",
    bidAmount: Number(entry?.bidAmount || 0),
    bidTime: entry?.bidTime || entry?.createdAt || new Date().toISOString(),
    bidStatus: entry?.bidStatus || "valid",
  };
}

export default function MyBidsPage() {
  const { user, isAuthenticated } = useAuth();
  const { socket, isSocketConnected } = useSocket();

  const [myBids, setMyBids] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentUserId = user?._id || user?.id || "";

  useEffect(() => {
    let isMounted = true;

    async function fetchMyBids() {
      setIsLoading(true);

      try {
        const response = await axiosInstance.get("/bids/my-bids");
        const payload = response?.data?.data || response?.data || [];
        const list = Array.isArray(payload) ? payload : [];

        if (isMounted) {
          setMyBids(list.map(mapMyBidEntry));
        }
      } catch (error) {
        if (isMounted) {
          setMyBids([]);

          const statusCode = Number(error?.response?.status || 0);
          if (statusCode === 401) {
            toast.error("Please login to view your bids.");
          } else {
            toast.error("Unable to load your bid history right now.");
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    if (isAuthenticated) {
      fetchMyBids();
    } else {
      setIsLoading(false);
      setMyBids([]);
    }

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!socket || !isSocketConnected || !currentUserId) {
      return;
    }

    const prependBid = (incomingBid) => {
      if (!incomingBid) {
        return;
      }

      const bidderId =
        typeof incomingBid?.bidderId === "string"
          ? incomingBid.bidderId
          : incomingBid?.bidderId?._id;

      if (String(bidderId || "") !== String(currentUserId)) {
        return;
      }

      const normalizedEntry = {
        _id: incomingBid?._id,
        auctionId: {
          _id: incomingBid?.auctionId,
          title: incomingBid?.auctionTitle || "Auction Room",
        },
        itemId: {
          _id: incomingBid?.itemId,
          title: incomingBid?.itemTitle || "Auction Item",
        },
        bidAmount: incomingBid?.bidAmount,
        bidTime: incomingBid?.bidTime,
        bidStatus: incomingBid?.bidStatus || "valid",
      };

      const mapped = mapMyBidEntry(normalizedEntry, 0);

      setMyBids((previousBids) => {
        const exists = previousBids.some(
          (entry) => String(entry.id) === String(mapped.id),
        );

        if (exists) {
          return previousBids;
        }

        return [mapped, ...previousBids];
      });
    };

    const handleMyBidUpdate = (payload) => {
      prependBid(payload?.bid);
    };

    const handleNewBid = (payload) => {
      prependBid(payload?.bid);
    };

    const handleMyBidWon = (payload) => {
      const winningBid = payload?.bid;
      if (!winningBid) {
        return;
      }

      const winningBidId = String(winningBid?._id || "");
      const winningItemId = String(winningBid?.itemId || "");

      setMyBids((previousBids) => {
        const hasWinningBid = previousBids.some(
          (entry) => String(entry.id) === winningBidId,
        );

        const nextBids = previousBids.map((entry) => {
          if (hasWinningBid && String(entry.id) === winningBidId) {
            return {
              ...entry,
              bidStatus: "winning",
              bidAmount: Number(winningBid?.bidAmount || entry.bidAmount || 0),
              bidTime: winningBid?.bidTime || entry.bidTime,
            };
          }

          if (String(entry.itemId) === winningItemId) {
            return {
              ...entry,
              bidStatus: "outbid",
            };
          }

          return entry;
        });

        if (!hasWinningBid) {
          const normalizedEntry = {
            _id: winningBid?._id || `winning-${Date.now()}`,
            auctionId: {
              _id: winningBid?.auctionId,
              title: winningBid?.auctionTitle || "Auction Room",
            },
            itemId: {
              _id: winningBid?.itemId,
              title: winningBid?.itemTitle || "Auction Item",
            },
            bidAmount: winningBid?.bidAmount,
            bidTime: winningBid?.bidTime,
            bidStatus: "winning",
          };

          return [mapMyBidEntry(normalizedEntry, 0), ...nextBids];
        }

        return nextBids;
      });

      toast.success(payload?.message || "You won this item.", {
        duration: 2600,
      });
    };

    socket.on("MY_BID_UPDATE", handleMyBidUpdate);
    socket.on("NEW_BID", handleNewBid);
    socket.on("MY_BID_WON", handleMyBidWon);

    return () => {
      socket.off("MY_BID_UPDATE", handleMyBidUpdate);
      socket.off("NEW_BID", handleNewBid);
      socket.off("MY_BID_WON", handleMyBidWon);
    };
  }, [currentUserId, isSocketConnected, socket]);

  const grouped = useMemo(
    () => ({
      winning: myBids.filter((bid) => bid.bidStatus === "winning"),
      valid: myBids.filter((bid) => bid.bidStatus === "valid"),
      outbid: myBids.filter((bid) => bid.bidStatus === "outbid"),
      other: myBids.filter(
        (bid) => !["winning", "valid", "outbid"].includes(bid.bidStatus),
      ),
    }),
    [myBids],
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
              My Bids
            </h1>
            <p className="text-sm sm:text-base text-brand-muted mt-2 max-w-3xl">
              Live timeline of your bidding activity across all auctions.
            </p>
          </div>

          {!isAuthenticated ? (
            <div className="mt-8 rounded-2xl border border-brand-border bg-brand-light/40 p-6 text-sm text-brand-muted">
              Please login to view your bids.
            </div>
          ) : (
            [
              { title: "Winning", items: grouped.winning },
              { title: "Active", items: grouped.valid },
              { title: "Outbid", items: grouped.outbid },
              { title: "Other", items: grouped.other },
            ].map((section) => (
              <section key={section.title} className="pt-8">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h2 className="font-display text-2xl sm:text-3xl text-brand-charcoal">
                    {section.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-brand-muted">
                    {section.items.length} bid
                    {section.items.length === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="space-y-3">
                  {isLoading &&
                    section.title === "Active" &&
                    Array.from({ length: 6 }).map((_, index) => (
                      <div
                        key={`my-bids-skeleton-${index}`}
                        className="h-16 rounded-xl bg-brand-light animate-pulse"
                      />
                    ))}

                  {!isLoading && section.items.length === 0 && (
                    <div className="rounded-xl border border-brand-border bg-brand-light/40 p-4 text-sm text-brand-muted">
                      No {section.title.toLowerCase()} bids yet.
                    </div>
                  )}

                  {!isLoading &&
                    section.items.map((bid) => (
                      <article
                        key={bid.id}
                        className="rounded-xl border border-brand-border bg-white p-4 flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <p className="text-sm sm:text-base font-sans font-medium text-brand-charcoal truncate">
                            {bid.auctionTitle} • {bid.itemTitle}
                          </p>
                          <p className="text-[11px] sm:text-xs text-brand-muted mt-1">
                            {formatBidTime(bid.bidTime)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm sm:text-base font-sans font-semibold text-brand-charcoal whitespace-nowrap">
                            {formatCurrency(bid.bidAmount)}
                          </p>
                          <p className="text-[11px] sm:text-xs text-brand-muted capitalize">
                            {bid.bidStatus}
                          </p>
                        </div>
                      </article>
                    ))}
                </div>
              </section>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
