-- Migration: Add performance indexes
-- These match the query patterns used throughout the app

-- highlights: chapter load (most frequent query)
CREATE INDEX IF NOT EXISTS highlights_user_book_chapter_idx
    ON public.highlights(user_id, book, chapter);

-- highlights: library view (sorted by newest)
CREATE INDEX IF NOT EXISTS highlights_user_created_idx
    ON public.highlights(user_id, created_at DESC);

-- reading_history: stats/heatmap queries
CREATE INDEX IF NOT EXISTS reading_history_user_completed_idx
    ON public.reading_history(user_id, completed_at DESC);

-- saved_wisdom: library view
CREATE INDEX IF NOT EXISTS saved_wisdom_user_created_idx
    ON public.saved_wisdom(user_id, created_at DESC);
