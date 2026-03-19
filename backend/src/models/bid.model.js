import mongoose from 'mongoose';

const bidSchema = new mongoose.Schema(
  {
    auctionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Auction',
      required: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuctionItem',
      required: true,
    },
    bidderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bidAmount: {
      type: Number,
      required: true,
    },
    bidTime: {
      type: Date,
      default: Date.now,
    },
    bidStatus: {
      type: String,
      enum:['valid', 'outbid', 'winning', 'rejected'],
      default: 'valid',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookup of bid history!
bidSchema.index({ auctionId: 1, itemId: 1, bidAmount: -1 });

export default mongoose.model('Bid', bidSchema);