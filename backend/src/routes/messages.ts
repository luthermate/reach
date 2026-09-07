import { Router, Response } from 'express';
import { query } from '../database';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

// Send message
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { recipient_id, content } = req.body;

    const result = await query(
      'INSERT INTO messages (sender_id, recipient_id, content) VALUES ($1, $2, $3) RETURNING *',
      [req.userId, recipient_id, content]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get conversation
router.get('/conversation/:user_id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(`
      SELECT * FROM messages
      WHERE (sender_id = $1 AND recipient_id = $2) OR (sender_id = $2 AND recipient_id = $1)
      ORDER BY created_at ASC
    `, [req.userId, req.params.user_id]);

    // Mark as read
    await query(
      'UPDATE messages SET read = true WHERE recipient_id = $1 AND sender_id = $2',
      [req.userId, req.params.user_id]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Get conversations list
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(`
      SELECT DISTINCT ON (other_user_id) 
        other_user_id, u.first_name, u.last_name, u.profile_photo_url,
        m.content as last_message, m.created_at, m.read
      FROM (
        SELECT recipient_id as other_user_id, content, created_at, read FROM messages WHERE sender_id = $1
        UNION
        SELECT sender_id as other_user_id, content, created_at, read FROM messages WHERE recipient_id = $1
      ) m
      JOIN users u ON u.id = m.other_user_id
      ORDER BY other_user_id, created_at DESC
    `, [req.userId]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

export default router;
