import { Router, Response } from 'express';
import Stripe from 'stripe';
import { query } from '../database';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' });

// Get current subscription
router.get('/current', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query('SELECT * FROM subscriptions WHERE user_id = $1', [req.userId]);
    res.json(result.rows[0] || null);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// Create checkout session
router.post('/checkout', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { plan_type } = req.body;
    const user = await query('SELECT * FROM users WHERE id = $1', [req.userId]);
    const userData = user.rows[0];

    const priceMap: { [key: string]: string } = {
      premium: 'price_1234567890', // Replace with actual Stripe price ID
      vip: 'price_0987654321'
    };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: userData.email,
      line_items: [
        {
          price: priceMap[plan_type],
          quantity: 1,
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      metadata: {
        user_id: req.userId,
        plan_type
      }
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Webhook for Stripe events
router.post('/webhook', async (req: AuthRequest, res: Response) => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const userId = session.metadata.user_id;
      const planType = session.metadata.plan_type;

      await query(
        'UPDATE subscriptions SET plan_type = $1, stripe_customer_id = $2, status = $3 WHERE user_id = $4',
        [planType, session.customer, 'active', userId]
      );
    }

    res.json({ received: true });
  } catch (error) {
    res.status(400).json({ error: 'Webhook error' });
  }
});

export default router;
