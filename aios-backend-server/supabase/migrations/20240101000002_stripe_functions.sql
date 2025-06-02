CREATE OR REPLACE FUNCTION handle_stripe_payment(
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
  SET points_balance = points_balance + p_points,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = p_user_id
  RETURNING points_balance INTO v_new_balance;

  -- Create point transaction record
  INSERT INTO point_transactions (
    id,
    user_id,
    transaction_type,
    points,
    description,
    stripe_payment_id,
    metadata,
    created_at
  )
  VALUES (
    gen_random_uuid(),
    p_user_id,
    'PURCHASE',
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