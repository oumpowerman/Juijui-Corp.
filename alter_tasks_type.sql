
-- Convert 'type' column to text to remove ENUM constraints
ALTER TABLE public.tasks 
ALTER COLUMN type TYPE text;

-- If there is a separate ENUM type created for this column, you might want to drop it later
-- DROP TYPE IF EXISTS task_type_enum;
