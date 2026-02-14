const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema(
    {
        skillId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Skill',
            required: true,
        },
        requestedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        requestedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        message: {
            type: String,
            maxlength: [500, 'Message cannot be more than 500 characters'],
        },
        status: {
            type: String,
            enum: ['Pending', 'Accepted', 'InProgress', 'Rejected', 'Completed'],
            default: 'Pending',
        },
        rejectedAt: {
            type: Date,
        },
        moderation: {
            classification: String,
            reason: String,
            suggestion: String
        }
    },
    {
        timestamps: true,
    }
);

// Prevent requesting your own skill
// Prevent requesting your own skill
requestSchema.pre('validate', async function () {
    if (this.requestedBy.toString() === this.requestedTo.toString()) {
        throw new Error('You cannot request your own skill');
    }
});

module.exports = mongoose.model('Request', requestSchema);
