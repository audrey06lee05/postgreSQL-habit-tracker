-- seed_demo.sql — 5 demo habits covering every badge state. Run once before the demo.
-- Uses generate_series() for date ranges + WITH...RETURNING to chain the inserts.

-- Uncomment to clear these before re-seeding:
-- DELETE FROM habits WHERE name IN ('Meditate', 'Read 20 pages', 'Stretch', 'Journal', 'Drink water');

-- ============================================================
-- 1. Meditate — every badge earned (100-day streak, maxed out)
-- ============================================================
WITH h AS (
  INSERT INTO habits (name, description, category, created_at)
  VALUES ('Meditate', '10 minutes every morning', 'Health', CURRENT_DATE - INTERVAL '99 days')
  RETURNING id
),
c AS (
  INSERT INTO habit_completions (habit_id, completion_date)
  SELECT id, generate_series(CURRENT_DATE - INTERVAL '99 days', CURRENT_DATE, INTERVAL '1 day')::date
  FROM h
  RETURNING habit_id
)
INSERT INTO achievements (habit_id, achievement_type)
SELECT DISTINCT c.habit_id, badge
FROM c, (VALUES ('7-day-streak'), ('30-day-streak'), ('100-day-streak')) AS badges(badge);

-- ============================================================
-- 2. Read 20 pages — 2 of 3 badges (30-day streak, 100 still locked)
-- ============================================================
WITH h AS (
  INSERT INTO habits (name, description, category, created_at)
  VALUES ('Read 20 pages', 'Fiction or non-fiction, doesn''t matter', 'Learning', CURRENT_DATE - INTERVAL '33 days')
  RETURNING id
),
c AS (
  INSERT INTO habit_completions (habit_id, completion_date)
  SELECT id, generate_series(CURRENT_DATE - INTERVAL '29 days', CURRENT_DATE, INTERVAL '1 day')::date
  FROM h
  RETURNING habit_id
)
INSERT INTO achievements (habit_id, achievement_type)
SELECT DISTINCT c.habit_id, badge
FROM c, (VALUES ('7-day-streak'), ('30-day-streak')) AS badges(badge);

-- ============================================================
-- 3. Stretch — 1 of 3 badges (7-day streak only)
-- ============================================================
WITH h AS (
  INSERT INTO habits (name, description, category, created_at)
  VALUES ('Stretch', '5 minutes, doesn''t need to be fancy', 'Fitness', CURRENT_DATE - INTERVAL '9 days')
  RETURNING id
),
c AS (
  INSERT INTO habit_completions (habit_id, completion_date)
  SELECT id, generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day')::date
  FROM h
  RETURNING habit_id
)
INSERT INTO achievements (habit_id, achievement_type)
SELECT DISTINCT habit_id, '7-day-streak' FROM c;

-- ============================================================
-- 4. Journal — current streak (2) vs. longest streak (10) mismatch.
--    Broke a 10-day streak, earned the 7-day badge during it, then
--    restarted 2 days ago. Badge stays lit even though the current
--    streak no longer reaches it — badges are a historical record,
--    not tied to your current state.
-- ============================================================
WITH h AS (
  INSERT INTO habits (name, description, category, created_at)
  VALUES ('Journal', 'A few sentences before bed', 'Productivity', CURRENT_DATE - INTERVAL '24 days')
  RETURNING id
),
c AS (
  INSERT INTO habit_completions (habit_id, completion_date)
  SELECT id, d FROM h,
    (
      SELECT generate_series(CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE - INTERVAL '11 days', INTERVAL '1 day')::date AS d
      UNION ALL
      SELECT generate_series(CURRENT_DATE - INTERVAL '1 days', CURRENT_DATE, INTERVAL '1 day')::date AS d
    ) AS dates
  RETURNING habit_id
)
INSERT INTO achievements (habit_id, achievement_type)
SELECT DISTINCT habit_id, '7-day-streak' FROM c;

-- ============================================================
-- 5. Drink water — brand new, zero completions, all 3 badges locked
-- ============================================================
INSERT INTO habits (name, description, category)
VALUES ('Drink water', '8 glasses a day', 'Health');
