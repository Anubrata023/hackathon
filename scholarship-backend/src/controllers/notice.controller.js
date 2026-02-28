// src/controllers/notice.controller.js
const prisma  = require('../config/database').prisma;
const slugify = require('slugify');
const { AppError } = require('../middleware/errorHandler');

exports.listNotices = async (req, res, next) => {
  try {
    const { tag, limit = 20, page = 1 } = req.query;
    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const where = { isActive: true };
    if (tag) where.tag = tag;

    const [notices, total] = await Promise.all([
      prisma.notice.findMany({
        where, skip, take: parseInt(limit),
        orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
      }),
      prisma.notice.count({ where }),
    ]);

    res.json({ success: true, data: notices, meta: { total } });
  } catch (err) { next(err); }
};

exports.getNotice = async (req, res, next) => {
  try {
    const notice = await prisma.notice.findUnique({ where: { slug: req.params.slug } });
    if (!notice) throw new AppError('Notice not found', 404);
    res.json({ success: true, data: notice });
  } catch (err) { next(err); }
};

exports.createNotice = async (req, res, next) => {
  try {
    const { title, ...rest } = req.body;
    let slug = slugify(title, { lower: true, strict: true });
    const existing = await prisma.notice.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    const notice = await prisma.notice.create({ data: { title, slug, ...rest } });
    res.status(201).json({ success: true, data: notice });
  } catch (err) { next(err); }
};

exports.updateNotice = async (req, res, next) => {
  try {
    const notice = await prisma.notice.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: notice });
  } catch (err) { next(err); }
};

exports.deleteNotice = async (req, res, next) => {
  try {
    await prisma.notice.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true, message: 'Notice deactivated' });
  } catch (err) { next(err); }
};
