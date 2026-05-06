ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS kie_task_id text;
CREATE INDEX IF NOT EXISTS idx_generations_kie_task_id ON public.generations(kie_task_id) WHERE kie_task_id IS NOT NULL;