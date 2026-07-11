DROP POLICY IF EXISTS "Anyone can update own endpoint" ON public.subscribers;
DROP POLICY IF EXISTS "Anyone can insert subscription" ON public.subscribers;
REVOKE INSERT, UPDATE ON public.subscribers FROM anon, authenticated;