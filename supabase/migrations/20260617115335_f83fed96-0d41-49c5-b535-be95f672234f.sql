UPDATE public.generations
SET layout_guide = NULL
WHERE status = 'failed'
  AND layout_guide IS NOT NULL
  AND length(btrim(layout_guide)) < 50;