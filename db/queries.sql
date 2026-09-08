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
