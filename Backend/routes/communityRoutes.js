const express = require('express');
const { getMembers, getStats, getActivities } = require('../controllers/communityController');
const { getRooms, createRoom, getMessages, sendMessage } = require('../controllers/communityChatController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/members', getMembers);
router.get('/stats', getStats);
router.get('/activities', getActivities);

// Community Chat Routes
router.get('/rooms', getRooms); // Can be public to view topics
router.post('/rooms', protect, createRoom); // Create new room
router.get('/rooms/:roomId/messages', protect, getMessages); // Get history
router.post('/rooms/:roomId/messages', protect, sendMessage); // Send message

module.exports = router;
