const Rating = require('../models/Rating');
const User = require('../models/User');
const Request = require('../models/Request');
const { emitToUser } = require('../utils/socket');
const { updateUserStats } = require('../utils/userStats');

// @desc    Create a rating
// @route   POST /api/ratings
// @access  Private
exports.createRating = async (req, res) => {
    try {
        const { requestId, score, comment } = req.body;
        const from = req.user._id;

        // 1. Validate request
        const request = await Request.findById(requestId);
        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        if (request.status !== 'Completed') {
            return res.status(400).json({ success: false, message: 'You can only rate completed collaborations' });
        }

        // Check if user is part of the request
        if (request.requestedBy.toString() !== from.toString() && request.requestedTo.toString() !== from.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to rate this collaboration' });
        }

        const to = request.requestedBy.toString() === from.toString() ? request.requestedTo : request.requestedBy;

        // 2. Prevent double rating
        const existingRating = await Rating.findOne({ requestId, from });
        if (existingRating) {
            return res.status(400).json({ success: false, message: 'You have already rated this collaboration' });
        }

        // 3. Create rating
        const rating = await Rating.create({
            from,
            to,
            requestId,
            skillId: request.skillId,
            score,
            comment
        });

        // 4. Update User Stats using utility
        const stats = await updateUserStats(to);

        // 5. Emit real-time update
        emitToUser(to, 'profile-rating-updated', stats);

        res.status(201).json({
            success: true,
            data: rating,
            message: 'Rating submitted successfully'
        });

    } catch (error) {
        console.error('Error in createRating:', error);
        res.status(500).json({
            success: false,
            message: 'Server error submitting rating',
            error: error.message
        });
    }
};

// @desc    Get ratings for a user
// @route   GET /api/ratings/user/:userId
// @access  Public
exports.getUserRatings = async (req, res) => {
    try {
        const ratings = await Rating.find({ to: req.params.userId })
            .populate('from', 'name')
            .populate('skillId', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: ratings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching ratings'
        });
    }
};
