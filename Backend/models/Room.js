const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
    {
        roomId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        name: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: false
        },
        type: {
            type: String,
            enum: ['public', 'private'], // Expandable
            default: 'public'
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Room', roomSchema);
