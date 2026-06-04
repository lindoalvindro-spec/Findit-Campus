const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.get('/', itemController.getItems);
router.get('/:id', itemController.getItemById);

// Protected routes
router.post('/', authMiddleware, itemController.createItem);
router.put('/:id', authMiddleware, itemController.updateItem);
router.delete('/:id', authMiddleware, itemController.deleteItem);

module.exports = router;
