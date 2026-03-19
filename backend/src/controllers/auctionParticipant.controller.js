import AuctionParticipant from '../models/auctionParticipant.model.js';
import Auction from '../models/auction.model.js';

// @desc    Join an auction
// @route   POST /api/participants/auction/:auctionId/join
// @access  Private
export const joinAuction = async (req, res, next) => {
  try {
    const { auctionId } = req.params;
    const { role } = req.body; // 'participant' or 'spectator'

    // 1. Check if auction exists and its status
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      res.status(404);
      return next(new Error('Auction not found'));
    }

    if (['ended', 'cancelled', 'draft'].includes(auction.status)) {
      res.status(400);
      return next(new Error(`Cannot join an auction that is ${auction.status}`));
    }

    // 2. Check if user already joined
    const alreadyJoined = await AuctionParticipant.findOne({
      auctionId,
      userId: req.user._id,
    });

    if (alreadyJoined) {
      res.status(400);
      return next(new Error('You have already joined this auction'));
    }

    // 3. Add to roster
    const participant = await AuctionParticipant.create({
      auctionId,
      userId: req.user._id,
      role: role || 'participant',
    });

    // 4. Update total participants count on the Auction
    auction.totalParticipants += 1;
    await auction.save();

    res.status(201).json({ success: true, data: participant });
  } catch (error) {
    // Catch Mongoose duplicate key error just in case
    if (error.code === 11000) {
      res.status(400);
      return next(new Error('You have already joined this auction'));
    }
    next(error);
  }
};

// @desc    Get all participants for an auction
// @route   GET /api/participants/auction/:auctionId
// @access  Public
export const getAuctionParticipants = async (req, res, next) => {
  try {
    const participants = await AuctionParticipant.find({ auctionId: req.params.auctionId })
      .populate('userId', 'name email role')
      .sort('-joinedAt');

    res.status(200).json({ success: true, count: participants.length, data: participants });
  } catch (error) {
    next(error);
  }
};