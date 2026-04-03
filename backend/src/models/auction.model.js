import mongoose from "mongoose";

const auctionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please add an auction title"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Please add a description"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Refers to the Client who created it
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "scheduled", "live", "ended", "cancelled"],
      default: "draft",
    },
    startTime: {
      type: Date,
      required: [true, "Please add a start time"],
    },
    endTime: {
      type: Date,
      required: [true, "Please add an end time"],
    },
    bidIncrement: {
      type: Number,
      default: 0, // 0 means any amount higher is fine, or you can enforce minimums
    },
    startingPrice: {
      type: Number,
      default: 0, // Base starting price for the auction event itself, if applicable
    },
    currentHighestBid: {
      type: Number,
      default: 0, // Caches highest bid across the auction (or item-specific later)
    },
    currentHighestBidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    totalItems: {
      type: Number,
      default: 0,
    },
    totalParticipants: {
      type: Number,
      default: 0,
    },
    finalCallDuration: {
      type: Number,
      default: 30,
    },
    antiSnipingExtension: {
      type: Number,
      default: 10,
    },
    bidCooldown: {
      type: Number,
      default: 3,
    },
  },
  {
    timestamps: true,
  },
);

// Add these indexes for fast filtering and sorting!
// 1. Speeds up "getMyAuctions" queries
auctionSchema.index({ createdBy: 1 });
// 2. Speeds up the public "getAuctions" query (filtering by status and sorting by time)
auctionSchema.index({ status: 1, startTime: 1 });

export default mongoose.model("Auction", auctionSchema);
