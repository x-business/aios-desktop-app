-- Create subscription_plans enum
CREATE TYPE subscription_plan_type AS ENUM ('small', 'medium', 'large');

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES users(id),
  "stripePlanId" TEXT NOT NULL,
  "stripeSubscriptionId" TEXT NOT NULL,
  "planType" subscription_plan_type NOT NULL,
  "monthlyPoints" INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL,
  "currentPeriodStart" TIMESTAMP WITH TIME ZONE NOT NULL,
  "currentPeriodEnd" TIMESTAMP WITH TIME ZONE NOT NULL,
  "canceledAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create function to handle subscription points allocation
CREATE OR REPLACE FUNCTION handle_subscription_points_allocation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Add monthly points to user's balance
  UPDATE users
  SET "pointsBalance" = COALESCE("pointsBalance", 0) + NEW."monthlyPoints",
      "updatedAt" = CURRENT_TIMESTAMP
  WHERE id = NEW."userId";

  -- Record points transaction
  INSERT INTO point_transactions (
    id,
    "userId",
    "transactionType",
    "operationType",
    points,
    description,
    metadata,
    "createdAt",
    "updatedAt"
  ) VALUES (
    gen_random_uuid(),
    NEW."userId",
    'CREDIT',
    'SUBSCRIPTION_RENEWAL',
    NEW."monthlyPoints",
    format('Monthly subscription points allocation - %s Plan', NEW."planType"),
    jsonb_build_object(
      'subscriptionId', NEW.id,
      'planType', NEW."planType",
      'period', jsonb_build_object(
        'start', NEW."currentPeriodStart",
        'end', NEW."currentPeriodEnd"
      )
    ),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

  RETURN NEW;
END;
$$;

-- Create trigger for subscription renewal
CREATE TRIGGER subscription_points_allocation_trigger
  AFTER INSERT OR UPDATE OF "currentPeriodStart"
  ON subscriptions
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION handle_subscription_points_allocation();

-- Add subscription plan configurations
CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "monthlyPoints" INTEGER NOT NULL,
  price INTEGER NOT NULL,
  "stripePriceId" TEXT NOT NULL,
  description TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default subscription plans
INSERT INTO subscription_plans (id, name, "monthlyPoints", price, "stripePriceId", description) 
VALUES 
  ('small', 'Small', 3000, 2900, 'price_small', 'Basic monthly plan for individual users'),
  ('medium', 'Medium', 10000, 7900, 'price_medium', 'Standard monthly plan for professionals'),
  ('large', 'Large', 30000, 19900, 'price_large', 'Premium monthly plan for power users');

-- Grant permissions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions FOR SELECT
  USING ("userId" = auth.uid());

CREATE POLICY "Anyone can view subscription plans"
  ON subscription_plans FOR SELECT
  TO authenticated
  USING (true); 