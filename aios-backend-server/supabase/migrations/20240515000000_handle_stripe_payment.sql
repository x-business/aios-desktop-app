-- Drop the function if it exists
DROP FUNCTION IF EXISTS public.handle_stripe_payment;

-- Create the function
CREATE OR REPLACE FUNCTION public.handle_stripe_payment(
  p_user_id UUID,
  p_points INTEGER,
  p_package_id TEXT,
  p_payment_intent TEXT,
  p_session_id TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Update user's points balance
  UPDATE users
  SET "pointsBalance" = "pointsBalance" + p_points,
      "updatedAt" = CURRENT_TIMESTAMP
  WHERE id = p_user_id
  RETURNING "pointsBalance" INTO v_new_balance;

  -- Create point transaction record with uppercase PURCHASE
  INSERT INTO point_transactions (
    id,
    "userId",
    "transactionType",
    "operationType",
    points,
    description,
    "stripePaymentId",
    metadata,
    "createdAt"
  )
  VALUES (
    gen_random_uuid(),
    p_user_id,
    'PURCHASE'::point_transactions_transactiontype_enum,
    'POINTS_PURCHASE'::point_transactions_operationtype_enum,
    p_points,
    format('Purchased %s points (%s package)', p_points, p_package_id),
    p_payment_intent,
    jsonb_build_object(
      'packageId', p_package_id,
      'checkoutSessionId', p_session_id
    ),
    CURRENT_TIMESTAMP
  )
  RETURNING id INTO v_transaction_id;

  RETURN json_build_object(
    'new_balance', v_new_balance,
    'transaction_id', v_transaction_id
  );
END;
$$; 