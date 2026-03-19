import Auction from '../models/auction.model.js';
import AuctionItem from '../models/auctionItem.model.js';

// Verify the user is the actual creator of the auction
const verifyHost = async (auctionId, userId) => {
  const auction = await Auction.findById(auctionId);
  if (!auction) throw new Error('Auction not found');
  if (auction.createdBy.toString() !== userId.toString()) {
    throw new Error('Unauthorized: Only the host can control this auction');
  }
  return auction;
};

export const startAuctionService = async (auctionId, hostId) => {
  const auction = await verifyHost(auctionId, hostId);
  
  if (auction.status === 'live') throw new Error('Auction is already live');
  
  // 1. Set auction to live
  auction.status = 'live';
  await auction.save();

  // 2. Find the first item (lowest order) and set it to live
  const firstItem = await AuctionItem.findOne({ auctionId }).sort('order');
  if (firstItem) {
    firstItem.status = 'live';
    await firstItem.save();
  }

  return { auction, activeItem: firstItem };
};

export const nextItemService = async (auctionId, currentItemId, hostId) => {
  await verifyHost(auctionId, hostId);

  // 1. Mark current item as sold (or unsold if no bids)
  const currentItem = await AuctionItem.findById(currentItemId);
  if (!currentItem) throw new Error('Current item not found');
  
  currentItem.status = currentItem.currentHighestBidder ? 'sold' : 'unsold';
  await currentItem.save();

  // 2. Find the NEXT item based on the order
  const nextItem = await AuctionItem.findOne({
    auctionId,
    order: { $gt: currentItem.order },
  }).sort('order');

  // 3. If there is a next item, set it to live
  if (nextItem) {
    nextItem.status = 'live';
    await nextItem.save();
  }

  return { previousItem: currentItem, activeItem: nextItem };
};

export const endAuctionService = async (auctionId, hostId) => {
  const auction = await verifyHost(auctionId, hostId);
  
  auction.status = 'ended';
  await auction.save();

  // Mark any remaining pending/live items as unsold
  await AuctionItem.updateMany(
    { auctionId, status: { $in: ['pending', 'live'] } },
    { status: 'unsold' }
  );

  return auction;
};