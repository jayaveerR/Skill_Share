const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
    {
        participants: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }],
        linkedRequestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Request',
            required: true,
            unique: true
        },
        encryptionKey: {
            type: String, // base64 encoded 32-byte key
            required: false
        },
        hiddenFor: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }]
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Chat', chatSchema);
