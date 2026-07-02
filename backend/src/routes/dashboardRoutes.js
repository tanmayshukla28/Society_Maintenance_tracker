const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const { summary } = require('../controllers/dashboardController');

router.get('/summary', authMiddleware, requireRole('admin'), summary);

module.exports = router;
