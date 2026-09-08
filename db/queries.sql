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
