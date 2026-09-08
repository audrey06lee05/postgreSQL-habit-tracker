// server.js — Express backend for the Habit Streak Tracker.
// Handles API requests from the React frontend and talks to PostgreSQL.

const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { Pool, types } = require("pg");
// Keep DATE columns as plain "YYYY-MM-DD" strings instead of
// converting them to JS Date objects, which shifts by timezone
types.setTypeParser(1082, (val) => val);

// Connection to the PostgreSQL database, using credentials from .env
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

const app = express();
app.use(cors()); // allow the React app (different port) to call this API
app.use(express.json()); // parse incoming JSON request bodies

// Sanity check — confirms the server is running and can reach the database
app.get("/api/health", async (req, res) => {
  const result = await pool.query("SELECT NOW()");
  res.json({ status: "ok", time: result.rows[0].now });
});

// Get all habits, newest first, with today's check-in status
app.get("/api/habits", async (req, res) => {
  const result = await pool.query(`
    SELECT h.*,
      EXISTS (
        SELECT 1 FROM habit_completions hc
        WHERE hc.habit_id = h.id AND hc.completion_date = CURRENT_DATE
      ) AS completed_today
    FROM habits h
    ORDER BY h.created_at DESC
  `);
  res.json(result.rows);
});

// Create a new habit
app.post("/api/habits", async (req, res) => {
  const { name, description, category } = req.body;
  const result = await pool.query(
    "INSERT INTO habits (name, description, category) VALUES ($1, $2, $3) RETURNING *",
    [name, description, category],
  );
  res.json(result.rows[0]);
});

// Update an existing habit by id
app.put("/api/habits/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description, category } = req.body;
  const result = await pool.query(
    "UPDATE habits SET name = $1, description = $2, category = $3 WHERE id = $4 RETURNING *",
    [name, description, category, id],
  );
  res.json(result.rows[0]);
});

// Delete a habit by id
app.delete("/api/habits/:id", async (req, res) => {
  const { id } = req.params;
  const result = await pool.query(
    "DELETE FROM habits WHERE id = $1 RETURNING *",
    [id],
  );
  res.json({ message: "Habit deleted", deleted: result.rows[0] });
});

// Mark a habit complete for today, award a badge if a streak milestone is hit
app.post("/api/habits/:id/complete", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "INSERT INTO habit_completions (habit_id, completion_date) VALUES ($1, CURRENT_DATE) RETURNING *",
      [id],
    );

    const completions = await pool.query(
      "SELECT completion_date FROM habit_completions WHERE habit_id = $1 ORDER BY completion_date ASC",
      [id],
    );
    const dates = completions.rows.map((row) => row.completion_date);
    const currentStreak = calculateCurrentStreak(dates);

    const milestones = [7, 30, 100];
    if (milestones.includes(currentStreak)) {
      await pool.query(
        "INSERT INTO achievements (habit_id, achievement_type) VALUES ($1, $2) ON CONFLICT (habit_id, achievement_type) DO NOTHING",
        [id, `${currentStreak}-day-streak`],
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: "Already checked in today" });
  }
});

// Get all achievements earned for one habit
app.get("/api/habits/:id/achievements", async (req, res) => {
  const { id } = req.params;
  const result = await pool.query(
    "SELECT * FROM achievements WHERE habit_id = $1 ORDER BY earned_at DESC",
    [id],
  );
  res.json(result.rows);
});

// Get completion dates + current/longest streak for one habit
app.get("/api/habits/:id/completions", async (req, res) => {
  const { id } = req.params;
  const result = await pool.query(
    "SELECT completion_date FROM habit_completions WHERE habit_id = $1 ORDER BY completion_date ASC",
    [id],
  );
  const dates = result.rows.map((row) => row.completion_date);
  const longestStreak = calculateLongestStreak(dates);
  const currentStreak = calculateCurrentStreak(dates);
  res.json({ dates, longestStreak, currentStreak });
});

// Get stats for every habit — total completions and completion % since creation
app.get("/api/stats", async (req, res) => {
  const result = await pool.query(`
    SELECT h.id, h.name, h.category,
      COUNT(hc.id) AS total_completions,
      LEAST(ROUND(
        COUNT(hc.id)::numeric / GREATEST((CURRENT_DATE - h.created_at::date) + 1, 1) * 100,
      1), 100.0) AS completion_percentage
    FROM habits h
    LEFT JOIN habit_completions hc ON hc.habit_id = h.id
    GROUP BY h.id
    ORDER BY total_completions DESC
  `);
  res.json(result.rows);
});

// Calculate the longest streak from a sorted array of "YYYY-MM-DD" dates
function calculateLongestStreak(dates) {
  if (dates.length === 0) return 0;

  const oneDay = 1000 * 60 * 60 * 24;
  let longestStreak = 1;
  let runningStreak = 1;

  for (let i = 1; i < dates.length; i++) {
    const diffInDays = (new Date(dates[i]) - new Date(dates[i - 1])) / oneDay;

    if (diffInDays === 1) {
      runningStreak++;
    } else {
      runningStreak = 1;
    }

    if (runningStreak > longestStreak) {
      longestStreak = runningStreak;
    }
  }

  return longestStreak;
}

// Calculate the current streak (must include today or yesterday to count)
function calculateCurrentStreak(dates) {
  if (dates.length === 0) return 0;

  const oneDay = 1000 * 60 * 60 * 24;
  const today = new Date().toISOString().split("T")[0];
  const lastDate = dates[dates.length - 1];
  const diffFromToday = (new Date(today) - new Date(lastDate)) / oneDay;

  if (diffFromToday > 1) return 0; // last check-in too long ago, streak's broken

  let currentStreak = 1;
  for (let i = dates.length - 1; i > 0; i--) {
    const diffInDays = (new Date(dates[i]) - new Date(dates[i - 1])) / oneDay;
    if (diffInDays === 1) {
      currentStreak++;
    } else {
      break;
    }
  }

  return currentStreak;
}

app.listen(3001, () => console.log("Server running on port 3001"));
