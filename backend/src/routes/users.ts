import { Router, Response } from 'express';
import { query } from '../database';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

// Get current user
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query('SELECT * FROM users WHERE id = $1', [req.userId]);
    const user = result.rows[0];

    // Get user interests
    const interests = await query(`
      SELECT i.* FROM interests i
      JOIN user_interests ui ON i.id = ui.interest_id
      WHERE ui.user_id = $1
    `, [req.userId]);

    res.json({ ...user, interests: interests.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update profile
router.put('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { first_name, last_name, bio, age, location, latitude, longitude, profile_photo_url } = req.body;

    const result = await query(
      `UPDATE users SET first_name = $1, last_name = $2, bio = $3, age = $4, location = $5, 
       latitude = $6, longitude = $7, profile_photo_url = $8, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $9 RETURNING *`,
      [first_name, last_name, bio, age, location, latitude, longitude, profile_photo_url, req.userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get user by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query('SELECT id, first_name, last_name, bio, age, location, profile_photo_url, created_at FROM users WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Get interests
    const interests = await query(`
      SELECT i.* FROM interests i
      JOIN user_interests ui ON i.id = ui.interest_id
      WHERE ui.user_id = $1
    `, [req.params.id]);

    res.json({ ...user, interests: interests.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
