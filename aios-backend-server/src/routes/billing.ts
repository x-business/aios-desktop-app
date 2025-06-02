import { RequestHandler, Router } from 'express';
import { authenticateJwt } from '../middleware/auth';
import { createCheckoutSession, handleStripeWebhook, createSubscription, getSubscriptionPlans, cancelSubscription, getPricingInfo, createSubscriptionCheckout, updateSubscription, getSubscriptionUpdatePreview } from '../controllers/billingController';
import { body } from 'express-validator';
import { validate } from '../middleware/validation';
import express from 'express';

const router = Router();

// Create a checkout session for points purchase
router.post(
  '/checkout',
  authenticateJwt,
  validate([
    body('packageId').isString().notEmpty().withMessage('Package ID is required')
  ]),
  createCheckoutSession as RequestHandler
);

// Handle Stripe webhook events
// Note: This route needs raw body for Stripe signature verification
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

// Create a subscription
router.post(
  '/subscriptions',
  authenticateJwt,
  validate([
    body('planId').isString().notEmpty().withMessage('Plan ID is required')
  ]),
  createSubscription as RequestHandler
);

// Create a subscription checkout session
router.post(
  '/subscriptions/checkout',
  authenticateJwt,
  validate([
    body('planId').isString().notEmpty().withMessage('Plan ID is required')
  ]),
  createSubscriptionCheckout as RequestHandler
);

// Get subscription plans
router.get(
  '/subscription-plans',
  authenticateJwt,
  getSubscriptionPlans as RequestHandler
);

// Update subscription (upgrade/downgrade)
router.post(
  '/subscriptions/update',
  authenticateJwt,
  validate([
    body('planId').isString().notEmpty().withMessage('Plan ID is required')
  ]),
  updateSubscription as RequestHandler
);

// Cancel subscription
router.post(
  '/subscriptions/cancel',
  authenticateJwt,
  cancelSubscription as RequestHandler
);

// Get user's subscriptions
// router.get('/subscriptions', authenticateJwt, getUserSubscriptions as RequestHandler);

// Get pricing information
router.get(
  '/pricing',
  getPricingInfo as RequestHandler
);

// Add this new route
router.post(
  '/subscriptions/preview-update',
  authenticateJwt,
  validate([
    body('planId').isString().notEmpty().withMessage('Plan ID is required')
  ]),
  getSubscriptionUpdatePreview as RequestHandler
);

export default router; 