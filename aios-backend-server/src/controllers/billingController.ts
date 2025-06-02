import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../types/auth";
import { supabase } from "../config/database";
import stripe, { POINTS_PACKAGES, PointsPackageKey } from "../config/stripe";
import { Database } from "../types/supabase";

// Create a checkout session for points purchase
export const createCheckoutSession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { packageId } = req.body;

    if (!req.user?.id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    console.log("packageId", packageId);

    const packageKey = packageId.toUpperCase() as PointsPackageKey;
    if (!POINTS_PACKAGES[packageKey]) {
      res.status(400).json({ message: "Invalid package ID" });
      return;
    }
    const selectedPackage = POINTS_PACKAGES[packageKey];
    // Get user from database
    const { data: user, error } = await supabase
      .from("users")
      .select("stripeCustomerId")
      .eq("id", req.user.id)
      .single();

    if (error || !user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      // Get user details for creating customer
      const { data: userDetails } = await supabase
        .from("users")
        .select("email, displayName")
        .eq("id", req.user.id)
        .single();

      if (!userDetails) {
        res.status(404).json({ message: "User details not found" });
        return;
      }

      const customer = await stripe.customers.create({
        email: userDetails.email,
        name: userDetails.displayName,
        metadata: {
          userId: req.user.id,
        },
      });

      customerId = customer.id;

      // Update user with Stripe customer ID
      await supabase
        .from("users")
        .update({ stripeCustomerId: customerId })
        .eq("id", req.user.id);
    }

    // Create success and cancel URLs
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const successUrl = `${baseUrl}/checkout/points/success?success=true&package=${packageId}`;
    const cancelUrl = `${baseUrl}/pricing?canceled=true`;

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
        userId: req.user.id,
        packageId: packageId,
        points: selectedPackage.points.toString(),
      },
    });

    res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error) {
    next(error);
  }
};

// Handle Stripe webhook events
export const handleStripeWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const event = req.body;
    console.log("Webhook event type:", event.type);
    console.log(
      "Webhook event data:",
      JSON.stringify(event.data.object, null, 2)
    );

    switch (event.type) {
      case "checkout.session.completed": {
        console.log("Processing checkout session completed event");
        const session = event.data.object;

        if (session.metadata?.userId && session.metadata?.points) {
          try {
            const { data: result, error } = await supabase.rpc<
              "handle_stripe_payment",
              {
                Args: {
                  p_user_id: string;
                  p_points: number;
                  p_package_id: string;
                  p_payment_intent: string;
                  p_session_id: string;
                };
                Returns: {
                  new_balance: number;
                  transaction_id: string;
                };
              }
            >("handle_stripe_payment", {
              p_user_id: session.metadata.userId,
              p_points: parseInt(session.metadata.points),
              p_package_id: session.metadata.packageId,
              p_payment_intent: session.payment_intent,
              p_session_id: session.id,
            });

            if (error) {
              console.error("Supabase RPC error:", error);
              throw error;
            }
            console.log("Payment processed successfully:", result);
          } catch (err) {
            console.error("Error processing payment:", err);
            throw err;
          }
        } else {
          console.error("Missing required metadata:", session.metadata);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        console.log("Processing subscription event:", subscription.id);
        console.log("Subscription data:", subscription);
        try {
          // Get the subscription item (first item in the subscription)
          const subscriptionItem = subscription.items.data[0];
          if (!subscriptionItem) {
            console.error("No subscription item found");
            break;
          }

          // Get the price and product details
          const price = subscriptionItem.price;
          const product = await stripe.products.retrieve(
            price.product as string
          );

          // Find user by stripe customer ID
          const { data: user, error: userError } = await supabase
            .from("users")
            .select("id")
            .eq("stripeCustomerId", subscription.customer)
            .single();

          if (userError || !user) {
            console.error(
              "User not found for customer:",
              subscription.customer
            );
            break;
          }

          // Check if subscription exists
          const { data: existingSub, error: subError } = await supabase
            .from("subscriptions")
            .select("id")
            .eq("stripeSubscriptionId", subscription.id)
            .single();

          // Safely convert timestamps
          const getCurrentPeriodStart = () => {
            try {
              return subscription.current_period_start
                ? new Date(
                    subscription.current_period_start * 1000
                  ).toISOString()
                : new Date().toISOString();
            } catch (e) {
              console.error("Error converting current_period_start:", e);
              return new Date().toISOString();
            }
          };

          const getCurrentPeriodEnd = () => {
            try {
              return subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000).toISOString()
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // Default to 30 days
            } catch (e) {
              console.error("Error converting current_period_end:", e);
              return new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
              ).toISOString();
            }
          };

          const getCanceledAt = () => {
            try {
              return subscription.canceled_at
                ? new Date(subscription.canceled_at * 1000).toISOString()
                : null;
            } catch (e) {
              console.error("Error converting canceled_at:", e);
              return null;
            }
          };

          const subscriptionData = {
            userId: user.id,
            stripePlanId: price.id,
            stripeSubscriptionId: subscription.id,
            planName: product.name,
            amount: price.unit_amount ? price.unit_amount / 100 : 0,
            status: subscription.cancel_at_period_end ? "canceled" : subscription.status,
            currentPeriodStart: getCurrentPeriodStart(),
            currentPeriodEnd: getCurrentPeriodEnd(),
            canceledAt: getCanceledAt(),
            updatedAt: new Date().toISOString(),
          };

          console.log("Subscription data to save:", subscriptionData);

          if (existingSub) {
            console.log("Updating existing subscription:", existingSub.id);
            const { error: updateError } = await supabase
              .from("subscriptions")
              .update(subscriptionData)
              .eq("id", existingSub.id);

            if (updateError) {
              console.error("Error updating subscription:", updateError);
            }
          } else {
            console.log("Creating new subscription");
            const { error: insertError } = await supabase
              .from("subscriptions")
              .insert({
                ...subscriptionData,
                createdAt: new Date().toISOString(),
              });

            if (insertError) {
              console.error("Error inserting subscription:", insertError);
            }
          }
        } catch (err) {
          console.error("Error processing subscription event:", err);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;

        await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            canceledAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .eq("stripeSubscriptionId", subscription.id);
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    next(error);
  }
};

