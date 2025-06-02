import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
});

export type PointsPackageKey = 'STARTER' | 'STANDARD' | 'PROFESSIONAL' | 'ENTERPRISE';

export const POINTS_PACKAGES: Record<PointsPackageKey, {
  id: string;
  name: string;
  points: number;
  price: number;
  stripePriceId: string;
}> = {
  STARTER: {
    id: 'starter',
    name: 'Starter',
    points: 1000,
    price: 1000, // $10.00
    stripePriceId: 'price_starter',
  },
  STANDARD: {
    id: 'standard',
    name: 'Standard',
    points: 5000,
    price: 4000, // $40.00
    stripePriceId: 'price_standard',
  },
  PROFESSIONAL: {
    id: 'professional',
    name: 'Professional',
    points: 15000,
    price: 10000, // $100.00
    stripePriceId: 'price_professional',
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    points: 50000,
    price: 30000, // $300.00
    stripePriceId: 'price_enterprise',
  },
};

export default stripe; 