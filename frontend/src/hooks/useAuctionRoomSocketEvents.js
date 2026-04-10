import { useEffect } from "react";
import toast from "react-hot-toast";
import { formatCurrency, normalizeEntityId } from "../utils/auctionRoom.utils";

export default function useAuctionRoomSocketEvents({
  socket,
  auctionId,
  currentUserId,
  isHost,
  setItems,
  setAuction,
  setStatusInputsByItem,
  setSoldFlashByItem,
  setIsJoined,
  setIsFinalCallExtended,
}) {
  useEffect(() => {
    if (!socket || !auctionId) {
      return;
    }

    let extensionTimeoutId;

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

        setSoldFlashByItem((previousState) => ({
          ...previousState,
          [soldItemId]: true,
        }));

        window.setTimeout(() => {
          setSoldFlashByItem((previousState) => ({
            ...previousState,
            [soldItemId]: false,
          }));
        }, 2500);
      }

      toast.success(
        payload?.message ||
          `${payload?.itemTitle || "Item"} sold to ${payload?.winnerName || "winner"} for ${formatCurrency(payload?.winningAmount || 0)}.`,
        { duration: 2600 },
      );
    };

    const handleMyBidWon = (payload) => {
      toast.success(
        payload?.message || `You won ${payload?.bid?.itemTitle || "an item"}!`,
        { duration: 4000 },
      );
    };

    const handleSubmissionApproved = (payload) => {
      if (isHost) {
        return;
      }

      if (String(payload?.auctionId || "") !== String(auctionId)) {
        return;
      }

      const submittedBy = normalizeEntityId(payload?.submittedBy);
      if (!submittedBy || String(submittedBy) !== String(currentUserId)) {
        return;
      }

      toast.success(
        "Your submitted item was approved and added to the auction!",
      );
    };

    const handleSubmissionRejected = (payload) => {
      if (isHost) {
        return;
      }

      if (String(payload?.auctionId || "") !== String(auctionId)) {
        return;
      }

      const submittedBy = normalizeEntityId(payload?.submittedBy);
      if (!submittedBy || String(submittedBy) !== String(currentUserId)) {
        return;
      }

      toast("Your submitted item was not approved this time.", {
        icon: "⚠️",
      });
    };

    const handleFinalCallStarted = (payload) => {
      if (
        payload?.auctionId &&
        String(payload.auctionId) !== String(auctionId)
      ) {
        return;
      }

      setIsFinalCallExtended(false);
    };

    const handleFinalCallExtended = (payload) => {
      if (
        payload?.auctionId &&
        String(payload.auctionId) !== String(auctionId)
      ) {
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

      if (syncActiveItemId) {
        setItems((previousItems) => {
          let didMatchActiveItem = false;

          const nextItems = previousItems.map((item) => {
            const currentId = item?._id || item?.id;

            if (String(currentId) === String(syncActiveItemId)) {
              didMatchActiveItem = true;
              return {
                ...item,
                ...syncActiveItem,
                status: "live",
              };
            }

            if ((item?.status || "").toLowerCase() === "live") {
              return {
                ...item,
                status: "pending",
              };
            }

            return item;
          });

          if (!didMatchActiveItem) {
            return [{ ...syncActiveItem, status: "live" }, ...nextItems];
          }

          return nextItems;
        });

        setStatusInputsByItem((previousState) => {
          const nextState = { ...previousState };

          Object.keys(nextState).forEach((key) => {
            if (
              (nextState[key] || "").toLowerCase() === "live" &&
              String(key) !== String(syncActiveItemId)
            ) {
              nextState[key] = "pending";
            }
          });

          nextState[syncActiveItemId] = "live";
          return nextState;
        });
      }

      if (payload?.isFinalCall && payload?.finalCallEndTime) {
        setIsFinalCallExtended(false);
        toast("Reconnected - final call in progress.", {
          duration: 1800,
        });
      }
    };

    socket.on("MY_BID_WON", handleMyBidWon);

    socket.on("NEW_BID", handleNewBid);
    socket.on("BID_ERROR", handleBidError);
    socket.on("AUCTION_STARTED", handleAuctionStarted);
    socket.on("ITEM_TRANSITION", handleItemTransition);
    socket.on("AUCTION_ENDED", handleAuctionEnded);
    socket.on("NO_MORE_ITEMS", handleNoMoreItems);
    socket.on("CONTROL_ERROR", handleControlError);
    socket.on("ITEM_STATUS_UPDATED", handleItemStatusUpdated);
    socket.on("ITEM_SOLD", handleItemSold);
    socket.on("SUBMISSION_APPROVED", handleSubmissionApproved);
    socket.on("SUBMISSION_REJECTED", handleSubmissionRejected);
    socket.on("FINAL_CALL_STARTED", handleFinalCallStarted);
    socket.on("FINAL_CALL_EXTENDED", handleFinalCallExtended);
    socket.on("AUCTION_RECONNECT_SYNC", handleReconnectSync);

    return () => {
      if (extensionTimeoutId) {
        window.clearTimeout(extensionTimeoutId);
      }

      socket.off("NEW_BID", handleNewBid);
      socket.off("BID_ERROR", handleBidError);
      socket.off("AUCTION_STARTED", handleAuctionStarted);
      socket.off("ITEM_TRANSITION", handleItemTransition);
      socket.off("AUCTION_ENDED", handleAuctionEnded);
      socket.off("NO_MORE_ITEMS", handleNoMoreItems);
      socket.off("CONTROL_ERROR", handleControlError);
      socket.off("ITEM_STATUS_UPDATED", handleItemStatusUpdated);
      socket.off("ITEM_SOLD", handleItemSold);
      socket.off("MY_BID_WON", handleMyBidWon);
      socket.off("SUBMISSION_APPROVED", handleSubmissionApproved);
      socket.off("SUBMISSION_REJECTED", handleSubmissionRejected);
      socket.off("FINAL_CALL_STARTED", handleFinalCallStarted);
      socket.off("FINAL_CALL_EXTENDED", handleFinalCallExtended);
      socket.off("AUCTION_RECONNECT_SYNC", handleReconnectSync);
    };
  }, [
    auctionId,
    currentUserId,
    isHost,
    setAuction,
    setIsFinalCallExtended,
    setIsJoined,
    setItems,
    setSoldFlashByItem,
    setStatusInputsByItem,
    socket,
  ]);
}
