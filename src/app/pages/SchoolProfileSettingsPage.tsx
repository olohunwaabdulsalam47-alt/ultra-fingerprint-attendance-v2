import { FormEvent, useEffect, useState } from "react";
import "./SchoolProfileSettingsPage.css";

interface SchoolSettings {
  schoolName: string;
  schoolType: string;
  phone: string;
  email: string;
  address: string;
  state: string;
  lga: string;
  academicSession: string;
  currentTerm: string;
  schoolStartTime: string;
  schoolEndTime: string;
  workingDays: string[];
  attendanceCutoffTime: string;
  lateThresholdMinutes: number;
  schoolStatus: "ACTIVE" | "INACTIVE";
}

const storageKey = "ultra-school-profile-settings";

const defaultSettings: SchoolSettings = {
  schoolName: "",
  schoolType: "Private School",
  phone: "",
  email: "",
  address: "",
  state: "Ogun",
  lga: "",
  academicSession: "2026/2027",
  currentTerm: "First Term",
  schoolStartTime: "08:00",
  schoolEndTime: "15:00",
  workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  attendanceCutoffTime: "10:00",
  lateThresholdMinutes: 15,
  schoolStatus: "ACTIVE",
};

const workingDayOptions = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function loadSettings(): SchoolSettings {
  try {
    const stored = localStorage.getItem(storageKey);

    if (!stored) {
      return defaultSettings;
    }

    return {
      ...defaultSettings,
      ...(JSON.parse(stored) as Partial<SchoolSettings>),
    };
  } catch {
    return defaultSettings;
  }
}

