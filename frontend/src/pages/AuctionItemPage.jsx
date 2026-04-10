import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../lib/axios";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import useFinalCallTimer from "../hooks/useFinalCallTimer";
import FinalCallBanner from "../components/ui/FinalCallBanner";
import useBidCooldown from "../hooks/useBidCooldown";
import SocketStatusBadge from "../components/ui/SocketStatusBadge";

const FALLBACK_ITEM_IMAGE =
  "https://images.unsplash.com/photo-1579546929662-711aa81148cf?w=700&q=80";

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

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "--";
  }

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const ITEM_TABS = [
  { id: "overview", label: "Overview" },
  { id: "bid", label: "Bid Panel" },
  { id: "history", label: "Bid History" },
];

function getBidderDisplayName(bidderValue, bids, fallbackBidAmount) {
  if (!bidderValue) {
    return "No bids yet";
  }

  if (typeof bidderValue === "object" && bidderValue?.name) {
    return bidderValue.name;
  }

  if (typeof bidderValue === "string") {
    // If socket already gave a name, use it as-is.
    if (!/^[a-f0-9]{24}$/i.test(bidderValue)) {
      return bidderValue;
    }

    const fromHistory = bids.find((bid) => {
      const bidUserId =
        typeof bid?.bidderId === "string" ? bid.bidderId : bid?.bidderId?._id;
      const sameBidder = String(bidUserId || "") === bidderValue;

      if (!sameBidder) {
        return false;
      }

      if (fallbackBidAmount == null) {
        return true;
      }

      return Number(bid?.bidAmount || 0) === Number(fallbackBidAmount);
    });

    if (fromHistory?.bidderId?.name) {
      return fromHistory.bidderId.name;
    }
  }

  return "No bids yet";
}

function computeTopBidders(bids) {
  const statsByBidder = bids.reduce((acc, bid) => {
    const bidderId =
      typeof bid?.bidderId === "string" ? bid.bidderId : bid?.bidderId?._id;
    const bidderName = bid?.bidderId?.name || "Participant";

    if (!bidderId) {
      return acc;
    }

    const amount = Number(bid?.bidAmount || 0);
    const previous = acc.get(bidderId) || {
      id: bidderId,
      name: bidderName,
      highestBid: 0,
      totalBids: 0,
    };

    acc.set(bidderId, {
      ...previous,
      highestBid: Math.max(previous.highestBid, amount),
      totalBids: previous.totalBids + 1,
    });

    return acc;
  }, new Map());

  return [...statsByBidder.values()]
    .sort((a, b) => {
      if (b.highestBid !== a.highestBid) {
        return b.highestBid - a.highestBid;
      }

      return b.totalBids - a.totalBids;
    })
    .slice(0, 5);
}

