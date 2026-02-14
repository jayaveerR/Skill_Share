const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a skill name'],
            trim: true,
            maxlength: [50, 'Name cannot be more than 50 characters'],
        },
        category: {
            type: String,
            required: [true, 'Please add a category'],
            enum: [
                'Development',
                'Design',
                'Marketing',
                'Business',
                'Music',
                'Language',
                'Photography',
                'Other',
            ],
        },
        level: {
            type: String,
            required: [true, 'Please select a level'],
            enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
        },
        description: {
            type: String,
            required: [true, 'Please add a description'],
            maxlength: [500, 'Description cannot be more than 500 characters'],
        },
        tags: {
            type: [String],
            default: [],
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        viewCount: {
            type: Number,
            default: 0,
        },
        requestCount: {
            type: Number,
            default: 0,
        },
        moderation: {
            classification: String,
            reason: String,
            suggestion: String
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Skill', skillSchema);
