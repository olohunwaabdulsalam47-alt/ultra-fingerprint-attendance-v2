import { useEffect, useState } from "react";
import type { SchoolClass } from "../../../domain/entities/class";
import { isValidSchoolClass } from "../../../domain/validation/entityValidation";
import {
  getClasses,
  saveClass,
} from "../../../data/repositories/classRepository";

export default function ClassesPage() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [schoolId, setSchoolId] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  async function loadClasses() {
    try {
      const savedClasses = await getClasses();
      setClasses(savedClasses);
      setError("");
    } catch {
      setError("Unable to load classes.");
    }
  }

  useEffect(() => {
    void loadClasses();
  }, []);

  async function handleAddClass() {
    const className = name.trim();
    const selectedSchoolId = schoolId.trim();

    if (!selectedSchoolId) {
      setError("School ID is required.");
      return;
    }

    if (!className) {
      setError("Class name is required.");
      return;
    }

    const now = new Date().toISOString();

    const schoolClass: SchoolClass = {
      classId: crypto.randomUUID(),
      schoolId: selectedSchoolId,
      name: className,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };

    if (!isValidSchoolClass(schoolClass)) {
      setError("Invalid class data.");
      return;
    }

    try {
      await saveClass(schoolClass);

      setSchoolId("");
      setName("");

      await loadClasses();
    } catch {
      setError("Unable to save class.");
    }
  }

  return (
    <section>
      <h2>Class Management</h2>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleAddClass();
        }}
      >
        <label>
          School ID
          <input
            type="text"
            value={schoolId}
            onChange={(event) =>
              setSchoolId(event.target.value)
            }
            placeholder="Enter School ID"
            required
          />
        </label>

        <label>
          Class Name
          <input
            type="text"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            placeholder="Enter class name"
            required
          />
        </label>

        <button type="submit">
          Add Class
        </button>
      </form>

      {error && <p role="alert">{error}</p>}

      <h3>Classes</h3>

      {classes.length === 0 ? (
        <p>No classes have been added yet.</p>
      ) : (
        <ul>
          {classes.map((schoolClass) => (
            <li key={schoolClass.classId}>
              {schoolClass.name} — School:{" "}
              {schoolClass.schoolId} —{" "}
              {schoolClass.status}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
