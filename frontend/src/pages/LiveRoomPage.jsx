import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../lib/axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

const FALLBACK_ITEM_IMAGE =
  "https://images.unsplash.com/photo-1579546929662-711aa81148cf?w=400&q=80";
const ITEM_STATUS_OPTIONS = ["pending", "live", "sold", "unsold"];

function normalizeEntityId(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
    if (typeof value?._id === "string") {
      return value._id;
    }

    if (value?._id) {
      return String(value._id);
    }

    if (typeof value?.id === "string") {
      return value.id;
    }

    if (value?.id) {
      return String(value.id);
    }
  }

  return String(value);
}

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

function computeLeaderboard(participants, bids) {
  const statsByUserId = bids.reduce((acc, bid) => {
    const bidderId =
      typeof bid?.bidderId === "string" ? bid.bidderId : bid?.bidderId?._id;

    if (!bidderId) {
      return acc;
    }

    const previous = acc.get(bidderId) || {
      highestBid: 0,
      totalBids: 0,
    };

    const amount = Number(bid?.bidAmount || 0);

    acc.set(bidderId, {
      highestBid: Math.max(previous.highestBid, amount),
      totalBids: previous.totalBids + 1,
    });

    return acc;
  }, new Map());

  return participants
    .map((participant) => {
      const user = participant?.userId || {};
      const userId = user?._id || String(participant?.userId || "");
      const userStats = statsByUserId.get(userId) || {
        highestBid: 0,
        totalBids: 0,
      };

      return {
        id: userId || participant?._id,
        name: user?.name || "Participant",
        highestBid: userStats.highestBid,
        totalBids: userStats.totalBids,
      };
    })
    .sort((a, b) => {
      if (b.highestBid !== a.highestBid) {
        return b.highestBid - a.highestBid;
      }

      return b.totalBids - a.totalBids;
    });
}

