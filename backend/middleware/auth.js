
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Session from '../models/Session.js';

dotenv.config();

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If token has jti (new tokens), verify it's an active session
    if (decoded.jti) {
      const session = await Session.findOne({ where: { userId: user.id, tokenId: decoded.jti } });
      if (!session || session.revoked) {
        return res.status(401).json({ message: 'Session revoked or not found' });
      }
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};
