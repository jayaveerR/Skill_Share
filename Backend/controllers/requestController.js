const Request = require('../models/Request');
const Skill = require('../models/Skill');
const Activity = require('../models/Activity');
const Chat = require('../models/Chat');
const { emitToUser } = require('../utils/socket');
const { updateUserStats } = require('../utils/userStats');
const User = require('../models/User');
const { checkTextQuality, isUserSpamBlocked } = require('../utils/moderation');

// @desc    Create new skill request
// @route   POST /api/requests
// @access  Private
exports.createRequest = async (req, res) => {
    try {
        console.log('--- Create Request Start ---');
        console.log('Body:', req.body);
        console.log('User:', req.user?._id);

        // 1. VALIDATE INPUT
        const { skillId, message } = req.body;
        const requestedBy = req.user._id;

        // 1. SPAM PROTECTION
        const isBlocked = await isUserSpamBlocked(requestedBy);
        if (isBlocked) {
            return res.status(429).json({
                success: false,
                message: 'Your account is temporarily restricted due to multiple spam detections. Please try again in 24 hours.'
            });
        }

        const moderation = await checkTextQuality(message, 'request');
        if (moderation.classification === 'SPAM') {
            await User.findByIdAndUpdate(requestedBy, {
                $inc: { spamAttemptCount: 1 },
                lastSpamAttempt: new Date()
            });
            return res.status(400).json({
                success: false,
                message: 'Your message was flagged as spam.',
                suggestion: moderation.suggestion
            });
        }

        // 2. VALIDATE INPUT
        if (!skillId) {
            console.log('Error: Missing skillId');
            return res.status(400).json({ success: false, message: 'Skill ID is required' });
        }

        console.log('Finding Skill:', skillId);
        const skill = await Skill.findById(skillId);
        if (!skill) {
            console.log('Error: Skill not found');
            return res.status(404).json({ success: false, message: 'Skill not found' });
        }
        console.log('Skill Found:', skill.name);

        const requestedTo = skill.createdBy;
        console.log('Requested To:', requestedTo);

        // Check for self-request
        if (requestedBy.toString() === requestedTo.toString()) {
            console.log('Error: Self-request');
            return res.status(400).json({ success: false, message: 'You cannot request your own skill' });
        }

        // 2. CHECK DUPLICATE REQUEST
        console.log('Checking for duplicates...');
        const existingRequest = await Request.findOne({
            skillId,
            requestedBy,
            status: { $in: ['Pending', 'Accepted', 'InProgress'] }
        });

        if (existingRequest) {
            console.log('Error: Duplicate request');
            return res.status(409).json({ success: false, message: 'Request already sent' });
        }

        // Check for recent rejection (1 hour cooldown)
        const lastRejectedRequest = await Request.findOne({
            skillId,
            requestedBy,
            status: 'Rejected'
        }).sort({ rejectedAt: -1 });

        if (lastRejectedRequest && lastRejectedRequest.rejectedAt) {
            const cooldownTime = 60 * 60 * 1000; // 1 hour
            const timeSinceRejection = Date.now() - new Date(lastRejectedRequest.rejectedAt).getTime();

            if (timeSinceRejection < cooldownTime) {
                const remainingMinutes = Math.ceil((cooldownTime - timeSinceRejection) / (60 * 1000));
                return res.status(429).json({
                    success: false,
                    message: `Please wait ${remainingMinutes} minutes before requesting this skill again.`
                });
            }
        }

        // 3. CREATE REQUEST
        console.log('Creating Request document...');
        const request = await Request.create({
            skillId,
            requestedBy,
            requestedTo,
            requestedTo,
            message,
            status: 'Pending',
            moderation: {
                classification: moderation.classification,
                reason: moderation.reason,
                suggestion: moderation.suggestion
            }
        });
        console.log('Request Created:', request._id);

        // 4. EMIT REAL-TIME NOTIFICATION
        try {
            console.log('Emitting Socket event...');
            emitToUser(requestedTo, 'new-request', {
                requestId: request._id,
                skillId: skill._id,
                skillName: skill.name,
                requestedBy: req.user.name || 'A user',
                message: message
            });
            console.log('Socket event emitted');

            console.log('Creating Activity...');
            await Activity.create({
                user: requestedBy,
                type: 'SKILL_REQUESTED',
                details: `requested to learn ${skill.name}`,
                meta: { targetId: requestedTo, targetName: 'User' }
            });
            console.log('Activity created');

        } catch (sErr) {
            console.error('Socket/Activity error (Non-blocking):', sErr);
        }

        // 5. RETURN RESPONSE
        res.status(201).json({
            success: true,
            data: request,
            message: 'Request created successfully'
        });

    } catch (error) {
        console.error('CRITICAL Error in createRequest:', error);

        // Handle Mongoose CastError (Invalid ID)
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: `Invalid Resource ID: ${error.value}`,
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error creating request',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// @desc    Get user requests (Incoming & Outgoing)
// @route   GET /api/requests
// @access  Private
exports.getRequests = async (req, res) => {
    try {
        const incoming = await Request.find({ requestedTo: req.user._id })
            .populate('requestedBy', 'name email')
            .populate('skillId', 'name category')
            .sort({ createdAt: -1 });

        const outgoing = await Request.find({ requestedBy: req.user._id })
            .populate('requestedTo', 'name email')
            .populate('skillId', 'name category')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: { incoming, outgoing }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error fetching requests' });
    }
};

// @desc    Update request status (Accept/Reject/Complete)
// @route   PUT /api/requests/:id
// @access  Private
exports.updateRequestStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const requestId = req.params.id;
        const request = await Request.findById(requestId);

        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        // ACCEPT / REJECT LOGIC
        if (status === 'Accepted') {
            // 1. VERIFY REQUEST
            if (request.requestedTo.toString() !== req.user._id.toString()) {
                return res.status(403).json({ success: false, message: 'Not authorized' });
            }
            if (request.status !== 'Pending') {
                return res.status(400).json({ success: false, message: 'Request is not pending' });
            }

            // 2. UPDATE STATUS
            request.status = 'Accepted';
            await request.save();

            // 3. EMIT EVENTS
            const skill = await Skill.findById(request.skillId);

            // Emit "request-accepted" to User A (Sender)
            emitToUser(request.requestedBy, 'request-accepted', {
                requestId: request._id,
                skillName: skill?.name,
                status: 'Accepted',
                peerId: request.requestedTo // User B (Receiver)
            });

            // Emit "request-updated" to User B (Receiver/Self) - Optional but prompt asked for it
            emitToUser(request.requestedTo, 'request-updated', {
                requestId: request._id,
                status: 'Accepted',
                peerId: request.requestedBy // User A (Sender)
            });

            // Track activity
            Activity.create({
                user: req.user._id,
                type: 'EXCHANGE_ACCEPTED',
                details: `accepted request for ${skill?.name}`,
                meta: { targetId: request.requestedBy }
            }).catch(e => console.error(e)); // Non-blocking

            // 4. ENABLE COMMUNICATION (Handled by frontend check on status)

            // 5. Update Stats for both parties
            await updateUserStats(request.requestedBy);
            await updateUserStats(request.requestedTo);

            // 6. RETURN RESPONSE
            return res.status(200).json({ success: true, data: request, message: 'Request accepted successfully' });
        }

        if (status === 'Rejected') {
            if (request.requestedTo.toString() !== req.user._id.toString()) {
                return res.status(403).json({ success: false, message: 'Not authorized' });
            }

            request.status = 'Rejected';
            request.rejectedAt = Date.now();
            await request.save();

            // Emit "request-rejected" to User A
            const skill = await Skill.findById(request.skillId);
            emitToUser(request.requestedBy, 'request-rejected', {
                requestId: request._id,
                skillName: skill?.name,
                status: 'Rejected'
            });

            return res.status(200).json({ success: true, data: request, message: 'Request rejected' });
        }

        // Handle Completed or other statuses if needed, falling back to original logic for now
        // But strictly for Accept/Reject prompt logic, we handled it above.

        // If status is "Completed", allow it:
        if (status === 'Completed') {
            if (request.requestedTo.toString() !== req.user._id.toString() && request.requestedBy.toString() !== req.user._id.toString()) {
                return res.status(403).json({ success: false, message: 'Not authorized' });
            }
            request.status = 'Completed';
            await request.save();

            const skill = await Skill.findById(request.skillId);

            // Notify both parties
            emitToUser(request.requestedBy, 'request-completed', {
                requestId: request._id,
                skillName: skill?.name,
                status: 'Completed'
            });

            emitToUser(request.requestedTo, 'request-completed', {
                requestId: request._id,
                skillName: skill?.name,
                status: 'Completed'
            });

            // Update Stats for both parties
            await updateUserStats(request.requestedBy);
            await updateUserStats(request.requestedTo);

            return res.status(200).json({ success: true, data: request, message: 'Request marked as completed' });
        }

        return res.status(400).json({ success: false, message: 'Invalid status' });

    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ success: false, message: 'Server error updating request', stack: process.env.NODE_ENV === 'development' ? error.stack : undefined });
    }
};
