CREATE TABLE IF NOT EXISTS public.booking_email_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    notifications_enabled BOOLEAN NOT NULL DEFAULT true,
    updated_by_email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.booking_email_settings (id, notifications_enabled)
VALUES ('default', true)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.booking_email_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    updated_by_email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS booking_email_recipients_active_idx
    ON public.booking_email_recipients (is_active, created_at DESC);

CREATE TABLE IF NOT EXISTS public.booking_email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id TEXT,
    product_name TEXT,
    requester_email TEXT,
    recipient_emails JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'sent',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS booking_email_logs_created_at_idx
    ON public.booking_email_logs (created_at DESC);

ALTER TABLE public.booking_email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_email_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "booking_email_settings_public_all" ON public.booking_email_settings;
CREATE POLICY "booking_email_settings_public_all"
    ON public.booking_email_settings
    FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "booking_email_recipients_public_all" ON public.booking_email_recipients;
CREATE POLICY "booking_email_recipients_public_all"
    ON public.booking_email_recipients
    FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "booking_email_logs_public_all" ON public.booking_email_logs;
CREATE POLICY "booking_email_logs_public_all"
    ON public.booking_email_logs
    FOR ALL
    USING (true)
    WITH CHECK (true);
