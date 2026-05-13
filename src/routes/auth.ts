import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { getUserById, loginUser, registerUser } from '../services/authService';

const router = Router();

const registerValidation = [
  body('username').trim().isLength({ min: 3, max: 30 }).isAlphanumeric(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('fullName').trim().notEmpty().withMessage('Full name is required').isLength({ max: 100 }),
  body('credentials').trim().notEmpty().withMessage('Credentials are required').isLength({ max: 100 }),
];

const loginValidation = [
  body('username').trim().notEmpty(),
  body('password').notEmpty(),
];

router.post('/register', registerValidation, async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  try {
    const user = await registerUser({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      full_name: req.body.fullName,
      credentials: req.body.credentials,
    });
    req.session.userId = user.id;
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
});

router.post('/login', loginValidation, async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  try {
    const user = await loginUser(req.body.username, req.body.password);
    req.session.userId = user.id;
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req: Request, res: Response, next: NextFunction) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out' });
  });
});

// Returns the current session user — used by the SPA on page load to restore auth state
router.get('/me', (req: Request, res: Response) => {
  if (!req.session.userId) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  try {
    const user = getUserById(req.session.userId);
    res.json({ user });
  } catch {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

export default router;
