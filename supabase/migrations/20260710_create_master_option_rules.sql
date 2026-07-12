-- 1. Create the master_option_rules table representing 1:1 relationship
CREATE TABLE IF NOT EXISTS public.master_option_rules (
    master_option_id UUID PRIMARY KEY REFERENCES public.master_options(id) ON DELETE CASCADE,
    xp INTEGER DEFAULT 0 NOT NULL,
    hp INTEGER DEFAULT 0 NOT NULL,
    coins INTEGER DEFAULT 0 NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.master_option_rules ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies matching master_options
CREATE POLICY "Allow public read access" ON public.master_option_rules
    FOR SELECT USING (true);

CREATE POLICY "Enable all access for authenticated users" ON public.master_option_rules
    USING (auth.role() = 'authenticated');

-- 4. Grant Permissions
GRANT ALL ON TABLE public.master_option_rules TO anon;
GRANT ALL ON TABLE public.master_option_rules TO authenticated;
GRANT ALL ON TABLE public.master_option_rules TO service_role;

-- 5. Seed existing data from game_configs (ATTENDANCE_RULES) into master_option_rules
DO $$
DECLARE
    rule_key text;
    rule_data jsonb;
    rule_val jsonb;
    mo_id uuid;
BEGIN
    SELECT value::jsonb INTO rule_val FROM public.game_configs WHERE key = 'ATTENDANCE_RULES' LIMIT 1;
    IF rule_val IS NOT NULL THEN
        FOR rule_key, rule_data IN SELECT * FROM jsonb_each(rule_val) LOOP
            -- find corresponding master_option id by key
            SELECT id INTO mo_id FROM public.master_options WHERE key = rule_key LIMIT 1;
            IF mo_id IS NOT NULL THEN
                INSERT INTO public.master_option_rules (master_option_id, xp, hp, coins)
                VALUES (
                    mo_id,
                    COALESCE((rule_data->>'xp')::integer, 0),
                    COALESCE((rule_data->>'hp')::integer, 0),
                    COALESCE((rule_data->>'coins')::integer, 0)
                )
                ON CONFLICT (master_option_id) DO UPDATE
                SET xp = EXCLUDED.xp,
                    hp = EXCLUDED.hp,
                    coins = EXCLUDED.coins;
            END IF;
        END LOOP;
    END IF;
END;
$$;

-- 6. Trigger to automatically sync master_option_rules back to game_configs (key = 'ATTENDANCE_RULES')
CREATE OR REPLACE FUNCTION public.sync_master_option_rules_to_game_configs()
RETURNS trigger AS $$
DECLARE
    rules_jsonb JSONB;
BEGIN
    -- Aggregate rules from master_option_rules joined with master_options to get keys, format them as JSONB
    SELECT jsonb_object_agg(mo.key, jsonb_build_object('xp', mor.xp, 'hp', mor.hp, 'coins', mor.coins))
    INTO rules_jsonb
    FROM public.master_option_rules mor
    JOIN public.master_options mo ON mor.master_option_id = mo.id;

    -- Update or insert into game_configs under key 'ATTENDANCE_RULES'
    INSERT INTO public.game_configs (key, value)
    VALUES ('ATTENDANCE_RULES', COALESCE(rules_jsonb, '{}'::jsonb))
    ON CONFLICT (key) DO UPDATE
    SET value = COALESCE(rules_jsonb, '{}'::jsonb);

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 7. Register Triggers
CREATE OR REPLACE TRIGGER trg_sync_master_option_rules
AFTER INSERT OR UPDATE OR DELETE ON public.master_option_rules
FOR EACH STATEMENT
EXECUTE FUNCTION public.sync_master_option_rules_to_game_configs();

CREATE OR REPLACE TRIGGER trg_sync_master_option_rules_on_options
AFTER UPDATE OF key ON public.master_options
FOR EACH STATEMENT
EXECUTE FUNCTION public.sync_master_option_rules_to_game_configs();