export default function SchoolProfileSettingsPage() {
  const [settings, setSettings] = useState<SchoolSettings>(loadSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(false);
  }, [settings]);

  function updateField<K extends keyof SchoolSettings>(
    field: K,
    value: SchoolSettings[K],
  ) {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function toggleWorkingDay(day: string) {
    setSettings((current) => {
      const exists = current.workingDays.includes(day);

      return {
        ...current,
        workingDays: exists
          ? current.workingDays.filter((item) => item !== day)
          : [...current.workingDays, day],
      };
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    localStorage.setItem(storageKey, JSON.stringify(settings));
    setSaved(true);
  }

  function resetSettings() {
    setSettings(defaultSettings);
    localStorage.setItem(storageKey, JSON.stringify(defaultSettings));
    setSaved(true);
  }

  return (
    <main className="school-settings-page">
      <header className="school-settings-header">
        <div>
          <p className="school-settings-eyebrow">SCHOOL ADMINISTRATION</p>
          <h1>School Profile & Settings</h1>
          <p>
            Configure your school identity, academic session, working days,
            and attendance rules.
          </p>
        </div>

        <span
          className={`school-status-badge ${
            settings.schoolStatus === "ACTIVE"
              ? "school-status-active"
              : "school-status-inactive"
          }`}
        >
          {settings.schoolStatus}
        </span>
      </header>

      {saved && (
        <div className="school-settings-success">
          School settings saved successfully in development storage.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <section className="school-settings-card">
          <div className="school-settings-section-heading">
            <h2>School Identity</h2>
            <p>Basic information used to identify the school.</p>
          </div>

          <div className="school-settings-grid">
            <label>
              <span>School Name</span>
              <input
                value={settings.schoolName}
                onChange={(event) =>
                  updateField("schoolName", event.target.value)
                }
                placeholder="Enter school name"
                required
              />
            </label>

            <label>
              <span>School Type</span>
              <select
                value={settings.schoolType}
                onChange={(event) =>
                  updateField("schoolType", event.target.value)
                }
              >
                <option>Private School</option>
                <option>Public School</option>
                <option>Mission School</option>
                <option>Islamic School</option>
                <option>Other</option>
              </select>
            </label>

            <label>
              <span>Phone Number</span>
              <input
                value={settings.phone}
                onChange={(event) =>
                  updateField("phone", event.target.value)
                }
                placeholder="School phone number"
                type="tel"
              />
            </label>

            <label>
              <span>Email Address</span>
              <input
                value={settings.email}
                onChange={(event) =>
                  updateField("email", event.target.value)
                }
                placeholder="school@example.com"
                type="email"
              />
            </label>

            <label className="school-settings-full-width">
              <span>School Address</span>
              <textarea
                value={settings.address}
                onChange={(event) =>
                  updateField("address", event.target.value)
                }
                placeholder="Enter full school address"
                rows={3}
              />
            </label>

            <label>
              <span>State</span>
              <input
                value={settings.state}
                onChange={(event) =>
                  updateField("state", event.target.value)
                }
                placeholder="State"
              />
            </label>

            <label>
              <span>Local Government Area</span>
              <input
                value={settings.lga}
                onChange={(event) =>
                  updateField("lga", event.target.value)
                }
                placeholder="LGA"
              />
            </label>
          </div>
        </section>

        <section className="school-settings-card">
          <div className="school-settings-section-heading">
            <h2>Academic Session</h2>
            <p>Set the current academic period for school operations.</p>
          </div>

          <div className="school-settings-grid">
            <label>
              <span>Academic Session</span>
              <input
                value={settings.academicSession}
                onChange={(event) =>
                  updateField("academicSession", event.target.value)
                }
                placeholder="2026/2027"
              />
            </label>

            <label>
              <span>Current Term</span>
              <select
                value={settings.currentTerm}
                onChange={(event) =>
                  updateField("currentTerm", event.target.value)
                }
              >
                <option>First Term</option>
                <option>Second Term</option>
                <option>Third Term</option>
              </select>
            </label>
          </div>
        </section>

        <section className="school-settings-card">
          <div className="school-settings-section-heading">
            <h2>School Working Days</h2>
            <p>Select the days on which the school normally operates.</p>
          </div>

          <div className="working-days">
            {workingDayOptions.map((day) => (
              <label className="working-day-option" key={day}>
                <input
                  type="checkbox"
                  checked={settings.workingDays.includes(day)}
                  onChange={() => toggleWorkingDay(day)}
                />
                <span>{day}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="school-settings-card">
          <div className="school-settings-section-heading">
            <h2>Attendance Configuration</h2>
            <p>Configure the basic daily attendance timing rules.</p>
          </div>

          <div className="school-settings-grid">
            <label>
              <span>School Start Time</span>
              <input
                type="time"
                value={settings.schoolStartTime}
                onChange={(event) =>
                  updateField("schoolStartTime", event.target.value)
                }
              />
            </label>

            <label>
              <span>School End Time</span>
              <input
                type="time"
                value={settings.schoolEndTime}
                onChange={(event) =>
                  updateField("schoolEndTime", event.target.value)
                }
              />
            </label>

            <label>
              <span>Attendance Cutoff Time</span>
              <input
                type="time"
                value={settings.attendanceCutoffTime}
                onChange={(event) =>
                  updateField("attendanceCutoffTime", event.target.value)
                }
              />
            </label>

            <label>
              <span>Late Threshold (minutes)</span>
              <input
                type="number"
                min="0"
                max="180"
                value={settings.lateThresholdMinutes}
                onChange={(event) =>
                  updateField(
                    "lateThresholdMinutes",
                    Number(event.target.value),
                  )
                }
              />
            </label>
          </div>
        </section>

        <section className="school-settings-card">
          <div className="school-settings-section-heading">
            <h2>Operational Status</h2>
            <p>Control whether this school is currently operational.</p>
          </div>

          <label className="status-select">
            <span>School Status</span>
            <select
              value={settings.schoolStatus}
              onChange={(event) =>
                updateField(
                  "schoolStatus",
                  event.target.value as SchoolSettings["schoolStatus"],
                )
              }
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </label>
        </section>

        <div className="school-settings-actions">
          <button
            type="button"
            className="school-settings-reset"
            onClick={resetSettings}
          >
            Reset
          </button>

          <button type="submit" className="school-settings-save">
            Save School Settings
          </button>
        </div>
      </form>

      <div className="school-settings-development-note">
        <strong>Development storage notice</strong>
        <p>
          These settings are currently stored in browser localStorage for
          development. Production deployment should move school configuration
          to the secured backend repository with authorization and audit
          logging.
        </p>
      </div>
    </main>
  );
}
