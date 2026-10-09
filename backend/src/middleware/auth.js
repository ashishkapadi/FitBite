import jwt from 'jsonwebtoken';
import { db } from '../db/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fitbite-super-secure-dev-jwt-secret-key-2026';

export function isDemoUser(user) {
  if (!user) return false;
  if (user.is_demo === true || user.is_demo === 1) return true;
  if (typeof user.email === 'string' && user.email.toLowerCase().endsWith('@fitbite.demo')) return true;
  const demoIds = new Set([
    'user_cust_01',
    'user_cust_family',
    'user_sell_01',
    'user_sell_02',
    'user_sell_03',
    'user_sell_04',
    'user_sell_05',
    'user_sell_06',
    'user_sell_07',
    'user_sell_08',
    'user_sell_pending',
    'user_admin_01',
    'user_deliv_01'
  ]);
  return demoIds.has(user.id);
}

export function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      is_demo: isDemoUser(user)
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function requireAuth(req, res, next) {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.fitbite_token) {
      token = req.cookies.fitbite_token;
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.findOne('users', { id: decoded.id });

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'User account not found or deactivated.' });
    }

    user.is_demo = isDemoUser(user);
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session token. Please sign in again.' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Requires one of roles: [${roles.join(', ')}]. Current role: ${req.user.role}`
      });
    }
    next();
  };
}