// Create a subscription
export const createSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { planId } = req.body;

    if (!req.user?.id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Get subscription plan details
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      res.status(400).json({ message: "Invalid plan ID" });
      return;
    }

    // Get or create customer
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("stripeCustomerId, email, displayName")
      .eq("id", req.user.id)
      .single();

    if (userError || !user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.displayName,
        metadata: {
          userId: req.user.id,
        },
      });
      customerId = customer.id;

      await supabase
        .from("users")
        .update({ stripeCustomerId: customerId })
        .eq("id", req.user.id);
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: plan.stripePriceId }],
      metadata: {
        userId: req.user.id,
        planId: planId,
        monthlyPoints: plan.monthlyPoints.toString(),
      },
    });

    res.status(200).json({
      subscriptionId: subscription.id,
    });
  } catch (error) {
    next(error);
  }
};

// Get subscription plans
export const getSubscriptionPlans = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { data: plans, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .order("price", { ascending: true });

    if (error) {
      throw error;
    }

    // Transform the data to match the frontend interface
    const formattedPlans = plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      points: plan.monthlyPoints || 0, // Ensure points is always a number
      price: plan.price / 100, // Convert cents to dollars
      description: plan.description || "",
      stripePriceId: plan.stripePriceId,
    }));

    res.status(200).json(formattedPlans);
  } catch (error) {
    next(error);
  }
};

// Handle subscription upgrade/downgrade
export const updateSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { planId } = req.body;

    if (!req.user?.id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Get current subscription
    const { data: currentSubscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("userId", req.user.id)
      .eq("status", "active")
      .single();

    if (!currentSubscription) {
      res.status(404).json({ message: "No active subscription found" });
      return;
    }

    // Get new plan details
    const { data: newPlan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError || !newPlan) {
      res.status(400).json({ message: "Invalid plan ID" });
      return;
    }

    // Update subscription in Stripe
    const subscription = await stripe.subscriptions.retrieve(
      currentSubscription.stripeSubscriptionId
    );

    await stripe.subscriptions.update(
      currentSubscription.stripeSubscriptionId,
      {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPlan.stripePriceId,
          },
        ],
        proration_behavior: "always_invoice",
      }
    );

    // Update subscription in database
    await supabase
      .from("subscriptions")
      .update({
        planId: newPlan.id,
        planName: newPlan.name,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", currentSubscription.id);

    res.status(200).json({ message: "Subscription updated successfully" });
  } catch (error) {
    next(error);
  }
};

