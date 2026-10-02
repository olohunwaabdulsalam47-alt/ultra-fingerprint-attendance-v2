import { useEffect, useState } from "react";
import type { School } from "../../../domain/entities/school";
import {
  isValidSchool,
} from "../../../domain/validation/entityValidation";
import {
  getSchools,
  saveSchool,
} from "../../../data/repositories/schoolRepository";

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  async function loadSchools() {
    try {
      const savedSchools = await getSchools();
      setSchools(savedSchools);
      setError("");
    } catch {
      setError("Unable to load schools.");
    }
  }

  useEffect(() => {
    void loadSchools();
  }, []);

  async function handleAddSchool() {
    const schoolName = name.trim();

    if (!schoolName) {
      setError("School name is required.");
      return;
    }

    const now = new Date().toISOString();

    const school: School = {
      schoolId: crypto.randomUUID(),
      name: schoolName,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };

    if (!isValidSchool(school)) {
      setError("Invalid school data.");
      return;
    }

    try {
      await saveSchool(school);
      setName("");
      await loadSchools();
    } catch {
      setError("Unable to save school.");
    }
  }

  return (
    <section>
      <h2>School Management</h2>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleAddSchool();
        }}
      >
        <label>
          School Name
          <input
            type="text"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            placeholder="Enter school name"
            required
          />
        </label>

        <button type="submit">
          Add School
        </button>
      </form>

      {error && <p role="alert">{error}</p>}

      <h3>Schools</h3>

      {schools.length === 0 ? (
        <p>No schools have been added yet.</p>
      ) : (
        <ul>
          {schools.map((school) => (
            <li key={school.schoolId}>
              {school.name} — {school.status}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
