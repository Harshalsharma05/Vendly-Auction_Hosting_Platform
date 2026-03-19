import Auction from '../models/auction.model.js';

// @desc    Create a new auction
// @route   POST /api/auctions
// @access  Private/Client
export const createAuction = async (req, res, next) => {
  try {
    const { title, description, startTime, endTime, bidIncrement, startingPrice, status } = req.body;

    const auction = await Auction.create({
      title,
      description,
      startTime,
      endTime,
      bidIncrement,
      startingPrice,
      status: status || 'draft',
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, auction });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all active/scheduled auctions (Public/Participant View)
// @route   GET /api/auctions
// @access  Public
export const getAuctions = async (req, res, next) => {
  try {
    // Only show scheduled, live, or ended auctions to the public (hide drafts and cancelled)
    const auctions = await Auction.find({ status: { $in: ['scheduled', 'live', 'ended'] } })
      .populate('createdBy', 'name')
      .sort({ startTime: 1 });

    res.status(200).json({ success: true, count: auctions.length, data: auctions });
  } catch (error) {
    next(error);
  }
};

// @desc    Get client's own auctions
// @route   GET /api/auctions/my-auctions
// @access  Private/Client
export const getMyAuctions = async (req, res, next) => {
  try {
    const auctions = await Auction.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: auctions.length, data: auctions });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single auction by ID
// @route   GET /api/auctions/:id
// @access  Public
export const getAuctionById = async (req, res, next) => {
  try {
    const auction = await Auction.findById(req.params.id).populate('createdBy', 'name');
    
    if (!auction) {
      res.status(404);
      return next(new Error('Auction not found'));
    }

    res.status(200).json({ success: true, data: auction });
  } catch (error) {
    next(error);
  }
};

// @desc    Update auction and state
// @route   PATCH /api/auctions/:id
// @access  Private/Client
export const updateAuction = async (req, res, next) => {
  try {
    let auction = await Auction.findById(req.params.id);

    if (!auction) {
      res.status(404);
      return next(new Error('Auction not found'));
    }

    // Ensure the user updating is the creator
    if (auction.createdBy.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('Not authorized to update this auction'));
    }

    // State Validation Logic
    if (req.body.status) {
      const validTransitions = {
        draft: ['scheduled', 'cancelled'],
        scheduled: ['live', 'cancelled', 'draft'],
        live:['ended', 'cancelled'],
        ended: [], // cannot change once ended
        cancelled:[], // cannot change once cancelled
      };

      if (!validTransitions[auction.status].includes(req.body.status)) {
        res.status(400);
        return next(new Error(`Cannot transition from ${auction.status} to ${req.body.status}`));
      }
    }

    // Update the auction
    auction = await Auction.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: auction });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an auction
// @route   DELETE /api/auctions/:id
// @access  Private/Client
export const deleteAuction = async (req, res, next) => {
  try {
    const auction = await Auction.findById(req.params.id);

    if (!auction) {
      res.status(404);
      return next(new Error('Auction not found'));
    }

    if (auction.createdBy.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('Not authorized to delete this auction'));
    }

    if (['live', 'ended'].includes(auction.status)) {
      res.status(400);
      return next(new Error('Cannot delete a live or ended auction. Cancel it instead.'));
    }

    await auction.deleteOne();

    res.status(200).json({ success: true, message: 'Auction deleted successfully' });
  } catch (error) {
    next(error);
  }
};