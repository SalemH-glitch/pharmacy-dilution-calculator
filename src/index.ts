import express from 'express';
import session from 'express-session';
import cors from 'cors';
import authRoutes from './routes/auth';
import calculationRoutes from './routes/calculations';
import diluentRoutes from './routes/diluents';
import drugRoutes from './routes/drugs';
import { errorHandler } from './middleware/errorHandler';

declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'change-me-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 8,
    },
  })
);

app.use(express.static('public'));

app.use('/api/auth', authRoutes);
app.use('/api/calculations', calculationRoutes);
app.use('/api/diluents', diluentRoutes);
app.use('/api/drugs', drugRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
