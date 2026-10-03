import { useMemo, useState } from "react";
import "./ResultsScoreManagementPage.css";

type AssessmentType =
  | "EXAMINATION"
  | "CONTINUOUS_ASSESSMENT"
  | "QUIZ"
  | "TEST"
  | "PROJECT"
  | "PRACTICAL";

type ScoreStatus = "DRAFT" | "LOCKED";

type Assessment = {
  assessmentId: string;
  title: string;
  assessmentType: AssessmentType;
  className: string;
  subject: string;
  subjectCode: string;
  maximumScore: number;
  passMark: number;
  status: string;
  scoreEntryStatus: string;
  active: boolean;
};

type Student = {
  studentId?: string;
  admissionNumber?: string;
  fullName?: string;
  name?: string;
  className?: string;
  status?: string;
  active?: boolean;
};

type ScoreRecord = {
  scoreId: string;
  assessmentId: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  subject: string;
  score: number;
  maximumScore: number;
  percentage: number;
  grade: string;
  remark: string;
  status: ScoreStatus;
  createdAt: string;
  updatedAt: string;
};

const ASSESSMENT_KEY = "ultra-examinations-assessments";
const STUDENT_KEYS = [
  "ultra-student-enrollment",
  "ultra-students",
];
const SCORE_KEY = "ultra-results-score-records";

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

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function readStudents(): Student[] {
  for (const key of STUDENT_KEYS) {
    const data = readJson<Student[]>(key, []);
    if (data.length > 0) {
      return data;
    }
  }

  return [];
}

