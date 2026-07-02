const prisma = require('../config/db');

/**
 * Appends a row to the complaint status history log.
 * This is the core audit trail: every status change is immutable once written.
 */
async function logStatusChange({ complaintId, actorId, oldStatus, newStatus, note }) {
  return prisma.complaintHistory.create({
    data: { complaintId, actorId, oldStatus, newStatus, note: note || null },
  });
}

module.exports = { logStatusChange };
