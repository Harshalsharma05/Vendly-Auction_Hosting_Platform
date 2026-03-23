import AuctionItem from "../models/auctionItem.model.js";
import Auction from "../models/auction.model.js";
import Bid from "../models/bid.model.js";

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

// @desc    Add an item to an auction
// @route   POST /api/items/auction/:auctionId
// @access  Private/Client
export const addAuctionItem = async (req, res, next) => {
  try {
    const { auctionId } = req.params;

    // 1. Verify auction exists and user owns it
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      res.status(404);
      return next(new Error("Auction not found"));
    }

    if (auction.createdBy.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error("Not authorized to add items to this auction"));
    }

    // 2. Automatically calculate the 'order' if not provided
    let { order } = req.body;
    if (!order) {
      const lastItem = await AuctionItem.findOne({ auctionId }).sort("-order");
      order = lastItem ? lastItem.order + 1 : 1;
    }

    // 3. Create the item
    const item = await AuctionItem.create({
      ...req.body,
      auctionId,
      order,
      currentHighestBid: req.body.startingPrice || 0, // Highest bid starts at starting price
    });

    // 4. Update the auction's totalItems count
    auction.totalItems += 1;
    await auction.save();

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all items for an auction
// @route   GET /api/items/auction/:auctionId
// @access  Public
export const getAuctionItems = async (req, res, next) => {
  try {
    // Fetch items sorted by the 'order' field
    const items = await AuctionItem.find({ auctionId: req.params.auctionId })
      .populate("currentHighestBidder", "name")
      .sort("order");

    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an auction item (including ordering)
// @route   PATCH /api/items/:id
// @access  Private/Client
export const updateAuctionItem = async (req, res, next) => {
  try {
    let item = await AuctionItem.findById(req.params.id).populate("auctionId");

    if (!item) {
      res.status(404);
      return next(new Error("Item not found"));
    }

    // Verify ownership via the populated auction reference
    if (item.auctionId.createdBy.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error("Not authorized to update this item"));
    }

    // Cannot update item details if it's currently live or sold
    if (["live", "sold"].includes(item.status)) {
      res.status(400);
      return next(
        new Error(`Cannot edit an item that is currently ${item.status}`),
      );
    }

    // Update item (excluding auctionId changes to prevent moving items between auctions)
    const { auctionId, ...updateData } = req.body;

    item = await AuctionItem.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

// @desc    Update only the status of an auction item
// @route   PATCH /api/items/:id/status
// @access  Private/Client
export const updateAuctionItemStatus = async (req, res, next) => {
  try {
    const allowedStatuses = ["pending", "live", "sold", "unsold"];
    const requestedStatus = String(req.body?.status || "").toLowerCase();

    if (!allowedStatuses.includes(requestedStatus)) {
      res.status(400);
      return next(
        new Error("Invalid status. Use pending, live, sold, or unsold."),
      );
    }

    const item = await AuctionItem.findById(req.params.id).populate(
      "auctionId",
    );

    if (!item) {
      res.status(404);
      return next(new Error("Item not found"));
    }

    if (item.auctionId.createdBy.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error("Not authorized to update this item status"));
    }

    if (requestedStatus === "live") {
      await AuctionItem.updateMany(
        {
          auctionId: item.auctionId._id,
          _id: { $ne: item._id },
          status: "live",
        },
        { status: "pending" },
      );
    }

    item.status = requestedStatus;
    await item.save();

    const updatedItem = await AuctionItem.findById(item._id).populate(
      "currentHighestBidder",
      "name",
    );

    const latestItems = await AuctionItem.find({
      auctionId: item.auctionId._id,
    })
      .populate("currentHighestBidder", "name")
      .sort("order");

    const io = req.app.get("io");
    if (io) {
      io.to(`auction_${item.auctionId._id.toString()}`).emit(
        "ITEM_STATUS_UPDATED",
        {
          message: `Item status changed to ${requestedStatus}`,
          auctionId: item.auctionId._id,
          itemId: updatedItem?._id,
          status: requestedStatus,
          items: latestItems,
        },
      );

      if (requestedStatus === "sold") {
        const winnerId =
          typeof updatedItem?.currentHighestBidder === "string"
            ? updatedItem.currentHighestBidder
            : updatedItem?.currentHighestBidder?._id;
        const winnerName =
          typeof updatedItem?.currentHighestBidder === "string"
            ? "Participant"
            : updatedItem?.currentHighestBidder?.name || "Participant";
        const winningAmount = Number(updatedItem?.currentHighestBid || 0);

        let winningBid = null;
        if (winnerId) {
          await Bid.updateMany(
            {
              itemId: updatedItem._id,
              bidStatus: { $ne: "rejected" },
            },
            { bidStatus: "outbid" },
          );

          winningBid = await Bid.findOne({
            itemId: updatedItem._id,
            bidderId: winnerId,
          }).sort({ bidAmount: -1, bidTime: -1 });

          if (winningBid) {
            winningBid.bidStatus = "winning";
            await winningBid.save();
          }
        }

        io.to(`auction_${item.auctionId._id.toString()}`).emit("ITEM_SOLD", {
          message: winnerId
            ? `${updatedItem?.title || "Item"} sold to ${winnerName} for ${formatCurrency(winningAmount)}.`
            : `${updatedItem?.title || "Item"} marked as sold.`,
          auctionId: item.auctionId._id,
          itemId: updatedItem._id,
          itemTitle: updatedItem?.title || "Auction Item",
          winnerId,
          winnerName,
          winningAmount,
        });

        if (winnerId) {
          io.to(`user_${winnerId}`).emit("MY_BID_WON", {
            message: `You won ${updatedItem?.title || "an item"} for ${formatCurrency(winningAmount)}.`,
            bid: {
              _id: winningBid?._id,
              auctionId: item.auctionId._id,
              auctionTitle: item?.auctionId?.title || "Auction Room",
              itemId: updatedItem._id,
              itemTitle: updatedItem?.title || "Auction Item",
              bidderId: {
                _id: winnerId,
                name: winnerName,
              },
              bidAmount: winningAmount,
              bidTime: winningBid?.bidTime || new Date().toISOString(),
              bidStatus: "winning",
            },
          });
        }
      }
    }

    res.status(200).json({ success: true, data: updatedItem });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an auction item
// @route   DELETE /api/items/:id
// @access  Private/Client
export const deleteAuctionItem = async (req, res, next) => {
  try {
    const item = await AuctionItem.findById(req.params.id).populate(
      "auctionId",
    );

    if (!item) {
      res.status(404);
      return next(new Error("Item not found"));
    }

    if (item.auctionId.createdBy.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error("Not authorized to delete this item"));
    }

    if (["live", "sold"].includes(item.status)) {
      res.status(400);
      return next(new Error(`Cannot delete an item that is ${item.status}`));
    }

    await item.deleteOne();

    // Decrease the auction's totalItems count
    const auction = await Auction.findById(item.auctionId._id);
    auction.totalItems = Math.max(0, auction.totalItems - 1);
    await auction.save();

    res
      .status(200)
      .json({ success: true, message: "Item deleted successfully" });
  } catch (error) {
    next(error);
  }
};
