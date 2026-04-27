ALTER TABLE specialists
  ADD COLUMN IF NOT EXISTS focus_areas TEXT[] DEFAULT '{}';
