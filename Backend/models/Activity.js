const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            required: true,
            enum: [
                'SKILL_ADDED',
                'SKILL_REQUESTED',
                'EXCHANGE_ACCEPTED',
                'EXCHANGE_COMPLETED',
                'RATING_RECEIVED',
                'JOINED_COMMUNITY',
            ],
        },
        details: {
            type: String,
            required: true,
        },
        meta: {
            targetId: { type: mongoose.Schema.Types.ObjectId },
            targetName: { type: String },
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Activity', activitySchema);
