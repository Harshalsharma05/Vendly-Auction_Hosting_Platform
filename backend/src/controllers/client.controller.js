import ClientProfile from '../models/clientProfile.model.js';

// @desc    Create or update client profile
// @route   POST /api/clients/profile
// @access  Private/Client
export const upsertProfile = async (req, res, next) => {
  try {
    const { organizationName, contactNumber, description, website } = req.body;

    let profile = await ClientProfile.findOne({ userId: req.user._id });

    if (profile) {
      // Update existing profile
      profile.organizationName = organizationName || profile.organizationName;
      profile.contactNumber = contactNumber || profile.contactNumber;
      profile.description = description || profile.description;
      profile.website = website || profile.website;
      await profile.save();
    } else {
      // Create new profile
      profile = await ClientProfile.create({
        userId: req.user._id,
        organizationName,
        contactNumber,
        description,
        website,
      });
    }

    res.status(200).json({ success: true, profile });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current client profile
// @route   GET /api/clients/profile
// @access  Private/Client
export const getMyProfile = async (req, res, next) => {
  try {
    const profile = await ClientProfile.findOne({ userId: req.user._id });
    if (!profile) {
      res.status(404);
      return next(new Error('Profile not found'));
    }
    res.status(200).json({ success: true, profile });
  } catch (error) {
    next(error);
  }
};

// ================= ADMIN CONTROLLERS ================= //

// @desc    Get all pending clients
// @route   GET /api/clients/admin/pending
// @access  Private/Admin
export const getPendingClients = async (req, res, next) => {
  try {
    const pendingClients = await ClientProfile.find({ approvalStatus: 'pending' }).populate('userId', 'name email');
    res.status(200).json({ success: true, count: pendingClients.length, data: pendingClients });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or Reject Client
// @route   PATCH /api/clients/admin/:id/status
// @access  Private/Admin
export const updateClientStatus = async (req, res, next) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    
    if (!['approved', 'rejected', 'suspended'].includes(status)) {
      res.status(400);
      return next(new Error('Invalid status'));
    }

    const profile = await ClientProfile.findById(req.params.id);
    if (!profile) {
      res.status(404);
      return next(new Error('Client profile not found'));
    }

    profile.approvalStatus = status;
    if (status === 'approved') {
      profile.approvedBy = req.user._id;
      profile.approvedAt = Date.now();
    }

    await profile.save();
    res.status(200).json({ success: true, profile });
  } catch (error) {
    next(error);
  }
};