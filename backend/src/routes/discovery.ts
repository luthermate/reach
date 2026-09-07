import { Router, Response } from 'express';
import { query } from '../database';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

// Get matched suggestions
router.get('/suggestions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    // Get current user's interests
    const userInterests = await query(`
      SELECT interest_id FROM user_interests WHERE user_id = $1
    `, [req.userId]);

    const interestIds = userInterests.rows.map(r => r.interest_id);

    if (interestIds.length === 0) {
      return res.json([]);
    }

    // Find users with similar interests (excluding current user and already matched)
    const result = await query(`
      SELECT DISTINCT u.id, u.first_name, u.last_name, u.bio, u.age, u.location, 
             u.profile_photo_url, COUNT(ui.interest_id) as common_interests
      FROM users u
      JOIN user_interests ui ON u.id = ui.user_id
      WHERE u.id != $1 
        AND ui.interest_id = ANY($2::int[])
        AND u.id NOT IN (
          SELECT matched_user_id FROM matches WHERE user_id = $1
        )
      GROUP BY u.id, u.first_name, u.last_name, u.bio, u.age, u.location, u.profile_photo_url
      ORDER BY common_interests DESC
      LIMIT $3 OFFSET $4
    `, [req.userId, interestIds, limit, offset]);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

export default router;
