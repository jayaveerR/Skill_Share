const User = require('../models/User');
const Rating = require('../models/Rating');
const Request = require('../models/Request');

/**
 * Updates a user's statistics based on their ratings and collaborations
 * @param {string} userId - The ID of the user to update
 */
const updateUserStats = async (userId) => {
    try {
        // 1. Calculate Rating Stats
        const ratings = await Rating.find({ to: userId });
        const totalRatings = ratings.length;
        const averageRating = totalRatings > 0
            ? ratings.reduce((acc, curr) => acc + curr.score, 0) / totalRatings
            : 0;

        // 2. Count Collaborations
        // A collaboration is counted if a request is Accepted, InProgress, or Completed
        const collabCount = await Request.countDocuments({
            $or: [{ requestedBy: userId }, { requestedTo: userId }],
            status: { $in: ['Accepted', 'InProgress', 'Completed'] }
        });

        // 3. Calculate Trust Score
        // Formula: (avgRating * 10) + (collabCount * 2) + (bonus for being active/old member potentially)
        // This is a draft formula, can be refined
        const trustScore = (averageRating * 10) + (collabCount * 2);

        // 4. Update User
        await User.findByIdAndUpdate(userId, {
            averageRating,
            totalRatings,
            completedCollaborations: collabCount,
            trustScore
        });

        return {
            averageRating,
            totalRatings,
            completedCollaborations: collabCount,
            trustScore
        };
    } catch (error) {
        console.error(`Error updating user stats for ${userId}:`, error);
        throw error;
    }
};

module.exports = { updateUserStats };
