-- Drop existing tables and types if they exist
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS point_transactions CASCADE;
DROP TYPE IF EXISTS subscriptions_status_enum CASCADE;
DROP TYPE IF EXISTS point_transactions_transactiontype_enum CASCADE;
DROP TYPE IF EXISTS point_transactions_operationtype_enum CASCADE;

-- Create subscription status enum
CREATE TYPE subscriptions_status_enum AS ENUM (
  'trialing',
  'active',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'past_due',
  'unpaid',
  'paused'
);

-- Create transaction type enum
CREATE TYPE point_transactions_transactiontype_enum AS ENUM (
  'CREDIT',
  'DEBIT',
  'PURCHASE',
  'REFUND'
);

-- Create operation type enum
CREATE TYPE point_transactions_operationtype_enum AS ENUM (
  'SUBSCRIPTION_RENEWAL',
  'API_USAGE',
  'MANUAL_ADJUSTMENT',
  'POINTS_PURCHASE',
  'SUBSCRIPTION_REFUND'
);

-- Create point transactions table
CREATE TABLE point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID REFERENCES public.users(id) ON DELETE CASCADE,
  "transactionType" point_transactions_transactiontype_enum NOT NULL,
  "operationType" point_transactions_operationtype_enum,
  points INTEGER NOT NULL,
  description TEXT,
  metadata JSONB,
  "stripePaymentId" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create subscription plans table
CREATE TABLE subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  "monthlyPoints" INTEGER NOT NULL,
  price INTEGER NOT NULL,
  "stripePriceId" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "allowProration" BOOLEAN DEFAULT true,
  "minimumPoints" INTEGER DEFAULT 0
);

-- Create subscriptions table with reference to public.users instead of auth.users
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID REFERENCES public.users(id) ON DELETE CASCADE,
  "stripePlanId" TEXT NOT NULL,
  "stripeSubscriptionId" TEXT UNIQUE NOT NULL,
  "planName" TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status subscriptions_status_enum NOT NULL DEFAULT 'trialing',
  "currentPeriodStart" TIMESTAMP WITH TIME ZONE NOT NULL,
  "currentPeriodEnd" TIMESTAMP WITH TIME ZONE NOT NULL,
  "canceledAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions("userId");
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions("stripeSubscriptionId");

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Update RLS Policies for subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions FOR SELECT
  USING ("userId" = auth.uid());

CREATE POLICY "Users can update their own subscriptions"
  ON subscriptions FOR UPDATE
  USING ("userId" = auth.uid());

CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Authenticated users can insert subscriptions"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for subscription_plans
CREATE POLICY "Anyone can view subscription plans"
  ON subscription_plans FOR SELECT
  USING (true);

-- Insert default subscription plans
INSERT INTO subscription_plans (id, name, description, "monthlyPoints", price, "stripePriceId")
VALUES 
  (
    'basic',
    'Basic Plan',
    'Perfect for individual users and small projects',
    3000,
    2900,
    'price_1RQEy1PwyfIps7XZkD3AGibi'
  ),
  (
    'medium',
    'Professional Plan',
    'Ideal for professionals and growing teams',
    10000,
    7900,
    'price_1RQF0BPwyfIps7XZpBB0O0F9'
  ),
  (
    'premium',
    'Enterprise Plan',
    'For large teams and high-volume usage',
    30000,
    19900,
    'price_1RQF0cPwyfIps7XZkASF5KMF'
  );

-- Update existing plans with proration settings
UPDATE subscription_plans
SET 
  "allowProration" = true,
  "minimumPoints" = "monthlyPoints" / 2  -- Set minimum points requirement
WHERE id IN ('basic', 'medium', 'premium');

-- Function to handle subscription points allocation
CREATE OR REPLACE FUNCTION handle_subscription_points_allocation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  monthly_points INTEGER;
BEGIN
  -- Only process active subscriptions
  IF NEW.status = 'active' THEN
    -- Get monthly points from subscription plan using planName instead of stripePlanId
    SELECT "monthlyPoints" INTO monthly_points
    FROM subscription_plans
    WHERE id = NEW."planName";

    -- First ensure the user has a valid points balance
    UPDATE public.users
    SET "pointsBalance" = 0
    WHERE id = NEW."userId" AND "pointsBalance" IS NULL;

    -- Then add points to user's balance
    UPDATE public.users
    SET 
      "pointsBalance" = COALESCE("pointsBalance", 0) + monthly_points,
      "updatedAt" = CURRENT_TIMESTAMP
    WHERE id = NEW."userId";

    -- Record points transaction
    INSERT INTO point_transactions (
      "userId",
      "transactionType",
      "operationType",
      points,
      description,
      metadata
    ) VALUES (
      NEW."userId",
      'CREDIT'::point_transactions_transactiontype_enum,
      'SUBSCRIPTION_RENEWAL'::point_transactions_operationtype_enum,
      monthly_points,
      'Monthly subscription points allocation - ' || NEW."planName",
      jsonb_build_object(
        'subscriptionId', NEW.id,
        'planName', NEW."planName",
        'period', jsonb_build_object(
          'start', NEW."currentPeriodStart",
          'end', NEW."currentPeriodEnd"
        )
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for subscription points allocation
DROP TRIGGER IF EXISTS subscription_points_allocation_trigger ON subscriptions;
CREATE TRIGGER subscription_points_allocation_trigger
  AFTER INSERT OR UPDATE OF status, "currentPeriodStart"
  ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION handle_subscription_points_allocation();

-- Create webhook handler function with elevated privileges
CREATE OR REPLACE FUNCTION handle_stripe_webhook_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the transaction type to use uppercase PURCHASE
  INSERT INTO point_transactions (
    "userId",
    "transactionType",
    "operationType",
    points,
    description,
    "stripePaymentId",
    metadata
  ) VALUES (
    NEW."userId",
    'PURCHASE'::point_transactions_transactiontype_enum,
    'POINTS_PURCHASE'::point_transactions_operationtype_enum,
    NEW.amount,
    'Points purchase via Stripe',
    NEW."stripePaymentId",
    jsonb_build_object(
      'stripeEvent', NEW.metadata
    )
  );
  
  RETURN NEW;
END;
$$;

-- First drop the existing foreign key constraint
ALTER TABLE subscriptions 
DROP CONSTRAINT IF EXISTS "subscriptions_userId_fkey";

-- Then add the new foreign key constraint pointing to public.users
ALTER TABLE subscriptions 
ADD CONSTRAINT "subscriptions_userId_fkey" 
FOREIGN KEY ("userId") 
REFERENCES public.users(id) 
ON DELETE CASCADE;

-- First ensure users table has proper pointsBalance default
ALTER TABLE public.users 
ALTER COLUMN "pointsBalance" SET DEFAULT 0;

-- Update any existing null values
UPDATE public.users 
SET "pointsBalance" = 0 
WHERE "pointsBalance" IS NULL;

-- Add not null constraint after fixing data
ALTER TABLE public.users 
ALTER COLUMN "pointsBalance" SET NOT NULL; 