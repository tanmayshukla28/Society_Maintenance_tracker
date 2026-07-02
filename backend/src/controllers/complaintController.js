const prisma = require('../config/db');
const { logStatusChange } = require('../services/historyService');
const { annotateOverdue, getOverdueThresholdDays } = require('../services/overdueService');
const { sendStatusChangeEmail } = require('../services/emailService');

// Valid forward transitions for the complaint lifecycle.
// Once Resolved, a complaint is closed and cannot be changed further.
const VALID_TRANSITIONS = {
  Open: ['InProgress', 'Resolved'],
  InProgress: ['Resolved', 'Open'], // allow reopening from InProgress back to Open if needed
  Resolved: [],
};

function buildPhotoUrl(req) {
  if (!req.file) return null;
  const strategy = process.env.UPLOAD_STRATEGY || 'local';
  if (strategy === 'local') {
    return `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  }
  // If UPLOAD_STRATEGY=cloudinary, req.file.cloudinaryUrl is set by a prior upload step.
  return req.file.cloudinaryUrl || null;
}

async function getCategories(req, res, next) {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    res.json(categories);
  } catch (err) {
    next(err);
  }
}

async function createComplaint(req, res, next) {
  try {
    const { categoryId, description } = req.body;
    if (!categoryId || !description) {
      return res.status(400).json({ error: 'categoryId and description are required' });
    }

    const photoUrl = buildPhotoUrl(req);

    const complaint = await prisma.complaint.create({
      data: {
        residentId: req.user.id,
        categoryId,
        description,
        photoUrl,
        status: 'Open',
      },
    });

    await logStatusChange({
      complaintId: complaint.id,
      actorId: req.user.id,
      oldStatus: null,
      newStatus: 'Open',
      note: 'Complaint raised',
    });

    res.status(201).json(complaint);
  } catch (err) {
    next(err);
  }
}

async function myComplaints(req, res, next) {
  try {
    const complaints = await prisma.complaint.findMany({
      where: { residentId: req.user.id },
      include: {
        category: true,
        history: { orderBy: { changedAt: 'asc' }, include: { actor: { select: { name: true, role: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const annotated = await annotateOverdue(complaints);
    res.json(annotated);
  } catch (err) {
    next(err);
  }
}

async function allComplaints(req, res, next) {
  try {
    const { category, status, from, to } = req.query;
    const where = {};
    if (category) where.categoryId = category;
    if (status) where.status = status;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const complaints = await prisma.complaint.findMany({
      where,
      include: { category: true, resident: { select: { name: true, email: true, flatNumber: true } } },
      orderBy: { createdAt: 'desc' },
    });

    let annotated = await annotateOverdue(complaints);

    // Overdue complaints surface at the top, then by priority, then oldest first.
    const priorityRank = { High: 0, Medium: 1, Low: 2, null: 3 };
    annotated.sort((a, b) => {
      if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
      const pa = priorityRank[a.priority] ?? 3;
      const pb = priorityRank[b.priority] ?? 3;
      if (pa !== pb) return pa - pb;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

    res.json(annotated);
  } catch (err) {
    next(err);
  }
}

async function complaintHistory(req, res, next) {
  try {
    const { id } = req.params;
    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        category: true,
        resident: { select: { name: true, email: true, flatNumber: true } },
        history: { orderBy: { changedAt: 'asc' }, include: { actor: { select: { name: true, role: true } } } },
      },
    });
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

    // Residents can only view their own complaint's history.
    if (req.user.role === 'resident' && complaint.residentId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(complaint);
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status: newStatus, note } = req.body;

    if (!['Open', 'InProgress', 'Resolved'].includes(newStatus)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const complaint = await prisma.complaint.findUnique({ where: { id }, include: { resident: true } });
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

    if (complaint.status === 'Resolved') {
      return res.status(409).json({ error: 'Complaint is already Resolved and closed. No further changes allowed.' });
    }

    const allowedNext = VALID_TRANSITIONS[complaint.status] || [];
    if (!allowedNext.includes(newStatus)) {
      return res.status(400).json({ error: `Cannot move from ${complaint.status} to ${newStatus}` });
    }

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        status: newStatus,
        resolvedAt: newStatus === 'Resolved' ? new Date() : null,
      },
    });

    await logStatusChange({
      complaintId: id,
      actorId: req.user.id,
      oldStatus: complaint.status,
      newStatus,
      note,
    });

    // Fire-and-forget email; failures are logged but don't break the request.
    sendStatusChangeEmail(complaint.resident, complaint, newStatus, note).catch(() => {});

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function updatePriority(req, res, next) {
  try {
    const { id } = req.params;
    const { priority } = req.body;
    if (!['Low', 'Medium', 'High'].includes(priority)) {
      return res.status(400).json({ error: 'priority must be Low, Medium, or High' });
    }

    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

    const updated = await prisma.complaint.update({ where: { id }, data: { priority } });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCategories,
  createComplaint,
  myComplaints,
  allComplaints,
  complaintHistory,
  updateStatus,
  updatePriority,
};
