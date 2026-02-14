const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Request = require('../models/Request');
const User = require('../models/User');
const { getIO, isUserOnline, emitToUser } = require('../utils/socket');
const crypto = require('crypto');
const { encrypt, decrypt } = require('../utils/encryption2');

function ensureChatKey(chat) {
    if (!chat.encryptionKey) {
        const key = crypto.randomBytes(32).toString('base64');
        chat.encryptionKey = key;
    }
}

function encryptContent(plaintext, base64Key) {
    const key = Buffer.from(base64Key, 'base64');
    const iv = crypto.randomBytes(12); // AES-GCM recommended IV length
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return {
        ciphertext: ciphertext.toString('base64'),
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64')
    };
}

function decryptContent(ciphertextB64, ivB64, authTagB64, base64Key) {
    const key = Buffer.from(base64Key, 'base64');
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');
    const ciphertext = Buffer.from(ciphertextB64, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return plaintext.toString('utf8');
}

// @desc    Get or Create Chat Session
// @route   POST /api/chat/session
// @access  Private
exports.getChatSession = async (req, res) => {
    try {
        const { requestId } = req.body;
        const userId = req.user._id;

        console.log('--- getChatSession Start ---');
        console.log('Request ID:', requestId);
        console.log('User ID:', userId);

        // 1. Validate Request
        const request = await Request.findById(requestId);
        if (!request) {
            console.log('Error: Request not found');
            return res.status(404).json({ success: false, message: 'Request not found' });
        }
        console.log('Request Found:', request._id);
        console.log('Request Status:', request.status);
        console.log('Participants:', request.requestedBy, request.requestedTo);

        // 2. Validate Access
        const isParticipant =
            request.requestedBy.toString() === userId.toString() ||
            request.requestedTo.toString() === userId.toString();

        if (!isParticipant) {
            console.log('Error: User not participant');
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (request.status !== 'Accepted') {
            console.log('Error: Invalid status', request.status);
            return res.status(403).json({ success: false, message: 'Chat is only allowed for Accepted requests' });
        }

        // 3. Find or Create Chat
        let chat = await Chat.findOne({ linkedRequestId: requestId });

        if (!chat) {
            console.log('Chat not found, creating new...');
            chat = await Chat.create({
                linkedRequestId: requestId,
                participants: [request.requestedBy, request.requestedTo]
            });
            console.log('New Chat Created:', chat._id);
            ensureChatKey(chat);
            await chat.save();
        } else {
            console.log('Existing Chat Found:', chat._id);
            ensureChatKey(chat);
            await chat.save();
        }

        const otherParticipantId = chat.participants.find(p => p.toString() !== userId.toString());
        const otherUser = await User.findById(otherParticipantId).select('isOnline lastSeen');

        res.status(200).json({
            success: true,
            data: {
                ...chat.toObject(),
                isPartnerOnline: otherUser?.isOnline || false,
                partnerLastSeen: otherUser?.lastSeen || null
            }
        });
    } catch (error) {
        console.error('Session Error:', error);
        res.status(500).json({ success: false, message: 'Server error creating session' });
    }
};

// @desc    Get messages for a chat
// @route   GET /api/chat/:chatId/messages
// @access  Private
// const { encrypt, decrypt } = require('../utils/encryption');


// ... (keep imports)

// @desc    Get messages for a chat
// @route   GET /api/chat/:chatId/messages
// @access  Private
exports.getMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user._id;

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ success: false, message: 'Chat not found' });
        }

        // If chat is hidden for this user, return empty messages (Simulate deletion)
        if (chat.hiddenFor && chat.hiddenFor.includes(userId)) {
            return res.status(200).json({
                success: true,
                data: []
            });
        }

        // Select all fields (encryptedContent is in schema now)
        const messages = await Message.find({ chatId, deleted: false })
            .sort({ createdAt: 1 });

        const decryptedMessages = messages.map(m => {
            let plainContent = "";

            if (m.encryptedContent) {
                // New Server-Side Encrypted
                plainContent = decrypt(m.encryptedContent);
            } else if (m.content) {
                // Legacy Plaintext (from previous step)
                plainContent = m.content;
            } else if (m.contentCiphertext) {
                // Legacy Client/Server Encrypted (oldest)
                // We can try to decrypt or just leave placeholder. 
                // Given the prompt's focus on "final year safe security", we focus on the new flow.
                plainContent = "[Legacy Encrypted Message]";
            }

            return {
                _id: m._id,
                chatId: m.chatId,
                senderId: m.senderId,
                content: plainContent, // Frontend always receives 'content'
                createdAt: m.createdAt,
                status: m.status
            };
        });

        res.status(200).json({
            success: true,
            data: decryptedMessages
        });
    } catch (error) {
        console.error("Get Messages Error", error);
        res.status(500).json({ success: false, message: 'Server error fetching messages' });
    }
};