export default function AuctionItemPage() {
  const { auctionId, itemId } = useParams();
  const { socket, isSocketConnected } = useSocket();
  const { isAuthenticated } = useAuth();

  const [auction, setAuction] = useState(null);
  const [item, setItem] = useState(null);
  const [bids, setBids] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [bidAmountInput, setBidAmountInput] = useState("");
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinalCallExtended, setIsFinalCallExtended] = useState(false);

  const { isFinalCall, remainingMs } = useFinalCallTimer({
    socket,
    activeItemId: item?._id,
  });

  const { isCoolingDown, remainingCooldownMs } = useBidCooldown({
    socket,
    cooldownSeconds: auction?.bidCooldown ?? 3,
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchItemPageData() {
      setIsLoading(true);

      try {
        const [auctionResponse, itemsResponse, bidsResponse] =
          await Promise.all([
            axiosInstance.get(`/auctions/${auctionId}`),
            axiosInstance.get(`/items/auction/${auctionId}`),
            axiosInstance.get(`/bids/item/${itemId}`),
          ]);

        const auctionPayload =
          auctionResponse?.data?.data || auctionResponse?.data || null;
        const itemsPayload =
          itemsResponse?.data?.data || itemsResponse?.data?.items || [];
        const bidsPayload =
          bidsResponse?.data?.data || bidsResponse?.data || [];
        const allItems = Array.isArray(itemsPayload) ? itemsPayload : [];
        const currentItem =
          allItems.find((entry) => String(entry?._id) === String(itemId)) ||
          null;

        if (isMounted) {
          setAuction(auctionPayload);
          setItem(currentItem);
          setBids(Array.isArray(bidsPayload) ? bidsPayload : []);
        }
      } catch {
        if (isMounted) {
          toast.error("Unable to load this auction item right now.");
          setAuction(null);
          setItem(null);
          setBids([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    if (auctionId && itemId) {
      fetchItemPageData();
    }

    return () => {
      isMounted = false;
    };
  }, [auctionId, itemId]);

  useEffect(() => {
    if (!socket || !auctionId || !itemId) {
      return;
    }

    let extensionTimeoutId;

    const joinRoom = () => {
      socket.emit("JOIN_AUCTION", auctionId);
    };

    const handleNewBid = (payload) => {
      if (String(payload?.itemId) !== String(itemId)) {
        return;
      }

      setItem((previousItem) => {
        if (!previousItem) {
          return previousItem;
        }

        return {
          ...previousItem,
          currentHighestBid:
            payload?.currentHighestBid ?? previousItem.currentHighestBid,
          currentHighestBidder:
            payload?.currentHighestBidder ?? previousItem.currentHighestBidder,
          bidCount: payload?.bidCount ?? previousItem.bidCount,
        };
      });

      setBids((previousBids) => {
        const payloadBid = payload?.bid;
        const nextBid = payloadBid
          ? {
              ...payloadBid,
              itemId: payloadBid?.itemId || itemId,
            }
          : {
              _id: `live-${Date.now()}`,
              bidAmount: Number(payload?.currentHighestBid || 0),
              bidTime: new Date().toISOString(),
              bidderId: {
                name: payload?.currentHighestBidder || "Participant",
              },
              itemId,
            };

        const exists = previousBids.some(
          (entry) => String(entry?._id) === String(nextBid?._id),
        );

        if (exists) {
          return previousBids;
        }

        return [nextBid, ...previousBids];
      });
    };

    const handleBidError = (payload) => {
      toast.error(payload?.message || "Bid rejected. Please try again.", {
        duration: 3000,
        style: {
          background: "#7f1d1d",
          color: "#fee2e2",
          border: "1px solid #b91c1c",
        },
      });
    };

    const handleItemStatusUpdated = (payload) => {
      const updatedItemId = payload?.itemId;
      if (String(updatedItemId || "") !== String(itemId)) {
        return;
      }

      const nextStatus = String(payload?.status || "").toLowerCase();
      const nextItems = Array.isArray(payload?.items) ? payload.items : [];
      const matchingItem =
        nextItems.find(
          (entry) => String(entry?._id || entry?.id) === String(itemId),
        ) || null;

      setItem((previousItem) => {
        if (!previousItem && !matchingItem) {
          return previousItem;
        }

        return {
          ...(previousItem || {}),
          ...(matchingItem || {}),
          status: nextStatus || matchingItem?.status || previousItem?.status,
        };
      });
    };

    const handleItemSold = (payload) => {
      if (String(payload?.itemId || "") !== String(itemId)) {
        return;
      }

      setItem((previousItem) => {
        if (!previousItem) {
          return previousItem;
        }

        return {
          ...previousItem,
          status: "sold",
          currentHighestBid:
            payload?.winningAmount ?? previousItem.currentHighestBid,
          currentHighestBidder:
            payload?.winnerName ?? previousItem.currentHighestBidder,
        };
      });

      toast.success(payload?.message || "This item has been sold.", {
        duration: 2600,
      });
    };

    // AuctionItemPage.jsx — add inside the useEffect that registers socket.on("NEW_BID", ...)
    const handleMyBidWon = (payload) => {
      toast.success(payload?.message || `You won this item!`, {
        duration: 4000,
      });
    };

    const handleFinalCallStarted = (payload) => {
      if (String(payload?.itemId || "") !== String(itemId)) {
        return;
      }

      setIsFinalCallExtended(false);
    };

    const handleFinalCallExtended = (payload) => {
      if (String(payload?.itemId || "") !== String(itemId)) {
        return;
      }

      setIsFinalCallExtended(true);

      if (extensionTimeoutId) {
        window.clearTimeout(extensionTimeoutId);
      }

      extensionTimeoutId = window.setTimeout(() => {
        setIsFinalCallExtended(false);
      }, 2000);
    };

    const handleReconnectSync = (payload) => {
      if (
        payload?.auctionId &&
        String(payload.auctionId) !== String(auctionId)
      ) {
        return;
      }

      const syncActiveItem = payload?.activeItem;
      const syncActiveItemId = syncActiveItem?._id || syncActiveItem?.id;

      if (!syncActiveItemId) {
        return;
      }

      if (String(syncActiveItemId) === String(itemId)) {
        setItem((previousItem) => {
          if (!previousItem) {
            return {
              ...syncActiveItem,
              status: "live",
            };
          }

          return {
            ...previousItem,
            ...syncActiveItem,
            status: "live",
          };
        });
      } else {
        setItem((previousItem) => {
          if (!previousItem) {
            return previousItem;
          }

          if ((previousItem?.status || "").toLowerCase() !== "live") {
            return previousItem;
          }

          return {
            ...previousItem,
            status: "pending",
          };
        });
      }

      if (
        payload?.isFinalCall &&
        payload?.finalCallEndTime &&
        String(syncActiveItemId) === String(itemId)
      ) {
        setIsFinalCallExtended(false);
        toast("Reconnected - final call in progress.", {
          duration: 1800,
        });
      }
    };

    socket.on("MY_BID_WON", handleMyBidWon);

    socket.on("NEW_BID", handleNewBid);
    socket.on("BID_ERROR", handleBidError);
    socket.on("ITEM_STATUS_UPDATED", handleItemStatusUpdated);
    socket.on("ITEM_SOLD", handleItemSold);
    socket.on("FINAL_CALL_STARTED", handleFinalCallStarted);
    socket.on("FINAL_CALL_EXTENDED", handleFinalCallExtended);
    socket.on("AUCTION_RECONNECT_SYNC", handleReconnectSync);

    if (isSocketConnected) {
      joinRoom();
    }

    socket.on("connect", joinRoom);

    return () => {
      if (extensionTimeoutId) {
        window.clearTimeout(extensionTimeoutId);
      }

      socket.emit("LEAVE_AUCTION", auctionId);
      socket.off("NEW_BID", handleNewBid);
      socket.off("BID_ERROR", handleBidError);
      socket.off("ITEM_STATUS_UPDATED", handleItemStatusUpdated);
      socket.off("ITEM_SOLD", handleItemSold);
      socket.off("connect", joinRoom);
      socket.off("MY_BID_WON", handleMyBidWon);
      socket.off("FINAL_CALL_STARTED", handleFinalCallStarted);
      socket.off("FINAL_CALL_EXTENDED", handleFinalCallExtended);
      socket.off("AUCTION_RECONNECT_SYNC", handleReconnectSync);
    };
  }, [auctionId, isSocketConnected, itemId, socket]);

  const itemStatus = (item?.status || "pending").toLowerCase();
  const minimumBidAmount =
    Number(item?.currentHighestBid || 0) + Number(item?.bidIncrement || 0);
  const canBidNow =
    Boolean(item?._id) &&
    itemStatus === "live" &&
    isAuthenticated &&
    Boolean(socket) &&
    isSocketConnected;
  const cooldownSecondsLeft = Math.ceil(remainingCooldownMs / 1000);

  const historyList = useMemo(() => {
    if (showFullHistory) {
      return bids;
    }

    return bids.slice(0, 8);
  }, [bids, showFullHistory]);

  const topBidders = useMemo(() => computeTopBidders(bids), [bids]);

  const highestBidderName = useMemo(
    () =>
      getBidderDisplayName(
        item?.currentHighestBidder,
        bids,
        item?.currentHighestBid,
      ),
    [bids, item?.currentHighestBid, item?.currentHighestBidder],
  );

  const handlePlaceBid = () => {
    if (!item?._id || !auctionId) {
      toast.error("Unable to place bid for this item.");
      return;
    }

    if (!canBidNow) {
      if (!isAuthenticated) {
        toast.error("Please log in to place a bid.");
        return;
      }

      if (itemStatus !== "live") {
        toast.error("This item is not live for bidding yet.");
        return;
      }

      toast.error("Live connection is required to place bids.");
      return;
    }

    const bidAmount = Number(bidAmountInput);

    if (Number.isNaN(bidAmount) || bidAmount <= 0) {
      toast.error("Enter a valid bid amount.");
      return;
    }

    if (bidAmount < minimumBidAmount) {
      toast.error(`Minimum bid is ${formatCurrency(minimumBidAmount)}.`);
      return;
    }

    setIsPlacingBid(true);

    socket.emit(
      "PLACE_BID",
      { auctionId, itemId: item._id, bidAmount: Number(bidAmount) },
      (acknowledgement) => {
        setIsPlacingBid(false);

        if (acknowledgement?.success) {
          setBidAmountInput("");
          toast.success("Bid placed successfully.");
        }
      },
    );
  };

  return (
    <main className="pt-23 min-h-screen bg-white">
      <section className="px-6 lg:px-10 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex items-center justify-between gap-3">
            <Link
              to={`/auction/${auctionId}/live-room`}
              className="text-[12px] font-sans text-brand-muted hover:text-brand-charcoal underline underline-offset-2 transition-colors duration-150"
            >
              Back to Live Room
            </Link>
            <Link
              to={`/auction/${auctionId}`}
              className="text-[12px] font-sans text-brand-muted hover:text-brand-charcoal underline underline-offset-2 transition-colors duration-150"
            >
              Back to Auction
            </Link>
          </div>

          <div className="rounded-[28px] border border-brand-border bg-white p-5 sm:p-6 lg:p-8">
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-8 w-2/3 rounded bg-brand-light animate-pulse" />
                <div className="h-4 w-1/2 rounded bg-brand-light animate-pulse" />
              </div>
            ) : (
              <>
                <h1 className="font-display text-3xl sm:text-4xl text-brand-charcoal leading-tight">
                  {item?.title || "Auction Item"}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <SocketStatusBadge isConnected={isSocketConnected} />
                  <span className="inline-flex items-center rounded-full border border-brand-border bg-brand-light/50 px-3 py-1 text-xs font-sans text-brand-charcoal capitalize">
                    {item?.status || "pending"}
                  </span>
                </div>
                <p className="text-sm sm:text-base text-brand-muted mt-2 max-w-3xl">
                  {item?.description ||
                    "Focused live bidding view for this lot."}
                </p>
                <p className="text-xs sm:text-sm text-brand-muted mt-3">
                  {auction?.title || "Auction"} • Status: {itemStatus}
                </p>
              </>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              {ITEM_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    "rounded-full px-4 py-1.5 text-xs sm:text-sm font-sans border transition-all duration-200",
                    activeTab === tab.id
                      ? "bg-brand-charcoal text-white border-brand-charcoal"
                      : "bg-white text-brand-muted border-brand-border hover:text-brand-charcoal",
                  ].join(" ")}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <section className="pt-8">
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 rounded-2xl border border-brand-border bg-white p-4 sm:p-5">
                  <div className="rounded-xl overflow-hidden bg-brand-light mb-4">
                    <img
                      src={
                        (Array.isArray(item?.imageUrls) &&
                          item?.imageUrls[0]) ||
                        item?.image ||
                        FALLBACK_ITEM_IMAGE
                      }
                      alt={item?.title || "Auction item"}
                      className="w-full h-72 sm:h-84 object-cover"
                    />
                  </div>

                  <div className="mb-4">
                    <FinalCallBanner
                      isFinalCall={isFinalCall}
                      remainingMs={remainingMs}
                      extended={isFinalCallExtended}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-brand-border bg-brand-light/20 p-3">
                      <p className="text-[11px] text-brand-muted">
                        Current Highest
                      </p>
                      <p className="text-lg sm:text-xl font-sans font-semibold text-brand-charcoal mt-1">
                        {formatCurrency(item?.currentHighestBid || 0)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-brand-border bg-brand-light/20 p-3">
                      <p className="text-[11px] text-brand-muted">
                        Bid Increment
                      </p>
                      <p className="text-lg sm:text-xl font-sans font-semibold text-brand-charcoal mt-1">
                        {formatCurrency(item?.bidIncrement || 0)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-brand-border bg-brand-light/20 p-3">
                      <p className="text-[11px] text-brand-muted">
                        Highest Bidder
                      </p>
                      <p className="text-sm sm:text-base font-sans font-medium text-brand-charcoal mt-1 truncate">
                        {highestBidderName}
                      </p>
                    </div>
                    <div className="rounded-xl border border-brand-border bg-brand-light/20 p-3">
                      <p className="text-[11px] text-brand-muted">Total Bids</p>
                      <p className="text-lg sm:text-xl font-sans font-semibold text-brand-charcoal mt-1">
                        {Number(item?.bidCount || 0)}
                      </p>
                    </div>
                  </div>
                </div>

                <aside className="rounded-2xl border border-brand-border bg-white p-4 sm:p-5 h-fit">
                  <h2 className="font-display text-2xl text-brand-charcoal">
                    Bid History
                  </h2>
                  <p className="text-xs sm:text-sm text-brand-muted mt-1">
                    Latest activity on this item.
                  </p>

                  <div className="mt-4 space-y-2 max-h-[340px] overflow-y-auto pr-1">
                    {historyList.length === 0 ? (
                      <div className="rounded-xl border border-brand-border bg-brand-light/40 p-3 text-sm text-brand-muted">
                        No bids recorded yet.
                      </div>
                    ) : (
                      historyList.map((bid, index) => (
                        <div
                          key={bid?._id || `item-bid-${index}`}
                          className="rounded-lg border border-brand-border bg-white px-3 py-2"
                        >
                          <p className="text-sm font-sans font-semibold text-brand-charcoal">
                            {formatCurrency(bid?.bidAmount || 0)}
                          </p>
                          <p className="text-[11px] text-brand-muted mt-0.5 truncate">
                            {bid?.bidderId?.name || "Participant"} •{" "}
                            {formatBidTime(bid?.bidTime)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {bids.length > 8 && !showFullHistory && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowFullHistory(true);
                        setActiveTab("history");
                      }}
                      className="mt-4 inline-flex items-center justify-center rounded-full bg-brand-charcoal text-white border border-brand-charcoal px-4 py-2 text-xs sm:text-sm font-sans font-medium hover:bg-brand-dark transition-all duration-200"
                    >
                      View Full Bid History
                    </button>
                  )}

                  <div className="mt-6 pt-5 border-t border-brand-border">
                    <h3 className="font-display text-xl text-brand-charcoal">
                      Top 5 Bidders
                    </h3>
                    <p className="text-xs sm:text-sm text-brand-muted mt-1">
                      Ranked by highest bid on this item.
                    </p>

                    <div className="mt-3 space-y-2">
                      {topBidders.length === 0 ? (
                        <div className="rounded-xl border border-brand-border bg-brand-light/40 p-3 text-sm text-brand-muted">
                          No bidder rankings yet.
                        </div>
                      ) : (
                        topBidders.map((entry, index) => (
                          <div
                            key={entry.id || `top-bidder-${index}`}
                            className="rounded-lg border border-brand-border bg-white px-3 py-2 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-sans font-medium text-brand-charcoal truncate">
                                {index + 1}. {entry.name}
                              </p>
                              <p className="text-[11px] text-brand-muted mt-0.5">
                                {entry.totalBids} bid
                                {entry.totalBids === 1 ? "" : "s"}
                              </p>
                            </div>
                            <p className="text-sm font-sans font-semibold text-brand-charcoal">
                              {formatCurrency(entry.highestBid)}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </aside>
              </div>
            )}

            {activeTab === "bid" && (
              <div className="rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
                <h2 className="font-display text-2xl sm:text-3xl text-brand-charcoal">
                  Place Your Bid
                </h2>
                <div className="mt-4">
                  <FinalCallBanner
                    isFinalCall={isFinalCall}
                    remainingMs={remainingMs}
                    extended={isFinalCallExtended}
                  />
                </div>
                <p className="text-sm text-brand-muted mt-2">
                  Minimum next bid: {formatCurrency(minimumBidAmount)}
                </p>

                <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    type="number"
                    min={minimumBidAmount}
                    step={item?.bidIncrement || 1}
                    value={bidAmountInput}
                    disabled={!canBidNow || isPlacingBid || isCoolingDown}
                    onChange={(event) => setBidAmountInput(event.target.value)}
                    placeholder={`${minimumBidAmount}`}
                    className="flex-1 min-w-0 rounded-full border border-brand-border bg-white px-5 py-3 text-sm sm:text-base text-brand-charcoal placeholder:text-brand-muted/80 outline-none focus:border-brand-charcoal disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={handlePlaceBid}
                    disabled={!canBidNow || isPlacingBid || isCoolingDown}
                    className="inline-flex items-center justify-center rounded-full bg-brand-charcoal text-white border border-brand-charcoal px-6 py-3 text-sm font-sans font-medium hover:bg-brand-dark transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPlacingBid
                      ? "Placing..."
                      : isCoolingDown
                        ? `Wait ${cooldownSecondsLeft}s`
                        : "Place Bid"}
                  </button>
                </div>

                {isCoolingDown && (
                  <p className="mt-2 text-[11px] sm:text-xs font-sans text-brand-muted">
                    Cooldown active — {cooldownSecondsLeft}s remaining
                  </p>
                )}

                <div className="mt-4 text-xs sm:text-sm text-brand-muted space-y-1">
                  {!isAuthenticated && <p>Please log in to place bids.</p>}
                  {isAuthenticated && itemStatus === "sold" && (
                    <p>This item has been sold.</p>
                  )}
                  {isAuthenticated && itemStatus !== "live" && (
                    <p>
                      This item is currently {itemStatus} and not accepting
                      bids.
                    </p>
                  )}
                  {isAuthenticated &&
                    itemStatus === "live" &&
                    !isSocketConnected && (
                      <p>Waiting for live socket connection...</p>
                    )}
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div className="rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h2 className="font-display text-2xl sm:text-3xl text-brand-charcoal">
                    Full Item Bid History
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowFullHistory((previous) => !previous)}
                    className="rounded-full border border-brand-border bg-white px-4 py-1.5 text-xs sm:text-sm font-sans text-brand-muted hover:text-brand-charcoal transition-colors"
                  >
                    {showFullHistory ? "Show Latest Only" : "Show All"}
                  </button>
                </div>

                {(showFullHistory ? bids : bids.slice(0, 10)).length === 0 ? (
                  <div className="rounded-xl border border-brand-border bg-brand-light/40 p-4 text-sm text-brand-muted">
                    No bid history found for this item.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                    {(showFullHistory ? bids : bids.slice(0, 10)).map(
                      (bid, index) => (
                        <div
                          key={bid?._id || `history-bid-${index}`}
                          className="rounded-lg border border-brand-border bg-white px-4 py-3 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-sans font-semibold text-brand-charcoal truncate">
                              {bid?.bidderId?.name || "Participant"}
                            </p>
                            <p className="text-[11px] text-brand-muted mt-0.5">
                              {formatBidTime(bid?.bidTime)}
                            </p>
                          </div>
                          <p className="text-sm sm:text-base font-sans font-semibold text-brand-charcoal">
                            {formatCurrency(bid?.bidAmount || 0)}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
