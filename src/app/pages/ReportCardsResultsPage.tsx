import { useMemo, useState } from "react";
import "./ReportCardsResultsPage.css";

type Student = {
  studentId?: string;
  admissionNumber?: string;
  fullName?: string;
  name?: string;
  className?: string;
  status?: string;
  active?: boolean;
};

type Assessment = {
  assessmentId: string;
  title: string;
  className: string;
  subject: string;
  subjectCode: string;
  academicSession?: string;
  term?: string;
  maximumScore: number;
  active: boolean;
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
  status: string;
};

type ReportCard = {
  reportId: string;
  studentId: string;
  session: string;
  term: string;
  principalRemark: string;
  classTeacherRemark: string;
  approvalStatus: "DRAFT" | "APPROVED" | "LOCKED";
  attendancePresent: number;
  attendanceAbsent: number;
  attendanceLate: number;
  updatedAt: string;
};

const STUDENT_KEYS = [
  "ultra-student-enrollment",
  "ultra-students",
];

const ASSESSMENT_KEY = "ultra-examinations-assessments";
const SCORE_KEY = "ultra-results-score-records";
const REPORT_KEY = "ultra-report-cards-results";

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

const SESSIONS = ["2026/2027", "2027/2028", "2028/2029"];
const TERMS = ["First Term", "Second Term", "Third Term"];

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

function getStudentName(student: Student): string {
  return student.fullName || student.name || "Unnamed Student";
}

function getAdmissionNumber(student: Student): string {
  return student.admissionNumber || student.studentId || "N/A";
}

