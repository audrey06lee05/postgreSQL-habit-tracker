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

  // Delete: remove a habit by id, then refresh the list
  function handleDelete(id) {
    fetch(`http://localhost:3001/api/habits/${id}`, {
      method: "DELETE",
    }).then(() => {
      fetchHabits();
    });
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

      {/* Habit list */}
      <ul>
        {habits.map((habit) => (
          <li key={habit.id}>
            <strong>{habit.name}</strong> — {habit.category}
            <button onClick={() => handleDelete(habit.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
