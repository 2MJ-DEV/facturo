import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { migrate } from './db.js';

import authRouter from './routes/auth.js';
import invoicesRouter from './routes/invoices.js';
import paymentsRouter from './routes/payments.js';
import clientsRouter from './routes/clients.js';
import dashboardRouter from './routes/dashboard.js';
import auditRouter from './routes/audit.js';
import usersRouter from './routes/users.js';

const app = express();
const allowedOrigins = [
  "https://facturo-delta.vercel.app",
  "http://localhost:5173",       
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// Health
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/audit', auditRouter);
app.use('/api/users', usersRouter);

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 4000;

migrate();
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
