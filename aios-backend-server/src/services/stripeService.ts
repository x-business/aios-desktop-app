import stripe from "../config/stripe";
import { POINTS_PACKAGES } from "../config/stripe";
import { getRepository } from "typeorm";
import { User } from "../models/User";
import { addPointsToUser } from "./pointsService";
import { TransactionType } from "../models/PointTransaction";
import { PointsPackageKey } from "../config/stripe";

// Create a Stripe customer for a user
export const createStripeCustomer = async (
  userId: string,
  email: string,
  name: string
): Promise<string | null> => {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId,
      },
    });

    const userRepository = getRepository(User);
    const user = await userRepository.findOne({ where: { id: userId } });

    if (user) {
      user.stripeCustomerId = customer.id;
      await userRepository.save(user);
    }

    return customer.id;
  } catch (error) {
    console.error("Error creating Stripe customer:", error);
    return null;
  }
};

// Create a checkout session for points purchase
export const createPointsCheckoutSession = async (
  userId: string,
  packageId: string,
  successUrl: string,
  cancelUrl: string
): Promise<{ sessionId: string; url: string } | null> => {
  try {
    const packageKey = packageId.toUpperCase() as PointsPackageKey;
    if (!POINTS_PACKAGES[packageKey]) {
      return null;
    }

    const selectedPackage = POINTS_PACKAGES[packageKey];

    const userRepository = getRepository(User);
    const user = await userRepository.findOne({ where: { id: userId } });

    if (!user) {
      return null;
    }

    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.displayName,
        metadata: {
          userId: user.id,
        },
      });

      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await userRepository.save(user);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${selectedPackage.name} Points Package`,
              description: `${selectedPackage.points} AIOS Points`,
            },
            unit_amount: selectedPackage.price,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: user.id,
        packageId: packageId,
        points: selectedPackage.points.toString(),
      },
    });

    return { sessionId: session.id, url: session.url || "" };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return null;
  }
};

// Process successful payment
export const processSuccessfulPayment = async (
  session: any
): Promise<boolean> => {
  try {
    if (
      !session.metadata ||
      !session.metadata.userId ||
      !session.metadata.points
    ) {
      return false;
    }

    const userId = session.metadata.userId;
    const points = parseInt(session.metadata.points);
    const packageId = session.metadata.packageId;

    // Add points to user's account
    const result = await addPointsToUser(
      userId,
      points,
      TransactionType.PURCHASE,
      `Purchased ${points} points (${packageId} package)`,
      {
        packageId,
        checkoutSessionId: session.id,
      },
      session.payment_intent
    );

    return result.success;
  } catch (error) {
    console.error("Error processing payment:", error);
    return false;
  }
};
