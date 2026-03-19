import AuctionItem from '../models/auctionItem.model.js';
import Auction from '../models/auction.model.js';

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
      return next(new Error('Auction not found'));
    }
    
    if (auction.createdBy.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('Not authorized to add items to this auction'));
    }

    // 2. Automatically calculate the 'order' if not provided
    let { order } = req.body;
    if (!order) {
      const lastItem = await AuctionItem.findOne({ auctionId }).sort('-order');
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
    const items = await AuctionItem.find({ auctionId: req.params.auctionId }).sort('order');
    
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
    let item = await AuctionItem.findById(req.params.id).populate('auctionId');
    
    if (!item) {
      res.status(404);
      return next(new Error('Item not found'));
    }

    // Verify ownership via the populated auction reference
    if (item.auctionId.createdBy.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('Not authorized to update this item'));
    }

    // Cannot update item details if it's currently live or sold
    if (['live', 'sold'].includes(item.status)) {
      res.status(400);
      return next(new Error(`Cannot edit an item that is currently ${item.status}`));
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

// @desc    Delete an auction item
// @route   DELETE /api/items/:id
// @access  Private/Client
export const deleteAuctionItem = async (req, res, next) => {
  try {
    const item = await AuctionItem.findById(req.params.id).populate('auctionId');
    
    if (!item) {
      res.status(404);
      return next(new Error('Item not found'));
    }

    if (item.auctionId.createdBy.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('Not authorized to delete this item'));
    }

    if (['live', 'sold'].includes(item.status)) {
      res.status(400);
      return next(new Error(`Cannot delete an item that is ${item.status}`));
    }

    await item.deleteOne();

    // Decrease the auction's totalItems count
    const auction = await Auction.findById(item.auctionId._id);
    auction.totalItems = Math.max(0, auction.totalItems - 1);
    await auction.save();

    res.status(200).json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    next(error);
  }
};