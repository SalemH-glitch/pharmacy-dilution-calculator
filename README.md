# Pharmaceutical Dilution Calculator
**Healthcare-grade calculation tool with audit trail & safety validation**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![Tests](https://img.shields.io/badge/tests-28%20passing-brightgreen)](/)

---

## 🏥 Project Overview

This pharmaceutical dilution calculator was built by a **Specialist IV Pharmacy Technician** with **500+ hours of sterile compounding experience** at WVU Children's Hospital. It demonstrates how software engineering skills can be applied directly to real-world healthcare workflows to improve safety and efficiency.

### Real-World Problem Solved

In hospital pharmacy, calculating precise IV dilutions is critical for patient safety — an error in concentration can be fatal, especially in neonatal and pediatric settings. This application automates the **C1×V1 = C2×V2** formula used daily in pharmacy practice, while adding comprehensive safety checks and a regulatory-compliant audit trail that mirrors professional pharmacy information systems (e.g., Pharmacy Keepers, Epic Willow).

---

## ✨ Key Features

### Core Functionality
- **Accurate dilution calculations** using the C1×V1 = C2×V2 formula
- **Multiple concentration units**: mg/mL, mcg/mL, g/mL, mEq/mL, units/mL
- **76 medications** pre-loaded with evidence-based safety limits
- **Real-time formula preview** as values are entered — shows stock and diluent volumes by name before submitting
- **Live drug search** — type-to-filter the medication dropdown

### Safety & Compliance
- ✅ **Concentration range validation** — prevents dangerous dilutions
- ✅ **Dilution ratio warnings** — alerts when ratio exceeds 1:10 or is under 1:2
- ✅ **Volume practicality checks** — flags volumes under 0.1 mL or over 1000 mL
- ✅ **Drug-diluent compatibility** — verifies appropriate combinations per formulary
- ✅ **Drug-specific concentration limits** — min/max limits derived from hospital pharmacy standards
- ✅ **High-alert medication flags** — enhanced warnings for medications with narrow therapeutic windows
- ✅ **Pre-signature safety review** — all validation warnings are shown inside the confirmation modal *before* the user signs

### Audit & Authentication
- 🔐 **User authentication** with bcrypt password hashing (12 salt rounds)
- ✍️ **Digital signatures** — every calculation requires an explicit professional confirmation step
- 📋 **Comprehensive audit trail** — records who, what, when, why for regulatory compliance
- 📊 **Calculation history** — paginated, filterable; export to CSV
- 👤 **Credential-aware signatures** — full name + credentials (e.g. "Jane Smith, PharmD") attached to every record

---

## 💻 Technology Stack

| Layer | Technology |
|---|---|
| Language | TypeScript 5.x (strict mode) |
| Runtime | Node.js 20+ |
| Framework | Express 4.x |
| Storage | JSON file store (zero native dependencies) |
| Auth | express-session + bcrypt |
| Validation | express-validator |
| Testing | Jest 29 + ts-jest |
| Frontend | Vanilla JS + modern CSS (no framework) |

> **Why no ORM or SQL database?** The project intentionally uses a plain JSON store to eliminate native-compilation dependencies (e.g., `better-sqlite3` requires C++ build tools). This means `npm install` works immediately on any system without additional setup.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/SalemH-glitch/pharmacy-dilution-calculator.git
cd pharmacy-dilution-calculator

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open **http://localhost:3000** in your browser.

### First Use

Register an account — your credentials are stored locally in `db.json`. Full Name and professional Credentials are required fields because they appear on every signed calculation in the audit trail.

| Script | Purpose |
|---|---|
| `npm run dev` | Start with hot-reload (nodemon + ts-node) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled build |
| `npm test` | Run test suite with coverage |

---

## 📖 Example Use Case

### Diluting Gentamicin for a NICU Patient

**Scenario**: Prepare 100 mL of Gentamicin at 2 mg/mL from a 40 mg/mL vial for a premature neonate.

| Field | Value |
|---|---|
| C1 (Stock concentration) | 40 mg/mL |
| C2 (Target concentration) | 2 mg/mL |
| V2 (Final volume needed) | 100 mL |

**Formula**:
```
V1 = (C2 × V2) / C1
V1 = (2 mg/mL × 100 mL) / 40 mg/mL
V1 = 5 mL
```

**Result**: Withdraw **5 mL** of Gentamicin 40 mg/mL stock and add **95 mL** of Normal Saline to achieve 100 mL at 2 mg/mL.

The application will also flag that the 1:20 dilution ratio exceeds the 1:10 threshold, prompting verification that intermediate dilution steps are not needed — exactly the kind of check that prevents real compounding errors.

---

## 🧪 Running Tests

```bash
npm test
```

```
Test Suites: 2 passed, 2 total
Tests:       28 passed, 28 total
```

Tests cover:

| Suite | What is tested |
|---|---|
| `dilutionService.test.ts` | C1V1=C2V2 math, serial dilutions, percent solutions |
| `validationService.test.ts` | Concentration range checks, ratio warnings, volume alerts, composite validation |

Each test suite sets `process.env.DB_PATH` to an isolated temp file before importing any modules, so tests never touch the real database and clean up after themselves.

---

## 🛡️ Safety Design Principles

### Pre-Signature Warning System

Validation warnings are surfaced to the user **before** they sign, inside the confirmation modal. This mirrors the double-check workflows used in clinical pharmacy, where a second review step is required before a preparation can be released.

### Audit Trail Fields

Every saved calculation records:

| Field | Purpose |
|---|---|
| `user_signature` | Full name + credentials of the signing pharmacist/technician |
| `created_at` | ISO 8601 timestamp (UTC) |
| `drug_id` / `drug_name_manual` | Medication reference (database entry or free-text) |
| `diluent_id` | Diluent used |
| `input` | Raw calculation inputs as JSON |
| `result` | Calculated output as JSON |
| `validation_status` | `PASS` / `WARN` / `FAIL` |
| `warnings_json` | Array of specific warning objects with codes and messages |
| `intended_use` | TPN Preparation, IV Medication, etc. |
| `patient_context` | NICU, Pediatric, Adult ICU, etc. (no PHI) |
| `notes` | Free-text field for batch numbers or special instructions |

### Validation Rules

| Check | Condition | Severity |
|---|---|---|
| Concentration exceeds initial | C2 > C1 | FAIL |
| Concentration unchanged | C2 = C1 | WARN |
| Above drug maximum | C2 > drug.max | FAIL |
| Below drug minimum | C2 < drug.min | WARN |
| Excessive dilution ratio | C1/C2 > 10 | WARN |
| Minimal dilution ratio | C1/C2 < 2 | WARN |
| Very small volume | V < 0.1 mL | WARN |
| Unusually large volume | V > 1000 mL | WARN |
| Imprecise volume | More than 2 decimal places | WARN |
| Incompatible diluent | Not in drug's compatibility list | WARN |

---

## 💊 Medication Database

76 medications pre-loaded across 8 categories, each with stock concentration, dilution target, min/max safe concentrations, compatible diluents, and detailed clinical safety notes.

| Category | Medications |
|---|---|
| **Antibiotics** | Vancomycin, Gentamicin, Ceftriaxone, Ampicillin, Cefazolin, Cefepime, Ceftazidime, Meropenem, Piperacillin-Tazobactam, Azithromycin, Nafcillin, Oxacillin, Tobramycin, Amikacin, Clindamycin, Metronidazole, Linezolid, Ciprofloxacin, TMP-SMX, Ertapenem, Daptomycin |
| **Antivirals / Antifungals** | Acyclovir, Ganciclovir, Foscarnet, Fluconazole, Micafungin, Caspofungin, Voriconazole, Amphotericin B (conventional), Amphotericin B Liposomal |
| **Cardiovascular** | Dopamine, Dobutamine, Epinephrine, Norepinephrine, Milrinone, Vasopressin, Amiodarone, Nitroprusside, Nitroglycerin, Esmolol, Labetalol, Nicardipine, Hydralazine |
| **Sedation / Analgesia** | Fentanyl, Morphine, Hydromorphone, Midazolam, Lorazepam, Ketamine, Dexmedetomidine, Propofol |
| **Neurology** | Phenobarbital, Fosphenytoin, Levetiracetam |
| **Electrolytes** | Calcium Gluconate, Potassium Chloride, Magnesium Sulfate, Sodium Bicarbonate, Sodium Phosphate |
| **NICU / Respiratory** | Caffeine Citrate, Alprostadil (PGE1), Furosemide, Bumetanide |
| **Steroids / GI / Other** | Dexamethasone, Hydrocortisone, Methylprednisolone, Insulin Regular, Heparin, Enoxaparin, Protamine Sulfate, Alteplase (tPA), Methotrexate, Vincristine, Ondansetron, Pantoprazole, Acetylcysteine IV |

> Safety notes for HIGH ALERT medications (e.g., concentrated electrolytes, chemotherapy, vasoactives) include route restrictions, maximum infusion rates, incompatibilities, and reversal agents — all derived from clinical pharmacy practice.

---

## 🗂️ Project Structure

```
pharmacy-dilution-calc/
├── src/
│   ├── index.ts                  # Express app bootstrap
│   ├── database/
│   │   ├── db.ts                 # JSON store singleton (lowdb-compatible API)
│   │   ├── schema.ts             # Shared TypeScript interfaces
│   │   └── seedData.ts           # 7 diluents + 76 drugs with clinical notes
│   ├── models/
│   │   ├── Calculation.ts
│   │   ├── Diluent.ts
│   │   ├── Drug.ts
│   │   └── User.ts
│   ├── routes/
│   │   ├── auth.ts               # POST /register, /login, /logout, GET /me
│   │   ├── calculations.ts       # POST /, GET /history, GET /:id
│   │   ├── diluents.ts
│   │   └── drugs.ts
│   ├── services/
│   │   ├── authService.ts        # bcrypt register/login
│   │   ├── dilutionService.ts    # C1V1=C2V2, serial, percent math
│   │   └── validationService.ts  # All safety validation logic
│   └── middleware/
│       ├── auth.ts               # requireAuth session guard
│       └── errorHandler.ts
├── public/
│   └── index.html                # Single-page app (vanilla JS + CSS)
├── tests/
│   ├── dilutionService.test.ts
│   └── validationService.test.ts
├── db.json                       # Runtime data (gitignored)
├── package.json
└── tsconfig.json
```

---

## 🎯 Potential Future Enhancements

- [ ] Integration with hospital EHR/EMR systems via HL7 FHIR
- [ ] Barcode scanning for medication verification
- [ ] Multi-user pharmacist + technician double-check workflows
- [ ] Mobile application (React Native / PWA)
- [ ] Print-to-PDF with QR codes for batch tracking
- [ ] Real-time alerts for FDA drug recalls
- [ ] Weight-based pediatric dosing calculator

---

## ⚠️ Disclaimer

**This is an educational portfolio project demonstrating software development skills applied to healthcare workflows.**

**NOT INTENDED FOR ACTUAL CLINICAL USE.** All pharmaceutical calculations in real clinical settings must be performed and independently verified by licensed healthcare professionals following institutional protocols and current drug references (e.g., Micromedex, Lexicomp).

---

## 👨‍💻 About the Developer

Built by **Salem Habtemichael** — Specialist IV Pharmacy Technician with 500+ hours of sterile compounding experience in the NICU and pediatric pharmacy at WVU Children's Hospital, currently applying that clinical domain knowledge to healthcare software engineering.

### Skills Demonstrated in This Project

- Full-stack TypeScript / Node.js development
- Healthcare domain expertise and regulatory awareness (USP 797/800)
- Safety-critical system design with pre-submission validation
- Test-driven development (Jest, ts-jest)
- RESTful API design with session-based authentication
- Responsive single-page application without framework dependencies
- Clinical medication data modeling

---

**Portfolio**: [github.com/SalemH-glitch](https://github.com/SalemH-glitch)

**LinkedIn**: *(add your profile link)*

**Email**: halyhabib@gmail.com
