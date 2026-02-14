const express = require('express');
const router = express.Router();
const {
    getChatSession,
    getMessages,
    sendMessage,
    deleteMessage,
    markMessagesRead,
    deleteChat
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/session', getChatSession);
router.get('/:chatId/messages', getMessages);
router.post('/:chatId/messages', sendMessage);
router.delete('/messages/:messageId', protect, deleteMessage);
router.post('/:chatId/read', protect, markMessagesRead);
router.delete('/:chatId', protect, deleteChat);

module.exports = router;
