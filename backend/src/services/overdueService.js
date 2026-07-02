const prisma = require('../config/db');

/**
 * Returns the currently configured overdue threshold (in days).
 * Falls back to env var / 3 days if not set in DB yet.
 */
async function getOverdueThresholdDays() {
  const setting = await prisma.setting.findUnique({ where: { key: 'overdue_threshold_days' } });
  if (setting) return parseInt(setting.value, 10);
  return parseInt(process.env.OVERDUE_THRESHOLD_DAYS || '3', 10);
}

/**
 * Given a complaint (with status + createdAt), returns whether it's overdue.
 * A complaint is overdue if it's not yet Resolved and was created more than
 * `thresholdDays` ago. Computed at query-time (no cron dependency needed).
 */
function isOverdue(complaint, thresholdDays) {
  if (complaint.status === 'Resolved') return false;
  const ageMs = Date.now() - new Date(complaint.createdAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return ageDays > thresholdDays;
}

/**
 * Annotates a list of complaints with an `isOverdue` boolean field.
 */
async function annotateOverdue(complaints) {
  const thresholdDays = await getOverdueThresholdDays();
  return complaints.map((c) => ({ ...c, isOverdue: isOverdue(c, thresholdDays) }));
}

module.exports = { getOverdueThresholdDays, isOverdue, annotateOverdue };
