-- queries.sql — reference log of the raw SQL used by the API routes.
-- Kept separate from schema.sql so it's easy to see every query used
-- in the app in one place, without digging through server.js.
-- ($1, $2, ... are placeholders — see server.js for the real parameter values)

-- Health check (GET /api/health)
SELECT NOW();

-- Get all habits, newest first (GET /api/habits)
SELECT * FROM habits ORDER BY created_at DESC;

-- Create a new habit (POST /api/habits)
INSERT INTO habits (name, description, category)
VALUES ($1, $2, $3)
RETURNING *;

-- Update an existing habit (PUT /api/habits/:id)
UPDATE habits
SET name = $1, description = $2, category = $3
WHERE id = $4
RETURNING *;

-- Delete a habit (DELETE /api/habits/:id)
DELETE FROM habits
WHERE id = $1
RETURNING *;

-- Mark a habit complete for today (POST /api/habits/:id/complete)
INSERT INTO habit_completions (habit_id, completion_date)
VALUES ($1, CURRENT_DATE)
RETURNING *;

-- Get all habits with today's check-in status (GET /api/habits)
SELECT h.*,
  EXISTS (
    SELECT 1 FROM habit_completions hc
    WHERE hc.habit_id = h.id AND hc.completion_date = CURRENT_DATE
  ) AS completed_today
FROM habits h
ORDER BY h.created_at DESC;

-- Award a streak-milestone badge, skip silently if already earned (part of POST /api/habits/:id/complete)
INSERT INTO achievements (habit_id, achievement_type)
VALUES ($1, $2)
ON CONFLICT (habit_id, achievement_type) DO NOTHING;

-- Get all achievements earned for one habit (GET /api/habits/:id/achievements)
SELECT * FROM achievements
WHERE habit_id = $1
ORDER BY earned_at DESC;

-- Get stats for every habit — total completions and completion % since creation, capped at 100 (GET /api/stats)
SELECT h.id, h.name, h.category,
  COUNT(hc.id) AS total_completions,
  LEAST(ROUND(
    COUNT(hc.id)::numeric / GREATEST((CURRENT_DATE - h.created_at::date) + 1, 1) * 100,
  1), 100.0) AS completion_percentage
FROM habits h
LEFT JOIN habit_completions hc ON hc.habit_id = h.id
GROUP BY h.id
ORDER BY total_completions DESC;

-- Undo today's check-in for a habit, only today (DELETE /api/habits/:id/complete)
DELETE FROM habit_completions
WHERE habit_id = $1 AND completion_date = CURRENT_DATE
RETURNING *;

-- Lock back a badge whose streak the undo dropped below (part of DELETE /api/habits/:id/complete)
DELETE FROM achievements
WHERE habit_id = $1 AND achievement_type = $2;
