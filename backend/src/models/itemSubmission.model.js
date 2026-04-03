import mongoose from "mongoose";

const itemSubmissionSchema = new mongoose.Schema(
  {
    auctionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auction",
      required: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
      type: [String],
      default: [],
    },
    expectedPrice: {
      type: Number,
      required: [true, "Please add an expected price"],
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

itemSubmissionSchema.index({ auctionId: 1, status: 1, createdAt: -1 });
itemSubmissionSchema.index({ submittedBy: 1, createdAt: -1 });

export default mongoose.model("ItemSubmission", itemSubmissionSchema);
