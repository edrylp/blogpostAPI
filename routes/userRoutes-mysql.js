const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/protect-mysql')
const userController = require('../controllers/userController-mysql')

// Register
router.post('/register', userController.register)

// Login
router.post('/login', userController.login)

// Get Details
router.get('/profile', protect, userController.getUserDetails)

// Change Password
router.post('/change-password', protect, userController.changePassword)

module.exports = router;
