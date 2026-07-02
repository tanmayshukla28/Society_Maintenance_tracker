const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');
const ctrl = require('../controllers/complaintController');

router.use(authMiddleware);

router.get('/categories', ctrl.getCategories);
router.post('/', requireRole('resident'), upload.single('photo'), ctrl.createComplaint);
router.get('/mine', requireRole('resident'), ctrl.myComplaints);
router.get('/', requireRole('admin'), ctrl.allComplaints);
router.get('/:id/history', ctrl.complaintHistory); // resident (own) or admin
router.patch('/:id/status', requireRole('admin'), ctrl.updateStatus);
router.patch('/:id/priority', requireRole('admin'), ctrl.updatePriority);

module.exports = router;
