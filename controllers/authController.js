const db = require('../config/database-simple');
const { generateToken, generateOTP, getOTPExpiry, sendOTP, formatPhone } = require('../utils/helpers');

/**
 * Send OTP for Login/Signup
 * POST /api/auth/send-otp
 */
exports.sendOTPController = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Format phone number
    const formattedPhone = formatPhone(phone);

    // Generate OTP
    const otp = generateOTP(6);
    const expiresAt = getOTPExpiry(10); // 10 minutes

    // Save OTP to database
    db.insert('otps', {
      phone: formattedPhone,
      otp_code: otp,
      purpose: 'login',
      is_verified: 0,
      expires_at: expiresAt
    });

    // Send OTP via SMS
    await sendOTP(formattedPhone, otp);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        phone: formattedPhone,
        expiresIn: '10 minutes',
        // Always return OTP in development/testing
        otp: otp
      }
    });

  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message
    });
  }
};

/**
 * Verify OTP and Login/Signup
 * POST /api/auth/verify-otp
 */
exports.verifyOTPController = async (req, res) => {
  try {
    const { phone, otp, name, email } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP are required'
      });
    }

    const formattedPhone = formatPhone(phone);

    // Check if OTP is valid and not expired
    const otps = db.find('otps', { phone: formattedPhone, otp_code: otp, is_verified: 0 })
      .filter(otp => new Date(otp.expires_at) > new Date())
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const otpRecord = otps.length > 0 ? otps[0] : null;

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Mark OTP as verified
    db.update('otps', { id: otpRecord.id }, { is_verified: 1 });

    const isAadhaar = formattedPhone.length === 12;

    // Check if user exists
    let user;
    if (isAadhaar) {
      // Check aadhaar field or fallback to phone field if saved incorrectly in previous sessions
      user = db.findOne('users', { aadhaar: formattedPhone }) || db.findOne('users', { phone: formattedPhone });
    } else {
      user = db.findOne('users', { phone: formattedPhone });
    }

    if (!user) {
      // Create new user (Signup)
      user = db.insert('users', {
        phone: isAadhaar ? null : formattedPhone,
        aadhaar: isAadhaar ? formattedPhone : null,
        name: name || null,
        email: email || null,
        role: 'citizen',
        is_active: 1
      });
    } else {
      // Update existing user if name/email provided, or fix legacy aadhaar mapping
      const updates = {};
      if (name && name !== user.name) updates.name = name;
      if (email && email !== user.email) updates.email = email;
      
      // Fix if 12-digit was saved to phone field previously
      if (isAadhaar && user.phone === formattedPhone) {
        updates.phone = null;
        updates.aadhaar = formattedPhone;
      }

      if (Object.keys(updates).length > 0) {
        db.update('users', { id: user.id }, updates);
        user = db.findOne('users', { id: user.id });
      }
    }

    // Generate JWT token
    const token = generateToken(user.id, user.phone, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          phone: user.phone,
          aadhaar: user.aadhaar,
          name: user.name,
          email: user.email,
          role: user.role,
          district: user.district,
          address: user.address
        }
      }
    });

  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
      error: error.message
    });
  }
};

/**
 * Get Current User Profile
 * GET /api/auth/me
 */
exports.getMeController = (req, res) => {
  try {
    const user = db.findOne('users', { id: req.user.id });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove sensitive fields
    const { password, ...userProfile } = user;

    res.status(200).json({
      success: true,
      data: userProfile
    });

  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
};

/**
 * Update User Profile
 * PUT /api/auth/profile
 */
exports.updateProfileController = (req, res) => {
  try {
    const { name, email, district, address } = req.body;

    db.update('users', { id: req.user.id }, {
      ...(name && { name }),
      ...(email && { email }),
      ...(district && { district }),
      ...(address && { address })
    });

    const updatedUser = db.findOne('users', { id: req.user.id });
    const { password, ...userProfile } = updatedUser;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: userProfile
    });

  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

/**
 * Logout (Client-side token deletion)
 * POST /api/auth/logout
 */
exports.logoutController = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};
