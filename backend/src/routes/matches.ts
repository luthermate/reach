import { Router, Response } from 'express';
import { query } from '../database';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

// Like a user
router.post('/like', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { matched_user_id } = req.body;

    // Check if already exists
    const existing = await query(
      'SELECT id FROM matches WHERE user_id = $1 AND matched_user_id = $2',
      [req.userId, matched_user_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Already liked this user' });
    }

    // Create match
    const result = await query(
      'INSERT INTO matches (user_id, matched_user_id, status) VALUES ($1, $2, $3) RETURNING *',
      [req.userId, matched_user_id, 'pending']
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to like user' });
  }
});

// Get all matches
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(`
      SELECT m.*, u.first_name, u.last_name, u.bio, u.profile_photo_url
      FROM matches m
      JOIN users u ON m.matched_user_id = u.id
      WHERE m.user_id = $1
      ORDER BY m.created_at DESC
    `, [req.userId]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// Accept match
router.put('/:id/accept', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'UPDATE matches SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3 RETURNING *',
      ['accepted', req.params.id, req.userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to accept match' });
  }
});

export default router;
