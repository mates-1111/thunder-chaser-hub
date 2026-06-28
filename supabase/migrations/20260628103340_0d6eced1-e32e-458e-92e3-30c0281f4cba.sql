
DROP POLICY "Anyone can subscribe" ON public.subscribers;
CREATE POLICY "Anyone can subscribe" ON public.subscribers
  FOR INSERT WITH CHECK (length(trim(city)) > 0 AND length(city) <= 100);
