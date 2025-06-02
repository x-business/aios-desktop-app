-- Function to sync users to auth.users
CREATE OR REPLACE FUNCTION sync_user_to_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into auth.users if not exists
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at
  )
  SELECT
    NEW.id,
    NEW.email,
    '**********'::text, -- placeholder password, they should login with OAuth
    NOW(),
    NEW.created_at,
    NEW.updated_at
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = NEW.id
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically sync users
DROP TRIGGER IF EXISTS sync_user_to_auth_trigger ON users;
CREATE TRIGGER sync_user_to_auth_trigger
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_to_auth();

-- Sync existing users
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
)
SELECT
  u.id,
  u.email,
  '**********'::text, -- placeholder password
  NOW(),
  u.created_at,
  u.updated_at
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users au WHERE au.id = u.id
); 