import { Router, Response } from 'express';
import { query } from '../database';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

// Get all interests
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query('SELECT * FROM interests ORDER BY category, name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch interests' });
  }
});

// Add user interests
router.post('/my-interests', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { interest_ids } = req.body;

    // Clear existing interests
    await query('DELETE FROM user_interests WHERE user_id = $1', [req.userId]);

    // Add new interests
    for (const interestId of interest_ids) {
      await query(
        'INSERT INTO user_interests (user_id, interest_id) VALUES ($1, $2)',
        [req.userId, interestId]
      );
    }

    res.json({ message: 'Interests updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update interests' });
  }
});

// Get user interests
router.get('/my-interests', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(`
      SELECT i.* FROM interests i
      JOIN user_interests ui ON i.id = ui.interest_id
      WHERE ui.user_id = $1
      ORDER BY i.name
    `, [req.userId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch interests' });
  }
});

export default router;
