import { FormEvent, useEffect, useMemo, useState } from "react";
import "./SubjectCurriculumPage.css";

type SubjectCategory =
  | "CORE"
  | "SCIENCE"
  | "ARTS"
  | "COMMERCIAL"
  | "LANGUAGE"
  | "RELIGIOUS"
  | "VOCATIONAL"
  | "OTHER";

type SubjectStatus = "ACTIVE" | "INACTIVE";

type Subject = {
  subjectId: string;
  name: string;
  code: string;
  category: SubjectCategory;
  status: SubjectStatus;
  createdAt: string;
};

type ClassSubject = {
  assignmentId: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  className: string;
  academicSession: string;
  term: string;
  requirement: "COMPULSORY" | "ELECTIVE";
  status: SubjectStatus;
  createdAt: string;
};

const SUBJECTS_KEY = "ultra-subject-curriculum";
const CLASS_SUBJECTS_KEY = "ultra-class-subjects";

const CLASS_NAMES = [
  "Nursery 1",
  "Nursery 2",
  "Primary 1",
  "Primary 2",
  "Primary 3",
  "Primary 4",
  "Primary 5",
  "Primary 6",
  "JSS 1",
  "JSS 2",
  "JSS 3",
  "SSS 1",
  "SSS 2",
  "SSS 3",
];

const CATEGORIES: SubjectCategory[] = [
  "CORE",
  "SCIENCE",
  "ARTS",
  "COMMERCIAL",
  "LANGUAGE",
  "RELIGIOUS",
  "VOCATIONAL",
  "OTHER",
];

const SESSIONS = ["2026/2027", "2027/2028", "2028/2029"];
const TERMS = ["First Term", "Second Term", "Third Term"];

const DEFAULT_SUBJECTS: Subject[] = [
  {
    subjectId: "SUB-ENG",
    name: "English Language",
    code: "ENG",
    category: "CORE",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  },
  {
    subjectId: "SUB-MATH",
    name: "Mathematics",
    code: "MTH",
    category: "CORE",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  },
  {
    subjectId: "SUB-BSC",
    name: "Basic Science",
    code: "BSC",
    category: "SCIENCE",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  },
  {
    subjectId: "SUB-BTECH",
    name: "Basic Technology",
    code: "BTE",
    category: "SCIENCE",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  },
  {
    subjectId: "SUB-SST",
    name: "Social Studies",
    code: "SST",
    category: "CORE",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  },
  {
    subjectId: "SUB-CIV",
    name: "Civic Education",
    code: "CIV",
    category: "CORE",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  },
  {
    subjectId: "SUB-CS",
    name: "Computer Studies",
    code: "CMP",
    category: "VOCATIONAL",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  },
  {
    subjectId: "SUB-AGR",
    name: "Agricultural Science",
    code: "AGR",
    category: "VOCATIONAL",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  },
  {
    subjectId: "SUB-BIO",
    name: "Biology",
    code: "BIO",
    category: "SCIENCE",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  },
  {
    subjectId: "SUB-CHEM",
    name: "Chemistry",
    code: "CHE",
    category: "SCIENCE",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  },
  {
    subjectId: "SUB-PHY",
    name: "Physics",
    code: "PHY",
    category: "SCIENCE",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  },
  {
    subjectId: "SUB-ECO",
    name: "Economics",
    code: "ECO",
    category: "COMMERCIAL",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  },
  {
    subjectId: "SUB-GOV",
    name: "Government",
    code: "GOV",
    category: "ARTS",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  },
  {
    subjectId: "SUB-LIT",
    name: "Literature",
    code: "LIT",
    category: "ARTS",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  },
  {
    subjectId: "SUB-YOR",
    name: "Yoruba",
    code: "YOR",
    category: "LANGUAGE",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  },
  {
    subjectId: "SUB-FRE",
    name: "French",
    code: "FRE",
    category: "LANGUAGE",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  },
  {
    subjectId: "SUB-ISL",
    name: "Islamic Studies",
    code: "IRS",
    category: "RELIGIOUS",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  },
  {
    subjectId: "SUB-CRS",
    name: "Christian Religious Studies",
    code: "CRS",
    category: "RELIGIOUS",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  },
  {
    subjectId: "SUB-PE",
    name: "Physical Education",
    code: "PHE",
    category: "VOCATIONAL",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  },
];

function readSubjects(): Subject[] {
  try {
    const stored = localStorage.getItem(SUBJECTS_KEY);

    if (!stored) {
      localStorage.setItem(SUBJECTS_KEY, JSON.stringify(DEFAULT_SUBJECTS));
      return DEFAULT_SUBJECTS;
    }

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : DEFAULT_SUBJECTS;
  } catch {
    return DEFAULT_SUBJECTS;
  }
}

