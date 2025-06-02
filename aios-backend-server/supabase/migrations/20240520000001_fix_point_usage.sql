-- First drop both existing functions to avoid conflicts
DROP FUNCTION IF EXISTS public.record_point_usage(UUID, INTEGER, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.record_point_usage(UUID, INTEGER, point_transactions_operationtype_enum, TEXT, JSONB);

-- Recreate the function with the correct enum type
CREATE OR REPLACE FUNCTION public.record_point_usage(
  p_user_id UUID,
  p_points INTEGER,
  p_operation_type point_transactions_operationtype_enum,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS TABLE (new_balance INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update user's points balance
  UPDATE users 
  SET "pointsBalance" = "pointsBalance" - p_points,
      "updatedAt" = CURRENT_TIMESTAMP
  WHERE id = p_user_id
  RETURNING "pointsBalance" as new_balance INTO new_balance;

  -- Create transaction record
  INSERT INTO point_transactions (
    "userId",
    "transactionType",
    "operationType",
    points,
    description,
    metadata
  ) VALUES (
    p_user_id,
    'DEBIT'::point_transactions_transactiontype_enum,
    p_operation_type,
    p_points,
    p_description,
    p_metadata
  );

  RETURN NEXT;
END;
$$; 