-- Migration: Auto-update updated_at on INSERT/UPDATE
-- Applies to all tables that have an updated_at column

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- highlights
DROP TRIGGER IF EXISTS set_highlights_updated_at ON public.highlights;
CREATE TRIGGER set_highlights_updated_at
    BEFORE INSERT OR UPDATE ON public.highlights
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- reading_history
DROP TRIGGER IF EXISTS set_reading_history_updated_at ON public.reading_history;
CREATE TRIGGER set_reading_history_updated_at
    BEFORE INSERT OR UPDATE ON public.reading_history
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- profiles
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- saved_wisdom
DROP TRIGGER IF EXISTS set_saved_wisdom_updated_at ON public.saved_wisdom;
CREATE TRIGGER set_saved_wisdom_updated_at
    BEFORE INSERT OR UPDATE ON public.saved_wisdom
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
