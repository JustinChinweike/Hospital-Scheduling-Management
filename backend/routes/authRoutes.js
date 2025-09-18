
import express from 'express';
import { 
  register, 
  login, 
  getCurrentUser, 
  setup2FA, 
  verify2FA, 
  disable2FA,
  updateProfile,
  changePassword,
  startEmailChange,
  verifyEmailChange,
  listSessions,
  revokeSession,
  revokeOtherSessions,
  getMyLogs,
  startPasswordReset,
  verifyPasswordReset
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { avatarUpload } from '../middleware/upload.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', rateLimiter({ max: 7, windowMs: 5 * 60 * 1000, key: (req) => req.body?.email || req.ip }), login);
router.get('/me', authenticate, getCurrentUser);
router.post('/2fa/setup', authenticate, setup2FA);
router.post('/2fa/verify', authenticate, verify2FA);
router.post('/2fa/disable', authenticate, disable2FA);
router.patch('/profile', authenticate, updateProfile);
router.post('/change-password', authenticate, changePassword);
router.get('/sessions', authenticate, listSessions);
router.delete('/sessions/:id', authenticate, revokeSession);
router.post('/sessions/revoke-others', authenticate, revokeOtherSessions);
router.post('/email-change/start', authenticate, startEmailChange);
router.post('/email-change/verify', authenticate, verifyEmailChange);
router.get('/my-logs', authenticate, getMyLogs);

// Password reset (no auth required)
router.post('/password-reset/start', rateLimiter({ max: 5, windowMs: 10 * 60 * 1000, key: (req) => req.body?.email || req.ip }), startPasswordReset);
router.post('/password-reset/verify', rateLimiter({ max: 10, windowMs: 10 * 60 * 1000, key: (req) => req.ip }), verifyPasswordReset);

// Avatar upload
router.post('/avatar', authenticate, avatarUpload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const url = `/uploads/avatars/${req.file.filename}`;
    await req.user.update({ avatarUrl: url });
    res.json({ message: 'Avatar updated', avatarUrl: url });
  } catch (e) {
    res.status(500).json({ message: 'Upload failed', error: e.message });
  }
});

router.delete('/avatar', authenticate, async (req, res) => {
  try {
    await req.user.update({ avatarUrl: null });
    res.json({ message: 'Avatar removed' });
  } catch (e) {
    res.status(500).json({ message: 'Delete failed', error: e.message });
  }
});

// Sessions and email change and logs can be added similarly later (stubs)

export default router;
