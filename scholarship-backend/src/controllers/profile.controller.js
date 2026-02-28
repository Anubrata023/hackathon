// src/controllers/profile.controller.js
const prisma  = require('../config/database').prisma;
const { AppError } = require('../middleware/errorHandler');

exports.getProfile = async (req, res, next) => {
  try {
    const profile = await prisma.studentProfile.findUnique({
      where:   { userId: req.user.id },
      include: { documents: { orderBy: { uploadedAt: 'desc' } } },
    });
    if (!profile) return res.json({ success: true, data: null });
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
};

exports.createProfile = async (req, res, next) => {
  try {
    const existing = await prisma.studentProfile.findUnique({ where: { userId: req.user.id } });
    if (existing) throw new AppError('Profile already exists. Use PUT to update.', 409);

    const profile = await prisma.studentProfile.create({
      data: { ...req.body, userId: req.user.id },
    });
    res.status(201).json({ success: true, data: profile });
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    // Disallow changing bank details via this endpoint
    const { bankAccountNo, bankName, bankIFSC, bankBranch, ...safeData } = req.body;

    const profile = await prisma.studentProfile.update({
      where: { userId: req.user.id },
      data:  safeData,
    });
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
};

exports.updateBankDetails = async (req, res, next) => {
  try {
    const { bankAccountNo, bankName, bankIFSC, bankBranch } = req.body;
    if (!bankAccountNo || !bankIFSC) throw new AppError('Account number and IFSC are required', 400);

    const profile = await prisma.studentProfile.update({
      where: { userId: req.user.id },
      data:  { bankAccountNo, bankName, bankIFSC, bankBranch },
    });
    res.json({ success: true, data: { bankAccountNo: profile.bankAccountNo, bankName: profile.bankName } });
  } catch (err) { next(err); }
};
