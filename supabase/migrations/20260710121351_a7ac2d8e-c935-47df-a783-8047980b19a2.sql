
ALTER TABLE public.subscribers
  ADD COLUMN IF NOT EXISTS endpoint text,
  ADD COLUMN IF NOT EXISTS p256dh text,
  ADD COLUMN IF NOT EXISTS auth text,
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS subscribers_endpoint_key ON public.subscribers(endpoint);
CREATE INDEX IF NOT EXISTS subscribers_city_idx ON public.subscribers(lower(city));

-- Allow anonymous upsert of push subscriptions
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.subscribers;
CREATE POLICY "Anyone can insert subscription"
  ON public.subscribers FOR INSERT TO anon, authenticated
  WITH CHECK (length(trim(city)) > 0 AND length(city) <= 100);

CREATE POLICY "Anyone can update own endpoint"
  ON public.subscribers FOR UPDATE TO anon, authenticated
  USING (endpoint IS NOT NULL)
  WITH CHECK (length(trim(city)) > 0 AND length(city) <= 100);
