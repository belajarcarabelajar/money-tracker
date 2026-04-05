import { Router } from 'express';
import { query } from '../db/index.js';
import { chatWithOllama, analyzeImage } from '../ai/ollama.js';
import { buildChatPrompt } from '../ai/prompt-builder.js';
import { checkOllamaHealth } from '../ai/ollama-health.js';

const router = Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  const health = await checkOllamaHealth();
  const status = health.healthy ? 200 : 503;
  res.status(status).json(health);
});

// Safe wrapper for chatWithOllama with pre-flight health check
async function safeChatWithOllama(prompt, image) {
  const health = await checkOllamaHealth();

  if (!health.serverHealthy) {
    const error = new Error(health.error);
    error.status = 503;
    error.category = 'OLLAMA_CONNECTION';
    throw error;
  }

  if (!health.modelAvailable) {
    const error = new Error(health.error);
    error.status = 503;
    error.category = 'OLLAMA_RESPONSE';
    throw error;
  }

  return await chatWithOllama(prompt, image);
}

// Chat endpoint
router.post('/', async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'] || 'demo';
    const { message, image } = req.body;

    if (!message && !image) {
      return res.status(400).json({ error: 'Message or image required' });
    }

    // Get user's financial context
    const balanceResult = await query(
      `SELECT total_income, total_expense, balance FROM user_balances WHERE user_id = $1`,
      [userId]
    );

    const balance = balanceResult.rows[0] || { total_income: 0, total_expense: 0, balance: 0 };

    // Get recent transactions for RAG context
    const transactionsResult = await query(
      `SELECT description, category, type, amount, date
       FROM transactions
       WHERE user_id = $1
       ORDER BY timestamp DESC
       LIMIT 50`,
      [userId]
    );

    const transactions = transactionsResult.rows;

    // Build prompt with context
    const prompt = buildChatPrompt({
      message,
      image,
      balance,
      transactions
    });

    // Call Ollama
    const response = await safeChatWithOllama(prompt, image);

    // Parse response - check if it's a transaction add action
    let action = null;
    try {
      const parsed = JSON.parse(response);
      if (parsed.action === 'add') {
        // Add transaction
        const now = new Date();
        await query(
          `INSERT INTO transactions (user_id, amount, description, category, type, date, time, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            userId,
            parsed.amount,
            parsed.description,
            parsed.category,
            parsed.type,
            now.toISOString().split('T')[0],
            now.toTimeString().split(' ')[0],
            now.getTime()
          ]
        );
        action = {
          type: 'transaction_added',
          data: parsed
        };
      }
    } catch (e) {
      // Not JSON, it's a regular chat response
    }

    res.json({
      response: action ? `Transaksi "${action.data.description}" sebesar Rp ${action.data.amount.toLocaleString('id-ID')} berhasil ditambahkan.` : response,
      action
    });
  } catch (err) {
    next(err);
  }
});

// Analyze image for receipt extraction
router.post('/analyze-image', async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'] || 'demo';
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image required' });
    }

    const result = await analyzeImage(image);

    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
