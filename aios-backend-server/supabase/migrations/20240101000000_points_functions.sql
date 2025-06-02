-- Function to add points to user
CREATE OR REPLACE FUNCTION add_points_to_user(
  p_user_id UUID,
  p_points INTEGER,
  p_transaction_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_stripe_payment_id TEXT DEFAULT NULL
) RETURNS TABLE (
  user_record users,
  transaction_record point_transactions
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Update user's points balance
  UPDATE users 
  SET points_balance = points_balance + p_points,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING * INTO user_record;

  -- Create transaction record
  INSERT INTO point_transactions (
    user_id,
    transaction_type,
    points,
    description,
    metadata,
    stripe_payment_id
  ) VALUES (
    p_user_id,
    p_transaction_type,
    p_points,
    p_description,
    p_metadata,
    p_stripe_payment_id
  ) RETURNING * INTO transaction_record;

  RETURN NEXT;
END;
$$;

-- Function to deduct points from user
CREATE OR REPLACE FUNCTION deduct_points_from_user(
  p_user_id UUID,
  p_points INTEGER,
  p_operation_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS TABLE (
  user_record users,
  transaction_record point_transactions
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT points_balance INTO current_balance
  FROM users
  WHERE id = p_user_id;

  -- Check if user has enough points
  IF current_balance < p_points THEN
    RAISE EXCEPTION 'Insufficient points balance';
  END IF;

  -- Update user's points balance
  UPDATE users 
  SET points_balance = points_balance - p_points,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING * INTO user_record;

  -- Create transaction record
  INSERT INTO point_transactions (
    user_id,
    transaction_type,
    operation_type,
    points,
    description,
    metadata
  ) VALUES (
    p_user_id,
    'USAGE',
    p_operation_type,
    -p_points,
    p_description,
    p_metadata
  ) RETURNING * INTO transaction_record;

  RETURN NEXT;
END;
$$; 