import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import SectionHeader from "../components/ui/SectionHeader";
import ItemCard from "../components/ui/ItemCard";
import axiosInstance from "../lib/axios";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";

const FALLBACK_AUCTION_IMAGE =
  "https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?w=1400&q=80";
const FALLBACK_ITEM_IMAGE =
  "https://images.unsplash.com/photo-1579546929662-711aa81148cf?w=600&q=80";
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

function formatRoomTime(timeValue) {
  if (!timeValue) {
    return "To be announced";
  }

  const parsedDate = new Date(timeValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return "To be announced";
  }

  return parsedDate.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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

function mapItemsToCards(items) {
  return items.map((item, index) => {
    const highestBid = item?.currentHighestBid || item?.startingPrice || 0;
    const status = (item?.status || "scheduled").toLowerCase();

    return {
      id: item?._id || item?.id || `item-${index}`,
      title: item?.title || "Untitled Item",
      artist: item?.description || "Live auction item",
      medium: `Increment: ${formatCurrency(item?.bidIncrement || 0)}`,
      price: formatCurrency(highestBid),
      sold: status === "sold",
      src:
        (Array.isArray(item?.imageUrls) && item.imageUrls[0]) ||
        item?.image ||
        FALLBACK_ITEM_IMAGE,
    };
  });
}

function RoomHeaderSkeleton() {
  return (
    <div className="rounded-[28px] border border-brand-border overflow-hidden bg-white">
      <div className="h-52 sm:h-64 w-full bg-brand-light animate-pulse" />
      <div className="p-6 lg:p-8 space-y-3">
        <div className="h-7 w-2/3 bg-brand-light rounded animate-pulse" />
        <div className="h-4 w-1/2 bg-brand-light rounded animate-pulse" />
        <div className="h-4 w-1/3 bg-brand-light rounded animate-pulse" />
      </div>
    </div>
  );
}

function ItemSkeleton({ keyId }) {
  return (
    <article key={keyId} className="group relative flex flex-col">
      <div
        className="relative w-full rounded-xl overflow-hidden bg-brand-light animate-pulse"
        style={{ aspectRatio: "3/4" }}
      />
      <div className="pt-3 space-y-2">
        <div className="h-4 w-4/5 bg-brand-light rounded animate-pulse" />
        <div className="h-3 w-3/5 bg-brand-light rounded animate-pulse" />
      </div>
    </article>
  );
}

export default function AuctionRoom() {
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const { socket, isSocketConnected } = useSocket();
  const { user: currentUser } = useAuth();

  const [auction, setAuction] = useState(null);
  const [items, setItems] = useState([]);
  const [isLoadingAuction, setIsLoadingAuction] = useState(true);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [isRefreshingItems, setIsRefreshingItems] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [bidInputs, setBidInputs] = useState({});
  const [isPlacingBidByItem, setIsPlacingBidByItem] = useState({});
  const [statusInputsByItem, setStatusInputsByItem] = useState({});
  const [isUpdatingStatusByItem, setIsUpdatingStatusByItem] = useState({});
  const [isStartingAuction, setIsStartingAuction] = useState(false);
  const [isAdvancingItem, setIsAdvancingItem] = useState(false);
  const [isEndingAuction, setIsEndingAuction] = useState(false);

  const statusLabel = useMemo(() => {
    const status = (auction?.status || "scheduled").toLowerCase();
    return `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
  }, [auction?.status]);

  const normalizedAuctionStatus = (
    auction?.status || "scheduled"
  ).toLowerCase();
  const canJoinLiveAuction = normalizedAuctionStatus === "live";

  const hostId = normalizeEntityId(auction?.createdBy);
  const currentUserId = normalizeEntityId(currentUser?._id || currentUser?.id);
  const isHost =
    Boolean(hostId) && Boolean(currentUserId) && hostId === currentUserId;

  const activeLiveItem = useMemo(
    () =>
      items.find((item) => (item?.status || "").toLowerCase() === "live") ||
      null,
    [items],
  );

  useEffect(() => {
    let isMounted = true;

    async function fetchAuctionDetails() {
      setIsLoadingAuction(true);
      setIsLoadingItems(true);

      try {
        const [auctionResponse, itemsResponse] = await Promise.all([
          axiosInstance.get(`/auctions/${auctionId}`),
          axiosInstance.get(`/items/auction/${auctionId}`),
        ]);

        const auctionPayload =
          auctionResponse?.data?.data || auctionResponse?.data || null;
        const itemsPayload =
          itemsResponse?.data?.data || itemsResponse?.data || [];
        const nextItems = Array.isArray(itemsPayload)
          ? itemsPayload
          : Array.isArray(itemsPayload?.items)
            ? itemsPayload.items
            : [];

        if (isMounted) {
          setAuction(auctionPayload);
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
      } catch {
        if (isMounted) {
          toast.error("Unable to load this auction room right now.");
          setAuction(null);
          setItems([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingAuction(false);
          setIsLoadingItems(false);
        }
      }
    }

    if (auctionId) {
      fetchAuctionDetails();
    }

    return () => {
      isMounted = false;
    };
  }, [auctionId]);

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
    if (!socket || !auctionId) {
      return;
    }

    const handleAuctionJoined = (payload) => {
      const message = payload?.message || "A participant joined this auction.";

      toast(message, {
        duration: 2200,
        icon: "",
        style: {
          background: "#111827",
          color: "#f9fafb",
          border: "1px solid #1f2937",
        },
      });
    };

    socket.on("AUCTION_JOINED", handleAuctionJoined);

    const rejoinOnReconnect = () => {
      if (isJoined) {
        socket.emit("JOIN_AUCTION", auctionId);
      }
    };

    socket.on("connect", rejoinOnReconnect);

    return () => {
      if (isJoined) {
        socket.emit("LEAVE_AUCTION", auctionId);
      }
      socket.off("AUCTION_JOINED", handleAuctionJoined);
      socket.off("connect", rejoinOnReconnect);
    };
  }, [auctionId, isJoined, socket]);

  useEffect(() => {
    setIsJoined(false);
    setIsJoining(false);
  }, [auctionId]);

  useEffect(() => {
    if (!socket || !auctionId) {
      return;
    }

    const handleNewBid = (payload) => {
      const nextItemId = payload?.itemId;

      if (!nextItemId) {
        return;
      }

      setItems((previousItems) =>
        previousItems.map((item) => {
          const currentId = item?._id || item?.id;
          if (currentId !== nextItemId) {
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

      const bidderName =
        payload?.bid?.bidderId?.name || payload?.currentHighestBidder;
      const itemTitle = payload?.bid?.itemTitle || "Auction Item";
      const bidAmount = Number(
        payload?.bid?.bidAmount || payload?.currentHighestBid || 0,
      );

      if (bidderName && bidAmount > 0) {
        toast(
          payload?.message ||
            `${bidderName} placed a bid of ${formatCurrency(bidAmount)} on ${itemTitle}.`,
          {
            duration: 2200,
          },
        );
      }
    };

    const handleBidError = (payload) => {
      const message = payload?.message || "Bid rejected. Please try again.";

      toast.error(message, {
        duration: 3000,
        style: {
          background: "#7f1d1d",
          color: "#fee2e2",
          border: "1px solid #b91c1c",
        },
      });
    };

    const handleAuctionStarted = (payload) => {
      const activeItem = payload?.activeItem;
      const activeItemId = activeItem?._id || activeItem?.id;

      setAuction((previousAuction) => {
        if (!previousAuction) {
          return previousAuction;
        }

        return {
          ...previousAuction,
          status: "live",
        };
      });

      if (activeItemId) {
        setItems((previousItems) =>
          previousItems.map((item) => {
            const currentId = item?._id || item?.id;

            if (currentId === activeItemId) {
              return {
                ...item,
                ...activeItem,
                status: "live",
              };
            }

            return {
              ...item,
              status:
                (item?.status || "").toLowerCase() === "live"
                  ? "pending"
                  : item.status,
            };
          }),
        );
      }

      toast.success(payload?.message || "Auction started.");
    };

    const handleItemTransition = (payload) => {
      const previousItem = payload?.previousItem;
      const activeItem = payload?.activeItem;
      const previousItemId = previousItem?._id || previousItem?.id;
      const activeItemId = activeItem?._id || activeItem?.id;

      setItems((previousItems) =>
        previousItems.map((item) => {
          const currentId = item?._id || item?.id;

          if (previousItemId && currentId === previousItemId) {
            return {
              ...item,
              ...previousItem,
              status: "sold",
            };
          }

          if (activeItemId && currentId === activeItemId) {
            return {
              ...item,
              ...activeItem,
              status: "live",
            };
          }

          return item;
        }),
      );

      toast.success(payload?.message || "Moved to next item.");
    };

    const handleAuctionEnded = (payload) => {
      setAuction((previousAuction) => {
        if (!previousAuction) {
          return previousAuction;
        }

        return {
          ...previousAuction,
          status: "ended",
        };
      });

      setIsJoined(false);
      toast(payload?.message || "Auction has ended.");
    };

    const handleNoMoreItems = (payload) => {
      toast(payload?.message || "No more items available.");
    };

    const handleControlError = (payload) => {
      toast.error(payload?.message || "Unable to perform this host action.");
    };

    const handleItemStatusUpdated = (payload) => {
      const nextItems = Array.isArray(payload?.items) ? payload.items : [];

      if (nextItems.length > 0) {
        setItems(nextItems);
        setStatusInputsByItem(
          nextItems.reduce((acc, entry) => {
            const entryId = entry?._id || entry?.id;
            if (entryId) {
              acc[entryId] = (entry?.status || "pending").toLowerCase();
            }
            return acc;
          }, {}),
        );
      }

      if (!isHost) {
        toast(payload?.message || "Auction item status updated.", {
          duration: 1800,
        });
      }
    };

    const handleItemSold = (payload) => {
      const soldItemId = payload?.itemId;

      if (soldItemId) {
        setItems((previousItems) =>
          previousItems.map((entry) => {
            const entryId = entry?._id || entry?.id;
            if (String(entryId) !== String(soldItemId)) {
              return entry;
            }

            return {
              ...entry,
              status: "sold",
            };
          }),
        );
      }

      toast.success(
        payload?.message ||
          `${payload?.itemTitle || "Item"} sold to ${payload?.winnerName || "winner"} for ${formatCurrency(payload?.winningAmount || 0)}.`,
        { duration: 2600 },
      );
    };

    socket.on("NEW_BID", handleNewBid);
    socket.on("BID_ERROR", handleBidError);
    socket.on("AUCTION_STARTED", handleAuctionStarted);
    socket.on("ITEM_TRANSITION", handleItemTransition);
    socket.on("AUCTION_ENDED", handleAuctionEnded);
    socket.on("NO_MORE_ITEMS", handleNoMoreItems);
    socket.on("CONTROL_ERROR", handleControlError);
    socket.on("ITEM_STATUS_UPDATED", handleItemStatusUpdated);
    socket.on("ITEM_SOLD", handleItemSold);

    return () => {
      socket.off("NEW_BID", handleNewBid);
      socket.off("BID_ERROR", handleBidError);
      socket.off("AUCTION_STARTED", handleAuctionStarted);
      socket.off("ITEM_TRANSITION", handleItemTransition);
      socket.off("AUCTION_ENDED", handleAuctionEnded);
      socket.off("NO_MORE_ITEMS", handleNoMoreItems);
      socket.off("CONTROL_ERROR", handleControlError);
      socket.off("ITEM_STATUS_UPDATED", handleItemStatusUpdated);
      socket.off("ITEM_SOLD", handleItemSold);
    };
  }, [auctionId, isHost, socket]);

  const onBidInputChange = (itemId, rawValue) => {
    setBidInputs((previousInputs) => ({
      ...previousInputs,
      [itemId]: rawValue,
    }));
  };

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

          // Backend enforces one live item by downgrading others to pending.
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

  const handleJoin = async () => {
    if (!auctionId || isJoining || isJoined) {
      return;
    }

    if (!canJoinLiveAuction) {
      if (normalizedAuctionStatus === "scheduled") {
        toast("This auction is scheduled. Join opens when it goes live.", {
          duration: 2600,
        });
      } else {
        toast.error(`Cannot join while auction is ${normalizedAuctionStatus}.`);
      }
      return;
    }

    if (!socket || !isSocketConnected) {
      toast.error("Socket is not connected yet. Please try again.");
      return;
    }

    setIsJoining(true);

    try {
      await axiosInstance.post(`/participants/auction/${auctionId}/join`, {
        role: "participant",
      });
      socket.emit("JOIN_AUCTION", auctionId);
      setIsJoined(true);
      toast.success("You have entered the live room");
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Unable to join the live room right now.";

      if (/already joined/i.test(message)) {
        socket.emit("JOIN_AUCTION", auctionId);
        setIsJoined(true);
        toast.success("You are already in this live room.");
        return;
      }

      toast.error(message);
    } finally {
      setIsJoining(false);
    }
  };

  const handleBid = (item) => {
    const itemId = item?._id;
    const itemStatus = (item?.status || "pending").toLowerCase();

    if (isHost) {
      toast.error("Hosts cannot place bids in their own auction.");
      return;
    }

    if (!socket || !isSocketConnected) {
      toast.error("Connect to the live room before placing a bid.");
      return;
    }

    if (!isJoined) {
      toast.error("Join the live room before placing bids.");
      return;
    }

    if (itemStatus !== "live") {
      toast.error("This item is not live for bidding yet.");
      return;
    }

    if (!itemId || !auctionId) {
      toast.error("Unable to place this bid right now.");
      return;
    }

    const bidAmount = Number(bidInputs[itemId]);
    const minimumSuggestedBid =
      Number(item?.currentHighestBid || 0) + Number(item?.bidIncrement || 0);

    if (Number.isNaN(bidAmount) || bidAmount <= 0) {
      toast.error("Enter a valid bid amount.");
      return;
    }

    if (bidAmount < minimumSuggestedBid) {
      toast.error(`Minimum bid is ${formatCurrency(minimumSuggestedBid)}.`);
      return;
    }

    setIsPlacingBidByItem((previousState) => ({
      ...previousState,
      [itemId]: true,
    }));

    socket.emit(
      "PLACE_BID",
      { auctionId, itemId: item._id, bidAmount: Number(bidAmount) },
      (acknowledgement) => {
        setIsPlacingBidByItem((previousState) => ({
          ...previousState,
          [itemId]: false,
        }));

        if (acknowledgement?.success) {
          setBidInputs((previousInputs) => ({
            ...previousInputs,
            [itemId]: "",
          }));
        }
      },
    );
  };

  const handleStartAuction = () => {
    if (!socket || !isSocketConnected || !auctionId) {
      toast.error("Socket is not connected yet. Please try again.");
      return;
    }

    setIsStartingAuction(true);
    socket.emit("START_AUCTION", auctionId, (acknowledgement) => {
      setIsStartingAuction(false);

      if (acknowledgement?.success) {
        toast.success("Start command sent to live room.");
      }
    });
  };

  const handleNextItem = () => {
    if (!socket || !isSocketConnected || !auctionId) {
      toast.error("Socket is not connected yet. Please try again.");
      return;
    }

    if (!activeLiveItem?._id) {
      toast.error("No active live item is available to transition.");
      return;
    }

    setIsAdvancingItem(true);
    socket.emit(
      "NEXT_ITEM",
      { auctionId, currentItemId: activeLiveItem._id },
      (acknowledgement) => {
        setIsAdvancingItem(false);

        if (acknowledgement?.success) {
          toast.success("Next item command sent.");
        }
      },
    );
  };

  const handleEndAuction = () => {
    if (!socket || !isSocketConnected || !auctionId) {
      toast.error("Socket is not connected yet. Please try again.");
      return;
    }

    setIsEndingAuction(true);
    socket.emit("END_AUCTION", auctionId, (acknowledgement) => {
      setIsEndingAuction(false);

      if (acknowledgement?.success) {
        toast.success("End auction command sent.");
      }
    });
  };

  const mappedItems = useMemo(() => mapItemsToCards(items), [items]);

  return (
    <main className="pt-23 min-h-screen bg-white">
      <section className="px-6 lg:px-10 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4">
            <Link
              to="/"
              className="text-[12px] font-sans text-brand-muted hover:text-brand-charcoal underline underline-offset-2 transition-colors duration-150"
            >
              Back to Live Auctions
            </Link>
          </div>

          {isLoadingAuction ? (
            <RoomHeaderSkeleton />
          ) : (
            <div className="rounded-[28px] border border-brand-border overflow-hidden bg-white">
              <div className="relative h-52 sm:h-64">
                <img
                  src={
                    auction?.coverImage ||
                    auction?.image ||
                    FALLBACK_AUCTION_IMAGE
                  }
                  alt={auction?.title || "Auction room"}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/45 via-black/20 to-transparent" />
                <div className="absolute top-4 right-4 rounded-full bg-white/90 border border-brand-border px-3 py-1 text-xs text-brand-charcoal">
                  {statusLabel}
                </div>
              </div>

              <div className="p-6 lg:p-8">
                <h1 className="font-display text-3xl sm:text-4xl text-brand-charcoal leading-tight mb-3">
                  {auction?.title || "Auction Room"}
                </h1>
                <p className="text-sm sm:text-base text-brand-muted max-w-3xl">
                  {auction?.description || "Welcome to this live auction room."}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-brand-muted">
                  <span>Starts: {formatRoomTime(auction?.startTime)}</span>
                  <span>Ends: {formatRoomTime(auction?.endTime)}</span>
                </div>
              </div>
            </div>
          )}

          {!isLoadingAuction && !isHost && (
            <div className="mt-5 rounded-2xl border border-brand-border bg-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-display text-lg sm:text-xl text-brand-charcoal leading-tight">
                  Join Live Auction to Place Bids
                </p>
                <p className="text-xs sm:text-sm text-brand-muted mt-1">
                  {canJoinLiveAuction
                    ? "Enter the room to activate real-time bidding and live updates."
                    : normalizedAuctionStatus === "scheduled"
                      ? `This auction starts ${formatRoomTime(auction?.startTime)}.`
                      : `This auction is currently ${normalizedAuctionStatus}. Live join is unavailable.`}
                </p>
              </div>

              {!isJoined && canJoinLiveAuction ? (
                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={isJoining || !isSocketConnected}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-charcoal text-white border border-brand-charcoal px-5 py-2.5 text-sm font-sans font-medium hover:bg-brand-dark transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isJoining ? "Joining..." : "Join Live Auction"}
                </button>
              ) : isJoined ? (
                <button
                  type="button"
                  onClick={() => navigate(`/auction/${auctionId}/live-room`)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-green-600 text-white border border-green-600 px-5 py-2.5 text-sm font-sans font-medium hover:bg-green-700 transition-all duration-200"
                >
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-200 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                  </span>
                  Live Room
                </button>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-light/50 px-4 py-2 text-sm font-sans text-brand-muted">
                  {normalizedAuctionStatus === "scheduled"
                    ? `Starts ${formatRoomTime(auction?.startTime)}`
                    : "Live room unavailable"}
                </div>
              )}
            </div>
          )}

          {!isLoadingAuction && isHost && (
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
                    onClick={() => navigate(`/auction/${auctionId}/host-view`)}
                    className="inline-flex items-center justify-center rounded-full bg-white text-brand-charcoal border border-brand-charcoal px-4 py-2 text-xs sm:text-sm font-sans font-medium hover:bg-brand-light transition-all duration-200"
                  >
                    Open View Panel
                  </button>

                  <button
                    type="button"
                    onClick={handleStartAuction}
                    disabled={
                      isStartingAuction || normalizedAuctionStatus === "ended"
                    }
                    className="inline-flex items-center justify-center rounded-full bg-brand-charcoal text-white border border-brand-charcoal px-4 py-2 text-xs sm:text-sm font-sans font-medium hover:bg-brand-dark transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isStartingAuction ? "Starting..." : "Start Auction"}
                  </button>

                  <button
                    type="button"
                    onClick={handleNextItem}
                    disabled={
                      isAdvancingItem || normalizedAuctionStatus !== "live"
                    }
                    className="inline-flex items-center justify-center rounded-full bg-white text-brand-charcoal border border-brand-charcoal px-4 py-2 text-xs sm:text-sm font-sans font-medium hover:bg-brand-light transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAdvancingItem ? "Switching..." : "Next Item"}
                  </button>

                  <button
                    type="button"
                    onClick={handleEndAuction}
                    disabled={
                      isEndingAuction || normalizedAuctionStatus === "ended"
                    }
                    className="inline-flex items-center justify-center rounded-full bg-[#7f1d1d] text-[#fee2e2] border border-[#b91c1c] px-4 py-2 text-xs sm:text-sm font-sans font-medium hover:bg-[#991b1b] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isEndingAuction ? "Ending..." : "End Auction"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <section className="pt-10">
            <div className="flex items-center justify-between gap-3 mb-5">
              <SectionHeader
                title="Auction Items"
                linkLabel={`${mappedItems.length} listed`}
                href="#"
                className="mb-0 flex-1"
              />
              <button
                type="button"
                onClick={() => refreshItemsOnly({ showToast: true })}
                disabled={isRefreshingItems}
                className="inline-flex items-center justify-center rounded-full bg-white text-brand-charcoal border border-brand-border px-3 py-1.5 text-[11px] sm:text-xs font-sans font-medium hover:bg-brand-light transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isRefreshingItems ? "Refreshing..." : "Refresh Items"}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
              {isLoadingItems &&
                Array.from({ length: 6 }).map((_, index) => (
                  <ItemSkeleton keyId={`item-skeleton-${index}`} />
                ))}

              {!isLoadingItems &&
                mappedItems.length > 0 &&
                mappedItems.map((item, index) => {
                  const sourceItem = items[index] || {};
                  const sourceItemId =
                    sourceItem?._id || sourceItem?.id || item.id;
                  const minimumSuggestedBid =
                    Number(sourceItem?.currentHighestBid || 0) +
                    Number(sourceItem?.bidIncrement || 0);
                  const currentHighestBid = Number(
                    sourceItem?.currentHighestBid || 0,
                  );
                  const highestBidder = sourceItem?.currentHighestBidder;
                  const highestBidderName =
                    typeof highestBidder === "string"
                      ? highestBidder
                      : highestBidder?.name || "No bids yet";
                  const bidCount = Number(sourceItem?.bidCount || 0);
                  const itemStatus = (
                    sourceItem?.status || "pending"
                  ).toLowerCase();
                  const isLiveItem = itemStatus === "live";
                  const isBidControlsDisabled =
                    isHost ||
                    !isJoined ||
                    !isLiveItem ||
                    Boolean(isPlacingBidByItem[sourceItemId]);
                  const selectedStatus =
                    statusInputsByItem[sourceItemId] || itemStatus;
                  const isStatusUpdateDisabled = Boolean(
                    isUpdatingStatusByItem[sourceItemId],
                  );

                  return (
                    <div key={item.id} className="flex flex-col gap-3">
                      <div
                        className={[
                          "rounded-2xl",
                          isLiveItem
                            ? "ring-2 ring-green-300 shadow-[0_0_0_1px_rgba(134,239,172,0.65)]"
                            : "",
                        ].join(" ")}
                      >
                        <ItemCard artwork={item} variant="featured" />
                      </div>

                      {isLiveItem && (
                        <div className="-mt-1 inline-flex w-fit items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-[11px] sm:text-xs font-sans font-medium text-green-700">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                          </span>
                          Live Item
                        </div>
                      )}

                      {(!item.sold || isHost) && (
                        <div className="rounded-xl border border-brand-border bg-white p-3 sm:p-4">
                          <div className="space-y-1 mb-3">
                            <p className="text-[11px] sm:text-xs font-sans text-brand-muted truncate">
                              Current Highest Bid:{" "}
                              {formatCurrency(currentHighestBid)}
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
                              Minimum Next Bid:{" "}
                              {formatCurrency(minimumSuggestedBid)}
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
                              disabled={!isJoined || !isLiveItem}
                              value={bidInputs[sourceItemId] ?? ""}
                              onChange={(event) =>
                                onBidInputChange(
                                  sourceItemId,
                                  event.target.value,
                                )
                              }
                              placeholder={`${minimumSuggestedBid}`}
                              className="flex-1 min-w-0 rounded-full border border-brand-border bg-white px-4 py-2 text-sm text-brand-charcoal placeholder:text-brand-muted/80 outline-none focus:border-brand-charcoal"
                            />
                            <button
                              type="button"
                              onClick={() => handleBid(sourceItem)}
                              disabled={isBidControlsDisabled}
                              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-charcoal text-white border border-brand-charcoal px-4 py-2 text-xs sm:text-sm font-sans font-medium hover:bg-brand-dark transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isPlacingBidByItem[sourceItemId]
                                ? "Placing..."
                                : "Place Bid"}
                            </button>
                          </div>

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
                              <p className="text-[11px] sm:text-xs font-sans text-brand-muted mb-2">
                                Host Item Status Control
                              </p>
                              <div className="flex items-center gap-2">
                                <select
                                  value={selectedStatus}
                                  onChange={(event) =>
                                    onStatusInputChange(
                                      sourceItemId,
                                      event.target.value,
                                    )
                                  }
                                  className="flex-1 min-w-0 rounded-full border border-brand-border bg-white px-4 py-2 text-sm text-brand-charcoal outline-none focus:border-brand-charcoal"
                                >
                                  {ITEM_STATUS_OPTIONS.map((statusOption) => (
                                    <option
                                      key={statusOption}
                                      value={statusOption}
                                    >
                                      {statusOption.charAt(0).toUpperCase()}
                                      {statusOption.slice(1)}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateItemStatus(sourceItem)
                                  }
                                  disabled={isStatusUpdateDisabled}
                                  className="inline-flex items-center justify-center rounded-full bg-white text-brand-charcoal border border-brand-charcoal px-4 py-2 text-xs sm:text-sm font-sans font-medium hover:bg-brand-light transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isStatusUpdateDisabled
                                    ? "Saving..."
                                    : "Update"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

              {!isLoadingItems && mappedItems.length === 0 && (
                <div className="col-span-full rounded-2xl border border-brand-border bg-brand-light/40 p-6 text-sm text-brand-muted">
                  No items are listed for this auction yet.
                </div>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
