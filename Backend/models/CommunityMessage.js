const mongoose = require('mongoose');

const communityMessageSchema = new mongoose.Schema(
    {
        roomId: {
            type: String, // Referencing Room.roomId (string) for easier lookups, or ObjectId. Let's use string roomId as per prompt which usually implies topic names like 'frontend'.
            required: true,
            ref: 'Room' // This might not work perfectly with String ID if not configured, but good for doc.
        },
        roomRef: { // Actual ObjectId reference if needed, but Prompt emphasizes "Topic based group chat".
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Room'
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        encryptedContent: {
            type: String,
            required: true
        },
        isDeleted: {
            type: Boolean,
            default: false
        },
        // Optional: for replies or threads
        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CommunityMessage'
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('CommunityMessage', communityMessageSchema);
