import { processBid } from "../services/bid.service.js";
import {
  startAuctionService,
  nextItemService,
  endAuctionService,
} from "../services/auctionControl.service.js";

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
  io.on("connection", (socket) => {
    console.log(`🟢 User connected: ${socket.user.name} (${socket.id})`);

    const userRoom = `user_${socket.user._id}`;
    socket.join(userRoom);

    // --- EVENT: JOIN AUCTION ROOM ---
    socket.on("JOIN_AUCTION", (auctionId) => {
      const room = `auction_${auctionId}`;
      socket.join(room);
      console.log(`✅ ${socket.user.name} joined room: ${room}`);

      socket.to(room).emit("AUCTION_JOINED", {
        message: `${socket.user.name} has joined the auction.`,
        user: { id: socket.user._id, name: socket.user.name },
      });
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
        const { newBid, updatedItem } = await processBid({
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

        // Send a direct bidder-specific event to keep My Bids history in sync
        socket.emit("MY_BID_UPDATE", {
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
        socket.emit("BID_ERROR", { message: error.message });

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

        io.to(room).emit("AUCTION_STARTED", {
          message: "The auction has officially started!",
          activeItem,
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

        if (activeItem) {
          io.to(room).emit("ITEM_TRANSITION", {
            message: `Moving to next item: ${activeItem.title}`,
            previousItem,
            activeItem,
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
