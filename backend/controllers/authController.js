
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import User from '../models/User.js';
import Log from '../models/Log.js';
import Session from '../models/Session.js';
import EmailChangeRequest from '../models/EmailChangeRequest.js';
import PasswordResetRequest from '../models/PasswordResetRequest.js';
import { sendMail } from '../utils/mailer.js';
import { Op } from 'sequelize';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

// Register a new user
export const register = async (req, res) => {
  try {
    let { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'username, email, password required' });
    }
    username = username.trim();
    email = email.toLowerCase().trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      password,
      role: 'USER', // Default role for new users
    });

    // Generate JWT token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
        avatarUrl: user.avatarUrl || null,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    let { email, password, twoFactorCode } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password required' });
    }
    email = email.toLowerCase().trim();

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Record failed login attempt with pseudo entity id (email)
      await Log.create({
        userId: null,
        action: 'READ',
        entityType: 'AUTH_FAIL',
        entityId: email
      }).catch(() => {});
      return res.status(404).json({ message: 'User not found' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await Log.create({
        userId: user.id,
        action: 'READ',
        entityType: 'AUTH_FAIL',
        entityId: user.id
      }).catch(() => {});
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // If 2FA is enabled, verify the code
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        return res.status(200).json({ 
          requiresTwoFactor: true,
          message: 'Two-factor authentication code required' 
        });
      }

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode,
        window: 2
      });

      if (!verified) {
        await Log.create({
          userId: user.id,
          action: 'READ',
          entityType: 'AUTH_FAIL_2FA',
          entityId: user.id
        }).catch(() => {});
        return res.status(401).json({ message: 'Invalid two-factor authentication code' });
      }
    }

    // Generate JWT token with jti for session tracking
    const jti = crypto.randomUUID();
    const token = jwt.sign({ id: user.id, jti }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    // Record session
    try {
      await Session.create({
        userId: user.id,
        tokenId: jti,
        userAgent: req.headers['user-agent'] || '',
        ip: (req.headers['x-forwarded-for'] || req.ip || '').toString(),
      });
    } catch (_) {}

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
        avatarUrl: user.avatarUrl || null,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'twoFactorSecret'] },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Setup 2FA
