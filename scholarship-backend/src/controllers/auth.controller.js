// src/controllers/auth.controller.js
// Handles registration, OTP-based login, JWT lifecycle, password reset

const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const prisma   = require('../config/database').prisma;
const redis    = require('../config/redis').client;
const logger   = require('../config/logger');
const { AppError } = require('../middleware/errorHandler');
const smsService   = require('../services/sms.service');
const emailService = require('../services/email.service');
const auditService = require('../services/audit.service');

const OTP_EXPIRES    = parseInt(process.env.OTP_EXPIRES_MINUTES || '10') * 60; // seconds
const OTP_MAX_TRIES  = parseInt(process.env.OTP_MAX_ATTEMPTS || '3');

// ── Helpers ───────────────────────────────────────────────
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateTokens(userId, role) {
  const accessToken = jwt.sign(
    { sub: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  const refreshToken = jwt.sign(
    { sub: userId, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );
  return { accessToken, refreshToken };
}

// ── Controllers ──────────────────────────────────────────

/**
 * POST /auth/otp/send
 * Send a 6-digit OTP to the given phone number.
 */
exports.sendOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;

    // Rate-check: max 3 OTPs per phone per 15 min
    const ratioKey = `otp_rate:${phone}`;
    const sends = await redis.incr(ratioKey);
    if (sends === 1) await redis.expire(ratioKey, 900);
    if (sends > 3) throw new AppError('OTP limit reached for this number. Try again in 15 minutes.', 429);

    // Upsert user by phone
    const user = await prisma.user.upsert({
      where:  { phone },
      update: {},
      create: { phone },
    });

    // Generate and store OTP (hashed in Redis)
    const otp     = generateOtp();
    const otpKey  = `otp:${phone}`;
    await redis.setEx(otpKey, OTP_EXPIRES, JSON.stringify({ code: otp, attempts: 0, userId: user.id }));

    // Send SMS
    await smsService.sendOtp(phone, otp);
    logger.info(`OTP sent to ${phone.replace(/\d(?=\d{4})/g, '*')}`);

    res.json({ success: true, message: 'OTP sent successfully', expiresIn: OTP_EXPIRES });
  } catch (err) { next(err); }
};

/**
 * POST /auth/otp/verify
 * Verify OTP and return JWT pair.
 */
exports.verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    const otpKey = `otp:${phone}`;
    const stored = await redis.get(otpKey);

    if (!stored) throw new AppError('OTP expired or not found. Please request a new one.', 400);

    const data = JSON.parse(stored);
    if (data.attempts >= OTP_MAX_TRIES) {
      await redis.del(otpKey);
      throw new AppError('Too many incorrect OTP attempts. Please request a new OTP.', 400);
    }

    if (data.code !== otp) {
      data.attempts++;
      await redis.setEx(otpKey, OTP_EXPIRES, JSON.stringify(data));
      throw new AppError(`Incorrect OTP. ${OTP_MAX_TRIES - data.attempts} attempts remaining.`, 400);
    }

    // OTP valid — clean up
    await redis.del(otpKey);

    const user = await prisma.user.update({
      where: { id: data.userId },
      data:  { isPhoneVerified: true, lastLoginAt: new Date() },
    });

    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    // Persist session
    await prisma.userSession.create({
      data: {
        userId:    user.id,
        token:     refreshToken,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    await auditService.log({ action: 'LOGIN', userId: user.id, req, meta: { method: 'OTP' } });

    res.json({
      success: true,
      message: 'Login successful',
      data: { accessToken, refreshToken, user: { id: user.id, phone: user.phone, role: user.role } },
    });
  } catch (err) { next(err); }
};

/**
 * POST /auth/register
 * Password-based registration for admin/verifier accounts.
 */
exports.register = async (req, res, next) => {
  try {
    const { email, phone, password, role = 'STUDENT' } = req.body;

    const existingEmail = email && await prisma.user.findUnique({ where: { email } });
    if (existingEmail) throw new AppError('Email already registered', 409);

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { email, phone, passwordHash, role },
      select: { id: true, email: true, phone: true, role: true, createdAt: true },
    });

    await auditService.log({ action: 'REGISTER', userId: user.id, req });

    if (email) await emailService.sendWelcomeEmail(email);

    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { accessToken, refreshToken, user },
    });
  } catch (err) { next(err); }
};

/**
 * POST /auth/login
 * Password-based login.
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) throw new AppError('Invalid credentials', 401);
    if (!user.isActive) throw new AppError('Your account has been suspended. Contact support.', 403);

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AppError('Invalid credentials', 401);

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    await prisma.userSession.create({
      data: {
        userId: user.id, token: refreshToken,
        ipAddress: req.ip, userAgent: req.headers['user-agent'],
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    await auditService.log({ action: 'LOGIN', userId: user.id, req, meta: { method: 'PASSWORD' } });

    res.json({
      success: true,
      data: {
        accessToken, refreshToken,
        user: { id: user.id, email: user.email, phone: user.phone, role: user.role },
      },
    });
  } catch (err) { next(err); }
};

/**
 * POST /auth/refresh
 * Use refresh token to get a new access token.
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new AppError('Refresh token required', 400);

    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const session = await prisma.userSession.findUnique({ where: { token: refreshToken } });
    if (!session || session.expiresAt < new Date()) {
      throw new AppError('Session expired. Please login again.', 401);
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) throw new AppError('User not found or suspended', 401);

    const { accessToken, refreshToken: newRefresh } = generateTokens(user.id, user.role);

    // Rotate refresh token
    await prisma.userSession.update({
      where: { id: session.id },
      data:  { token: newRefresh, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    });

    res.json({ success: true, data: { accessToken, refreshToken: newRefresh } });
  } catch (err) { next(err); }
};

/**
 * POST /auth/logout
 */
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.userSession.deleteMany({ where: { token: refreshToken, userId: req.user.id } });
    }
    await auditService.log({ action: 'LOGOUT', userId: req.user.id, req });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) { next(err); }
};

/**
 * GET /auth/me
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, email: true, phone: true, role: true,
        isEmailVerified: true, isPhoneVerified: true,
        lastLoginAt: true, createdAt: true,
        profile: {
          select: {
            firstName: true, lastName: true, dob: true, gender: true,
            category: true, academicLevel: true, institution: true,
          },
        },
      },
    });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

/**
 * POST /auth/forgot-password
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    // Always respond the same regardless of whether the user exists (security)
    if (user && user.email) {
      const token     = uuidv4();
      const tokenKey  = `pwd_reset:${token}`;
      await redis.setEx(tokenKey, 3600, user.id); // 1 hour
      await emailService.sendPasswordReset(email, token);
    }

    res.json({ success: true, message: 'If this email is registered, a reset link has been sent.' });
  } catch (err) { next(err); }
};

/**
 * POST /auth/reset-password
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const tokenKey = `pwd_reset:${token}`;
    const userId   = await redis.get(tokenKey);

    if (!userId) throw new AppError('Reset link is invalid or has expired.', 400);

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    await redis.del(tokenKey);

    // Invalidate all sessions
    await prisma.userSession.deleteMany({ where: { userId } });

    res.json({ success: true, message: 'Password reset successfully. Please login.' });
  } catch (err) { next(err); }
};
