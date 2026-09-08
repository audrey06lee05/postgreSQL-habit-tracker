-- schema.sql — Database structure for the Habit Streak Tracker.
-- Three tables: habits (the list), habit_completions (daily check-ins),
-- and achievements (unlocked badges). Both child tables link back to
-- habits via habit_id (one habit -> many completions / achievements).

-- The habits themselves
CREATE TABLE habits (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('Health', 'Productivity', 'Fitness', 'Learning', 'Other')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- One row per day a habit was checked off
CREATE TABLE habit_completions (
    id SERIAL PRIMARY KEY,
    habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    completion_date DATE NOT NULL,
    UNIQUE (habit_id, completion_date) -- can't check in twice on the same day
);

-- One row per badge unlocked (e.g. 7-day streak)
CREATE TABLE achievements (
    id SERIAL PRIMARY KEY,
    habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    achievement_type TEXT NOT NULL,
    earned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (habit_id, achievement_type) -- can't earn the same badge twice
);
