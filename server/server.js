// server.js — Express backend for the Habit Streak Tracker.
// Handles API requests from the React frontend and talks to PostgreSQL.

const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { Pool } = require("pg");

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

// Get all habits, newest first
app.get("/api/habits", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM habits ORDER BY created_at DESC",
  );
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

app.listen(3001, () => console.log("Server running on port 3001"));
