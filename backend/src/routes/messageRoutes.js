const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');

// All message routes are protected
router.use(authMiddleware);

router.get('/conversations', messageController.getConversations);
router.get('/unread-count', messageController.getUnreadCount);
router.get('/history/:otherUserId', messageController.getMessages);

router.post('/', messageController.sendMessage);
router.put('/read-all', messageController.markAsRead);
router.put('/read-single/:messageId', messageController.markSingleAsRead);
router.delete('/:id', messageController.deleteMessage);
router.delete('/conversation/:otherUserId', messageController.deleteConversation);

module.exports = router;
