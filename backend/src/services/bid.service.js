import Auction from "../models/auction.model.js";
import AuctionItem from "../models/auctionItem.model.js";
import Bid from "../models/bid.model.js";
import {
  canPlaceBid,
  updateBidTime,
  clearCooldown,
} from "../utils/bidCooldown.js";

const maybeExtendFinalCall = async ({ auction, itemId, updatedItem }) => {
  if (!updatedItem?.isFinalCall) {
    return null;
  }

  const now = new Date();
  const extensionMs = Number(auction?.antiSnipingExtension || 10) * 1000;
  const newEndTime = new Date(now.getTime() + extensionMs);

  const currentEndTime = updatedItem.finalCallEndTime
    ? new Date(updatedItem.finalCallEndTime)
    : null;

  if (currentEndTime && newEndTime.getTime() <= currentEndTime.getTime()) {
    return null;
  }

  const extendedItem = await AuctionItem.findOneAndUpdate(
    {
      _id: itemId,
      status: "live",
      isFinalCall: true,
      $or: [
        { finalCallEndTime: null },
        { finalCallEndTime: { $lt: newEndTime } },
      ],
    },
    {
      finalCallEndTime: newEndTime,
    },
    { new: true },
  );

  if (!extendedItem) {
    return null;
  }

  return {
    itemId: extendedItem._id,
    newEndTime: extendedItem.finalCallEndTime,
    serverTime: now,
  };
};

export const processBid = async ({
  auctionId,
  itemId,
  bidderId,
  bidAmount,
}) => {
  // 1. Validate Auction is Live
  const auction = await Auction.findById(auctionId);
  if (!auction) throw new Error("Auction not found");
  if (auction.status !== "live")
    throw new Error(`Auction is currently ${auction.status}, not live.`);

  // Cooldown is the first bid gate before item validation and writes.
  const isCooldownSatisfied = canPlaceBid(
    bidderId,
    auctionId,
    auction.bidCooldown,
  );
  if (!isCooldownSatisfied) {
    throw new Error("Cooldown active. Please wait before placing another bid.");
  }

  // 2. Validate Item exists
  const item = await AuctionItem.findById(itemId);
  if (!item) throw new Error("Item not found");
  if (item.status !== "live")
    throw new Error(`Item is currently ${item.status}, not accepting bids.`);

  const previousHighestBidder = item.currentHighestBidder
    ? String(item.currentHighestBidder)
    : null;

  const now = Date.now();
  const effectiveEndTime = item.isFinalCall
    ? item.finalCallEndTime
    : item.itemEndTime;

  if (effectiveEndTime) {
    const effectiveEndTs = new Date(effectiveEndTime).getTime();

    if (!Number.isNaN(effectiveEndTs) && now >= effectiveEndTs) {
      throw new Error("Bidding window has closed for this item.");
    }
  }

  // 3. Check Minimum Increment Rule
  const minimumRequiredBid = item.currentHighestBid + item.bidIncrement;
  if (bidAmount < minimumRequiredBid) {
    throw new Error(`Bid amount must be at least ${minimumRequiredBid}`);
  }

  // 4. ATOMIC UPDATE (Concurrency Protection 🛡️)
  // We use $lt (less than) to ensure we ONLY update if the database's current highest bid
  // is STILL less than the incoming bidAmount. This prevents race conditions!
  const updatedItem = await AuctionItem.findOneAndUpdate(
    {
      _id: itemId,
      status: "live",
      currentHighestBid: { $lt: bidAmount }, // The Magic Concurrency Check
    },
    {
      currentHighestBid: bidAmount,
      currentHighestBidder: bidderId,
      $inc: { bidCount: 1 },
    },
    { new: true }, // Return the updated document
  ).populate("currentHighestBidder", "name");

  // If updatedItem is null, someone else placed a higher bid a millisecond before this user!
  if (!updatedItem) {
    throw new Error("You were outbid! The current bid has already increased.");
  }

  const currentBidderId = String(bidderId);
  if (previousHighestBidder && previousHighestBidder !== currentBidderId) {
    clearCooldown(previousHighestBidder, auctionId);
  }

  // 5. Insert Bid Record
  const newBid = await Bid.create({
    auctionId,
    itemId,
    bidderId,
    bidAmount,
    bidStatus: "valid",
  });

  updateBidTime(bidderId, auctionId);

  const finalCallExtension = await maybeExtendFinalCall({
    auction,
    itemId,
    updatedItem,
  });

  return { newBid, updatedItem, finalCallExtension };
};
