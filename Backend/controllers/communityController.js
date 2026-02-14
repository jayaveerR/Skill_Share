const User = require('../models/User');
const Skill = require('../models/Skill');
const Request = require('../models/Request');
const Rating = require('../models/Rating');
const Activity = require('../models/Activity');

// @desc    Get community members with skills and ratings
// @route   GET /api/community/members
// @access  Public
exports.getMembers = async (req, res) => {
    try {
        const { role, skillCategory } = req.query;

        // Fetch users (only active ones)
        const users = await User.find({ isActive: true })
            .select('name email bio createdAt isOnline lastSeen avatar')
            .lean();

        // Map skills and ratings to users
        const members = await Promise.all(
            users.map(async (user) => {
                const skills = await Skill.find({ createdBy: user._id }).select('name category level');

                // Calculate average rating
                const ratings = await Rating.find({ to: user._id });
                const avgRating = ratings.length > 0
                    ? ratings.reduce((acc, curr) => acc + curr.score, 0) / ratings.length
                    : 0;

                // Role logic: Mentor if they have > 0 skills, else Learner (or "Both" if we implement learning interests)
                const computedRole = skills.length > 0 ? 'Mentor' : 'Learner';

                return {
                    ...user,
                    skills,
                    role: computedRole,
                    rating: avgRating,
                    ratingCount: ratings.length,
                };
            })
        );

        // Apply filters
        let filteredMembers = members;

        if (role && role !== 'All') {
            filteredMembers = filteredMembers.filter(m => m.role === role);
        }

        if (skillCategory && skillCategory !== 'All') {
            filteredMembers = filteredMembers.filter(m =>
                m.skills.some(s => s.category === skillCategory)
            );
        }


        res.status(200).json({
            success: true,
            data: filteredMembers,
        });
    } catch (error) {
        console.error('Get members error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error retrieving members',
        });
    }
};

// @desc    Get community stats
// @route   GET /api/community/stats
// @access  Public
exports.getStats = async (req, res) => {
    try {
        const totalMembers = await User.countDocuments({ isActive: true });
        const activeProviders = await Skill.distinct('createdBy');
        const totalSkills = await Skill.countDocuments();
        const successfulExchanges = await Request.countDocuments({ status: 'Completed' });

        res.status(200).json({
            success: true,
            data: {
                totalMembers,
                activeProviders: activeProviders.length,
                totalSkills,
                successfulExchanges,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get recent community activities
// @route   GET /api/community/activities
// @access  Public
exports.getActivities = async (req, res) => {
    try {
        const activities = await Activity.find()
            .populate('user', 'name')
            .sort({ createdAt: -1 })
            .limit(10);

        // Filter out activities with null users (e.g. if user was deleted)
        const filteredActivities = activities.filter(a => a.user);

        res.status(200).json({
            success: true,
            data: filteredActivities,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
