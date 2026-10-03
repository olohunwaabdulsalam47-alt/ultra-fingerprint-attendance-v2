import { useMemo, useState } from "react";
import "./ExaminationAssessmentPage.css";

type AssessmentType =
  | "EXAMINATION"
  | "CONTINUOUS_ASSESSMENT"
  | "QUIZ"
  | "TEST"
  | "PROJECT"
  | "PRACTICAL";

type AssessmentStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED";

type ScoreEntryStatus = "NOT_OPEN" | "OPEN" | "LOCKED";

type Assessment = {
  assessmentId: string;
  title: string;
  assessmentType: AssessmentType;
  className: string;
  subject: string;
  subjectCode: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  invigilatorId: string;
  invigilatorName: string;
  academicSession: string;
  term: string;
  maximumScore: number;
  passMark: number;
  status: AssessmentStatus;
  scoreEntryStatus: ScoreEntryStatus;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

type Teacher = {
  staffId?: string;
  teacherId?: string;
  fullName?: string;
  name?: string;
  status?: string;
  employmentStatus?: string;
};

const STORAGE_KEY = "ultra-examinations-assessments";
const TEACHER_STORAGE_KEY = "ultra-teacher-staff-management";

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

const SUBJECTS = [
  { name: "Mathematics", code: "MATH" },
  { name: "English Language", code: "ENG" },
  { name: "Basic Science", code: "BSC" },
  { name: "Basic Technology", code: "BT" },
  { name: "Social Studies", code: "SOC" },
  { name: "Computer Studies", code: "ICT" },
  { name: "Civic Education", code: "CIV" },
  { name: "Islamic Religious Studies", code: "IRS" },
  { name: "Christian Religious Studies", code: "CRS" },
  { name: "Agricultural Science", code: "AGR" },
  { name: "Economics", code: "ECO" },
  { name: "Government", code: "GOV" },
  { name: "Biology", code: "BIO" },
  { name: "Chemistry", code: "CHEM" },
  { name: "Physics", code: "PHY" },
];

const ASSESSMENT_TYPES: AssessmentType[] = [
  "EXAMINATION",
  "CONTINUOUS_ASSESSMENT",
  "QUIZ",
  "TEST",
  "PROJECT",
  "PRACTICAL",
];

const SESSIONS = ["2026/2027", "2027/2028", "2028/2029"];

const TERMS = ["First Term", "Second Term", "Third Term"];

const emptyForm = {
  title: "",
  assessmentType: "EXAMINATION" as AssessmentType,
  className: "Primary 1",
  subject: "Mathematics",
  date: "",
  startTime: "",
  endTime: "",
  venue: "",
  invigilatorId: "",
  academicSession: "2026/2027",
  term: "First Term",
  maximumScore: "100",
  passMark: "40",
  status: "DRAFT" as AssessmentStatus,
  scoreEntryStatus: "NOT_OPEN" as ScoreEntryStatus,
};

function readAssessments(): Assessment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function readTeachers(): Teacher[] {
  try {
    const raw = localStorage.getItem(TEACHER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function createId(): string {
  return `ASM-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getTeacherName(teacher: Teacher): string {
  return teacher.fullName || teacher.name || "Unnamed Teacher";
}

export default function ExaminationAssessmentPage() {
  const [assessments, setAssessments] = useState<Assessment[]>(readAssessments);
  const [teachers] = useState<Teacher[]>(readTeachers);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [message, setMessage] = useState("");

  const activeTeachers = teachers.filter(
    (teacher) =>
      teacher.status !== "INACTIVE" &&
      teacher.employmentStatus !== "INACTIVE",
  );

  const filteredAssessments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return assessments.filter((assessment) => {
      const matchesSearch =
        !query ||
        assessment.title.toLowerCase().includes(query) ||
        assessment.subject.toLowerCase().includes(query) ||
        assessment.className.toLowerCase().includes(query) ||
        assessment.invigilatorName.toLowerCase().includes(query);

      const matchesClass =
        classFilter === "ALL" || assessment.className === classFilter;

      const matchesType =
        typeFilter === "ALL" || assessment.assessmentType === typeFilter;

      const matchesStatus =
        statusFilter === "ALL" || assessment.status === statusFilter;

      return matchesSearch && matchesClass && matchesType && matchesStatus;
    });
  }, [assessments, search, classFilter, typeFilter, statusFilter]);

  const scheduledCount = assessments.filter(
    (item) => item.status === "SCHEDULED" && item.active,
  ).length;

  const completedCount = assessments.filter(
    (item) => item.status === "COMPLETED" && item.active,
  ).length;

  const openScoreCount = assessments.filter(
    (item) => item.scoreEntryStatus === "OPEN" && item.active,
  ).length;

  function updateForm(
    field: keyof typeof emptyForm,
    value: string,
  ): void {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function persist(next: Assessment[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setAssessments(next);
  }

  function resetForm(): void {
    setForm(emptyForm);
    setEditingId(null);
  }

  function showMessage(text: string): void {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 3500);
  }

  function hasConflict(): boolean {
    return assessments.some((assessment) => {
      if (assessment.assessmentId === editingId) {
        return false;
      }

      return (
        assessment.active &&
        assessment.className === form.className &&
        assessment.subject === form.subject &&
        assessment.date === form.date &&
        assessment.academicSession === form.academicSession &&
        assessment.term === form.term &&
        assessment.assessmentType === form.assessmentType
      );
    });
  }

  function saveAssessment(): void {
    if (!form.title.trim()) {
      showMessage("Assessment title is required.");
      return;
    }

    if (!form.date) {
      showMessage("Assessment date is required.");
      return;
    }

    if (!form.startTime || !form.endTime) {
      showMessage("Start and end time are required.");
      return;
    }

    if (form.endTime <= form.startTime) {
      showMessage("End time must be later than start time.");
      return;
    }

    const maximumScore = Number(form.maximumScore);
    const passMark = Number(form.passMark);

    if (!Number.isFinite(maximumScore) || maximumScore <= 0) {
      showMessage("Maximum score must be greater than zero.");
      return;
    }

    if (
      !Number.isFinite(passMark) ||
      passMark < 0 ||
      passMark > maximumScore
    ) {
      showMessage("Pass mark must be between 0 and the maximum score.");
      return;
    }

    if (hasConflict()) {
      showMessage(
        "A similar assessment already exists for this class, subject, date, session and term.",
      );
      return;
    }

    const selectedSubject = SUBJECTS.find(
      (subject) => subject.name === form.subject,
    );

    const selectedTeacher = activeTeachers.find(
      (teacher) =>
        (teacher.staffId || teacher.teacherId || "") === form.invigilatorId,
    );

    const now = new Date().toISOString();

    const record: Assessment = {
      assessmentId: editingId || createId(),
      title: form.title.trim(),
      assessmentType: form.assessmentType,
      className: form.className,
      subject: form.subject,
      subjectCode: selectedSubject?.code || "",
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      venue: form.venue.trim(),
      invigilatorId: form.invigilatorId,
      invigilatorName: selectedTeacher
        ? getTeacherName(selectedTeacher)
        : "",
      academicSession: form.academicSession,
      term: form.term,
      maximumScore,
      passMark,
      status: form.status,
      scoreEntryStatus: form.scoreEntryStatus,
      active: true,
      createdAt:
        editingId
          ? assessments.find((item) => item.assessmentId === editingId)
              ?.createdAt || now
          : now,
      updatedAt: now,
    };

    const next = editingId
      ? assessments.map((item) =>
          item.assessmentId === editingId ? record : item,
        )
      : [record, ...assessments];

    persist(next);
    resetForm();
    showMessage(editingId ? "Assessment updated." : "Assessment created.");
  }

  function editAssessment(assessment: Assessment): void {
    setEditingId(assessment.assessmentId);

    setForm({
      title: assessment.title,
      assessmentType: assessment.assessmentType,
      className: assessment.className,
      subject: assessment.subject,
      date: assessment.date,
      startTime: assessment.startTime,
      endTime: assessment.endTime,
      venue: assessment.venue,
      invigilatorId: assessment.invigilatorId,
      academicSession: assessment.academicSession,
      term: assessment.term,
      maximumScore: String(assessment.maximumScore),
      passMark: String(assessment.passMark),
      status: assessment.status,
      scoreEntryStatus: assessment.scoreEntryStatus,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleActive(assessment: Assessment): void {
    const next = assessments.map((item) =>
      item.assessmentId === assessment.assessmentId
        ? {
            ...item,
            active: !item.active,
            updatedAt: new Date().toISOString(),
          }
        : item,
    );

    persist(next);
    showMessage(
      assessment.active ? "Assessment deactivated." : "Assessment activated.",
    );
  }

  return (
    <div className="assessment-page">
      <header className="assessment-header">
        <div>
          <span className="assessment-eyebrow">
            SCHOOL ADMINISTRATION
          </span>
          <h1>Examination & Assessment Management</h1>
          <p>
            Create, schedule and manage school examinations and academic
            assessments.
          </p>
        </div>
      </header>

      {message && <div className="assessment-message">{message}</div>}

      <section className="assessment-stats">
        <div className="assessment-stat">
          <span>Total Assessments</span>
          <strong>{assessments.length}</strong>
        </div>

        <div className="assessment-stat">
          <span>Scheduled</span>
          <strong>{scheduledCount}</strong>
        </div>

        <div className="assessment-stat">
          <span>Completed</span>
          <strong>{completedCount}</strong>
        </div>

        <div className="assessment-stat">
          <span>Score Entry Open</span>
          <strong>{openScoreCount}</strong>
        </div>
      </section>

      <section className="assessment-card">
        <div className="assessment-card-header">
          <div>
            <h2>{editingId ? "Edit Assessment" : "Create Assessment"}</h2>
            <p>
              All assessment records are restricted to the current school
              workspace.
            </p>
          </div>
        </div>

        <div className="assessment-form-grid">
          <label>
            Assessment Title
            <input
              value={form.title}
              onChange={(event) =>
                updateForm("title", event.target.value)
              }
              placeholder="e.g. First Term Mathematics Examination"
            />
          </label>

          <label>
            Assessment Type
            <select
              value={form.assessmentType}
              onChange={(event) =>
                updateForm(
                  "assessmentType",
                  event.target.value as AssessmentType,
                )
              }
            >
              {ASSESSMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>

          <label>
            Class
            <select
              value={form.className}
              onChange={(event) =>
                updateForm("className", event.target.value)
              }
            >
              {CLASS_NAMES.map((className) => (
                <option key={className}>{className}</option>
              ))}
            </select>
          </label>

          <label>
            Subject
            <select
              value={form.subject}
              onChange={(event) =>
                updateForm("subject", event.target.value)
              }
            >
              {SUBJECTS.map((subject) => (
                <option key={subject.code} value={subject.name}>
                  {subject.name} ({subject.code})
                </option>
              ))}
            </select>
          </label>

          <label>
            Examination Date
            <input
              type="date"
              value={form.date}
              onChange={(event) =>
                updateForm("date", event.target.value)
              }
            />
          </label>

          <label>
            Start Time
            <input
              type="time"
              value={form.startTime}
              onChange={(event) =>
                updateForm("startTime", event.target.value)
              }
            />
          </label>

          <label>
            End Time
            <input
              type="time"
              value={form.endTime}
              onChange={(event) =>
                updateForm("endTime", event.target.value)
              }
            />
          </label>

          <label>
            Venue / Classroom
            <input
              value={form.venue}
              onChange={(event) =>
                updateForm("venue", event.target.value)
              }
              placeholder="e.g. JSS Hall A"
            />
          </label>

          <label>
            Invigilator
            <select
              value={form.invigilatorId}
              onChange={(event) =>
                updateForm("invigilatorId", event.target.value)
              }
            >
              <option value="">Select invigilator</option>
              {activeTeachers.map((teacher, index) => {
                const id =
                  teacher.staffId ||
                  teacher.teacherId ||
                  `teacher-${index}`;

                return (
                  <option key={id} value={id}>
                    {getTeacherName(teacher)}
                  </option>
                );
              })}
            </select>
          </label>

          <label>
            Academic Session
            <select
              value={form.academicSession}
              onChange={(event) =>
                updateForm("academicSession", event.target.value)
              }
            >
              {SESSIONS.map((session) => (
                <option key={session}>{session}</option>
              ))}
            </select>
          </label>

          <label>
            Term
            <select
              value={form.term}
              onChange={(event) =>
                updateForm("term", event.target.value)
              }
            >
              {TERMS.map((term) => (
                <option key={term}>{term}</option>
              ))}
            </select>
          </label>

          <label>
            Maximum Score
            <input
              type="number"
              min="1"
              value={form.maximumScore}
              onChange={(event) =>
                updateForm("maximumScore", event.target.value)
              }
            />
          </label>

          <label>
            Pass Mark
            <input
              type="number"
              min="0"
              value={form.passMark}
              onChange={(event) =>
                updateForm("passMark", event.target.value)
              }
            />
          </label>

          <label>
            Assessment Status
            <select
              value={form.status}
              onChange={(event) =>
                updateForm(
                  "status",
                  event.target.value as AssessmentStatus,
                )
              }
            >
              <option value="DRAFT">Draft</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </label>

          <label>
            Score Entry
            <select
              value={form.scoreEntryStatus}
              onChange={(event) =>
                updateForm(
                  "scoreEntryStatus",
                  event.target.value as ScoreEntryStatus,
                )
              }
            >
              <option value="NOT_OPEN">Not Open</option>
              <option value="OPEN">Open</option>
              <option value="LOCKED">Locked</option>
            </select>
          </label>
        </div>

        <div className="assessment-actions">
          <button className="primary-button" onClick={saveAssessment}>
            {editingId ? "Update Assessment" : "Create Assessment"}
          </button>

          {editingId && (
            <button className="secondary-button" onClick={resetForm}>
              Cancel Edit
            </button>
          )}
        </div>
      </section>

      <section className="assessment-card">
        <div className="assessment-card-header">
          <div>
            <h2>Assessment Records</h2>
            <p>{filteredAssessments.length} record(s) displayed.</p>
          </div>
        </div>

        <div className="assessment-filters">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title, subject, class or invigilator..."
          />

          <select
            value={classFilter}
            onChange={(event) => setClassFilter(event.target.value)}
          >
            <option value="ALL">All Classes</option>
            {CLASS_NAMES.map((className) => (
              <option key={className}>{className}</option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          >
            <option value="ALL">All Types</option>
            {ASSESSMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.replaceAll("_", " ")}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="assessment-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Assessment</th>
                <th>Class</th>
                <th>Subject</th>
                <th>Date / Time</th>
                <th>Venue</th>
                <th>Score</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredAssessments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-cell">
                    No assessment records found.
                  </td>
                </tr>
              ) : (
                filteredAssessments.map((assessment) => (
                  <tr key={assessment.assessmentId}>
                    <td>
                      <strong>{assessment.title}</strong>
                      <small>
                        {assessment.assessmentType.replaceAll("_", " ")}
                      </small>
                    </td>

                    <td>{assessment.className}</td>

                    <td>
                      {assessment.subject}
                      <small>{assessment.subjectCode}</small>
                    </td>

                    <td>
                      {assessment.date}
                      <small>
                        {assessment.startTime} - {assessment.endTime}
                      </small>
                    </td>

                    <td>{assessment.venue || "Not specified"}</td>

                    <td>
                      {assessment.maximumScore}
                      <small>Pass: {assessment.passMark}</small>
                    </td>

                    <td>
                      <span
                        className={`status-badge status-${assessment.status.toLowerCase()}`}
                      >
                        {assessment.status}
                      </span>

                      <small>
                        Score:{" "}
                        {assessment.scoreEntryStatus.replaceAll("_", " ")}
                      </small>
                    </td>

                    <td>
                      <div className="row-actions">
                        <button
                          className="small-button"
                          onClick={() => editAssessment(assessment)}
                        >
                          Edit
                        </button>

                        <button
                          className="small-button danger"
                          onClick={() => toggleActive(assessment)}
                        >
                          {assessment.active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="assessment-security-note">
        <strong>School Data Boundary:</strong> Examination and assessment
        records are stored and managed within the current school workspace.
        This implementation uses localStorage for development persistence.
        Production deployment will move persistence and authorization to the
        secured backend.
      </div>
    </div>
  );
}
