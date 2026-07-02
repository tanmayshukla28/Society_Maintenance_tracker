const prisma = require('../config/db');

async function getOverdueThreshold(req, res, next) {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'overdue_threshold_days' } });
    res.json({ overdue_threshold_days: setting ? parseInt(setting.value, 10) : 3 });
  } catch (err) {
    next(err);
  }
}

async function updateOverdueThreshold(req, res, next) {
  try {
    const { days } = req.body;
    if (!days || isNaN(days) || days < 1) {
      return res.status(400).json({ error: 'days must be a positive number' });
    }
    const setting = await prisma.setting.upsert({
      where: { key: 'overdue_threshold_days' },
      update: { value: String(days) },
      create: { key: 'overdue_threshold_days', value: String(days) },
    });
    res.json({ overdue_threshold_days: parseInt(setting.value, 10) });
  } catch (err) {
    next(err);
  }
}

module.exports = { getOverdueThreshold, updateOverdueThreshold };
