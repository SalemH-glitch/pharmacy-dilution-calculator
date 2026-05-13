import { Router, Request, Response, NextFunction } from 'express';
import db from '../database/db';

const router = Router();

// Public — reference data needed to populate the calculator form before login
router.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const drugs = [...db.data.drugs].sort((a, b) => a.name.localeCompare(b.name));
    res.json({ drugs });
  } catch (err) {
    next(err);
  }
});

export default router;
