import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import transactionsRouter from './routes/transactions.js';
import chatRouter from './routes/chat.js';
import backupRouter from './routes/backup.js';
import errorHandler from './middleware/error-handler.js';
import { validateEnvSync } from './middleware/env-validator.js';

dotenv.config();
validateEnvSync();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(join(__dirname, '../../uploads')));

// API Routes
app.use('/api/transactions', transactionsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/backup', backupRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../frontend/index.html'));
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Money Tracker server running on port ${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
});

export default app;
