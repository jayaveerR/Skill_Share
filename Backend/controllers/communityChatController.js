const Room = require('../models/Room');
const CommunityMessage = require('../models/CommunityMessage');
const { getIO } = require('../utils/socket');
const { encrypt, decrypt } = require('../utils/encryption2');

// @desc    Get all community rooms
// @route   GET /api/community/rooms
// @access  Public (or Protected)
exports.getRooms = async (req, res) => {
    try {
        const rooms = await Room.find().sort({ createdAt: 1 });
        res.status(200).json({ success: true, data: rooms });
    } catch (error) {
        console.error('Get rooms error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching rooms' });
    }
};

// @desc    Create a new room (Admin only in real app, open for dev/prompt)
// @route   POST /api/community/rooms
// @access  Protected
exports.createRoom = async (req, res) => {
    try {
        const { roomId, name, description } = req.body;

        const existingRoom = await Room.findOne({ roomId });
        if (existingRoom) {
            return res.status(400).json({ success: false, message: 'Room ID already exists' });
        }

        const room = await Room.create({
            roomId,
            name,
            description,
            createdBy: req.user ? req.user._id : null
        });

        res.status(201).json({ success: true, data: room });
    } catch (error) {
        console.error('Create room error:', error);
        res.status(500).json({ success: false, message: 'Server error creating room' });
    }
};

// @desc    Get messages for a room
// @route   GET /api/community/rooms/:roomId/messages
// @access  Protected
exports.getMessages = async (req, res) => {
    try {
        const { roomId } = req.params;

        // Ensure room exists
        const room = await Room.findOne({ roomId });
        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        const messages = await CommunityMessage.find({ roomId })
            .populate('senderId', 'name avatar')
            .sort({ createdAt: 1 }); // Oldest first for chat history

        const decryptedMessages = messages.map(m => {
            const doc = m.toObject(); // Convert to plain object to modify

            // Decrypt Logic
            let plainContent = "";
            if (doc.encryptedContent) {
                plainContent = decrypt(doc.encryptedContent);
            } else if (doc.content) {
                plainContent = doc.content; // Legacy
            } else {
                plainContent = "[No Content]";
            }

            // Return with 'content' as plain text
            return {
                ...doc,
                content: plainContent
            };
        });

        res.status(200).json({ success: true, data: decryptedMessages });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching messages' });
    }
};

// @desc    Send a message to a room
// @route   POST /api/community/rooms/:roomId/messages
// @access  Protected
exports.sendMessage = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { content } = req.body;
        const senderId = req.user._id;

        if (!content) {
            return res.status(400).json({ success: false, message: 'Message content is required' });
        }

        // Validate room
        const room = await Room.findOne({ roomId });
        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        // ENCRYPTION: Store encrypted, send plain
        const encryptedContent = encrypt(content);

        // Create message
        const newMessage = await CommunityMessage.create({
            roomId,
            roomRef: room._id,
            senderId,
            encryptedContent: encryptedContent
        });

        // Populate sender info for frontend
        const populatedMessage = await newMessage.populate('senderId', 'name avatar');

        // Prepare plain response for UI
        const responseData = {
            ...populatedMessage.toObject(),
            content: content // Override with plain text for immediate view
        };

        // Real-time emit
        try {
            const io = getIO();
            // Emit PLAIN text to clients
            io.to(roomId).emit('new-community-message', responseData);
        } catch (socketError) {
            console.error('Socket emit error:', socketError);
            // Continue execution, message is saved in DB
        }

        res.status(201).json({ success: true, data: responseData });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ success: false, message: 'Server error sending message' });
    }
};
