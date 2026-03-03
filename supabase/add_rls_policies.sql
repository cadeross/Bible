-- Migration: Add missing RLS policies

-- reading_history: UPDATE policy (matches existing INSERT pattern)
CREATE POLICY IF NOT EXISTS "Users can update their own reading_history"
    ON public.reading_history
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- saved_wisdom: UPDATE policy
CREATE POLICY IF NOT EXISTS "Users can update their own saved_wisdom"
    ON public.saved_wisdom
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- daily_content: explicit SELECT for authenticated and anon users
-- (makes intent explicit instead of relying on implicit open access)
CREATE POLICY IF NOT EXISTS "Anyone can read daily_content"
    ON public.daily_content
    FOR SELECT
    USING (true);
