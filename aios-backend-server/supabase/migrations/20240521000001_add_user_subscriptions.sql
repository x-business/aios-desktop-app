CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID REFERENCES public.users(id) ON DELETE CASCADE,
  "planId" TEXT NOT NULL,
  status TEXT NOT NULL,
  "currentPeriodEnd" TIMESTAMP WITH TIME ZONE NOT NULL,
  "stripeSubscriptionId" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions("userId"); 