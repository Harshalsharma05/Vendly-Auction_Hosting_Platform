import Auction from '../models/auction.model.js';
import AuctionItem from '../models/auctionItem.model.js';
import Bid from '../models/bid.model.js';

export const processBid = async ({ auctionId, itemId, bidderId, bidAmount }) => {
  // 1. Validate Auction is Live
  const auction = await Auction.findById(auctionId);
  if (!auction) throw new Error('Auction not found');
  if (auction.status !== 'live') throw new Error(`Auction is currently ${auction.status}, not live.`);

  // 2. Validate Item exists
  const item = await AuctionItem.findById(itemId);
  if (!item) throw new Error('Item not found');
  if (item.status !== 'live') throw new Error(`Item is currently ${item.status}, not accepting bids.`);

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
      status: 'live',
      currentHighestBid: { $lt: bidAmount }, // The Magic Concurrency Check
    },
    {
      currentHighestBid: bidAmount,
      currentHighestBidder: bidderId,
      $inc: { bidCount: 1 },
    },
    { new: true } // Return the updated document
  ).populate('currentHighestBidder', 'name');

  // If updatedItem is null, someone else placed a higher bid a millisecond before this user!
  if (!updatedItem) {
    throw new Error('You were outbid! The current bid has already increased.');
  }

  // 5. Insert Bid Record
  const newBid = await Bid.create({
    auctionId,
    itemId,
    bidderId,
    bidAmount,
    bidStatus: 'valid',
  });

  return { newBid, updatedItem };
};