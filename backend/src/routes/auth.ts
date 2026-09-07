import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../database';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { body, validationResult } from 'express-validator';

const router = Router();

// Register
router.post('/register', [
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('first_name').notEmpty(),
  body('last_name').notEmpty()
], async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password, first_name, last_name, phone } = req.body;

    // Check if user exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await query(
      'INSERT INTO users (email, phone, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name',
      [email, phone, hashedPassword, first_name, last_name]
    );

    const user = result.rows[0];

    // Generate token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    // Create subscription
    await query(
      'INSERT INTO subscriptions (user_id, plan_type, status) VALUES ($1, $2, $3)',
      [user.id, 'free', 'active']
    );

    res.status(201).json({ token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty()
], async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    // Generate token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    res.json({ token, user: { id: user.id, email: user.email, first_name: user.first_name } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Verify token
router.post('/verify', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query('SELECT id, email, first_name FROM users WHERE id = $1', [req.userId]);
    res.json({ user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

export default router;
