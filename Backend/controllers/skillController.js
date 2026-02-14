const Skill = require('../models/Skill');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Request = require('../models/Request');
const { getIO } = require('../utils/socket');
const { checkTextQuality, isUserSpamBlocked } = require('../utils/moderation');

// Helper: Calculate AI-like Relevance Score
const calculateRelevanceScore = (user, skill) => {
    let score = 0;

    if (!user) return Math.floor(Math.random() * 20); // Random base for guests

    // 1. Tag match (+30)
    const userInterests = user.interests || [];
    const skillTags = skill.tags || [];
    if (skillTags.some(tag => userInterests.includes(tag))) {
        score += 30;
    }

    // 2. Category match with previous views (+20)
    const viewedCategories = user.viewedCategories || [];
    if (viewedCategories.includes(skill.category)) {
        score += 20;
    }

    // 3. Owner is online (+15)
    if (skill.createdBy?.isOnline) {
        score += 15;
    }

    // 4. Rating >= 4 (+15)
    if (skill.createdBy?.averageRating >= 4) {
        score += 15;
    }

    // 5. Beginner friendly (+10)
    // Heuristic: If user is new (no collaborations) and skill is Beginner
    const isUserNew = (user.completedCollaborations || 0) < 2;
    if (isUserNew && skill.level === 'Beginner') {
        score += 10;
    }

    // 6. Recently added (+10)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    if (new Date(skill.createdAt) > sevenDaysAgo) {
        score += 10;
    }

    return score;
};

// Helper: Generate Profile Insights
const getProfileInsights = (user) => {
    if (!user) return [];
    const insights = [];

    if (user.averageRating >= 4.5 && user.completedCollaborations >= 10) {
        insights.push("Highly trusted mentor");
    } else if (user.averageRating >= 4) {
        insights.push("Quality contributor");
    }

    if (user.completedCollaborations >= 5 && user.averageRating >= 4) {
        insights.push("Beginner friendly helper");
    }

    // Quick responder heuristic: Online recently and has some activity
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    if (user.isOnline || (user.lastSeen && new Date(user.lastSeen) > oneHourAgo)) {
        insights.push("Quick responder");
    }

    if (!user.totalRatings) {
        insights.push("New Member");
    }

    return insights;
};

// @desc    Get all skills
// @route   GET /api/skills
// @access  Public
exports.getSkills = async (req, res) => {
    try {
        const { category, search, user } = req.query;
        let query = {};

        if (user) {
            query.createdBy = user;
        }

        if (category && category !== 'All') {
            query.category = category;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        const skills = await Skill.find(query)
            .populate('createdBy', 'name email avatar averageRating totalRatings completedCollaborations trustScore isOnline lastSeen')
            .sort({ createdAt: -1 });

        // Apply AI-like scoring and insights
        const scoredSkills = skills.map(skill => {
            const skillObj = skill.toObject();
            const relevanceScore = calculateRelevanceScore(req.user, skillObj);
            const insights = getProfileInsights(skillObj.createdBy);

            // Trending formula: (requests * 2) + views
            const trendingScore = (skillObj.requestCount || 0) * 2 + (skillObj.viewCount || 0);

            return {
                ...skillObj,
                relevanceScore,
                insights,
                isTrending: trendingScore > 5, // Heuristic threshold
            };
        });

        // Sort by relevance if user is logged in, else by trending/new
        if (req.user) {
            scoredSkills.sort((a, b) => b.relevanceScore - a.relevanceScore);
        }

        res.status(200).json({
            success: true,
            count: scoredSkills.length,
            data: scoredSkills,
        });
    } catch (error) {
        console.error('Get skills error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error retrieving skills',
            error: error.message,
        });
    }
};

// @desc    Create new skill
// @route   POST /api/skills
// @access  Private
exports.createSkill = async (req, res) => {
    try {
        req.body.createdBy = req.user._id;

        // SPAM PROTECTION
        const isBlocked = await isUserSpamBlocked(req.user._id);
        if (isBlocked) {
            return res.status(429).json({
                success: false,
                message: 'Your account is temporarily restricted due to multiple spam detections. Please try again in 24 hours.'
            });
        }

        const moderation = await checkTextQuality(req.body.description, 'skill');
        if (moderation.classification === 'SPAM') {
            await User.findByIdAndUpdate(req.user._id, {
                $inc: { spamAttemptCount: 1 },
                lastSpamAttempt: new Date()
            });
            return res.status(400).json({
                success: false,
                message: 'Your skill description was flagged as spam.',
                suggestion: moderation.suggestion
            });
        }

        req.body.moderation = {
            classification: moderation.classification,
            reason: moderation.reason,
            suggestion: moderation.suggestion
        };

        const skill = await Skill.create(req.body);

        // Populate user details for immediate display
        const populatedSkill = await Skill.findById(skill._id).populate(
            'createdBy',
            'name email averageRating totalRatings completedCollaborations trustScore isOnline'
        );

        // Track Activity
        await Activity.create({
            user: req.user._id,
            type: 'SKILL_ADDED',
            details: `added a new skill: ${skill.name}`,
            meta: {
                targetId: skill._id,
                targetName: skill.name,
            }
        });

        res.status(201).json({
            success: true,
            data: populatedSkill,
            message: 'Skill added successfully',
        });
    } catch (error) {
        console.error('Create skill error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating skill',
            error: error.message,
        });
    }
};

// @desc    Delete skill permanently
// @route   DELETE /api/skills/:id
// @access  Private
exports.deleteSkill = async (req, res) => {
    try {
        const skill = await Skill.findById(req.params.id);

        if (!skill) {
            return res.status(404).json({
                success: false,
                message: 'Skill not found',
            });
        }

        // Check ownership
        if (skill.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this skill',
            });
        }

        // Check for active collaborations
        const activeRequests = await Request.findOne({
            skillId: skill._id,
            status: { $in: ['Pending', 'Accepted', 'InProgress'] }
        });

        if (activeRequests) {
            return res.status(409).json({
                success: false,
                message: 'Skill has active collaborations and cannot be removed'
            });
        }

        // Permanent Delete
        await skill.deleteOne();

        // Remove from User's skills array for consistency
        await User.findByIdAndUpdate(req.user._id, {
            $pull: { skills: { name: skill.name } }
        });

        // Emit Socket.IO event
        const io = getIO();
        io.emit('skill-removed', { skillId: skill._id });

        res.status(200).json({
            success: true,
            message: 'Skill removed permanently',
        });
    } catch (error) {
        console.error('Delete skill error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting skill',
            error: error.message,
        });
    }
};

// @desc    Track skill view and update user interests
// @route   POST /api/skills/:id/view
// @access  Public (Optional Auth)
exports.trackSkillView = async (req, res) => {
    try {
        const skill = await Skill.findById(req.params.id);
        if (!skill) {
            return res.status(404).json({ success: false, message: 'Skill not found' });
        }

        // Increment skill view count
        skill.viewCount += 1;
        await skill.save();

        // Update user's viewed categories if logged in
        if (req.user) {
            const user = await User.findById(req.user._id);
            if (user) {
                // Keep only last 5 categories for focus
                if (!user.viewedCategories.includes(skill.category)) {
                    user.viewedCategories.unshift(skill.category);
                    if (user.viewedCategories.length > 5) user.viewedCategories.pop();
                    await user.save();
                }
            }
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Track view error:', error);
        res.status(500).json({ success: false, message: 'Server error tracking view' });
    }
};
