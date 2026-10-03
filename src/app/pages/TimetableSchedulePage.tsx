import { FormEvent, useEffect, useMemo, useState } from "react";
import "./TimetableSchedulePage.css";

type ScheduleStatus = "ACTIVE" | "INACTIVE";

type Schedule = {
  scheduleId: string;
  className: string;
  subject: string;
  subjectCode: string;
  teacher: string;
  teacherId: string;
  day: string;
  period: string;
  startTime: string;
  endTime: string;
  academicSession: string;
  term: string;
  classroom: string;
  status: ScheduleStatus;
  createdAt: string;
};

type StaffRecord = {
  staffId?: string;
  staffName?: string;
  fullName?: string;
  name?: string;
  status?: string;
  employmentStatus?: string;
};

const SCHEDULES_KEY = "ultra-timetable-schedules";
const STAFF_KEY = "ultra-teacher-staff-management";

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

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const PERIODS = [
  { period: "Period 1", start: "08:00", end: "08:40" },
  { period: "Period 2", start: "08:40", end: "09:20" },
  { period: "Period 3", start: "09:20", end: "10:00" },
  { period: "Period 4", start: "10:20", end: "11:00" },
  { period: "Period 5", start: "11:00", end: "11:40" },
  { period: "Period 6", start: "11:40", end: "12:20" },
  { period: "Period 7", start: "12:20", end: "13:00" },
  { period: "Period 8", start: "13:30", end: "14:10" },
];

const SUBJECTS = [
  ["English Language", "ENG"],
  ["Mathematics", "MTH"],
  ["Basic Science", "BSC"],
  ["Basic Technology", "BTE"],
  ["Social Studies", "SST"],
  ["Civic Education", "CIV"],
  ["Computer Studies", "CMP"],
  ["Agricultural Science", "AGR"],
  ["Biology", "BIO"],
  ["Chemistry", "CHE"],
  ["Physics", "PHY"],
  ["Economics", "ECO"],
  ["Government", "GOV"],
  ["Literature", "LIT"],
  ["Geography", "GEO"],
  ["Islamic Studies", "IRS"],
  ["Christian Religious Studies", "CRS"],
  ["Yoruba", "YOR"],
  ["French", "FRE"],
  ["Physical Education", "PHE"],
];

const SESSIONS = ["2026/2027", "2027/2028", "2028/2029"];
const TERMS = ["First Term", "Second Term", "Third Term"];