// @desc    Send a plain text message
// @route   POST /api/chat/:chatId/messages
// @access  Private
exports.sendMessage = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { content } = req.body;
        const senderId = req.user._id;

        if (!content) {
            return res.status(400).json({ success: false, message: 'Message content required' });
        }

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ success: false, message: 'Chat not found' });
        }

        // Verify sender is participant
        if (!chat.participants.includes(senderId)) {
            return res.status(403).json({ success: false, message: 'Not authorized to send to this chat' });
        }

        const receiverId = chat.participants.find(p => p.toString() !== senderId.toString());

        // Auto-unhide
        if (receiverId && chat.hiddenFor && chat.hiddenFor.includes(receiverId)) {
            chat.hiddenFor = chat.hiddenFor.filter(id => id.toString() !== receiverId.toString());
        }
        if (chat.hiddenFor && chat.hiddenFor.includes(senderId)) {
            chat.hiddenFor = chat.hiddenFor.filter(id => id.toString() !== senderId.toString());
        }
        await chat.save();

        let status = 'sent';
        if (receiverId && isUserOnline(receiverId)) {
            status = 'delivered';
        }

        // SERVER-SIDE ENCRYPTION (Step 2)
        // Store encryptedContent. Do NOT store plain 'content'.
        const encryptedContent = encrypt(content);

        const message = await Message.create({
            chatId,
            senderId,
            encryptedContent: encryptedContent,
            status
        });

        // Real-time Sync
        const io = getIO();

        // Emit decrypted/plain content to room (authorized users active in room)
        // Frontend expects 'content'
        io.to(`chat:${chatId}`).emit('new-message', {
            _id: message._id,
            chatId,
            senderId,
            content: content, // Send plain text via socket (TLS secured)
            createdAt: message.createdAt,
            status: message.status
        });

        if (status === 'delivered' && receiverId) {
            emitToUser(senderId, 'message-delivered', { messageId: message._id, chatId, status: 'delivered' });
        }

        res.status(201).json({
            success: true,
            data: {
                _id: message._id,
                chatId,
                senderId,
                content: content, // Return plain text to sender
                createdAt: message.createdAt,
                status: message.status
            }
        });
    } catch (error) {
        console.error("Send Error", error);
        res.status(500).json({ success: false, message: 'Server error sending message' });
    }
};

// @desc    Delete a message
// @route   DELETE /api/chat/messages/:messageId
// @access  Private
exports.deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        if (message.senderId.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this message' });
        }

        // Hard delete as requested
        await Message.findByIdAndDelete(messageId);

        // Notify UI
        const io = getIO();
        io.to(`chat:${message.chatId}`).emit('message-deleted', { messageId });

        res.status(200).json({ success: true, message: 'Message deleted' });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error deleting message' });
    }
};
// @desc    Mark messages as read
// @route   POST /api/chat/:chatId/read
// @access  Private
exports.markMessagesRead = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user._id;

        // Find all messages in this chat sent by the OTHER person that are not yet 'read'
        // We need to know who the other person is, or just say "senderId != userId"

        const result = await Message.updateMany(
            { chatId, senderId: { $ne: userId }, status: { $ne: 'read' } },
            { $set: { status: 'read' } }
        );

        if (result.modifiedCount > 0) {
            const io = getIO();
            // Emit to the room so the sender sees the update
            io.to(`chat:${chatId}`).emit('message-read', { chatId, readerId: userId });
        }

        res.status(200).json({ success: true, count: result.modifiedCount });

    } catch (error) {
        console.error('Mark Read Error:', error);
        res.status(500).json({ success: false, message: 'Server error marking messages read' });
    }
};

// @desc    Delete (Hide) a chat
// @route   DELETE /api/chat/:chatId
// @access  Private
exports.deleteChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user._id;

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ success: false, message: 'Chat not found' });
        }

        // Verify participant
        if (!chat.participants.includes(userId)) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Add to hiddenFor if not already there
        if (!chat.hiddenFor.includes(userId)) {
            chat.hiddenFor.push(userId);
        }

        // Check if ALL participants have hidden the chat
        const allHidden = chat.participants.every(p =>
            chat.hiddenFor.some(h => h.toString() === p.toString())
        );

        if (allHidden) {
            // Permanent Delete
            await Message.deleteMany({ chatId });
            await Chat.findByIdAndDelete(chatId);
            return res.status(200).json({ success: true, message: 'Chat permanently deleted for everyone' });
        }

        await chat.save();
        res.status(200).json({ success: true, message: 'Chat deleted' });

    } catch (error) {
        console.error('Delete Chat Error:', error);
        res.status(500).json({ success: false, message: 'Server error deleting chat' });
    }
};
