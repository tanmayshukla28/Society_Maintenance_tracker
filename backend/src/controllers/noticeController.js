const prisma = require('../config/db');
const { sendImportantNoticeEmail } = require('../services/emailService');

async function createNotice(req, res, next) {
  try {
    const { title, content, isImportant } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'title and content are required' });
    }

    const notice = await prisma.notice.create({
      data: { title, content, isImportant: !!isImportant, postedById: req.user.id },
    });

    if (notice.isImportant) {
      const residents = await prisma.user.findMany({ where: { role: 'resident' }, select: { name: true, email: true } });
      // Fire-and-forget: don't block the API response on bulk email sending.
      sendImportantNoticeEmail(residents, notice).catch(() => {});
    }

    res.status(201).json(notice);
  } catch (err) {
    next(err);
  }
}

async function listNotices(req, res, next) {
  try {
    const notices = await prisma.notice.findMany({
      include: { postedBy: { select: { name: true } } },
      orderBy: [{ isImportant: 'desc' }, { createdAt: 'desc' }],
    });
    res.json(notices);
  } catch (err) {
    next(err);
  }
}

module.exports = { createNotice, listNotices };
