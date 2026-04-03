import mongoose from "mongoose";

const auctionItemSchema = new mongoose.Schema(
  {
    auctionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auction",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Please add an item title"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Please add an item description"],
    },
    imageUrls: {
      type: [String], // Array of image URLs
      default: [],
    },
    startingPrice: {
      type: Number,
      required: [true, "Please add a starting price"],
    },
    bidIncrement: {
      type: Number,
      default: 0,
    },
    currentHighestBid: {
      type: Number,
      default: 0,
    },
    currentHighestBidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    bidCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "live", "sold", "unsold"],
      default: "pending",
    },
    isFinalCall: {
      type: Boolean,
      default: false,
    },
    finalCallStartTime: {
      type: Date,
      default: null,
    },
    finalCallEndTime: {
      type: Date,
      default: null,
    },
    itemEndTime: {
      type: Date,
      default: null,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isUserSubmitted: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 1, // To define which item goes first, second, etc.
    },
  },
  {
    timestamps: true,
  },
);

// We will add an index to quickly fetch items for a specific auction, sorted by order
auctionItemSchema.index({ auctionId: 1, order: 1 });

export default mongoose.model("AuctionItem", auctionItemSchema);
