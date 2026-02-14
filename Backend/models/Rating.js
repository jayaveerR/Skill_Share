const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
    {
        from: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: true,
        },
        to: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: true,
        },
        requestId: {
            type: mongoose.Schema.ObjectId,
            ref: 'Request',
            required: true,
        },
        skillId: {
            type: mongoose.Schema.ObjectId,
            ref: 'Skill',
            required: true,
        },
        score: {
            type: Number,
            required: [true, 'Please add a score from 1 to 5'],
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            maxlength: [200, 'Comment cannot be more than 200 characters'],
        },
    },
    {
        timestamps: true,
    }
);

// Prevent user from rating themselves
ratingSchema.pre('save', async function () {
    if (this.from.toString() === this.to.toString()) {
        throw new Error('You cannot rate yourself');
    }
});

module.exports = mongoose.model('Rating', ratingSchema);
