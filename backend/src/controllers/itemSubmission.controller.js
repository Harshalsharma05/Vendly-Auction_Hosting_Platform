import Auction from "../models/auction.model.js";
import AuctionItem from "../models/auctionItem.model.js";
import ItemSubmission from "../models/itemSubmission.model.js";

// @desc    Get pending submissions for a host's auction
// @route   GET /api/submissions/:auctionId
// @access  Private/Client
export const getPendingSubmissions = async (req, res, next) => {
  try {
    const { auctionId } = req.params;
    const clientUserId = req.user?._id;

    const auction = await Auction.findById(auctionId);
    if (!auction) {
      res.status(404);
      return next(new Error("Auction not found"));
    }

    if (String(auction.createdBy) !== String(clientUserId)) {
      res.status(403);
      return next(new Error("Not authorized to view these submissions"));
    }

    const submissions = await ItemSubmission.find({
      auctionId,
      status: "pending",
    })
      .sort({ createdAt: -1 })
      .select(
        "_id status submittedBy title description imageUrls expectedPrice createdAt",
      );

    res.status(200).json({
      success: true,
      data: submissions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit an item for auction moderation
// @route   POST /api/submissions/:auctionId
// @access  Private/Participant
export const submitItem = async (req, res, next) => {
  try {
    const { auctionId } = req.params;
    const userId = req.user?._id;
    const { title, description, imageUrls, expectedPrice } = req.body;

    if (
      !title ||
      !String(title).trim() ||
      !description ||
      !String(description).trim()
    ) {
      res.status(400);
      return next(new Error("Title and description are required"));
    }

    const auction = await Auction.findById(auctionId);
    if (!auction) {
      res.status(404);
      return next(new Error("Auction not found"));
    }

    if (
      ["ended", "cancelled"].includes(
        String(auction.status || "").toLowerCase(),
      )
    ) {
      res.status(400);
      return next(new Error("Submissions are closed for this auction"));
    }

    const normalizedExpectedPrice =
      expectedPrice === undefined ||
      expectedPrice === null ||
      expectedPrice === ""
        ? 0
        : Number(expectedPrice);

    if (Number.isNaN(normalizedExpectedPrice) || normalizedExpectedPrice < 0) {
      res.status(400);
      return next(new Error("Expected price must be a non-negative number"));
    }

    const submission = await ItemSubmission.create({
      auctionId,
      submittedBy: userId,
      title: String(title).trim(),
      description: String(description).trim(),
      imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
      expectedPrice: normalizedExpectedPrice,
      status: "pending",
    });

    const io = req.app.get("io");
    if (io) {
      io.to(`auction_${auctionId}`).emit("SUBMISSION_CREATED", {
        submissionId: submission._id,
        auctionId,
        submittedBy: userId,
      });
    }

    res.status(201).json({
      success: true,
      data: submission,
    });
  } catch (error) {
    next(error);
  }
};

const loadSubmissionForReview = async ({ submissionId, clientUserId }) => {
  const submission = await ItemSubmission.findById(submissionId);
  if (!submission) {
    const error = new Error("Submission not found");
    error.statusCode = 404;
    throw error;
  }

  if (submission.status !== "pending") {
    const error = new Error("Only pending submissions can be reviewed");
    error.statusCode = 400;
    throw error;
  }

  const auction = await Auction.findById(submission.auctionId);
  if (!auction) {
    const error = new Error("Auction not found for this submission");
    error.statusCode = 404;
    throw error;
  }

  if (String(auction.createdBy) !== String(clientUserId)) {
    const error = new Error("Not authorized to review this submission");
    error.statusCode = 403;
    throw error;
  }

  return { submission, auction };
};

// @desc    Approve a pending item submission
// @route   PATCH /api/submissions/:submissionId/approve
// @access  Private/Client
export const approveSubmission = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const clientUserId = req.user?._id;

    const { submission, auction } = await loadSubmissionForReview({
      submissionId,
      clientUserId,
    });

    const lastItem = await AuctionItem.findOne({ auctionId: auction._id }).sort(
      "-order",
    );
    const nextOrder = lastItem ? lastItem.order + 1 : 1;

    const createdItem = await AuctionItem.create({
      auctionId: submission.auctionId,
      title: submission.title,
      description: submission.description,
      imageUrls: submission.imageUrls,
      startingPrice: Number(submission.expectedPrice || 0),
      bidIncrement: Number(auction.bidIncrement || 0),
      currentHighestBid: Number(submission.expectedPrice || 0),
      submittedBy: submission.submittedBy,
      isUserSubmitted: true,
      status: "pending",
      order: nextOrder,
    });

    submission.status = "approved";
    submission.reviewedBy = clientUserId;
    submission.reviewedAt = new Date();
    await submission.save();

    auction.totalItems += 1;
    await auction.save();

    const io = req.app.get("io");
    if (io) {
      io.to(`auction_${auction._id.toString()}`).emit("SUBMISSION_APPROVED", {
        submissionId: submission._id,
        auctionId: auction._id,
        createdItemId: createdItem._id,
        submittedBy: submission.submittedBy,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        createdItem,
        submission,
      },
    });
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode);
    }
    next(error);
  }
};

// @desc    Reject a pending item submission
// @route   PATCH /api/submissions/:submissionId/reject
// @access  Private/Client
export const rejectSubmission = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const clientUserId = req.user?._id;

    const { submission, auction } = await loadSubmissionForReview({
      submissionId,
      clientUserId,
    });

    submission.status = "rejected";
    submission.reviewedBy = clientUserId;
    submission.reviewedAt = new Date();
    await submission.save();

    const io = req.app.get("io");
    if (io) {
      io.to(`auction_${auction._id.toString()}`).emit("SUBMISSION_REJECTED", {
        submissionId: submission._id,
        auctionId: auction._id,
        submittedBy: submission.submittedBy,
      });
    }

    res.status(200).json({
      success: true,
      message: "Submission rejected",
      data: submission,
    });
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode);
    }
    next(error);
  }
};
