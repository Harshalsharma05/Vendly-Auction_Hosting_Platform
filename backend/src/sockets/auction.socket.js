import { processBid } from "../services/bid.service.js";
import {
  startAuctionService,
  nextItemService,
  endAuctionService,
} from "../services/auctionControl.service.js";
import Auction from "../models/auction.model.js";
import AuctionItem from "../models/auctionItem.model.js";

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

export const setupAuctionSockets = (io) => {
  const finalCallTimers = new Map();
  const itemEndWatchers = new Map();

  const emitToAuctionRoom = (auctionId, eventName, payload) => {
    io.to(`auction_${auctionId}`).emit(eventName, payload);
  };

  const emitToUserRoom = (userId, eventName, payload) => {
    io.to(`user_${userId}`).emit(eventName, payload);
  };

  const emitToSocket = (socket, eventName, payload) => {
    socket.emit(eventName, payload);
  };

  const clearFinalCallTimer = (itemId) => {
    if (!itemId) {
      return;
    }

    const key = String(itemId);
    const existingEntry = finalCallTimers.get(key);
    if (existingEntry?.timer) {
      clearTimeout(existingEntry.timer);
      finalCallTimers.delete(key);
    }
  };

  const clearFinalCallTimersForAuction = (auctionId) => {
    const normalizedAuctionId = String(auctionId);

    for (const [itemId, entry] of finalCallTimers.entries()) {
      if (String(entry?.auctionId) !== normalizedAuctionId) {
        continue;
      }

      clearTimeout(entry.timer);
      finalCallTimers.delete(itemId);
    }
  };

  const clearItemEndWatcher = (itemId) => {
    if (!itemId) {
      return;
    }

    const key = String(itemId);
    const watcherEntry = itemEndWatchers.get(key);
    if (watcherEntry?.intervalId) {
      clearInterval(watcherEntry.intervalId);
      itemEndWatchers.delete(key);
    }
  };

  const clearItemEndWatchersForAuction = (auctionId) => {
    const normalizedAuctionId = String(auctionId);

    for (const [itemId, entry] of itemEndWatchers.entries()) {
      if (String(entry?.auctionId) !== normalizedAuctionId) {
        continue;
      }

      clearInterval(entry.intervalId);
      itemEndWatchers.delete(itemId);
    }
  };

  const resolveIntendedItemEndTime = (item) => {
    const candidateRaw = item?.itemEndTime;

    const candidateDate = candidateRaw ? new Date(candidateRaw) : null;
    if (!candidateDate || Number.isNaN(candidateDate.getTime())) {
      return null;
    }

    return candidateDate;
  };

  const triggerFinalCall = async ({ auctionId, itemId, intendedEndTime }) => {
    const now = new Date();

    const updatedItem = await AuctionItem.findOneAndUpdate(
      {
        _id: itemId,
        auctionId,
        status: "live",
      },
      {
        isFinalCall: true,
        finalCallStartTime: now,
        finalCallEndTime: intendedEndTime,
      },
      { new: true },
    );

    if (!updatedItem) {
      return;
    }

    emitToAuctionRoom(auctionId, "FINAL_CALL_STARTED", {
      itemId: updatedItem._id,
      finalCallEndTime: updatedItem.finalCallEndTime,
      serverTime: now,
    });
  };

  const scheduleFinalCallForLiveItem = async ({ auctionId, item }) => {
    if (!item?._id) {
      return item;
    }

    const auction =
      await Auction.findById(auctionId).select("finalCallDuration");
    if (!auction) {
      return item;
    }

    const intendedEndTime = resolveIntendedItemEndTime(item);
    if (!intendedEndTime) {
      return item;
    }

    const itemId = String(item._id);
    clearFinalCallTimer(itemId);

    const refreshedItem = await AuctionItem.findOneAndUpdate(
      { _id: itemId, auctionId },
      {
        isFinalCall: false,
        finalCallStartTime: null,
        finalCallEndTime: intendedEndTime,
      },
      { new: true },
    );

    const finalCallDurationMs = Number(auction.finalCallDuration || 30) * 1000;
    const finalCallStartTime = new Date(
      intendedEndTime.getTime() - finalCallDurationMs,
    );
    const delay = finalCallStartTime.getTime() - Date.now();

    if (delay <= 0) {
      await triggerFinalCall({ auctionId, itemId, intendedEndTime });
      return refreshedItem || item;
    }

    const timer = setTimeout(async () => {
      clearFinalCallTimer(itemId);

      try {
        await triggerFinalCall({ auctionId, itemId, intendedEndTime });
      } catch (error) {
        console.error("❌ Failed to trigger final call:", error.message);
      }
    }, delay);

    finalCallTimers.set(itemId, { timer, auctionId: String(auctionId) });
    return refreshedItem || item;
  };

  const finalizeItemAndTransition = async ({ auctionId, itemId, now }) => {
    const liveItem = await AuctionItem.findById(itemId).populate(
      "currentHighestBidder",
      "name",
    );

    if (!liveItem || liveItem.status !== "live") {
      return;
    }

    if (!liveItem.isFinalCall || !liveItem.finalCallEndTime) {
      return;
    }

    const finalCallEndTime = new Date(liveItem.finalCallEndTime);
    if (Number.isNaN(finalCallEndTime.getTime()) || now < finalCallEndTime) {
      return;
    }

    const nextStatus = liveItem.currentHighestBidder ? "sold" : "unsold";
    const finalizedItem = await AuctionItem.findOneAndUpdate(
      {
        _id: itemId,
        auctionId,
        status: "live",
        isFinalCall: true,
        finalCallEndTime: { $lte: now },
      },
      {
        status: nextStatus,
      },
      { new: true },
    ).populate("currentHighestBidder", "name");

    if (!finalizedItem) {
      return;
    }

    clearFinalCallTimer(itemId);
    clearItemEndWatcher(itemId);

    const room = `auction_${auctionId}`;
    const winner = finalizedItem.currentHighestBidder;
    const winningBid = finalizedItem.currentHighestBid || 0;

    io.to(room).emit("ITEM_SOLD", {
      itemId: finalizedItem._id,
      itemTitle: finalizedItem.title,
      winner,
      winnerName: winner?.name || null,
      winningBid,
      winningAmount: winningBid,
      soldAt: now,
      status: finalizedItem.status,
      message:
        finalizedItem.status === "sold"
          ? `${finalizedItem.title || "Item"} sold to ${winner?.name || "winner"} for ${formatCurrency(winningBid)}.`
          : `${finalizedItem.title || "Item"} closed with no valid bids.`,
    });

    if (winner?._id) {
      emitToUserRoom(winner._id, "MY_BID_WON", {
        itemId: finalizedItem._id,
        winningBid,
      });
    }

    const auction =
      await Auction.findById(auctionId).select("createdBy status");
    if (!auction || auction.status !== "live") {
      return;
    }

    const { previousItem, activeItem } = await nextItemService(
      auctionId,
      finalizedItem._id,
      auction.createdBy,
    );

    if (activeItem) {
      const activeItemWithTimer = await scheduleFinalCallForLiveItem({
        auctionId,
        item: activeItem,
      });
      startItemEndWatcher({
        auctionId,
        itemId: activeItemWithTimer?._id || activeItem._id,
      });

      io.to(room).emit("ITEM_TRANSITION", {
        message: `Moving to next item: ${activeItemWithTimer?.title || activeItem.title}`,
        previousItem,
        activeItem: activeItemWithTimer,
      });
      return;
    }

    await endAuctionService(auctionId, auction.createdBy);
    clearFinalCallTimersForAuction(auctionId);
    clearItemEndWatchersForAuction(auctionId);

    io.to(room).emit("AUCTION_ENDED", {
      message: "The auction has ended. Thank you for participating!",
    });

    io.in(room).socketsLeave(room);
  };

  const startItemEndWatcher = ({ auctionId, itemId }) => {
    if (!itemId) {
      return;
    }

    clearItemEndWatcher(itemId);

    const normalizedItemId = String(itemId);
    const normalizedAuctionId = String(auctionId);

    const watcherEntry = {
      auctionId: normalizedAuctionId,
      intervalId: null,
      inFlight: false,
    };

    watcherEntry.intervalId = setInterval(async () => {
      if (watcherEntry.inFlight) {
        return;
      }

      watcherEntry.inFlight = true;
      try {
        await finalizeItemAndTransition({
          auctionId: normalizedAuctionId,
          itemId: normalizedItemId,
          now: new Date(),
        });
      } catch (error) {
        console.error("❌ Failed to auto-end auction item:", error.message);
      } finally {
        watcherEntry.inFlight = false;
      }
    }, 750);

    itemEndWatchers.set(normalizedItemId, watcherEntry);
  };

  const buildReconnectionSyncPayload = async (auctionId) => {
    const liveItem = await AuctionItem.findOne({
      auctionId,
      status: "live",
    })
      .populate("currentHighestBidder", "name")
      .sort("order");

    const serverTime = new Date();
    if (!liveItem) {
      return {
        auctionId,
        serverTime,
        activeItem: null,
        remainingTimeMs: null,
        isFinalCall: false,
        finalCallEndTime: null,
      };
    }

    const effectiveEndTime = liveItem.isFinalCall
      ? liveItem.finalCallEndTime
      : liveItem.itemEndTime;
    const endTime = effectiveEndTime ? new Date(effectiveEndTime) : null;
    const remainingTimeMs = endTime
      ? Math.max(0, endTime.getTime() - serverTime.getTime())
      : null;

    return {
      auctionId,
      serverTime,
      activeItem: liveItem,
      remainingTimeMs,
      isFinalCall: Boolean(liveItem.isFinalCall),
      finalCallEndTime: liveItem.finalCallEndTime || null,
    };
  };

  io.on("connection", (socket) => {
    console.log(`🟢 User connected: ${socket.user.name} (${socket.id})`);

    const userRoom = `user_${socket.user._id}`;
    socket.join(userRoom);

    // --- EVENT: JOIN AUCTION ROOM ---
    socket.on("JOIN_AUCTION", async (auctionId) => {
      const room = `auction_${auctionId}`;
      socket.join(room);
      console.log(`✅ ${socket.user.name} joined room: ${room}`);

      socket.to(room).emit("AUCTION_JOINED", {
        message: `${socket.user.name} has joined the auction.`,
        user: { id: socket.user._id, name: socket.user.name },
      });

      try {
        const syncPayload = await buildReconnectionSyncPayload(auctionId);
        emitToSocket(socket, "AUCTION_RECONNECT_SYNC", syncPayload);
      } catch (error) {
        console.error("❌ Failed to send reconnect sync:", error.message);
      }
    });

    socket.on("JOIN_USER_ROOM", ({ userId }) => {
      // Verify the userId matches the authenticated socket user
      // so no one can join another user's room
      if (!userId || socket.user._id.toString() !== userId.toString()) {
        return;
      }

      const room = `user_${userId}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined personal room: ${room}`);
    });

    // --- EVENT: PLACE BID ---
    socket.on("PLACE_BID", async (data, callback) => {
      try {
        const { auctionId, itemId, bidAmount } = data;
        const bidderId = socket.user._id;

        console.log(
          `💰 Processing bid of ${bidAmount} from ${socket.user.name}...`,
        );

        // 1. Process the bid through our secure service
        const { newBid, updatedItem, finalCallExtension } = await processBid({
          auctionId,
          itemId,
          bidderId,
          bidAmount,
        });

        const room = `auction_${auctionId}`;
        const bidPayload = {
          _id: newBid?._id,
          auctionId,
          itemId,
          itemTitle: updatedItem?.title || "Auction Item",
          bidderId: {
            _id: bidderId,
            name: socket.user.name,
          },
          bidAmount: newBid?.bidAmount,
          bidTime: newBid?.bidTime,
          bidStatus: newBid?.bidStatus,
        };

        // 2. Broadcast the successful bid to EVERYONE in the room
        io.to(room).emit("NEW_BID", {
          message: `${socket.user.name} placed a bid of ${formatCurrency(bidAmount)} on ${updatedItem?.title || "Auction Item"}.`,
          auctionId,
          itemId,
          currentHighestBid: updatedItem.currentHighestBid,
          currentHighestBidder: updatedItem.currentHighestBidder.name,
          bidCount: updatedItem.bidCount,
          bid: bidPayload,
        });

        if (finalCallExtension) {
          emitToAuctionRoom(auctionId, "FINAL_CALL_EXTENDED", {
            itemId: finalCallExtension.itemId,
            finalCallEndTime: finalCallExtension.newEndTime,
            serverTime: finalCallExtension.serverTime,
            newEndTime: finalCallExtension.newEndTime,
          });
        }

        // Send a direct bidder-specific event to keep My Bids history in sync
        emitToSocket(socket, "MY_BID_UPDATE", {
          message: "Your bid has been recorded.",
          bid: bidPayload,
        });

        // 3. Optional: Acknowledge success to the user who placed the bid
        if (typeof callback === "function") {
          callback({ success: true, message: "Bid placed successfully!" });
        }
      } catch (error) {
        console.error(`❌ Bid failed: ${error.message}`);
        // Send error back ONLY to the user who tried to bid
        const isCooldownError = String(error.message || "")
          .toLowerCase()
          .includes("cooldown active");

        if (isCooldownError) {
          emitToSocket(socket, "BID_COOLDOWN_ACTIVE", {
            message: error.message,
          });
        }

        emitToSocket(socket, "BID_ERROR", { message: error.message });

        if (typeof callback === "function") {
          callback({ success: false, message: error.message });
        }
      }
    });

    // --- EVENT: LEAVE AUCTION ROOM ---
    socket.on("LEAVE_AUCTION", (auctionId) => {
      const room = `auction_${auctionId}`;
      socket.leave(room);
      console.log(`🚪 ${socket.user.name} left room: ${room}`);
    });

    socket.on("START_AUCTION", async (auctionId, callback) => {
      try {
        const { activeItem } = await startAuctionService(
          auctionId,
          socket.user._id,
        );
        const room = `auction_${auctionId}`;
        const activeItemWithTimer = activeItem
          ? await scheduleFinalCallForLiveItem({ auctionId, item: activeItem })
          : activeItem;

        if (activeItemWithTimer?._id) {
          startItemEndWatcher({ auctionId, itemId: activeItemWithTimer._id });
        }

        io.to(room).emit("AUCTION_STARTED", {
          message: "The auction has officially started!",
          activeItem: activeItemWithTimer,
        });

        if (callback) callback({ success: true });
      } catch (error) {
        socket.emit("CONTROL_ERROR", { message: error.message });
      }
    });

    // --- HOST EVENT: NEXT ITEM ---
    socket.on("NEXT_ITEM", async (data, callback) => {
      try {
        const { auctionId, currentItemId } = data;
        const { previousItem, activeItem } = await nextItemService(
          auctionId,
          currentItemId,
          socket.user._id,
        );

        const room = `auction_${auctionId}`;
        clearFinalCallTimer(currentItemId);
        clearItemEndWatcher(currentItemId);
        const activeItemWithTimer = activeItem
          ? await scheduleFinalCallForLiveItem({ auctionId, item: activeItem })
          : activeItem;

        if (activeItemWithTimer?._id) {
          startItemEndWatcher({ auctionId, itemId: activeItemWithTimer._id });
        }

        if (activeItemWithTimer) {
          io.to(room).emit("ITEM_TRANSITION", {
            message: `Moving to next item: ${activeItemWithTimer.title}`,
            previousItem,
            activeItem: activeItemWithTimer,
          });
        } else {
          io.to(room).emit("NO_MORE_ITEMS", {
            message: "All items have been auctioned.",
          });
        }

        if (callback) callback({ success: true });
      } catch (error) {
        socket.emit("CONTROL_ERROR", { message: error.message });
      }
    });

    // --- HOST EVENT: END AUCTION ---
    socket.on("END_AUCTION", async (auctionId, callback) => {
      try {
        await endAuctionService(auctionId, socket.user._id);
        const room = `auction_${auctionId}`;

        clearFinalCallTimersForAuction(auctionId);
        clearItemEndWatchersForAuction(auctionId);

        io.to(room).emit("AUCTION_ENDED", {
          message: "The auction has ended. Thank you for participating!",
        });

        // Disconnect all sockets from the room to clean up
        io.in(room).socketsLeave(room);

        if (callback) callback({ success: true });
      } catch (error) {
        socket.emit("CONTROL_ERROR", { message: error.message });
      }
    });

    socket.on("disconnect", () => {
      console.log(`🔴 User disconnected: ${socket.user.name}`);
    });
  });
};
