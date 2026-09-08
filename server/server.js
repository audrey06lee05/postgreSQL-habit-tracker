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

app.listen(3001, () => console.log("Server running on port 3001"));
