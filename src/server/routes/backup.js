import { Router } from 'express';
import { query } from '../db/index.js';

const router = Router();

// Export all transactions as JSON
router.get('/export', async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'] || 'demo';

    const result = await query(
      `SELECT amount, description, category, type, date, time, timestamp, image_url
       FROM transactions
       WHERE user_id = $1
       ORDER BY timestamp DESC`,
      [userId]
    );

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=money_tracker_backup_${new Date().toISOString().split('T')[0]}.json`);

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// Import transactions from JSON
router.post('/import', async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'] || 'demo';
    const { data, mode = 'merge' } = req.body; // mode: 'replace' or 'merge'

    if (!Array.isArray(data)) {
      return res.status(400).json({ error: 'Data must be an array' });
    }

    // Validate items
    const validItems = data.filter(item =>
      item.amount && item.description && item.category && item.type && item.date
    );

    if (validItems.length === 0) {
      return res.status(400).json({ error: 'No valid transactions found' });
    }

    // If replace mode, delete all existing first
    if (mode === 'replace') {
      await query(`DELETE FROM transactions WHERE user_id = $1`, [userId]);
    }

    // Insert new items
    let successCount = 0;
    for (const item of validItems) {
      await query(
        `INSERT INTO transactions (user_id, amount, description, category, type, date, time, timestamp, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          userId,
          item.amount,
          item.description,
          item.category,
          item.type,
          item.date,
          item.time || '00:00:00',
          item.timestamp || Date.now(),
          item.image_url || null
        ]
      );
      successCount++;
    }

    res.json({
      message: `Successfully imported ${successCount} transactions`,
      mode,
      total: successCount
    });
  } catch (err) {
    next(err);
  }
});

export default router;
