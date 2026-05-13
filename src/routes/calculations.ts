import { Router, Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { calculate } from '../services/dilutionService';
import { validateCalculation } from '../services/validationService';
import db, { nextId, nowIso } from '../database/db';
import { Calculation, DilutionInput } from '../models/Calculation';

const router = Router();

// ─── Validation rules ─────────────────────────────────────────────────────────

const postValidation = [
  body('type').isIn(['c1v1', 'serial', 'percent']).withMessage('type must be c1v1, serial, or percent'),
  body('signatureConfirmed').isBoolean().withMessage('signatureConfirmed must be a boolean'),
  body('c1').optional().isFloat({ min: 0 }).withMessage('c1 must be a non-negative number'),
  body('v1').optional().isFloat({ min: 0 }).withMessage('v1 must be a non-negative number'),
  body('c2').optional().isFloat({ min: 0 }).withMessage('c2 must be a non-negative number'),
  body('v2').optional().isFloat({ min: 0 }).withMessage('v2 must be a non-negative number'),
  body('initialConcentration').optional().isFloat({ min: 0 }),
  body('dilutionFactor').optional().isFloat({ gt: 0 }),
  body('steps').optional().isInt({ min: 1 }),
  body('soluteMass').optional().isFloat({ min: 0 }),
  body('solventVolume').optional().isFloat({ gt: 0 }),
  body('unit').optional().isIn(['mg/mL','mcg/mL','g/mL','mEq/mL','units/mL']).withMessage('unit must be one of mg/mL, mcg/mL, g/mL, mEq/mL, units/mL'),
  body('drugId').optional().isInt({ min: 1 }).withMessage('drugId must be a positive integer'),
  body('drugNameManual').optional().trim().isLength({ max: 200 }),
  body('diluentId').optional().isInt({ min: 1 }).withMessage('diluentId must be a positive integer'),
  body('intendedUse').optional().trim().isLength({ max: 200 }),
  body('patientContext').optional().trim().isLength({ max: 100 }),
  body('notes').optional().trim().isLength({ max: 1000 }),
];

// ─── POST / — run calculation with full audit trail ───────────────────────────

router.post('/', postValidation, (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  if (req.body.signatureConfirmed !== true) {
    res.status(400).json({
      error: 'Signature confirmation required. Set signatureConfirmed: true to acknowledge responsibility for this calculation.',
    });
    return;
  }

  try {
    const userSignature = (typeof req.body.pharmacistSignature === 'string' && req.body.pharmacistSignature.trim())
      || 'Pharmacist';

    const input: DilutionInput = {
      type:                req.body.type,
      unit:                req.body.unit ?? undefined,
      c1:                  req.body.c1                  !== undefined ? Number(req.body.c1)                  : undefined,
      v1:                  req.body.v1                  !== undefined ? Number(req.body.v1)                  : undefined,
      c2:                  req.body.c2                  !== undefined ? Number(req.body.c2)                  : undefined,
      v2:                  req.body.v2                  !== undefined ? Number(req.body.v2)                  : undefined,
      initialConcentration: req.body.initialConcentration !== undefined ? Number(req.body.initialConcentration) : undefined,
      dilutionFactor:      req.body.dilutionFactor      !== undefined ? Number(req.body.dilutionFactor)      : undefined,
      steps:               req.body.steps               !== undefined ? Number(req.body.steps)               : undefined,
      soluteMass:          req.body.soluteMass          !== undefined ? Number(req.body.soluteMass)          : undefined,
      solventVolume:       req.body.solventVolume       !== undefined ? Number(req.body.solventVolume)       : undefined,
    };

    const drugId:    number | undefined = req.body.drugId    !== undefined ? Number(req.body.drugId)    : undefined;
    const diluentId: number | undefined = req.body.diluentId !== undefined ? Number(req.body.diluentId) : undefined;

    const calcResult = calculate(input);
    const validation = validateCalculation({ input, drugId, diluentId });

    const id = nextId(db.data.calculations);
    const calc: Calculation = {
      id,
      user_id:           0,
      type:              input.type,
      input:             JSON.stringify(input),
      result:            JSON.stringify(calcResult),
      user_signature:    userSignature,
      drug_id:           drugId           ?? null,
      drug_name_manual:  req.body.drugNameManual  ?? null,
      diluent_id:        diluentId        ?? null,
      intended_use:      req.body.intendedUse     ?? null,
      patient_context:   req.body.patientContext  ?? null,
      validation_status: validation.status,
      warnings_json:     JSON.stringify(validation.warnings),
      notes:             req.body.notes           ?? null,
      created_at:        nowIso(),
    };
    db.data.calculations.push(calc);
    db.write();

    res.status(201).json({
      id,
      ...calcResult,
      audit: {
        signedBy:         userSignature,
        validationStatus: validation.status,
        warnings:         validation.warnings,
        recordedAt:       calc.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /history — paginated list for authenticated user ─────────────────────

router.get('/history', (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit  = Math.min(Number(req.query.limit)  || 20, 100);
    const offset = Number(req.query.offset) || 0;

    const rows = db.data.calculations
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(offset, offset + limit);

    const parsed = rows.map(row => ({
      ...row,
      input:    JSON.parse(row.input)    as unknown,
      result:   JSON.parse(row.result)   as unknown,
      warnings: row.warnings_json ? JSON.parse(row.warnings_json) as unknown : [],
    }));

    res.json({ calculations: parsed, limit, offset });
  } catch (err) {
    next(err);
  }
});

// ─── GET /:id — retrieve specific calculation (owner only) ───────────────────

router.get(
  '/:id',
  [param('id').isInt({ min: 1 }).withMessage('id must be a positive integer')],
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const row = db.data.calculations.find(
        c => c.id === Number(req.params.id)
      );

      if (!row) {
        res.status(404).json({ error: 'Calculation not found' });
        return;
      }

      res.json({
        ...row,
        input:    JSON.parse(row.input)    as unknown,
        result:   JSON.parse(row.result)   as unknown,
        warnings: row.warnings_json ? JSON.parse(row.warnings_json) as unknown : [],
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