function createId(): string {
  return `RPT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function calculateGrade(percentage: number): string {
  if (percentage >= 75) return "A";
  if (percentage >= 65) return "B";
  if (percentage >= 55) return "C";
  if (percentage >= 45) return "D";
  if (percentage >= 40) return "E";
  return "F";
}

export default function ReportCardsResultsPage() {
  const [students] = useState<Student[]>(readStudents);

  const [assessments] = useState<Assessment[]>(() =>
    readJson<Assessment[]>(ASSESSMENT_KEY, []),
  );

  const [scores] = useState<ScoreRecord[]>(() =>
    readJson<ScoreRecord[]>(SCORE_KEY, []),
  );

  const [reports, setReports] = useState<ReportCard[]>(() =>
    readJson<ReportCard[]>(REPORT_KEY, []),
  );

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [session, setSession] = useState("2026/2027");
  const [term, setTerm] = useState("First Term");
  const [classFilter, setClassFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const [principalRemark, setPrincipalRemark] = useState("");
  const [classTeacherRemark, setClassTeacherRemark] = useState("");
  const [approvalStatus, setApprovalStatus] =
    useState<ReportCard["approvalStatus"]>("DRAFT");

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return students.filter((student) => {
      const active =
        student.status !== "INACTIVE" && student.active !== false;

      if (!active) return false;

      const studentClass = student.className || "";

      if (
        classFilter !== "ALL" &&
        studentClass !== classFilter
      ) {
        return false;
      }

      if (!query) return true;

      return (
        getStudentName(student).toLowerCase().includes(query) ||
        getAdmissionNumber(student).toLowerCase().includes(query)
      );
    });
  }, [students, classFilter, search]);

  const selectedStudent = students.find(
    (student) => student.studentId === selectedStudentId,
  );

  const selectedReport = reports.find(
    (report) =>
      report.studentId === selectedStudentId &&
      report.session === session &&
      report.term === term,
  );

  const studentScores = useMemo(() => {
    if (!selectedStudent) return [];

    const studentScoreRecords = scores.filter(
      (score) =>
        score.studentId === selectedStudent.studentId &&
        score.status !== "DELETED",
    );

    return studentScoreRecords.map((score) => {
      const assessment = assessments.find(
        (item) => item.assessmentId === score.assessmentId,
      );

      return {
        ...score,
        session:
          assessment?.academicSession || session,
        assessmentTerm:
          assessment?.term || term,
        subjectCode:
          assessment?.subjectCode || "",
      };
    }).filter(
      (score) =>
        score.session === session &&
        score.assessmentTerm === term,
    );
  }, [
    selectedStudent,
    scores,
    assessments,
    session,
    term,
  ]);

  const subjectResults = useMemo(() => {
    const grouped = new Map<
      string,
      {
        subject: string;
        subjectCode: string;
        total: number;
        maximum: number;
        percentage: number;
        grade: string;
        remark: string;
      }
    >();

    for (const score of studentScores) {
      const key = score.subject;

      const current = grouped.get(key) || {
        subject: score.subject,
        subjectCode: score.subjectCode,
        total: 0,
        maximum: 0,
        percentage: 0,
        grade: "",
        remark: "",
      };

      current.total += score.score;
      current.maximum += score.maximumScore;
      current.percentage =
        current.maximum > 0
          ? (current.total / current.maximum) * 100
          : 0;

      current.grade = calculateGrade(current.percentage);
      current.remark =
        current.percentage >= 40 ? "Passed" : "Failed";

      grouped.set(key, current);
    }

    return Array.from(grouped.values());
  }, [studentScores]);

  const overallPercentage =
    subjectResults.length > 0
      ? subjectResults.reduce(
          (total, result) => total + result.percentage,
          0,
        ) / subjectResults.length
      : 0;

  const overallGrade = calculateGrade(overallPercentage);

  const attendancePresent = 0;
  const attendanceAbsent = 0;
  const attendanceLate = 0;

  const totalAttendance =
    attendancePresent + attendanceAbsent + attendanceLate;

  const attendancePercentage =
    totalAttendance > 0
      ? (attendancePresent / totalAttendance) * 100
      : 0;

  const approvedCount = reports.filter(
    (report) => report.approvalStatus === "APPROVED",
  ).length;

  const lockedCount = reports.filter(
    (report) => report.approvalStatus === "LOCKED",
  ).length;

  function notify(text: string): void {
    setMessage(text);

    window.setTimeout(() => {
      setMessage("");
    }, 3500);
  }

  function persist(next: ReportCard[]): void {
    localStorage.setItem(REPORT_KEY, JSON.stringify(next));
    setReports(next);
  }

  function loadStudentReport(studentId: string): void {
    setSelectedStudentId(studentId);

    const existing = reports.find(
      (report) =>
        report.studentId === studentId &&
        report.session === session &&
        report.term === term,
    );

    setPrincipalRemark(existing?.principalRemark || "");
    setClassTeacherRemark(existing?.classTeacherRemark || "");
    setApprovalStatus(existing?.approvalStatus || "DRAFT");
  }

  function saveReport(): void {
    if (!selectedStudent) {
      notify("Select a student first.");
      return;
    }

    if (selectedReport?.approvalStatus === "LOCKED") {
      notify("This report card is locked.");
      return;
    }

    const now = new Date().toISOString();

    const record: ReportCard = {
      reportId: selectedReport?.reportId || createId(),
      studentId: selectedStudent.studentId || "",
      session,
      term,
      principalRemark: principalRemark.trim(),
      classTeacherRemark: classTeacherRemark.trim(),
      approvalStatus,
      attendancePresent,
      attendanceAbsent,
      attendanceLate,
      updatedAt: now,
    };

    const next = selectedReport
      ? reports.map((report) =>
          report.reportId === selectedReport.reportId
            ? record
            : report,
        )
      : [record, ...reports];

    persist(next);
    notify("Report card saved.");
  }

  function printReport(): void {
    if (!selectedStudent) {
      notify("Select a student first.");
      return;
    }

    window.print();
  }

  function lockReport(): void {
    if (!selectedReport) {
      notify("Save the report before locking it.");
      return;
    }

    const next = reports.map((report) =>
      report.reportId === selectedReport.reportId
        ? {
            ...report,
            approvalStatus: "LOCKED" as const,
            updatedAt: new Date().toISOString(),
          }
        : report,
    );

    persist(next);
    setApprovalStatus("LOCKED");
    notify("Report card locked.");
  }

  return (
    <div className="report-page">
      <header className="report-header no-print">
        <div>
          <span className="report-eyebrow">
            ACADEMIC RESULTS
          </span>

          <h1>Report Cards & Academic Results</h1>

          <p>
            Prepare, review, approve and print student academic
            report cards.
          </p>
        </div>
      </header>

      {message && (
        <div className="report-message no-print">
          {message}
        </div>
      )}

      <section className="report-stats no-print">
        <div className="report-stat">
          <span>Students</span>
          <strong>{students.length}</strong>
        </div>

        <div className="report-stat">
          <span>Reports</span>
          <strong>{reports.length}</strong>
        </div>

        <div className="report-stat">
          <span>Approved</span>
          <strong>{approvedCount}</strong>
        </div>

        <div className="report-stat">
          <span>Locked</span>
          <strong>{lockedCount}</strong>
        </div>
      </section>

      <section className="report-card no-print">
        <div className="report-card-header">
          <div>
            <h2>Report Selection</h2>
            <p>
              Select the student, academic session and term.
            </p>
          </div>
        </div>

        <div className="report-selection-grid">
          <label>
            Student
            <select
              value={selectedStudentId}
              onChange={(event) =>
                loadStudentReport(event.target.value)
              }
            >
              <option value="">Select student</option>

              {filteredStudents.map((student) => (
                <option
                  key={student.studentId}
                  value={student.studentId}
                >
                  {getStudentName(student)} —{" "}
                  {getAdmissionNumber(student)}
                </option>
              ))}
            </select>
          </label>

          <label>
            Academic Session
            <select
              value={session}
              onChange={(event) =>
                setSession(event.target.value)
              }
            >
              {SESSIONS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <label>
            Term
            <select
              value={term}
              onChange={(event) =>
                setTerm(event.target.value)
              }
            >
              {TERMS.map((item) => (
                <option key={item}>{item}</option>
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

              {CLASS_NAMES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <label>
            Search
            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Student name or admission number"
            />
          </label>
        </div>
      </section>

      {selectedStudent && (
        <div className="printable-report">
          <section className="report-card report-heading-card">
            <div className="school-report-heading">
              <div className="school-mark">UFA</div>

              <div>
                <h2>ULTRA FINGERPRINT ATTENDANCE</h2>
                <p>STUDENT ACADEMIC REPORT CARD</p>
              </div>
            </div>

            <div className="student-information">
              <div>
                <span>Student Name</span>
                <strong>
                  {getStudentName(selectedStudent)}
                </strong>
              </div>

              <div>
                <span>Admission Number</span>
                <strong>
                  {getAdmissionNumber(selectedStudent)}
                </strong>
              </div>

              <div>
                <span>Class</span>
                <strong>
                  {selectedStudent.className || "Not specified"}
                </strong>
              </div>

              <div>
                <span>Session</span>
                <strong>{session}</strong>
              </div>

              <div>
                <span>Term</span>
                <strong>{term}</strong>
              </div>

              <div>
                <span>Report Status</span>
                <strong>{approvalStatus}</strong>
              </div>
            </div>
          </section>

          <section className="report-card">
            <div className="report-card-header">
              <div>
                <h2>Subject Results</h2>
                <p>
                  Results recorded for {term}, {session}.
                </p>
              </div>
            </div>

            <div className="report-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Code</th>
                    <th>Total Score</th>
                    <th>Percentage</th>
                    <th>Grade</th>
                    <th>Remark</th>
                  </tr>
                </thead>

                <tbody>
                  {subjectResults.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="empty-cell"
                      >
                        No results are available for this
                        student and term.
                      </td>
                    </tr>
                  ) : (
                    subjectResults.map((result) => (
                      <tr key={result.subject}>
                        <td>
                          <strong>{result.subject}</strong>
                        </td>

                        <td>{result.subjectCode || "—"}</td>

                        <td>
                          {result.total.toFixed(2)} /{" "}
                          {result.maximum}
                        </td>

                        <td>
                          {result.percentage.toFixed(2)}%
                        </td>

                        <td>
                          <span className="grade-badge">
                            {result.grade}
                          </span>
                        </td>

                        <td>{result.remark}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="report-summary-grid">
            <div className="report-card">
              <span>Overall Average</span>
              <strong>
                {overallPercentage.toFixed(2)}%
              </strong>
            </div>

            <div className="report-card">
              <span>Overall Grade</span>
              <strong>{overallGrade}</strong>
            </div>

            <div className="report-card">
              <span>Subjects Recorded</span>
              <strong>{subjectResults.length}</strong>
            </div>

            <div className="report-card">
              <span>Attendance</span>
              <strong>
                {totalAttendance > 0
                  ? `${attendancePercentage.toFixed(1)}%`
                  : "N/A"}
              </strong>
            </div>
          </section>

          <section className="report-card attendance-card">
            <div className="report-card-header">
              <div>
                <h2>Attendance Summary</h2>
              </div>
            </div>

            <div className="attendance-grid">
              <div>
                <span>Present</span>
                <strong>{attendancePresent}</strong>
              </div>

              <div>
                <span>Absent</span>
                <strong>{attendanceAbsent}</strong>
              </div>

              <div>
                <span>Late</span>
                <strong>{attendanceLate}</strong>
              </div>

              <div>
                <span>Attendance Rate</span>
                <strong>
                  {totalAttendance > 0
                    ? `${attendancePercentage.toFixed(1)}%`
                    : "N/A"}
                </strong>
              </div>
            </div>
          </section>

          <section className="report-card no-print">
            <div className="report-card-header">
              <div>
                <h2>Remarks & Approval</h2>
                <p>
                  Add official remarks before approving the report.
                </p>
              </div>
            </div>

            <div className="remarks-grid">
              <label>
                Class Teacher Remark
                <textarea
                  value={classTeacherRemark}
                  onChange={(event) =>
                    setClassTeacherRemark(
                      event.target.value,
                    )
                  }
                  placeholder="Enter class teacher remark..."
                  disabled={approvalStatus === "LOCKED"}
                />
              </label>

              <label>
                Principal Remark
                <textarea
                  value={principalRemark}
                  onChange={(event) =>
                    setPrincipalRemark(event.target.value)
                  }
                  placeholder="Enter principal remark..."
                  disabled={approvalStatus === "LOCKED"}
                />
              </label>

              <label>
                Approval Status
                <select
                  value={approvalStatus}
                  onChange={(event) =>
                    setApprovalStatus(
                      event.target
                        .value as ReportCard["approvalStatus"],
                    )
                  }
                  disabled={approvalStatus === "LOCKED"}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="APPROVED">Approved</option>
                  <option value="LOCKED">Locked</option>
                </select>
              </label>
            </div>

            <div className="report-actions">
              <button
                className="primary-button"
                onClick={saveReport}
                disabled={approvalStatus === "LOCKED"}
              >
                Save Report
              </button>

              <button
                className="secondary-button"
                onClick={lockReport}
              >
                Lock Report
              </button>

              <button
                className="secondary-button"
                onClick={printReport}
              >
                Print Report Card
              </button>
            </div>
          </section>
        </div>
      )}

      <div className="report-security-note no-print">
        <strong>School Data Boundary:</strong> Academic report
        records are restricted to the current school workspace.
        Report approval and locking provide a controlled result
        lifecycle. Attendance integration will use the central
        attendance repository when the production attendance
        reporting layer is connected.
      </div>
    </div>
  );
}
