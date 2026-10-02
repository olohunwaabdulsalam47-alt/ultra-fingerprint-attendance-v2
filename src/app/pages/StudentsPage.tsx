import { useEffect, useState } from "react";
import type { Student } from "../../../domain/entities/student";
import { isValidStudent } from "../../../domain/validation/entityValidation";
import {
  getStudents,
  saveStudent,
} from "../../../data/repositories/studentRepository";

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [schoolId, setSchoolId] = useState("");
  const [classId, setClassId] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  async function loadStudents() {
    try {
      const savedStudents = await getStudents();
      setStudents(savedStudents);
      setError("");
    } catch {
      setError("Unable to load students.");
    }
  }

  useEffect(() => {
    void loadStudents();
  }, []);

  async function handleAddStudent() {
    const studentName = name.trim();
    const selectedSchoolId = schoolId.trim();
    const selectedClassId = classId.trim();

    if (!selectedSchoolId) {
      setError("School ID is required.");
      return;
    }

    if (!selectedClassId) {
      setError("Class ID is required.");
      return;
    }

    if (!studentName) {
      setError("Student name is required.");
      return;
    }

    const now = new Date().toISOString();

    const student: Student = {
      studentId: crypto.randomUUID(),
      schoolId: selectedSchoolId,
      name: studentName,
      classId: selectedClassId,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };

    if (!isValidStudent(student)) {
      setError("Invalid student data.");
      return;
    }

    try {
      await saveStudent(student);

      setSchoolId("");
      setClassId("");
      setName("");

      await loadStudents();
    } catch {
      setError("Unable to save student.");
    }
  }

  return (
    <section>
      <h2>Student Management</h2>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleAddStudent();
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
          Class ID
          <input
            type="text"
            value={classId}
            onChange={(event) =>
              setClassId(event.target.value)
            }
            placeholder="Enter Class ID"
            required
          />
        </label>

        <label>
          Student Name
          <input
            type="text"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            placeholder="Enter student name"
            required
          />
        </label>

        <button type="submit">
          Add Student
        </button>
      </form>

      {error && <p role="alert">{error}</p>}

      <h3>Students</h3>

      {students.length === 0 ? (
        <p>No students have been added yet.</p>
      ) : (
        <ul>
          {students.map((student) => (
            <li key={student.studentId}>
              {student.name} — Class:{" "}
              {student.classId} — School:{" "}
              {student.schoolId} —{" "}
              {student.status}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
