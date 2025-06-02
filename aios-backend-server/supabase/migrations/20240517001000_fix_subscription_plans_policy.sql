-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Anyone can view subscription plans" ON subscription_plans;

-- Create new policy with public access
CREATE POLICY "Public can view subscription plans"
  ON subscription_plans FOR SELECT
  USING (true);

-- Ensure RLS is enabled but not blocking access
ALTER TABLE subscription_plans FORCE ROW LEVEL SECURITY; 