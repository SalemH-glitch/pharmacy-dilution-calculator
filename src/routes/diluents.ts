import { Router, Request, Response, NextFunction } from 'express';
import db from '../database/db';

const router = Router();

// Public — reference data needed to populate the calculator form before login
router.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const diluents = [...db.data.diluents].sort(
      (a, b) => a.concentration_percent - b.concentration_percent
    );
    res.json({ diluents });
  } catch (err) {
    next(err);
  }
});

export default router;