function createId(): string {
  return `SCR-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getStudentName(student: Student): string {
  return student.fullName || student.name || "Unnamed Student";
}

function getAdmissionNumber(student: Student): string {
  return student.admissionNumber || student.studentId || "N/A";
}

function calculateGrade(percentage: number): string {
  if (percentage >= 75) return "A";
  if (percentage >= 65) return "B";
  if (percentage >= 55) return "C";
  if (percentage >= 45) return "D";
  if (percentage >= 40) return "E";
  return "F";
}

function calculateRemark(percentage: number, passMark: number): string {
  if (percentage >= passMark) {
    return percentage >= 75 ? "Excellent" : "Passed";
  }

  return "Failed";
}

export default function ResultsScoreManagementPage() {
  const [assessments] = useState<Assessment[]>(() =>
    readJson<Assessment[]>(ASSESSMENT_KEY, []),
  );

  const [students] = useState<Student[]>(readStudents);

  const [scores, setScores] = useState<ScoreRecord[]>(() =>
    readJson<ScoreRecord[]>(SCORE_KEY, []),
  );

  const [selectedAssessmentId, setSelectedAssessmentId] = useState("");
  const [classFilter, setClassFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const [editingScoreId, setEditingScoreId] = useState<string | null>(
    null,
  );

  const [scoreInput, setScoreInput] = useState("");

  const selectedAssessment = assessments.find(
    (assessment) => assessment.assessmentId === selectedAssessmentId,
  );

  const activeAssessments = assessments.filter(
    (assessment) =>
      assessment.active &&
      assessment.status !== "CANCELLED",
  );

  const classStudents = useMemo(() => {
    if (!selectedAssessment) return [];

    return students.filter((student) => {
      const studentClass = student.className || "";
      const active =
        student.status !== "INACTIVE" && student.active !== false;

      return (
        active &&
        studentClass === selectedAssessment.className
      );
    });
  }, [students, selectedAssessment]);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return classStudents.filter((student) => {
      if (classFilter !== "ALL") {
        const studentClass = student.className || "";

        if (studentClass !== classFilter) {
          return false;
        }
      }

      if (!query) return true;

      return (
        getStudentName(student).toLowerCase().includes(query) ||
        getAdmissionNumber(student).toLowerCase().includes(query)
      );
    });
  }, [classStudents, search, classFilter]);

  const assessmentScores = scores.filter(
    (score) => score.assessmentId === selectedAssessmentId,
  );

  const enteredCount = assessmentScores.length;

  const passedCount = assessmentScores.filter(
    (score) => score.percentage >= 40,
  ).length;

  const failedCount = assessmentScores.filter(
    (score) => score.percentage < 40,
  ).length;

  const averageScore =
    assessmentScores.length > 0
      ? assessmentScores.reduce(
          (total, score) => total + score.percentage,
          0,
        ) / assessmentScores.length
      : 0;

  function persist(next: ScoreRecord[]): void {
    localStorage.setItem(SCORE_KEY, JSON.stringify(next));
    setScores(next);
  }

  function notify(text: string): void {
    setMessage(text);

    window.setTimeout(() => {
      setMessage("");
    }, 3500);
  }

  function getExistingScore(studentId: string): ScoreRecord | undefined {
    return scores.find(
      (score) =>
        score.assessmentId === selectedAssessmentId &&
        score.studentId === studentId,
    );
  }

  function startScoreEntry(student: Student): void {
    if (!selectedAssessment) {
      notify("Select an assessment first.");
      return;
    }

    if (selectedAssessment.scoreEntryStatus !== "OPEN") {
      notify("Score entry is not open for this assessment.");
      return;
    }

    const existing = getExistingScore(student.studentId || "");

    setEditingScoreId(existing?.scoreId || null);
    setScoreInput(existing ? String(existing.score) : "");
  }

  function saveScore(student: Student): void {
    if (!selectedAssessment) {
      notify("Select an assessment first.");
      return;
    }

    if (!student.studentId) {
      notify("Student ID is required.");
      return;
    }

    if (selectedAssessment.scoreEntryStatus !== "OPEN") {
      notify("Score entry is not open for this assessment.");
      return;
    }

    const numericScore = Number(scoreInput);

    if (
      !Number.isFinite(numericScore) ||
      numericScore < 0 ||
      numericScore > selectedAssessment.maximumScore
    ) {
      notify(
        `Score must be between 0 and ${selectedAssessment.maximumScore}.`,
      );
      return;
    }

    const percentage =
      (numericScore / selectedAssessment.maximumScore) * 100;

    const grade = calculateGrade(percentage);

    const passPercentage =
      (selectedAssessment.passMark /
        selectedAssessment.maximumScore) *
      100;

    const remark = calculateRemark(
      percentage,
      passPercentage,
    );

    const now = new Date().toISOString();

    const existing = getExistingScore(student.studentId);

    const record: ScoreRecord = {
      scoreId: existing?.scoreId || createId(),
      assessmentId: selectedAssessment.assessmentId,
      studentId: student.studentId,
      studentName: getStudentName(student),
      admissionNumber: getAdmissionNumber(student),
      className: selectedAssessment.className,
      subject: selectedAssessment.subject,
      score: numericScore,
      maximumScore: selectedAssessment.maximumScore,
      percentage: Number(percentage.toFixed(2)),
      grade,
      remark,
      status: existing?.status || "DRAFT",
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    const next = existing
      ? scores.map((item) =>
          item.scoreId === existing.scoreId ? record : item,
        )
      : [record, ...scores];

    persist(next);
    setEditingScoreId(null);
    setScoreInput("");

    notify(existing ? "Score updated." : "Score saved.");
  }

  function lockScore(scoreId: string): void {
    const next = scores.map((score) =>
      score.scoreId === scoreId
        ? {
            ...score,
            status: "LOCKED" as ScoreStatus,
            updatedAt: new Date().toISOString(),
          }
        : score,
    );

    persist(next);
    notify("Score locked.");
  }

  function unlockScore(scoreId: string): void {
    const next = scores.map((score) =>
      score.scoreId === scoreId
        ? {
            ...score,
            status: "DRAFT" as ScoreStatus,
            updatedAt: new Date().toISOString(),
          }
        : score,
    );

    persist(next);
    notify("Score unlocked.");
  }

  function clearScore(scoreId: string): void {
    const target = scores.find((score) => score.scoreId === scoreId);

    if (!target) return;

    if (target.status === "LOCKED") {
      notify("Locked scores cannot be cleared.");
      return;
    }

    persist(
      scores.filter((score) => score.scoreId !== scoreId),
    );

    notify("Score removed.");
  }

  return (
    <div className="results-page">
      <header className="results-header">
        <div>
          <span className="results-eyebrow">
            SCHOOL ACADEMIC RECORDS
          </span>

          <h1>Results & Score Management</h1>

          <p>
            Enter, validate, review and lock student assessment scores.
          </p>
        </div>
      </header>

      {message && (
        <div className="results-message">
          {message}
        </div>
      )}

      <section className="results-card">
        <div className="results-card-header">
          <div>
            <h2>Select Assessment</h2>
            <p>
              Scores can only be entered when the selected assessment
              has score entry opened.
            </p>
          </div>
        </div>

        <div className="results-selection-grid">
          <label>
            Assessment
            <select
              value={selectedAssessmentId}
              onChange={(event) => {
                setSelectedAssessmentId(event.target.value);
                setEditingScoreId(null);
                setScoreInput("");
              }}
            >
              <option value="">Select assessment</option>

              {activeAssessments.map((assessment) => (
                <option
                  key={assessment.assessmentId}
                  value={assessment.assessmentId}
                >
                  {assessment.title} — {assessment.className} —{" "}
                  {assessment.subject}
                </option>
              ))}
            </select>
          </label>

          <label>
            Class Filter
            <select
              value={classFilter}
              onChange={(event) =>
                setClassFilter(event.target.value)
              }
            >
              <option value="ALL">All Classes</option>

              {CLASS_NAMES.map((className) => (
                <option key={className}>{className}</option>
              ))}
            </select>
          </label>

          <label>
            Search Student
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name or admission number"
            />
          </label>
        </div>
      </section>

      {selectedAssessment && (
        <>
          <section className="results-stats">
            <div className="results-stat">
              <span>Students</span>
              <strong>{classStudents.length}</strong>
            </div>

            <div className="results-stat">
              <span>Scores Entered</span>
              <strong>{enteredCount}</strong>
            </div>

            <div className="results-stat">
              <span>Passed</span>
              <strong>{passedCount}</strong>
            </div>

            <div className="results-stat">
              <span>Average</span>
              <strong>{averageScore.toFixed(1)}%</strong>
            </div>
          </section>

          <section className="results-card">
            <div className="selected-assessment">
              <div>
                <span>SELECTED ASSESSMENT</span>
                <h2>{selectedAssessment.title}</h2>

                <p>
                  {selectedAssessment.className} ·{" "}
                  {selectedAssessment.subject} · Maximum{" "}
                  {selectedAssessment.maximumScore} · Pass Mark{" "}
                  {selectedAssessment.passMark}
                </p>
              </div>

              <div
                className={`entry-state ${
                  selectedAssessment.scoreEntryStatus.toLowerCase()
                }`}
              >
                Score Entry:{" "}
                {selectedAssessment.scoreEntryStatus.replaceAll(
                  "_",
                  " ",
                )}
              </div>
            </div>

            <div className="results-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Admission No.</th>
                    <th>Score</th>
                    <th>Percentage</th>
                    <th>Grade</th>
                    <th>Remark</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="empty-cell">
                        No students found for this assessment.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => {
                      const existing = getExistingScore(
                        student.studentId || "",
                      );

                      const editing =
                        editingScoreId === existing?.scoreId;

                      return (
                        <tr key={student.studentId}>
                          <td>
                            <strong>
                              {getStudentName(student)}
                            </strong>
                          </td>

                          <td>
                            {getAdmissionNumber(student)}
                          </td>

                          <td>
                            {editing ? (
                              <input
                                className="inline-score-input"
                                type="number"
                                min="0"
                                max={
                                  selectedAssessment.maximumScore
                                }
                                value={scoreInput}
                                onChange={(event) =>
                                  setScoreInput(
                                    event.target.value,
                                  )
                                }
                              />
                            ) : existing ? (
                              `${existing.score}/${existing.maximumScore}`
                            ) : (
                              "Not entered"
                            )}
                          </td>

                          <td>
                            {existing
                              ? `${existing.percentage}%`
                              : "—"}
                          </td>

                          <td>
                            {existing ? existing.grade : "—"}
                          </td>

                          <td>
                            {existing ? existing.remark : "—"}
                          </td>

                          <td>
                            {existing ? (
                              <span
                                className={`score-status ${existing.status.toLowerCase()}`}
                              >
                                {existing.status}
                              </span>
                            ) : (
                              <span className="score-status missing">
                                MISSING
                              </span>
                            )}
                          </td>

                          <td>
                            <div className="score-actions">
                              {!existing && (
                                <button
                                  className="small-button"
                                  onClick={() =>
                                    startScoreEntry(student)
                                  }
                                >
                                  Enter
                                </button>
                              )}

                              {existing &&
                                existing.status !==
                                  "LOCKED" &&
                                !editing && (
                                  <button
                                    className="small-button"
                                    onClick={() => {
                                      setEditingScoreId(
                                        existing.scoreId,
                                      );
                                      setScoreInput(
                                        String(existing.score),
                                      );
                                    }}
                                  >
                                    Edit
                                  </button>
                                )}

                              {editing && (
                                <button
                                  className="small-button primary"
                                  onClick={() =>
                                    saveScore(student)
                                  }
                                >
                                  Save
                                </button>
                              )}

                              {existing &&
                                existing.status !==
                                  "LOCKED" && (
                                  <>
                                    <button
                                      className="small-button lock"
                                      onClick={() =>
                                        lockScore(
                                          existing.scoreId,
                                        )
                                      }
                                    >
                                      Lock
                                    </button>

                                    <button
                                      className="small-button danger"
                                      onClick={() =>
                                        clearScore(
                                          existing.scoreId,
                                        )
                                      }
                                    >
                                      Clear
                                    </button>
                                  </>
                                )}

                              {existing &&
                                existing.status ===
                                  "LOCKED" && (
                                  <button
                                    className="small-button"
                                    onClick={() =>
                                      unlockScore(
                                        existing.scoreId,
                                      )
                                    }
                                  >
                                    Unlock
                                  </button>
                                )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="results-card">
            <div className="results-card-header">
              <div>
                <h2>Result Summary</h2>
                <p>
                  {enteredCount} score(s) recorded for this assessment.
                </p>
              </div>

              <div className="summary-failed">
                Failed: {failedCount}
              </div>
            </div>

            <div className="summary-grid">
              <div>
                <span>Maximum Score</span>
                <strong>
                  {selectedAssessment.maximumScore}
                </strong>
              </div>

              <div>
                <span>Pass Mark</span>
                <strong>
                  {selectedAssessment.passMark}
                </strong>
              </div>

              <div>
                <span>Scores Entered</span>
                <strong>{enteredCount}</strong>
              </div>

              <div>
                <span>Average Percentage</span>
                <strong>{averageScore.toFixed(2)}%</strong>
              </div>
            </div>
          </section>
        </>
      )}

      <div className="results-security-note">
        <strong>School Data Boundary:</strong> Student results are
        managed within the current school workspace. Duplicate score
        records are prevented by assessment and student identity.
        Locked scores require an explicit unlock action before editing.
        Development persistence currently uses localStorage and will
        be replaced by secured backend persistence in production.
      </div>
    </div>
  );
}