export const setup2FA = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Hospital Scheduler (${user.email})`,
      issuer: 'Hospital Scheduler'
    });

    // Update user with the secret (but don't enable 2FA yet)
    await user.update({ twoFactorSecret: secret.base32 });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Verify and enable 2FA
export const verify2FA = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ message: 'Two-factor setup not initiated' });
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Enable 2FA
    await user.update({ twoFactorEnabled: true });

    res.json({ message: 'Two-factor authentication enabled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Disable 2FA
export const disable2FA = async (req, res) => {
  try {
    const { password, twoFactorCode } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Verify 2FA code if 2FA is enabled
    if (user.twoFactorEnabled) {
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode,
        window: 2
      });

      if (!verified) {
        return res.status(400).json({ message: 'Invalid two-factor authentication code' });
      }
    }

    // Disable 2FA
    await user.update({ 
      twoFactorEnabled: false,
      twoFactorSecret: null 
    });

    res.json({ message: 'Two-factor authentication disabled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update profile (currently only username)
export const updateProfile = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ message: 'Username is required' });
    }
    const existing = await User.findOne({ where: { username: username.trim() } });
    if (existing && existing.id !== req.user.id) {
      return res.status(409).json({ message: 'Username already taken' });
    }
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.username = username.trim();
    await user.save();
    return res.json({ message: 'Profile updated', user: { id: user.id, username: user.username, email: user.email, role: user.role, twoFactorEnabled: user.twoFactorEnabled, avatarUrl: user.avatarUrl || null } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both currentPassword and newPassword required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const match = await user.comparePassword(currentPassword);
    if (!match) return res.status(401).json({ message: 'Current password incorrect' });
    // Optional: breach check (non-blocking warning)
    try {
      const sha1 = crypto.createHash('sha1').update(newPassword).digest('hex').toUpperCase();
      const prefix = sha1.slice(0,5);
      const suffix = sha1.slice(5);
      const resp = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
      if (resp.ok) {
        const text = await resp.text();
        const found = text.split('\n').some(line => line.startsWith(suffix));
        if (found) {
          // Do not block, just include warning
          await user.save(); // ensure instance consistent before response
          user.password = newPassword; // will be hashed by hook on subsequent save
          await user.save();
          return res.json({ message: 'Password changed successfully (warning: appears in breach database)' });
        }
      }
    } catch (_) {}
    user.password = newPassword; // will be hashed by hook
    await user.save();
    return res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Start email change (send verification token via email)
export const startEmailChange = async (req, res) => {
  try {
    let { newEmail } = req.body;
    if (!newEmail) return res.status(400).json({ message: 'newEmail required' });
    newEmail = newEmail.toLowerCase().trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newEmail)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    const exists = await User.findOne({ where: { email: newEmail } });
    if (exists) return res.status(409).json({ message: 'Email already in use' });
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await EmailChangeRequest.create({ userId: req.user.id, newEmail, token, expiresAt });
    // Send verification email with link
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const link = `${baseUrl}/verify-email-change?token=${encodeURIComponent(token)}`;
    try {
      const { previewUrl } = await sendMail({
        to: newEmail,
        subject: 'Verify your email change',
        text: `Click the link to verify your new email: ${link}`,
        html: `<p>Click the link to verify your new email:</p><p><a href="${link}">${link}</a></p>`
      });
      return res.json({ message: 'Verification email sent', previewUrl });
    } catch (e) {
      // Fallback: email sending unavailable. Return token so user can verify manually.
      return res.json({ message: 'Email sending unavailable. Use the token below to verify.', verificationToken: token });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const verifyEmailChange = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'token required' });
    const reqRec = await EmailChangeRequest.findOne({ where: { token, used: false } });
    if (!reqRec) return res.status(400).json({ message: 'Invalid token' });
    if (reqRec.userId !== req.user.id) return res.status(403).json({ message: 'Token does not belong to this user' });
    if (new Date(reqRec.expiresAt).getTime() < Date.now()) return res.status(400).json({ message: 'Token expired' });
    // Update email
    const user = await User.findByPk(req.user.id);
    user.email = reqRec.newEmail.toLowerCase();
    await user.save();
    reqRec.used = true; await reqRec.save();
    return res.json({ message: 'Email updated successfully', email: user.email });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const listSessions = async (req, res) => {
  try {
    const sessions = await Session.findAll({ where: { userId: req.user.id }, order: [['createdAt', 'DESC']] });
    return res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const revokeSession = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await Session.findByPk(id);
    if (!session || session.userId !== req.user.id) return res.status(404).json({ message: 'Session not found' });
    session.revoked = true; await session.save();
    return res.json({ message: 'Session revoked' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const revokeOtherSessions = async (req, res) => {
  try {
    // If JWT has jti, keep that one active; else revoke all
    const authHeader = req.headers.authorization || '';
    const token = authHeader.split(' ')[1] || '';
    let keepTokenId = null;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      keepTokenId = decoded.jti || null;
    } catch (_) {}
  const where = { userId: req.user.id };
  if (keepTokenId) where.tokenId = { [Op.ne]: keepTokenId };
    await Session.update({ revoked: true }, { where });
    return res.json({ message: 'Other sessions revoked' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getMyLogs = async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const data = await Log.findAll({ where: { userId: req.user.id }, order: [['createdAt','DESC']], limit });
    return res.json({ data });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const startPasswordReset = async (req, res) => {
  try {
    let { email } = req.body;
    if (!email) return res.status(400).json({ message: 'email required' });
    email = email.toLowerCase().trim();
    const user = await User.findOne({ where: { email } });
    // Always respond 200 to avoid user enumeration
    if (!user) return res.json({ message: 'If the email exists, a reset link has been sent' });
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await PasswordResetRequest.create({ userId: user.id, token, expiresAt });
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const link = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
    try {
      const { previewUrl } = await sendMail({
        to: email,
        subject: 'Reset your password',
        text: `Use this link to reset your password: ${link}`,
        html: `<p>Use this link to reset your password:</p><p><a href="${link}">${link}</a></p>`
      });
      return res.json({ message: 'If the email exists, a reset link has been sent', previewUrl });
    } catch (_) {
      return res.json({ message: 'If the email exists, a reset link has been sent', resetToken: token });
    }
  } catch (e) {
    return res.status(500).json({ message: 'Server error', error: e.message });
  }
};

export const verifyPasswordReset = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: 'token and newPassword required' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    const reqRec = await PasswordResetRequest.findOne({ where: { token, used: false } });
    if (!reqRec) return res.status(400).json({ message: 'Invalid token' });
    if (new Date(reqRec.expiresAt).getTime() < Date.now()) return res.status(400).json({ message: 'Token expired' });
    const user = await User.findByPk(reqRec.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.password = newPassword; // hashed by hook
    await user.save();
      // Revoke all existing sessions for security
      try {
        await Session.update({ revoked: true }, { where: { userId: user.id } });
      } catch (_) {}
    reqRec.used = true; await reqRec.save();
    return res.json({ message: 'Password reset successfully' });
  } catch (e) {
    return res.status(500).json({ message: 'Server error', error: e.message });
  }
};
