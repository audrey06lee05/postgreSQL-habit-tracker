# 🔥 Habit Streak Tracker
🎯 A full-stack habit tracker — daily check-ins, streak calculations, a GitHub-style calendar heatmap, achievement badges, and a stats dashboard, all backed by a normalized PostgreSQL schema.

Built as a learning project focused on React state/hooks, REST API design, and raw SQL. No ORM, and streaks/stats are calculated from raw data at request time rather than stored, so they can never go stale.

## 🗣️ Language & Technologies
* PostgreSQL
* Node.js + Express
* `pg` (raw SQL, no ORM)
* React (Vite) — `fetch`, hooks, no state management library

## 🗄️ Schema Design
* **Habits** — name, description, category (constrained to Health/Productivity/Fitness/Learning/Other via a `CHECK`), and `created_at`.
* **Habit Completions** — one row per day a habit was checked off, linked to its habit via `habit_id` (one-to-many). A `UNIQUE (habit_id, completion_date)` constraint makes double check-ins on the same day impossible at the database level, not just in the UI.
* **Achievements** — one row per badge unlocked (7/30/100-day streaks), with `UNIQUE (habit_id, achievement_type)` so the same badge can't be earned twice. Awarding uses `ON CONFLICT DO NOTHING` to stay idempotent, and undoing a check-in re-checks the recalculated streak and deletes any badge it no longer reaches — badges reflect the current state of the data, not a one-way ratchet.
* **Streaks & stats aren't stored anywhere.** Current streak, longest streak, total completions, and completion percentage are all calculated at request time from the raw `habit_completions` rows — streaks via a gaps-and-islands pass in JS, stats via `GROUP BY` + `COUNT` in SQL — so none of it can ever drift out of sync with the actual check-in history.

Both child tables use `ON DELETE CASCADE`, so deleting a habit cleans up its completions and achievements automatically.

<img width="942" height="588" alt="image" src="https://github.com/user-attachments/assets/1109d47d-2abc-4a48-8869-1f69af9d1b4c" />


## 🏗️ API Endpoints
| Method | Endpoint | Returns |
|---|---|---|
| GET | `/api/health` | Server + database health check |
| GET | `/api/habits` | All habits, with today's check-in status |
| POST | `/api/habits` | Create a habit |
| PUT | `/api/habits/:id` | Update a habit's name/description/category |
| DELETE | `/api/habits/:id` | Delete a habit (cascades to its completions + achievements) |
| POST | `/api/habits/:id/complete` | Check in for today, awarding a badge if a streak milestone is hit |
| DELETE | `/api/habits/:id/complete` | Undo today's check-in, locking back any badge the new streak no longer reaches |
| GET | `/api/habits/:id/completions` | A habit's completion dates + current/longest streak |
| GET | `/api/habits/:id/achievements` | Badges earned for a habit |
| GET | `/api/stats` | Total completions + completion % for every habit |

## 🔧 Setup
1. Create a Postgres database (e.g. `habit_tracker`)
2. Run `db/schema.sql` against it — creates the three tables
3. Add a `.env` file in `server/`:
   ```
   DB_USER=<your postgres user>
   DB_PASSWORD=<your postgres password>
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=habit_tracker
   ```
4. Start the backend:
   ```
   cd server
   npm install
   node server.js
   ```
   Runs on `http://localhost:3001`
5. Start the frontend, in a separate terminal:
   ```
   cd client
   npm install
   npm run dev
   ```
   Opens on `http://localhost:5173`

## 📌 How to Use
#### ➕ Add a Habit
Fill in a name, optional description, and category, then hit **Add**.
#### ✅ Check In / Undo
**Check In** marks a habit done for today; if that streak hits 7, 30, or 100 days, a badge unlocks. **Undo Check In** removes today's check-in and re-locks any badge the streak no longer reaches.
#### 📅 Calendar
**Show Calendar** reveals a GitHub-style heatmap of the current month, with completed days highlighted.
#### 🏅 Badges
Each habit always shows all three streak badges — colored and labeled once earned, a plain 🔒 until then.
#### 📊 Statistics
The Statistics section shows the best-performing habit plus every habit's total completions and completion percentage, updating live as you check in, edit, or delete habits.
#### 📤 Export
**Export Data** downloads a `habit-data.json` file with every habit's info, stats, badges, and full completion history.

## 🗂️ Query Log
`db/queries.sql` holds every raw SQL query used by the API, in the order the routes were built — CRUD on habits, the check-in/undo logic, the achievements lookups, and the stats aggregation (`GROUP BY` + `COUNT` + a `LEFT JOIN` so habits with zero completions still show up instead of disappearing).
