CREATE TABLE IF NOT EXISTS public.canvas_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  name text NOT NULL,
  format text NOT NULL CHECK (format IN ('feed','story','carousel_cover')),
  category text NOT NULL,
  canvas_width integer NOT NULL DEFAULT 1080,
  canvas_height integer NOT NULL DEFAULT 1080,
  layers jsonb NOT NULL DEFAULT '[]'::jsonb,
  thumbnail text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS canvas_templates_user_id_idx
  ON public.canvas_templates(user_id);

CREATE INDEX IF NOT EXISTS canvas_templates_client_id_idx
  ON public.canvas_templates(client_id);

ALTER TABLE public.canvas_templates ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE ON public.canvas_templates TO authenticated;

DROP POLICY IF EXISTS "users see own + defaults" ON public.canvas_templates;
CREATE POLICY "users see own + defaults"
ON public.canvas_templates
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR is_default = true);

DROP POLICY IF EXISTS "users insert own" ON public.canvas_templates;
CREATE POLICY "users insert own"
ON public.canvas_templates
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users delete own non-default" ON public.canvas_templates;
CREATE POLICY "users delete own non-default"
ON public.canvas_templates
FOR DELETE
TO authenticated
USING (user_id = auth.uid() AND is_default = false);