function readSchedules(): Schedule[] {
  try {
    const stored = localStorage.getItem(SCHEDULES_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readStaff(): StaffRecord[] {
  try {
    const stored = localStorage.getItem(STAFF_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getStaffName(staff: StaffRecord): string {
  return staff.staffName || staff.fullName || staff.name || "Unnamed Staff";
}

function getStaffId(staff: StaffRecord, index: number): string {
  return staff.staffId || `STAFF-${index + 1}`;
}

function isActiveStaff(staff: StaffRecord): boolean {
  const status = String(
    staff.status || staff.employmentStatus || "ACTIVE",
  ).toUpperCase();

  return !["INACTIVE", "SUSPENDED", "TERMINATED"].includes(status);
}

function makeId(): string {
  return `SCH-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;
}

export default function TimetableSchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [staff, setStaff] = useState<StaffRecord[]>([]);

  const [className, setClassName] = useState(CLASS_NAMES[0]);
  const [subjectValue, setSubjectValue] = useState(
    `${SUBJECTS[0][0]}|${SUBJECTS[0][1]}`,
  );
  const [teacherId, setTeacherId] = useState("");
  const [day, setDay] = useState(DAYS[0]);
  const [period, setPeriod] = useState(PERIODS[0].period);
  const [session, setSession] = useState(SESSIONS[0]);
  const [term, setTerm] = useState(TERMS[0]);
  const [classroom, setClassroom] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("ALL");
  const [dayFilter, setDayFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    const loadedSchedules = readSchedules();
    const loadedStaff = readStaff();

    setSchedules(loadedSchedules);
    setStaff(loadedStaff);

    const firstStaff = loadedStaff.find(isActiveStaff);

    if (firstStaff) {
      setTeacherId(getStaffId(firstStaff, loadedStaff.indexOf(firstStaff)));
    }
  }, []);

  const activeStaff = useMemo(
    () =>
      staff
        .map((item, index) => ({
          item,
          id: getStaffId(item, index),
          name: getStaffName(item),
        }))
        .filter(({ item }) => isActiveStaff(item)),
    [staff],
  );

  const selectedPeriod = PERIODS.find((item) => item.period === period);

  const filteredSchedules = useMemo(() => {
    const query = search.trim().toLowerCase();

    return schedules.filter((item) => {
      const matchesSearch =
        !query ||
        item.className.toLowerCase().includes(query) ||
        item.subject.toLowerCase().includes(query) ||
        item.subjectCode.toLowerCase().includes(query) ||
        item.teacher.toLowerCase().includes(query) ||
        item.classroom.toLowerCase().includes(query);

      const matchesClass =
        classFilter === "ALL" || item.className === classFilter;

      const matchesDay = dayFilter === "ALL" || item.day === dayFilter;

      const matchesStatus =
        statusFilter === "ALL" || item.status === statusFilter;

      return matchesSearch && matchesClass && matchesDay && matchesStatus;
    });
  }, [schedules, search, classFilter, dayFilter, statusFilter]);

  const activeSchedules = schedules.filter(
    (item) => item.status === "ACTIVE",
  );

  const uniqueClasses = new Set(
    activeSchedules.map((item) => item.className),
  ).size;

  const uniqueTeachers = new Set(
    activeSchedules.map((item) => item.teacherId),
  ).size;

  const totalPeriods = activeSchedules.length;

  const saveSchedules = (next: Schedule[]) => {
    setSchedules(next);
    localStorage.setItem(SCHEDULES_KEY, JSON.stringify(next));
  };

  const resetForm = () => {
    setClassName(CLASS_NAMES[0]);
    setSubjectValue(`${SUBJECTS[0][0]}|${SUBJECTS[0][1]}`);
    setDay(DAYS[0]);
    setPeriod(PERIODS[0].period);
    setSession(SESSIONS[0]);
    setTerm(TERMS[0]);
    setClassroom("");
    setEditingId(null);

    const firstStaff = activeStaff[0];

    if (firstStaff) {
      setTeacherId(firstStaff.id);
    } else {
      setTeacherId("");
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!teacherId) {
      window.alert("Select a teacher.");
      return;
    }

    const [subject, subjectCode] = subjectValue.split("|");
    const teacherIndex = staff.findIndex(
      (item, index) => getStaffId(item, index) === teacherId,
    );
    const teacherRecord = staff[teacherIndex];

    if (!teacherRecord) {
      window.alert("Selected teacher could not be found.");
      return;
    }

    if (!selectedPeriod) {
      window.alert("Select a valid period.");
      return;
    }

    const duplicate = schedules.some(
      (item) =>
        item.scheduleId !== editingId &&
        item.status === "ACTIVE" &&
        item.academicSession === session &&
        item.term === term &&
        item.day === day &&
        item.period === period &&
        (item.className === className || item.teacherId === teacherId),
    );

    if (duplicate) {
      window.alert(
        "Schedule conflict detected. The selected class or teacher already has this period.",
      );
      return;
    }

    const teacherName = getStaffName(teacherRecord);

    if (editingId) {
      const next = schedules.map((item) =>
        item.scheduleId === editingId
          ? {
              ...item,
              className,
              subject,
              subjectCode,
              teacher: teacherName,
              teacherId,
              day,
              period,
              startTime: selectedPeriod.start,
              endTime: selectedPeriod.end,
              academicSession: session,
              term,
              classroom: classroom.trim(),
            }
          : item,
      );

      saveSchedules(next);
    } else {
      const newSchedule: Schedule = {
        scheduleId: makeId(),
        className,
        subject,
        subjectCode,
        teacher: teacherName,
        teacherId,
        day,
        period,
        startTime: selectedPeriod.start,
        endTime: selectedPeriod.end,
        academicSession: session,
        term,
        classroom: classroom.trim() || "Main Classroom",
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      };

      saveSchedules([...schedules, newSchedule]);
    }

    resetForm();
  };

  const editSchedule = (schedule: Schedule) => {
    setEditingId(schedule.scheduleId);
    setClassName(schedule.className);
    setSubjectValue(`${schedule.subject}|${schedule.subjectCode}`);
    setTeacherId(schedule.teacherId);
    setDay(schedule.day);
    setPeriod(schedule.period);
    setSession(schedule.academicSession);
    setTerm(schedule.term);
    setClassroom(schedule.classroom);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleSchedule = (scheduleId: string) => {
    const next = schedules.map((item) =>
      item.scheduleId === scheduleId
        ? {
            ...item,
            status:
              item.status === "ACTIVE"
                ? ("INACTIVE" as ScheduleStatus)
                : ("ACTIVE" as ScheduleStatus),
          }
        : item,
    );

    saveSchedules(next);
  };

  return (
    <main className="timetable-page">
      <section className="timetable-header">
        <div>
          <p className="eyebrow">STEP 102</p>
          <h1>Timetable & Class Schedule Management</h1>
          <p>
            Create school schedules while preventing class and teacher period
            conflicts.
          </p>
        </div>
      </section>

      <section className="timetable-stats">
        <article>
          <span>Active Periods</span>
          <strong>{totalPeriods}</strong>
        </article>

        <article>
          <span>Scheduled Classes</span>
          <strong>{uniqueClasses}</strong>
        </article>

        <article>
          <span>Scheduled Teachers</span>
          <strong>{uniqueTeachers}</strong>
        </article>

        <article>
          <span>Total Records</span>
          <strong>{schedules.length}</strong>
        </article>
      </section>

      <section className="timetable-form-card">
        <div className="section-heading">
          <div>
            <h2>{editingId ? "Edit Schedule" : "Create Schedule"}</h2>
            <p>
              Assign a subject and teacher to a class for a specific academic
              period.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Class
              <select
                value={className}
                onChange={(event) => setClassName(event.target.value)}
              >
                {CLASS_NAMES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Subject
              <select
                value={subjectValue}
                onChange={(event) => setSubjectValue(event.target.value)}
              >
                {SUBJECTS.map(([name, code]) => (
                  <option key={code} value={`${name}|${code}`}>
                    {name} ({code})
                  </option>
                ))}
              </select>
            </label>

            <label>
              Teacher
              <select
                value={teacherId}
                onChange={(event) => setTeacherId(event.target.value)}
              >
                <option value="">Select teacher</option>

                {activeStaff.map(({ id, name }) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Day
              <select
                value={day}
                onChange={(event) => setDay(event.target.value)}
              >
                {DAYS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Period
              <select
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
              >
                {PERIODS.map((item) => (
                  <option key={item.period} value={item.period}>
                    {item.period} — {item.start}–{item.end}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Academic Session
              <select
                value={session}
                onChange={(event) => setSession(event.target.value)}
              >
                {SESSIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Term
              <select
                value={term}
                onChange={(event) => setTerm(event.target.value)}
              >
                {TERMS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Classroom / Location
              <input
                value={classroom}
                onChange={(event) => setClassroom(event.target.value)}
                placeholder="e.g. Room 12"
              />
            </label>
          </div>

          <div className="period-preview">
            <strong>Selected period:</strong>{" "}
            {selectedPeriod
              ? `${selectedPeriod.period} — ${selectedPeriod.start}–${selectedPeriod.end}`
              : "Not selected"}
          </div>

          <div className="form-actions">
            <button type="submit" className="primary-button">
              {editingId ? "Update Schedule" : "Create Schedule"}
            </button>

            {editingId && (
              <button
                type="button"
                className="secondary-button"
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>

        {activeStaff.length === 0 && (
          <div className="warning-box">
            No active staff records were found. Create an active teacher in
            Teacher & Staff Management before creating a timetable.
          </div>
        )}
      </section>

      <section className="schedule-list-card">
        <div className="section-heading">
          <div>
            <h2>Schedule Records</h2>
            <p>Search, filter, edit and deactivate timetable entries.</p>
          </div>
        </div>

        <div className="toolbar">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search class, subject, teacher..."
          />

          <select
            value={classFilter}
            onChange={(event) => setClassFilter(event.target.value)}
          >
            <option value="ALL">All Classes</option>
            {CLASS_NAMES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={dayFilter}
            onChange={(event) => setDayFilter(event.target.value)}
          >
            <option value="ALL">All Days</option>
            {DAYS.map((item) => (
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
                <th>Class</th>
                <th>Subject</th>
                <th>Teacher</th>
                <th>Day</th>
                <th>Period</th>
                <th>Session / Term</th>
                <th>Room</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredSchedules.map((item) => (
                <tr key={item.scheduleId}>
                  <td>{item.className}</td>

                  <td>
                    <strong>{item.subject}</strong>
                    <small>{item.subjectCode}</small>
                  </td>

                  <td>{item.teacher}</td>

                  <td>{item.day}</td>

                  <td>
                    <strong>{item.period}</strong>
                    <small>
                      {item.startTime}–{item.endTime}
                    </small>
                  </td>

                  <td>
                    <strong>{item.academicSession}</strong>
                    <small>{item.term}</small>
                  </td>

                  <td>{item.classroom}</td>

                  <td>
                    <span
                      className={`status-badge ${item.status.toLowerCase()}`}
                    >
                      {item.status}
                    </span>
                  </td>

                  <td className="action-cell">
                    <button
                      type="button"
                      onClick={() => editSchedule(item)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleSchedule(item.scheduleId)}
                    >
                      {item.status === "ACTIVE"
                        ? "Deactivate"
                        : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}

              {filteredSchedules.length === 0 && (
                <tr>
                  <td colSpan={9} className="empty-state">
                    No timetable records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="boundary-notice">
        <strong>School Data Boundary</strong>
        <p>
          Timetable records are intended to remain within the authenticated
          school's data boundary. Development persistence currently uses
          browser localStorage and must be replaced with secured backend
          persistence before production.
        </p>
      </section>
    </main>
  );
}
