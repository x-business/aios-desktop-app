-- Drop the function if it exists
DROP FUNCTION IF EXISTS public.record_point_usage;

-- Create the function
CREATE OR REPLACE FUNCTION public.record_point_usage(
  p_user_id UUID,
  p_points INTEGER,
  p_operation_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (new_balance INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance INTEGER;
BEGIN
  -- Get current balance and lock the user row
  SELECT "pointsBalance" INTO v_current_balance
  FROM users
  WHERE id = p_user_id
  FOR UPDATE;

  -- Check if user has enough points
  IF v_current_balance < p_points THEN
    RAISE EXCEPTION 'Insufficient points balance';
  END IF;

  -- Update user's points balance
  UPDATE users
  SET "pointsBalance" = "pointsBalance" - p_points,
      "updatedAt" = CURRENT_TIMESTAMP
  WHERE id = p_user_id
  RETURNING "pointsBalance" INTO new_balance;

  -- Create point transaction record
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
  )
  VALUES (
    gen_random_uuid(),
    p_user_id,
    'DEBIT',
    p_operation_type,
    p_points,
    COALESCE(p_description, format('Used %s points for %s', p_points, p_operation_type)),
    p_metadata,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

  RETURN NEXT;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.record_point_usage TO authenticated;

-- Add comment to the function
COMMENT ON FUNCTION public.record_point_usage IS 'Records a point usage transaction and updates user balance'; 