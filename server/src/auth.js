import jwt from 'jsonwebtoken';

export const COOKIE = 'cadence_session';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function setSession(res, userId, secret) {
  const token = jwt.sign({ sub: userId }, secret, { expiresIn: '7d' });
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAX_AGE_MS,
  });
}

export function clearSession(res) {
  res.clearCookie(COOKIE, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
}

export function requireAuth(secret) {
  return (req, res, next) => {
    const token = req.cookies?.[COOKIE];
    if (!token) return res.status(401).json({ error: 'Not signed in' });
    try {
      req.userId = jwt.verify(token, secret).sub;
      next();
    } catch {
      clearSession(res);
      res.status(401).json({ error: 'Session expired' });
    }
  };
}
