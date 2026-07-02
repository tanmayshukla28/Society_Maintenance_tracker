const prisma = require('../config/db');
const { annotateOverdue } = require('../services/overdueService');

async function summary(req, res, next) {
  try {
    const complaints = await prisma.complaint.findMany({ include: { category: true } });
    const annotated = await annotateOverdue(complaints);

    const byStatus = {};
    const byCategory = {};
    let overdueCount = 0;

    for (const c of annotated) {
      byStatus[c.status] = (byStatus[c.status] || 0) + 1;
      const catName = c.category?.name || 'Unknown';
      byCategory[catName] = (byCategory[catName] || 0) + 1;
      if (c.isOverdue) overdueCount += 1;
    }

    res.json({
      total: annotated.length,
      byStatus,
      byCategory,
      overdueCount,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { summary };
