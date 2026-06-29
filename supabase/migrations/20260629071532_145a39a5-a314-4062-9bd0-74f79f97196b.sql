
ALTER TABLE public.alerts
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS starts_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS alerts_expires_at_idx ON public.alerts (expires_at);

ALTER TABLE public.alerts REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'alerts'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts';
  END IF;
END $$;
