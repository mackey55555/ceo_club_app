-- Fix RLS policies for event_tags table (add write permissions)

DROP POLICY IF EXISTS "event_tags_select_policy" ON event_tags;

CREATE POLICY "event_tags_select_policy" ON event_tags
    FOR SELECT
    USING (true);

CREATE POLICY "event_tags_insert_policy" ON event_tags
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "event_tags_update_policy" ON event_tags
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "event_tags_delete_policy" ON event_tags
    FOR DELETE
    USING (true);

-- Fix RLS policies for event_event_tags table (add write permissions)

DROP POLICY IF EXISTS "event_event_tags_select_policy" ON event_event_tags;

CREATE POLICY "event_event_tags_select_policy" ON event_event_tags
    FOR SELECT
    USING (true);

CREATE POLICY "event_event_tags_insert_policy" ON event_event_tags
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "event_event_tags_update_policy" ON event_event_tags
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "event_event_tags_delete_policy" ON event_event_tags
    FOR DELETE
    USING (true);

