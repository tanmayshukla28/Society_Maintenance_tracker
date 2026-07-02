const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const { createNotice, listNotices } = require('../controllers/noticeController');

router.use(authMiddleware);

router.get('/', listNotices); // resident + admin both can view
router.post('/', requireRole('admin'), createNotice);

module.exports = router;
