import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [habits, setHabits] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Health");

  useEffect(() => {
    fetchHabits();
  }, []);

  function fetchHabits() {
    fetch("http://localhost:3001/api/habits")
      .then((res) => res.json())
      .then((data) => setHabits(data));
  }

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

  return (
    <div>
      <h1>Habit Streak Tracker</h1>

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

      <ul>
        {habits.map((habit) => (
          <li key={habit.id}>
            <strong>{habit.name}</strong> — {habit.category}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
