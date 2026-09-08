const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", async (req, res) => {
  const result = await pool.query("SELECT NOW()");
  res.json({ status: "ok", time: result.rows[0].now });
});

app.get("/api/habits", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM habits ORDER BY created_at DESC",
  );
  res.json(result.rows);
});

app.post("/api/habits", async (req, res) => {
  const { name, description, category } = req.body;
  const result = await pool.query(
    "INSERT INTO habits (name, description, category) VALUES ($1, $2, $3) RETURNING *",
    [name, description, category],
  );
  res.json(result.rows[0]);
});

app.listen(3001, () => console.log("Server running on port 3001"));