function readClassSubjects(): ClassSubject[] {
  try {
    const stored = localStorage.getItem(CLASS_SUBJECTS_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;
}

export default function SubjectCurriculumPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);

  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [category, setCategory] = useState<SubjectCategory>("CORE");
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(
    null,
  );

  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedClass, setSelectedClass] = useState(CLASS_NAMES[0]);
  const [selectedSession, setSelectedSession] = useState(SESSIONS[0]);
  const [selectedTerm, setSelectedTerm] = useState(TERMS[0]);
  const [requirement, setRequirement] = useState<
    "COMPULSORY" | "ELECTIVE"
  >("COMPULSORY");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [classFilter, setClassFilter] = useState("ALL");

  const [activeTab, setActiveTab] = useState<"subjects" | "curriculum">(
    "subjects",
  );

  useEffect(() => {
    const loadedSubjects = readSubjects();
    setSubjects(loadedSubjects);

    const loadedAssignments = readClassSubjects();
    setClassSubjects(loadedAssignments);

    const firstActive = loadedSubjects.find(
      (subject) => subject.status === "ACTIVE",
    );

    if (firstActive) {
      setSelectedSubjectId(firstActive.subjectId);
    }
  }, []);

  const saveSubjects = (next: Subject[]) => {
    setSubjects(next);
    localStorage.setItem(SUBJECTS_KEY, JSON.stringify(next));
  };

  const saveClassSubjects = (next: ClassSubject[]) => {
    setClassSubjects(next);
    localStorage.setItem(CLASS_SUBJECTS_KEY, JSON.stringify(next));
  };

  const activeSubjects = useMemo(
    () => subjects.filter((subject) => subject.status === "ACTIVE"),
    [subjects],
  );

  const filteredSubjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    return subjects.filter((subject) => {
      const matchesSearch =
        !query ||
        subject.name.toLowerCase().includes(query) ||
        subject.code.toLowerCase().includes(query);

      const matchesCategory =
        categoryFilter === "ALL" || subject.category === categoryFilter;

      const matchesStatus =
        statusFilter === "ALL" || subject.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [subjects, search, categoryFilter, statusFilter]);

  const filteredClassSubjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    return classSubjects.filter((assignment) => {
      const matchesSearch =
        !query ||
        assignment.subjectName.toLowerCase().includes(query) ||
        assignment.subjectCode.toLowerCase().includes(query) ||
        assignment.className.toLowerCase().includes(query);

      const matchesClass =
        classFilter === "ALL" || assignment.className === classFilter;

      const matchesStatus =
        statusFilter === "ALL" || assignment.status === statusFilter;

      return matchesSearch && matchesClass && matchesStatus;
    });
  }, [classSubjects, search, classFilter, statusFilter]);

  const totalSubjects = subjects.length;
  const activeSubjectCount = subjects.filter(
    (subject) => subject.status === "ACTIVE",
  ).length;
  const curriculumCount = classSubjects.length;
  const activeCurriculumCount = classSubjects.filter(
    (assignment) => assignment.status === "ACTIVE",
  ).length;

  const handleSubjectSubmit = (event: FormEvent) => {
    event.preventDefault();

    const name = subjectName.trim();
    const code = subjectCode.trim().toUpperCase();

    if (!name || !code) {
      window.alert("Subject name and subject code are required.");
      return;
    }

    const duplicate = subjects.some(
      (subject) =>
        subject.subjectId !== editingSubjectId &&
        (subject.name.toLowerCase() === name.toLowerCase() ||
          subject.code.toLowerCase() === code.toLowerCase()),
    );

    if (duplicate) {
      window.alert("A subject with this name or code already exists.");
      return;
    }

    if (editingSubjectId) {
      const next = subjects.map((subject) =>
        subject.subjectId === editingSubjectId
          ? {
              ...subject,
              name,
              code,
              category,
            }
          : subject,
      );

      saveSubjects(next);
    } else {
      const newSubject: Subject = {
        subjectId: makeId("SUB"),
        name,
        code,
        category,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      };

      saveSubjects([...subjects, newSubject]);

      if (!selectedSubjectId) {
        setSelectedSubjectId(newSubject.subjectId);
      }
    }

    resetSubjectForm();
  };

  const resetSubjectForm = () => {
    setSubjectName("");
    setSubjectCode("");
    setCategory("CORE");
    setEditingSubjectId(null);
  };

  const editSubject = (subject: Subject) => {
    setEditingSubjectId(subject.subjectId);
    setSubjectName(subject.name);
    setSubjectCode(subject.code);
    setCategory(subject.category);
    setActiveTab("subjects");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleSubject = (subjectId: string) => {
    const next = subjects.map((subject) =>
      subject.subjectId === subjectId
        ? {
            ...subject,
            status:
              subject.status === "ACTIVE"
                ? ("INACTIVE" as SubjectStatus)
                : ("ACTIVE" as SubjectStatus),
          }
        : subject,
    );

    saveSubjects(next);
  };

  const handleCurriculumSubmit = (event: FormEvent) => {
    event.preventDefault();

    const subject = subjects.find(
      (item) => item.subjectId === selectedSubjectId,
    );

    if (!subject) {
      window.alert("Select a subject first.");
      return;
    }

    if (subject.status !== "ACTIVE") {
      window.alert("Only active subjects can be assigned to a class.");
      return;
    }

    const duplicate = classSubjects.some(
      (assignment) =>
        assignment.assignmentId !== selectedSubjectId &&
        assignment.subjectId === selectedSubjectId &&
        assignment.className === selectedClass &&
        assignment.academicSession === selectedSession &&
        assignment.term === selectedTerm &&
        assignment.status === "ACTIVE",
    );

    if (duplicate) {
      window.alert(
        "This subject is already assigned to the selected class, session and term.",
      );
      return;
    }

    const assignment: ClassSubject = {
      assignmentId: makeId("CSA"),
      subjectId: subject.subjectId,
      subjectName: subject.name,
      subjectCode: subject.code,
      className: selectedClass,
      academicSession: selectedSession,
      term: selectedTerm,
      requirement,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    };

    saveClassSubjects([...classSubjects, assignment]);
  };

  const toggleCurriculumAssignment = (assignmentId: string) => {
    const next = classSubjects.map((assignment) =>
      assignment.assignmentId === assignmentId
        ? {
            ...assignment,
            status:
              assignment.status === "ACTIVE"
                ? ("INACTIVE" as SubjectStatus)
                : ("ACTIVE" as SubjectStatus),
          }
        : assignment,
    );

    saveClassSubjects(next);
  };

  const deleteCurriculumAssignment = (assignmentId: string) => {
    const confirmed = window.confirm(
      "Remove this curriculum assignment from the development dataset?",
    );

    if (!confirmed) return;

    saveClassSubjects(
      classSubjects.filter(
        (assignment) => assignment.assignmentId !== assignmentId,
      ),
    );
  };

  return (
    <main className="subject-curriculum-page">
      <section className="subject-curriculum-header">
        <div>
          <p className="eyebrow">STEP 101</p>
          <h1>Subject & Curriculum Management</h1>
          <p>
            Manage school subjects and assign them to classes across academic
            sessions and terms.
          </p>
        </div>
      </section>

      <section className="subject-stat-grid">
        <article className="subject-stat-card">
          <span>Total Subjects</span>
          <strong>{totalSubjects}</strong>
        </article>

        <article className="subject-stat-card">
          <span>Active Subjects</span>
          <strong>{activeSubjectCount}</strong>
        </article>

        <article className="subject-stat-card">
          <span>Curriculum Assignments</span>
          <strong>{curriculumCount}</strong>
        </article>

        <article className="subject-stat-card">
          <span>Active Assignments</span>
          <strong>{activeCurriculumCount}</strong>
        </article>
      </section>

      <section className="subject-tab-bar">
        <button
          type="button"
          className={activeTab === "subjects" ? "active" : ""}
          onClick={() => setActiveTab("subjects")}
        >
          Subject Catalogue
        </button>

        <button
          type="button"
          className={activeTab === "curriculum" ? "active" : ""}
          onClick={() => setActiveTab("curriculum")}
        >
          Class Curriculum
        </button>
      </section>

      {activeTab === "subjects" && (
        <>
          <section className="subject-form-card">
            <div className="section-heading">
              <div>
                <h2>
                  {editingSubjectId ? "Edit Subject" : "Create Subject"}
                </h2>
                <p>
                  Define the subjects available to this school curriculum.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubjectSubmit}>
              <div className="form-grid">
                <label>
                  Subject Name
                  <input
                    value={subjectName}
                    onChange={(event) => setSubjectName(event.target.value)}
                    placeholder="e.g. Mathematics"
                  />
                </label>

                <label>
                  Subject Code
                  <input
                    value={subjectCode}
                    onChange={(event) => setSubjectCode(event.target.value)}
                    placeholder="e.g. MTH"
                    maxLength={12}
                  />
                </label>

                <label>
                  Category
                  <select
                    value={category}
                    onChange={(event) =>
                      setCategory(event.target.value as SubjectCategory)
                    }
                  >
                    {CATEGORIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" className="primary-button">
                  {editingSubjectId ? "Update Subject" : "Create Subject"}
                </button>

                {editingSubjectId && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={resetSubjectForm}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="subject-list-card">
            <div className="toolbar">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search subject name or code..."
              />

              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="ALL">All Categories</option>
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Code</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredSubjects.map((subject) => (
                    <tr key={subject.subjectId}>
                      <td>{subject.name}</td>
                      <td>{subject.code}</td>
                      <td>{subject.category}</td>
                      <td>
                        <span
                          className={`status-badge ${subject.status.toLowerCase()}`}
                        >
                          {subject.status}
                        </span>
                      </td>
                      <td className="action-cell">
                        <button
                          type="button"
                          onClick={() => editSubject(subject)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleSubject(subject.subjectId)}
                        >
                          {subject.status === "ACTIVE"
                            ? "Deactivate"
                            : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredSubjects.length === 0 && (
                    <tr>
                      <td colSpan={5} className="empty-state">
                        No subjects found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {activeTab === "curriculum" && (
        <>
          <section className="subject-form-card">
            <div className="section-heading">
              <div>
                <h2>Assign Subject to Class</h2>
                <p>
                  Create the academic curriculum for each class, session and
                  term.
                </p>
              </div>
            </div>

            <form onSubmit={handleCurriculumSubmit}>
              <div className="form-grid">
                <label>
                  Subject
                  <select
                    value={selectedSubjectId}
                    onChange={(event) =>
                      setSelectedSubjectId(event.target.value)
                    }
                  >
                    <option value="">Select subject</option>
                    {activeSubjects.map((subject) => (
                      <option
                        key={subject.subjectId}
                        value={subject.subjectId}
                      >
                        {subject.name} ({subject.code})
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Class
                  <select
                    value={selectedClass}
                    onChange={(event) => setSelectedClass(event.target.value)}
                  >
                    {CLASS_NAMES.map((className) => (
                      <option key={className} value={className}>
                        {className}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Academic Session
                  <select
                    value={selectedSession}
                    onChange={(event) =>
                      setSelectedSession(event.target.value)
                    }
                  >
                    {SESSIONS.map((session) => (
                      <option key={session} value={session}>
                        {session}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Term
                  <select
                    value={selectedTerm}
                    onChange={(event) => setSelectedTerm(event.target.value)}
                  >
                    {TERMS.map((term) => (
                      <option key={term} value={term}>
                        {term}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Requirement
                  <select
                    value={requirement}
                    onChange={(event) =>
                      setRequirement(
                        event.target.value as "COMPULSORY" | "ELECTIVE",
                      )
                    }
                  >
                    <option value="COMPULSORY">Compulsory</option>
                    <option value="ELECTIVE">Elective</option>
                  </select>
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" className="primary-button">
                  Assign Subject
                </button>
              </div>
            </form>
          </section>

          <section className="subject-list-card">
            <div className="toolbar">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search subject or class..."
              />

              <select
                value={classFilter}
                onChange={(event) => setClassFilter(event.target.value)}
              >
                <option value="ALL">All Classes</option>
                {CLASS_NAMES.map((className) => (
                  <option key={className} value={className}>
                    {className}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Class</th>
                    <th>Session</th>
                    <th>Term</th>
                    <th>Requirement</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredClassSubjects.map((assignment) => (
                    <tr key={assignment.assignmentId}>
                      <td>
                        <strong>{assignment.subjectName}</strong>
                        <small>{assignment.subjectCode}</small>
                      </td>
                      <td>{assignment.className}</td>
                      <td>{assignment.academicSession}</td>
                      <td>{assignment.term}</td>
                      <td>{assignment.requirement}</td>
                      <td>
                        <span
                          className={`status-badge ${assignment.status.toLowerCase()}`}
                        >
                          {assignment.status}
                        </span>
                      </td>
                      <td className="action-cell">
                        <button
                          type="button"
                          onClick={() =>
                            toggleCurriculumAssignment(
                              assignment.assignmentId,
                            )
                          }
                        >
                          {assignment.status === "ACTIVE"
                            ? "Deactivate"
                            : "Activate"}
                        </button>

                        <button
                          type="button"
                          className="danger-button"
                          onClick={() =>
                            deleteCurriculumAssignment(
                              assignment.assignmentId,
                            )
                          }
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredClassSubjects.length === 0 && (
                    <tr>
                      <td colSpan={7} className="empty-state">
                        No curriculum assignments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <section className="school-boundary-notice">
        <strong>School Data Boundary</strong>
        <p>
          This workspace is designed for the authenticated school's
          curriculum. Development persistence currently uses browser
          localStorage and must be replaced by secured backend persistence
          before production deployment.
        </p>
      </section>
    </main>
  );
}
