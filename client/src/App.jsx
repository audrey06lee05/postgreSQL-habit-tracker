// App.jsx — main (and so far only) component for the Habit Streak Tracker UI.
// Displays the habit list, a form to add new habits, and a delete button per habit.

import { useState, useEffect } from "react";
import "./App.css";

function App() {
  // ============================================================
  // STATE
  // ============================================================
  const [habits, setHabits] = useState([]); // the list of habits fetched from the API
  const [name, setName] = useState(""); // controlled input: new habit's name
  const [description, setDescription] = useState(""); // controlled input: new habit's description
  const [category, setCategory] = useState("Health"); // controlled input: new habit's category
  const [calendars, setCalendars] = useState({}); // { habitId: [dates] }
  const [filterCategory, setFilterCategory] = useState("All"); // which category to show in the list

  // ============================================================
  // EFFECTS
  // ============================================================
  // Load habits once, when the page first loads
  useEffect(() => {
    fetchHabits();
  }, []);

  // ============================================================
  // API CALLS
  // ============================================================
  // Read: get all habits from the backend
  function fetchHabits() {
    fetch("http://localhost:3001/api/habits")
      .then((res) => res.json())
      .then((data) => setHabits(data));
  }

  // Create: submit the form to add a new habit, then refresh the list
  function handleSubmit(e) {
    e.preventDefault();
    fetch("http://localhost:3001/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, category }),
    }).then(() => {
      fetchHabits();
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
    });
  }

  // Delete: remove a habit by id, then refresh the list
  function handleDelete(id) {
    fetch(`http://localhost:3001/api/habits/${id}`, {
      method: "DELETE",
    }).then(() => {
      fetchHabits();
    });
  }

  function toggleCalendar(id) {
    if (calendars[id]) {
      const updated = { ...calendars };
      delete updated[id];
      setCalendars(updated);
      return;
    }
    fetch(`http://localhost:3001/api/habits/${id}/completions`)
      .then((res) => res.json())
      .then((data) => setCalendars({ ...calendars, [id]: data.dates }));
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

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div>
      <h1>Habit Streak Tracker</h1>

      {/* Add-habit form */}
      <form onSubmit={handleSubmit}>
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
        <button type="submit">Add Habit</button>
      </form>

      {/* Category filter */}
      <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
        <option>All</option>
        <option>Health</option>
        <option>Productivity</option>
        <option>Fitness</option>
        <option>Learning</option>
        <option>Other</option>
      </select>

      {/* Habit list */}
      <ul>
        {habits
          .filter((habit) => filterCategory === "All" || habit.category === filterCategory)
          .map((habit) => (
          <li key={habit.id}>
            <strong>{habit.name}</strong> — {habit.category}
            {habit.completed_today && <span> ✓ done today</span>}
            <button
              onClick={() => handleCheckIn(habit.id)}
              disabled={habit.completed_today}
            >
              Check In
            </button>
            <button onClick={() => handleDelete(habit.id)}>Delete</button>
            <button onClick={() => toggleCalendar(habit.id)}>
              {calendars[habit.id] ? "Hide Calendar" : "Show Calendar"}
            </button>
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
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
