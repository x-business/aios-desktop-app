CREATE OR REPLACE FUNCTION record_point_usage(
  p_user_id UUID,
  p_points INTEGER,
  p_operation_type VARCHAR,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
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
  SET points_balance = points_balance - p_points,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = p_user_id
  RETURNING points_balance INTO v_new_balance;

  -- Create point transaction record
  INSERT INTO point_transactions (
    id,
    user_id,
    transaction_type,
    operation_type,
    points,
    description,
    metadata,
    created_at
  )
  VALUES (
    gen_random_uuid(),
    p_user_id,
    'USAGE',
    p_operation_type,
    -p_points,
    p_description,
    p_metadata,
    CURRENT_TIMESTAMP
  )
  RETURNING id INTO v_transaction_id;

  RETURN json_build_object(
    'new_balance', v_new_balance,
    'transaction_id', v_transaction_id
  );
END;
$$; 