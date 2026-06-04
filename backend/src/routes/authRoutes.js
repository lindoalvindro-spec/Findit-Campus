const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.get('/verify-reset-token', authController.verifyResetToken);
router.post('/reset-password', authController.resetPassword);


// Protected routes
router.get('/me', authMiddleware, authController.getMe);
router.get('/user/:id', authController.getUserById);
router.put('/profile', authMiddleware, authController.updateProfile);
router.put('/last-seen', authMiddleware, authController.updateLastSeen);

module.exports = router;

