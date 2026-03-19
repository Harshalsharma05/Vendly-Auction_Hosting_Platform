import Bid from '../models/bid.model.js';
import Auction from '../models/auction.model.js';

// @desc    Get all bids for a specific auction (Timeline)
// @route   GET /api/bids/auction/:auctionId
// @access  Public (or Private depending on your business logic)
export const getAuctionBids = async (req, res, next) => {
  try {
    const { auctionId } = req.params;

    const bids = await Bid.find({ auctionId })
      .populate('bidderId', 'name')
      .populate('itemId', 'title')
      .sort({ bidTime: -1 }); // Newest bids first

    res.status(200).json({ success: true, count: bids.length, data: bids });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bids for a specific item
// @route   GET /api/bids/item/:itemId
// @access  Public
export const getItemBids = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    const bids = await Bid.find({ itemId })
      .populate('bidderId', 'name')
      .sort({ bidTime: -1 }); // Newest bids first

    res.status(200).json({ success: true, count: bids.length, data: bids });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my bidding history
// @route   GET /api/bids/my-bids
// @access  Private/Participant
export const getMyBids = async (req, res, next) => {
  try {
    const bids = await Bid.find({ bidderId: req.user._id })
      .populate('auctionId', 'title status')
      .populate('itemId', 'title currentHighestBid status')
      .sort({ bidTime: -1 });

    res.status(200).json({ success: true, count: bids.length, data: bids });
  } catch (error) {
    next(error);
  }
};