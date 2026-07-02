const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const { getOverdueThreshold, updateOverdueThreshold } = require('../controllers/settingsController');

router.get('/overdue-threshold', authMiddleware, requireRole('admin'), getOverdueThreshold);
router.patch('/overdue-threshold', authMiddleware, requireRole('admin'), updateOverdueThreshold);

module.exports = router;