export default function LiveRoomPage() {
  const { auctionId } = useParams();
  const location = useLocation();
  const { user: currentUser } = useAuth();
  const { socket, isSocketConnected } = useSocket();

  const [auction, setAuction] = useState(null);
  const [items, setItems] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [bids, setBids] = useState([]);
  const [statusInputsByItem, setStatusInputsByItem] = useState({});
  const [isUpdatingStatusByItem, setIsUpdatingStatusByItem] = useState({});
  const [isRefreshingItems, setIsRefreshingItems] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isHostViewRoute = location.pathname.endsWith("/host-view");

  const hostId = normalizeEntityId(auction?.createdBy);
  const currentUserId = normalizeEntityId(currentUser?._id || currentUser?.id);
  const isClientOwner =
    Boolean(hostId) && Boolean(currentUserId) && hostId === currentUserId;
  const isHostControlView = isHostViewRoute && isClientOwner;
  const isReadOnlyClientView = isHostViewRoute && !isClientOwner;

  useEffect(() => {
    let isMounted = true;

    async function fetchLiveRoomData() {
      setIsLoading(true);

      try {
        const [
          auctionResponse,
          itemsResponse,
          participantsResponse,
          bidsResponse,
        ] = await Promise.all([
          axiosInstance.get(`/auctions/${auctionId}`),
          axiosInstance.get(`/items/auction/${auctionId}`),
          axiosInstance.get(`/participants/auction/${auctionId}`),
          axiosInstance.get(`/bids/auction/${auctionId}`),
        ]);

        const auctionPayload =
          auctionResponse?.data?.data || auctionResponse?.data || null;
        const itemsPayload =
          itemsResponse?.data?.data || itemsResponse?.data?.items || [];
        const participantsPayload =
          participantsResponse?.data?.data || participantsResponse?.data || [];
        const bidsPayload =
          bidsResponse?.data?.data || bidsResponse?.data || [];

        if (isMounted) {
          setAuction(auctionPayload);
          setItems(Array.isArray(itemsPayload) ? itemsPayload : []);
          setStatusInputsByItem(
            (Array.isArray(itemsPayload) ? itemsPayload : []).reduce(
              (acc, item) => {
                const itemId = item?._id || item?.id;
                if (itemId) {
                  acc[itemId] = (item?.status || "pending").toLowerCase();
                }
                return acc;
              },
              {},
            ),
          );
          setParticipants(
            Array.isArray(participantsPayload) ? participantsPayload : [],
          );
          setBids(Array.isArray(bidsPayload) ? bidsPayload : []);
        }
      } catch {
        if (isMounted) {
          toast.error("Unable to load live room details right now.");
          setAuction(null);
          setItems([]);
          setParticipants([]);
          setBids([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    if (auctionId) {
      fetchLiveRoomData();
    }

    return () => {
      isMounted = false;
    };
  }, [auctionId]);

  const leaderboard = useMemo(
    () => computeLeaderboard(participants, bids),
    [bids, participants],
  );

  const bidHistory = useMemo(
    () =>
      [...bids].sort(
        (a, b) =>
          new Date(b?.bidTime || 0).getTime() -
          new Date(a?.bidTime || 0).getTime(),
      ),
    [bids],
  );

  const refreshItemsOnly = async ({ showToast = false } = {}) => {
    if (!auctionId) {
      return;
    }

    setIsRefreshingItems(true);

    try {
      const itemsResponse = await axiosInstance.get(
        `/items/auction/${auctionId}`,
      );
      const itemsPayload =
        itemsResponse?.data?.data || itemsResponse?.data || [];
      const nextItems = Array.isArray(itemsPayload)
        ? itemsPayload
        : Array.isArray(itemsPayload?.items)
          ? itemsPayload.items
          : [];

      setItems(nextItems);
      setStatusInputsByItem(
        nextItems.reduce((acc, item) => {
          const itemId = item?._id || item?.id;
          if (itemId) {
            acc[itemId] = (item?.status || "pending").toLowerCase();
          }
          return acc;
        }, {}),
      );

      if (showToast) {
        toast.success("Items refreshed.");
      }
    } catch {
      toast.error("Unable to refresh items right now.");
    } finally {
      setIsRefreshingItems(false);
    }
  };

  useEffect(() => {
    if (!socket || !auctionId || !isSocketConnected) {
      return;
    }

    socket.emit("JOIN_AUCTION", auctionId);

    const handleNewBid = (payload) => {
      if (String(payload?.auctionId || "") !== String(auctionId)) {
        return;
      }

      const nextItemId = payload?.itemId;

      if (nextItemId) {
        setItems((previousItems) =>
          previousItems.map((item) => {
            const currentId = item?._id || item?.id;
            if (String(currentId) !== String(nextItemId)) {
              return item;
            }

            return {
              ...item,
              currentHighestBid:
                payload?.currentHighestBid ?? item.currentHighestBid,
              currentHighestBidder:
                payload?.currentHighestBidder ?? item.currentHighestBidder,
              bidCount: payload?.bidCount ?? item.bidCount,
            };
          }),
        );
      }

      const incomingBid = payload?.bid;
      if (!incomingBid) {
        return;
      }

      setBids((previousBids) => {
        const alreadyExists = previousBids.some(
          (entry) => String(entry?._id) === String(incomingBid?._id),
        );

        if (alreadyExists) {
          return previousBids;
        }

        return [incomingBid, ...previousBids];
      });
    };

    const handleItemStatusUpdated = (payload) => {
      const nextItems = Array.isArray(payload?.items) ? payload.items : [];
      if (nextItems.length > 0) {
        setItems(nextItems);
        setStatusInputsByItem(
          nextItems.reduce((acc, item) => {
            const itemId = item?._id || item?.id;
            if (itemId) {
              acc[itemId] = (item?.status || "pending").toLowerCase();
            }
            return acc;
          }, {}),
        );
      }

      toast(payload?.message || "Auction item status updated.", {
        duration: 1800,
      });
    };

    socket.on("NEW_BID", handleNewBid);
    socket.on("ITEM_STATUS_UPDATED", handleItemStatusUpdated);

    return () => {
      socket.emit("LEAVE_AUCTION", auctionId);
      socket.off("NEW_BID", handleNewBid);
      socket.off("ITEM_STATUS_UPDATED", handleItemStatusUpdated);
    };
  }, [auctionId, isSocketConnected, socket]);

  const onStatusInputChange = (itemId, nextStatus) => {
    setStatusInputsByItem((previousState) => ({
      ...previousState,
      [itemId]: String(nextStatus || "pending").toLowerCase(),
    }));
  };

  const handleUpdateItemStatus = async (item) => {
    const itemId = item?._id || item?.id;
    if (!itemId) {
      toast.error("Unable to update this item status.");
      return;
    }

    const selectedStatus = String(
      statusInputsByItem[itemId] || item?.status || "pending",
    ).toLowerCase();

    if (!ITEM_STATUS_OPTIONS.includes(selectedStatus)) {
      toast.error("Please choose a valid item status.");
      return;
    }

    setIsUpdatingStatusByItem((previousState) => ({
      ...previousState,
      [itemId]: true,
    }));

    try {
      const response = await axiosInstance.patch(`/items/${itemId}/status`, {
        status: selectedStatus,
      });

      const updatedItem = response?.data?.data || null;
      if (!updatedItem) {
        throw new Error("Invalid server response");
      }

      setItems((previousItems) =>
        previousItems.map((entry) => {
          const entryId = entry?._id || entry?.id;

          if (String(entryId) === String(itemId)) {
            return {
              ...entry,
              ...updatedItem,
              status: (updatedItem?.status || selectedStatus).toLowerCase(),
            };
          }

          if (
            selectedStatus === "live" &&
            (entry?.status || "").toLowerCase() === "live"
          ) {
            return {
              ...entry,
              status: "pending",
            };
          }

          return entry;
        }),
      );

      setStatusInputsByItem((previousState) => ({
        ...previousState,
        [itemId]: (updatedItem?.status || selectedStatus).toLowerCase(),
      }));

      toast.success(`Item status updated to ${selectedStatus}.`);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Unable to update item status right now.";
      toast.error(message);
    } finally {
      setIsUpdatingStatusByItem((previousState) => ({
        ...previousState,
        [itemId]: false,
      }));
    }
  };

  return (
    <main className="pt-23 min-h-screen bg-white">
      <section className="px-6 lg:px-10 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4">
            <Link
              to={`/auction/${auctionId}`}
              className="text-[12px] font-sans text-brand-muted hover:text-brand-charcoal underline underline-offset-2 transition-colors duration-150"
            >
              Back to Auction Room
            </Link>
          </div>

          <div className="rounded-[28px] border border-brand-border bg-white p-5 sm:p-6 lg:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl sm:text-4xl text-brand-charcoal leading-tight">
                  {auction?.title || "Live Room"}
                </h1>
                <p className="text-sm sm:text-base text-brand-muted mt-2">
                  {isHostControlView
                    ? "Host controls for item status with full auction visibility."
                    : isReadOnlyClientView
                      ? "Client view for item status, auction history, and leaderboard insights."
                      : "Live participant board and real-time item bidding lane."}
                </p>
              </div>
              <div
                className={[
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-sans",
                  isHostControlView || isReadOnlyClientView
                    ? "border border-brand-border bg-brand-light/60 text-brand-charcoal"
                    : "border border-green-200 bg-green-50/80 text-green-700",
                ].join(" ")}
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span
                    className={[
                      "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                      isHostControlView || isReadOnlyClientView
                        ? "bg-brand-muted/60"
                        : "bg-green-400",
                    ].join(" ")}
                  />
                  <span
                    className={[
                      "relative inline-flex rounded-full h-2.5 w-2.5",
                      isHostControlView || isReadOnlyClientView
                        ? "bg-brand-charcoal"
                        : "bg-green-500",
                    ].join(" ")}
                  />
                </span>
                {isHostControlView
                  ? "Client Host Control View"
                  : isReadOnlyClientView
                    ? "Client Read-Only View"
                    : "Live Room Active"}
              </div>
            </div>
          </div>

          <section className="pt-8 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2 rounded-2xl border border-brand-border bg-white p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="font-display text-2xl text-brand-charcoal">
                  Items
                </h2>
                <div className="flex items-center gap-2">
                  <p className="text-xs sm:text-sm text-brand-muted">
                    {items.length} listed
                  </p>
                  <button
                    type="button"
                    onClick={() => refreshItemsOnly({ showToast: true })}
                    disabled={isRefreshingItems}
                    className="inline-flex items-center justify-center rounded-full bg-white text-brand-charcoal border border-brand-border px-3 py-1.5 text-[11px] sm:text-xs font-sans font-medium hover:bg-brand-light transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isRefreshingItems ? "Refreshing..." : "Refresh"}
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={`item-row-skeleton-${index}`}
                      className="h-24 rounded-xl bg-brand-light animate-pulse"
                    />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="rounded-xl border border-brand-border bg-brand-light/40 p-4 text-sm text-brand-muted">
                  No items found in this live room yet.
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-h-[640px] overflow-y-auto pr-1">
                  {items.map((item, index) => {
                    const highestBid = Number(
                      item?.currentHighestBid || item?.startingPrice || 0,
                    );
                    const highestBidder = item?.currentHighestBidder;
                    const highestBidderName =
                      typeof highestBidder === "string"
                        ? highestBidder
                        : highestBidder?.name || "No bids yet";
                    const status = (item?.status || "pending").toLowerCase();
                    const itemId = item?._id || item?.id;
                    const selectedStatus = statusInputsByItem[itemId] || status;
                    const isStatusUpdateDisabled = Boolean(
                      isUpdatingStatusByItem[itemId],
                    );

                    return (
                      <article
                        key={item?._id || `live-item-${index}`}
                        className={[
                          "rounded-xl border bg-white p-3 flex gap-3",
                          status === "live"
                            ? "border-green-300 shadow-[0_0_0_1px_rgba(134,239,172,0.65)]"
                            : "border-brand-border",
                        ].join(" ")}
                      >
                        <div className="w-18 h-18 sm:w-20 sm:h-20 shrink-0 rounded-lg overflow-hidden bg-brand-light">
                          <img
                            src={
                              (Array.isArray(item?.imageUrls) &&
                                item.imageUrls[0]) ||
                              item?.image ||
                              FALLBACK_ITEM_IMAGE
                            }
                            alt={item?.title || "Auction item"}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-display text-base sm:text-lg text-brand-charcoal truncate">
                                {item?.title || "Untitled Item"}
                              </p>
                              <p className="text-xs text-brand-muted truncate mt-0.5">
                                {item?.description || "Live auction item"}
                              </p>
                            </div>
                            <span className="rounded-full border border-brand-border px-2.5 py-1 text-[11px] text-brand-muted capitalize">
                              {status}
                            </span>
                          </div>

                          {status === "live" && (
                            <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-[11px] sm:text-xs font-sans font-medium text-green-700">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                              </span>
                              Live Item
                            </div>
                          )}

                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] sm:text-xs text-brand-muted">
                            <span>
                              Current Highest: {formatCurrency(highestBid)}
                            </span>
                            <span>Bidder: {highestBidderName}</span>
                            <span>
                              Total Bids: {Number(item?.bidCount || 0)}
                            </span>
                          </div>

                          <div className="mt-3">
                            {isHostControlView ? (
                              <div className="space-y-2">
                                <div className="inline-flex items-center justify-center rounded-full bg-brand-light text-brand-charcoal border border-brand-border px-4 py-1.5 text-xs sm:text-sm font-sans font-medium">
                                  Bidding Disabled For Host
                                </div>
                                <div className="flex items-center gap-2">
                                  <select
                                    value={selectedStatus}
                                    onChange={(event) =>
                                      onStatusInputChange(
                                        itemId,
                                        event.target.value,
                                      )
                                    }
                                    className="flex-1 min-w-0 rounded-full border border-brand-border bg-white px-4 py-2 text-sm text-brand-charcoal outline-none focus:border-brand-charcoal"
                                  >
                                    {ITEM_STATUS_OPTIONS.map((statusOption) => (
                                      <option
                                        key={`${itemId}-${statusOption}`}
                                        value={statusOption}
                                      >
                                        {statusOption.charAt(0).toUpperCase()}
                                        {statusOption.slice(1)}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateItemStatus(item)}
                                    disabled={isStatusUpdateDisabled}
                                    className="inline-flex items-center justify-center rounded-full bg-brand-charcoal text-white border border-brand-charcoal px-4 py-2 text-xs sm:text-sm font-sans font-medium hover:bg-brand-dark transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {isStatusUpdateDisabled
                                      ? "Saving..."
                                      : "Update"}
                                  </button>
                                </div>
                              </div>
                            ) : isReadOnlyClientView ? (
                              <span className="inline-flex items-center justify-center rounded-full bg-brand-light text-brand-charcoal border border-brand-border px-4 py-1.5 text-xs sm:text-sm font-sans font-medium">
                                View Only
                              </span>
                            ) : (
                              <Link
                                to={`/auction/${auctionId}/item/${item?._id}`}
                                className="inline-flex items-center justify-center rounded-full bg-brand-charcoal text-white border border-brand-charcoal px-4 py-1.5 text-xs sm:text-sm font-sans font-medium hover:bg-brand-dark transition-all duration-200"
                              >
                                Bid Now
                              </Link>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            <aside className="rounded-2xl border border-brand-border bg-white p-4 sm:p-5 h-fit">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="font-display text-2xl text-brand-charcoal">
                  Leaderboard
                </h2>
                <p className="text-xs sm:text-sm text-brand-muted">
                  {leaderboard.length} participants
                </p>
              </div>

              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={`leaderboard-skeleton-${index}`}
                      className="h-12 rounded-lg bg-brand-light animate-pulse"
                    />
                  ))}
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="rounded-xl border border-brand-border bg-brand-light/40 p-4 text-sm text-brand-muted">
                  No participants joined this auction yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry, index) => (
                    <div
                      key={entry.id || `leaderboard-${index}`}
                      className="rounded-lg border border-brand-border bg-white px-3 py-2.5 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-sans font-medium text-brand-charcoal truncate">
                          {index + 1}. {entry.name}
                        </p>
                        <p className="text-[11px] text-brand-muted">
                          {entry.totalBids} bid
                          {entry.totalBids === 1 ? "" : "s"}
                        </p>
                      </div>
                      <p className="text-sm font-sans font-semibold text-brand-charcoal">
                        {entry.highestBid > 0
                          ? formatCurrency(entry.highestBid)
                          : "No bids"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </aside>
          </section>

          <section className="pt-6">
            <div className="rounded-2xl border border-brand-border bg-white p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="font-display text-2xl text-brand-charcoal">
                  Auction Bid History
                </h2>
                <p className="text-xs sm:text-sm text-brand-muted">
                  {bidHistory.length} bids
                </p>
              </div>

              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={`history-skeleton-${index}`}
                      className="h-11 rounded-lg bg-brand-light animate-pulse"
                    />
                  ))}
                </div>
              ) : bidHistory.length === 0 ? (
                <div className="rounded-xl border border-brand-border bg-brand-light/40 p-4 text-sm text-brand-muted">
                  No bids recorded for this auction yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {bidHistory.map((bid, index) => {
                    const bidderName =
                      typeof bid?.bidderId === "string"
                        ? bid.bidderId
                        : bid?.bidderId?.name || "Participant";
                    const bidItemId =
                      typeof bid?.itemId === "string"
                        ? bid.itemId
                        : bid?.itemId?._id;
                    const itemTitle =
                      bid?.itemTitle ||
                      (typeof bid?.itemId === "object" && bid?.itemId?.title) ||
                      items.find(
                        (item) => String(item?._id) === String(bidItemId),
                      )?.title ||
                      "Auction Item";

                    return (
                      <div
                        key={bid?._id || `auction-bid-${index}`}
                        className="rounded-lg border border-brand-border bg-white px-3 py-2.5 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-sans font-medium text-brand-charcoal truncate">
                            {bidderName}
                          </p>
                          <p className="text-[11px] text-brand-muted truncate">
                            {itemTitle} • {formatBidTime(bid?.bidTime)}
                          </p>
                        </div>
                        <p className="text-sm font-sans font-semibold text-brand-charcoal whitespace-nowrap">
                          {formatCurrency(bid?.bidAmount || 0)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