// Cancel subscription
export const cancelSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Get current subscription
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("userId", req.user.id)
      .eq("status", "active")
      .single();

    if (!subscription) {
      res.status(404).json({ message: "No active subscription found" });
      return;
    }

    // Cancel subscription in Stripe
    const stripeSubscription = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // Update subscription status in database
    const { data: updateResult, error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: "canceled",
        updatedAt: new Date().toISOString(),
      })
      .eq("id", subscription.id);
    
    if (updateError) {
      console.error("Error updating subscription status:", updateError);
      throw updateError;
    }

    res.status(200).json({ 
      message: "Subscription cancelled successfully",
      redirectUrl: "/dashboard/subscription/cancel/success"
    });
  } catch (error) {
    next(error);
  }
};

// Get pricing information (points packages and subscription plans)
export const getPricingInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get subscription plans from database
    const { data: subscriptionPlans, error: plansError } = await supabase
      .from("subscription_plans")
      .select("*")
      .order("price", { ascending: true });

    if (plansError) throw plansError;

    // Get points packages from config
    const pointsPackages = Object.values(POINTS_PACKAGES).map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      points: pkg.points,
      price: pkg.price / 100, // Convert cents to dollars
      description: `${pkg.points.toLocaleString()} AIOS Points`,
    }));

    res.status(200).json({
      pointsPackages,
      subscriptionPlans: subscriptionPlans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        points: plan.monthlyPoints,
        price: plan.price / 100, // Convert cents to dollars
        description: plan.description,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// Create a subscription checkout session for upgrades/downgrades
export const createSubscriptionCheckout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log("createSubscriptionCheckout");
    const { planId } = req.body;

    if (!req.user?.id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Get subscription plan details
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      res.status(400).json({ message: "Invalid plan ID" });
      return;
    }

    // Get user's current subscription
    const { data: currentSubscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("userId", req.user.id)
      .eq("status", "active")
      .single();

    let customerId = req.user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: req.user.displayName,
        metadata: {
          userId: req.user.id,
        },
      });
      customerId = customer.id;

      await supabase
        .from("users")
        .update({ stripeCustomerId: customerId })
        .eq("id", req.user.id);
    }

    // Create success and cancel URLs
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const successUrl = `${baseUrl}/checkout/subscription/success?success=true&plan=${planId}`;
    const cancelUrl = `${baseUrl}/pricing?canceled=true`;

    let sessionConfig: any = {
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: req.user.id,
        planId: planId,
        monthlyPoints: plan.monthlyPoints.toString(),
      },
    };

    // If user has an existing subscription, add subscription_data
    if (currentSubscription?.stripeSubscriptionId) {
      sessionConfig = {
        ...sessionConfig,
        subscription_data: {
          metadata: {
            previousSubscriptionId: currentSubscription.stripeSubscriptionId
          }
        }
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Subscription checkout error:", error);
    next(error);
  }
};

// Add this new function to get proration preview
export const getSubscriptionUpdatePreview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { planId } = req.body;

    if (!req.user?.id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Get current subscription
    const { data: currentSubscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("userId", req.user.id)
      .eq("status", "active")
      .single();

    if (!currentSubscription) {
      res.status(404).json({ message: "No active subscription found" });
      return;
    }

    // Get new plan details
    const { data: newPlan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError || !newPlan) {
      res.status(400).json({ message: "Invalid plan ID" });
      return;
    }

    // Get the subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(
      currentSubscription.stripeSubscriptionId
    );

    // Calculate proration
    const invoice = await stripe.invoices.retrieveUpcoming({
      customer: subscription.customer as string,
      subscription: subscription.id,
      subscription_items: [
        {
          id: subscription.items.data[0].id,
          price: newPlan.stripePriceId,
        },
      ],
    });

    // Format the response
    const prorationDate = Math.floor(Date.now() / 1000);
    const currentPeriodEnd = subscription.current_period_end;
    
    res.status(200).json({
      immediatePayment: invoice.amount_due > 0 ? invoice.amount_due / 100 : 0,
      newPrice: newPlan.price / 100,
      currentPrice: currentSubscription.amount,
      nextBillingDate: new Date(currentPeriodEnd * 1000).toISOString(),
      proration: {
        prorated: invoice.amount_due !== 0,
        amount: Math.abs(invoice.amount_due) / 100,
        isCredit: invoice.amount_due < 0,
      }
    });
  } catch (error) {
    next(error);
  }
};
