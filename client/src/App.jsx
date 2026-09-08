// App.jsx — main (and so far only) component for the Habit Streak Tracker UI.
// Displays the habit list, a form to add new habits, and a delete button per habit.

import { useState, useEffect } from "react";
import "./App.css";

const MILESTONES = [
  { type: "7-day-streak", label: "7-Day Streak", icon: "🔥", className: "b7" },
  {
    type: "30-day-streak",
    label: "30-Day Streak",
    icon: "⭐",
    className: "b30",
  },
  {
    type: "100-day-streak",
    label: "100-Day Streak",
    icon: "🏆",
    className: "b100",
  },
];

function App() {
  // ============================================================
  // STATE
  // ============================================================
  const [habits, setHabits] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Health");
  const [calendars, setCalendars] = useState({});
  const [filterCategory, setFilterCategory] = useState("All");
  const [achievements, setAchievements] = useState({});
  const [streaks, setStreaks] = useState({});
  const [stats, setStats] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("Health");

  // ============================================================
  // EFFECTS
  // ============================================================
  // Load habits once, when the page first loads
  useEffect(() => {
    fetchHabits();
    fetchStats();
  }, []);

  // ============================================================
  // API CALLS
  // ============================================================
  // Read: get all habits from the backend, then fetch each one's badges
  function fetchHabits() {
    fetch("http://localhost:3001/api/habits")
      .then((res) => res.json())
      .then((data) => {
        setHabits(data);
        fetchAllAchievements(data);
        fetchAllStreaks(data);
      });
  }

  // Read: get badges for every habit at once
  function fetchAllAchievements(habitsList) {
    habitsList.forEach((habit) => {
      fetch(`http://localhost:3001/api/habits/${habit.id}/achievements`)
        .then((res) => res.json())
        .then((data) =>
          setAchievements((prev) => ({ ...prev, [habit.id]: data })),
        );
    });
  }

  // Read: get current/longest streak for every habit at once
  function fetchAllStreaks(habitsList) {
    habitsList.forEach((habit) => {
      fetch(`http://localhost:3001/api/habits/${habit.id}/completions`)
        .then((res) => res.json())
        .then((data) =>
          setStreaks((prev) => ({
            ...prev,
            [habit.id]: {
              currentStreak: data.currentStreak,
              longestStreak: data.longestStreak,
            },
          })),
        );
    });
  }

  // Read: get stats (total completions + completion %) for every habit
  function fetchStats() {
    fetch("http://localhost:3001/api/stats")
      .then((res) => res.json())
      .then((data) => setStats(data));
  }

  // Create: submit the form to add a new habit, then refresh the list
  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return; // don't submit a habit with no name

    fetch("http://localhost:3001/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, category }),
    }).then(() => {
      fetchHabits();
      fetchStats();
      setName("");
      setDescription("");
    });
  }

  // Check in: mark a habit complete for today, then refresh the list
  function handleCheckIn(id) {
    fetch(`http://localhost:3001/api/habits/${id}/complete`, {
      method: "POST",
    }).then(() => {
      fetchHabits();
      fetchStats();
      refreshCalendarIfOpen(id);
    });
  }

  // Undo: remove today's check-in, then refresh the list
  function handleUncheckIn(id) {
    fetch(`http://localhost:3001/api/habits/${id}/complete`, {
      method: "DELETE",
    }).then(() => {
      fetchHabits();
      fetchStats();
      refreshCalendarIfOpen(id);
    });
  }

  // If this habit's calendar is currently open, re-fetch its dates so the
  // heatmap reflects the check-in/undo that just happened
  function refreshCalendarIfOpen(id) {
    if (!calendars[id]) return;
    fetch(`http://localhost:3001/api/habits/${id}/completions`)
      .then((res) => res.json())
      .then((data) => setCalendars((prev) => ({ ...prev, [id]: data.dates })));
  }

  // Delete: remove a habit by id, then refresh the list
  function handleDelete(id) {
    if (!window.confirm("Delete this habit? This can't be undone.")) return;

    fetch(`http://localhost:3001/api/habits/${id}`, {
      method: "DELETE",
    }).then(() => {
      fetchHabits();
      fetchStats();
    });
  }

  function startEdit(habit) {
    setEditingId(habit.id);
    setEditName(habit.name);
    setEditDescription(habit.description);
    setEditCategory(habit.category);
  }

  function handleUpdate(id) {
    fetch(`http://localhost:3001/api/habits/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName,
        description: editDescription,
        category: editCategory,
      }),
    }).then(() => {
      fetchHabits();
      fetchStats();
      setEditingId(null);
    });
  }

  function toggleCalendar(id) {
    if (calendars[id]) {
      const updatedCalendars = { ...calendars };
      delete updatedCalendars[id];
      setCalendars(updatedCalendars);
      return;
    }
    fetch(`http://localhost:3001/api/habits/${id}/completions`)
      .then((res) => res.json())
      .then((data) => setCalendars({ ...calendars, [id]: data.dates }));
  }

  // Export: fetch every habit's completion history, combine it with stats +
  // badges already in state, then download the result as one JSON file
  function handleExport() {
    Promise.all(
      habits.map((habit) =>
        fetch(`http://localhost:3001/api/habits/${habit.id}/completions`)
          .then((res) => res.json())
          .then((data) => ({ ...habit, completions: data.dates })),
      ),
    ).then((habitsWithCompletions) => {
      const exportData = habitsWithCompletions.map((habit) => {
        const habitStats = stats.find((s) => s.id === habit.id);
        return {
          ...habit,
          total_completions: habitStats ? habitStats.total_completions : 0,
          completion_percentage: habitStats
            ? habitStats.completion_percentage
            : 0,
          badges: (achievements[habit.id] || []).map((b) => b.achievement_type),
        };
      });

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "habit-data.json";
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  // ============================================================
  // HELPERS
  // ============================================================
  // Build an array of every day in the current month as "YYYY-MM-DD" strings
  function getDaysInCurrentMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0 = January, 11 = December
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // day 0 of next month = last day of this month

    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const mm = String(month + 1).padStart(2, "0");
      const dd = String(day).padStart(2, "0");
      days.push(`${year}-${mm}-${dd}`);
    }
    return days;
  }

  // Find the habit with the highest completion percentage
  function getBestHabit() {
    if (stats.length === 0) return null;
    return stats.reduce((best, current) =>
      Number(current.completion_percentage) > Number(best.completion_percentage)
        ? current
        : best,
    );
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div>
      <h1>Habit Streak Tracker</h1>

      {/* Add-habit form */}
      <form className="habit-form" onSubmit={handleSubmit}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Habit name"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option>Health</option>
          <option>Productivity</option>
          <option>Fitness</option>
          <option>Learning</option>
          <option>Other</option>
        </select>
        <button type="submit">Add</button>
      </form>

      {/* Category filter */}
      <div className="filter-row">
        Filter:{" "}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option>All</option>
          <option>Health</option>
          <option>Productivity</option>
          <option>Fitness</option>
          <option>Learning</option>
          <option>Other</option>
        </select>
      </div>

      {/* Habit list */}
      <ul className="habit-list">
        {habits
          .filter(
            (habit) =>
              filterCategory === "All" || habit.category === filterCategory,
          )
          .map((habit) => (
            <li key={habit.id} className="habit-item">
              {editingId === habit.id ? (
                <div className="edit-form">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Habit name"
                  />
                  <input
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Description"
                  />
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                  >
                    <option>Health</option>
                    <option>Productivity</option>
                    <option>Fitness</option>
                    <option>Learning</option>
                    <option>Other</option>
                  </select>
                  <div className="habit-actions">
                    <button onClick={() => handleUpdate(habit.id)}>Save</button>
                    <button onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="habit-top">
                    <span className="habit-name">{habit.name}</span>
                    <span className="habit-cat">{habit.category}</span>
                    {habit.completed_today && (
                      <span className="done">✓ done today</span>
                    )}
                  </div>
                  {habit.description && (
                    <p className="habit-desc">{habit.description}</p>
                  )}
                  {streaks[habit.id] && streaks[habit.id].currentStreak > 0 && (
                    <p className="streak-info">
                      🔥 {streaks[habit.id].currentStreak}-day streak
                      {streaks[habit.id].longestStreak >
                        streaks[habit.id].currentStreak &&
                        ` (longest: ${streaks[habit.id].longestStreak})`}
                    </p>
                  )}
                  <div className="habit-actions">
                    {habit.completed_today ? (
                      <button onClick={() => handleUncheckIn(habit.id)}>
                        Undo Check In
                      </button>
                    ) : (
                      <button onClick={() => handleCheckIn(habit.id)}>
                        Check In
                      </button>
                    )}
                    <button onClick={() => toggleCalendar(habit.id)}>
                      {calendars[habit.id] ? "Hide Calendar" : "Show Calendar"}
                    </button>
                    <button onClick={() => startEdit(habit)}>Edit</button>
                    <button onClick={() => handleDelete(habit.id)}>
                      Delete
                    </button>
                  </div>
                  <div className="badges">
                    {MILESTONES.map((milestone) => {
                      const earned = (achievements[habit.id] || []).some(
                        (badge) => badge.achievement_type === milestone.type,
                      );
                      return (
                        <span
                          key={milestone.type}
                          className={`badge ${earned ? milestone.className : "locked"}`}
                        >
                          {earned
                            ? `${milestone.icon} ${milestone.label}`
                            : "🔒"}
                        </span>
                      );
                    })}
                  </div>
                  {calendars[habit.id] && (
                    <div className="heatmap">
                      {getDaysInCurrentMonth().map((day) => (
                        <div
                          key={day}
                          className={`heatmap-day ${calendars[habit.id].includes(day) ? "completed" : ""}`}
                          title={day}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </li>
          ))}
      </ul>

      {/* Statistics dashboard */}
      <h2>Statistics</h2>
      {stats.length > 0 && (
        <p className="best-stat">
          🏆 Best performing: <strong>{getBestHabit().name}</strong> (
          {getBestHabit().completion_percentage}%)
        </p>
      )}
      <ul className="stats-list">
        {stats.map((stat) => (
          <li key={stat.id} className="stat-row">
            <span>{stat.name}</span>
            <span>
              {stat.total_completions} completions ·{" "}
              {stat.completion_percentage}%
            </span>
          </li>
        ))}
      </ul>

      <button className="export-btn" onClick={handleExport}>
        Export Data
      </button>
    </div>
  );
}

export default App;
