import mongoose from 'mongoose';

const clientProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    organizationName: {
      type: String,
      required:[true, 'Please add an organization name'],
    },
    contactNumber: {
      type: String,
      required: [true, 'Please add a contact number'],
    },
    description: {
      type: String,
    },
    website: {
      type: String,
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // The Admin who approved it
    },
    approvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('ClientProfile', clientProfileSchema);