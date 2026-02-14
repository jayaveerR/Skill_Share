const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
    {
        chatId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Chat',
            required: true,
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        // Store ONLY encrypted content
        encryptedContent: {
            type: String,
            required: true
        },
        // Encrypted payload (Legacy/Optional)
        contentCiphertext: {
            type: String,
            required: false
        },
        iv: {
            type: String,
            required: false
        },
        authTag: {
            type: String,
            required: false
        },
        deleted: {
            type: Boolean,
            default: false
        },
        status: {
            type: String,
            enum: ['sent', 'delivered', 'read'],
            default: 'sent'
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Message', messageSchema);
