-- Allow any authenticated user to view any inventory (needed for trading UI)
CREATE POLICY "Authenticated users can view others inventory for trading."
  ON public.user_inventory
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
