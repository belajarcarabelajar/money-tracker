import { Router } from 'express';
import { query } from '../db/index.js';

const router = Router();

// Get all transactions for user
router.get('/', async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'] || 'demo';
    const { limit = 100, offset = 0, type, category, startDate, endDate } = req.query;

    let sql = `
      SELECT id, user_id, amount, description, category, type, date, time, timestamp, image_url, created_at
      FROM transactions
      WHERE user_id = $1
    `;
    const params = [userId];
    let paramIndex = 2;

    if (type) {
      sql += ` AND type = $${paramIndex++}`;
      params.push(type);
    }

    if (category) {
      sql += ` AND category = $${paramIndex++}`;
      params.push(category);
    }

    if (startDate) {
      sql += ` AND date >= $${paramIndex++}`;
      params.push(startDate);
    }

    if (endDate) {
      sql += ` AND date <= $${paramIndex++}`;
      params.push(endDate);
    }

    sql += ` ORDER BY timestamp DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(sql, params);

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM transactions WHERE user_id = $1`,
      [userId]
    );

    res.json({
      data: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    next(err);
  }
});

// Get balance summary
router.get('/balance', async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'] || 'demo';

    const result = await query(
      `SELECT total_income, total_expense, balance FROM user_balances WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        income: 0,
        expense: 0,
        balance: 0
      });
    }

    res.json({
      income: result.rows[0].total_income,
      expense: result.rows[0].total_expense,
      balance: result.rows[0].balance
    });
  } catch (err) {
    next(err);
  }
});

// Get statistics for charts
router.get('/stats', async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'] || 'demo';
    const { type = 'Expense' } = req.query;

    // Category breakdown
    const categoryResult = await query(
      `SELECT category, SUM(amount) as total
       FROM transactions
       WHERE user_id = $1 AND type = $2
       GROUP BY category
       ORDER BY total DESC`,
      [userId, type]
    );

    // 7-day trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const trendResult = await query(
      `SELECT date, type, SUM(amount) as total
       FROM transactions
       WHERE user_id = $1 AND date >= $2
       GROUP BY date, type
       ORDER BY date ASC`,
      [userId, sevenDaysAgo.toISOString().split('T')[0]]
    );

    res.json({
      categories: categoryResult.rows,
      trend: trendResult.rows
    });
  } catch (err) {
    next(err);
  }
});

// Create transaction
router.post('/', async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'] || 'demo';
    const { amount, description, category, type, date, time, timestamp, image_url } = req.body;

    if (!amount || !description || !category || !type || !date || !time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await query(
      `INSERT INTO transactions (user_id, amount, description, category, type, date, time, timestamp, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [userId, amount, description, category, type, date, time, timestamp || Date.now(), image_url]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Delete single transaction
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'] || 'demo';
    const { id } = req.params;

    const result = await query(
      `DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ message: 'Transaction deleted', data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// Clear all transactions for user
router.delete('/', async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'] || 'demo';

    await query(`DELETE FROM transactions WHERE user_id = $1`, [userId]);

    res.json({ message: 'All transactions deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
