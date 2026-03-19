import mongoose from 'mongoose';

const auctionParticipantSchema = new mongoose.Schema(
  {
    auctionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Auction',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum:['participant', 'spectator'],
      default: 'participant',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Add a compound unique index so a user cannot join the same auction twice!
auctionParticipantSchema.index({ auctionId: 1, userId: 1 }, { unique: true });

export default mongoose.model('AuctionParticipant', auctionParticipantSchema);