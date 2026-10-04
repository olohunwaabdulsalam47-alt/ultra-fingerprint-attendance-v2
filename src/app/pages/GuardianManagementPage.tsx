import { FormEvent, useEffect, useState } from "react";
import type {
  Guardian,
  GuardianRelationship,
} from "../../../domain/entities/guardian";
import {
  getGuardians,
  saveGuardian,
} from "../../../data/repositories/guardianRepository";
import { getAuthSession } from "../auth/authSession";

const RELATIONSHIPS: GuardianRelationship[] = [
  "Father",
  "Mother",
  "Guardian",
  "Grandparent",
  "Sibling",
  "Other",
];

export default function GuardianManagementPage() {
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [studentId, setStudentId] = useState("");
  const [fullName, setFullName] = useState("");
  const [relationship, setRelationship] =
    useState<GuardianRelationship>("Father");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [preferredContactMethod, setPreferredContactMethod] =
    useState<Guardian["preferredContactMethod"]>("WHATSAPP");
  const [receiveAttendanceAlerts, setReceiveAttendanceAlerts] =
    useState(true);
  const [receiveAcademicAlerts, setReceiveAcademicAlerts] =
    useState(true);
  const [receiveGeneralNotifications, setReceiveGeneralNotifications] =
    useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadGuardians() {
    try {
      const session = getAuthSession();

      if (!session?.schoolId) {
        setError("Your account is not assigned to a school.");
        return;
      }

      const records = await getGuardians();

      setGuardians(
        records.filter(
          (guardian) =>
            guardian.schoolId === session.schoolId,
        ),
      );

      setError("");
    } catch {
      setError("Unable to load guardian records.");
    }
  }

  useEffect(() => {
    void loadGuardians();
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    const session = getAuthSession();

    if (!session) {
      setError("You must be logged in.");
      return;
    }

    if (!session.schoolId) {
      setError("Your account is not assigned to a school.");
      return;
    }

    const selectedStudentId = studentId.trim();
    const selectedName = fullName.trim();
    const selectedPhone = phone.trim();

    if (!selectedStudentId) {
      setError("Student ID is required.");
      return;
    }

    if (!selectedName) {
      setError("Guardian name is required.");
      return;
    }

    if (
      !selectedPhone &&
      preferredContactMethod !== "EMAIL"
    ) {
      setError(
        "Phone number is required for SMS or WhatsApp.",
      );
      return;
    }

    if (
      preferredContactMethod === "EMAIL" &&
      !email.trim()
    ) {
      setError(
        "Email address is required for email notifications.",
      );
      return;
    }

    const now = new Date().toISOString();

    const guardian: Guardian = {
      guardianId: crypto.randomUUID(),
      schoolId: session.schoolId,
      studentId: selectedStudentId,
      fullName: selectedName,
      relationship,
      phone: selectedPhone,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      preferredContactMethod,
      receiveAttendanceAlerts,
      receiveAcademicAlerts,
      receiveGeneralNotifications,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };

    try {
      await saveGuardian(guardian);

      setStudentId("");
      setFullName("");
      setRelationship("Father");
      setPhone("");
      setEmail("");
      setAddress("");
      setPreferredContactMethod("WHATSAPP");
      setReceiveAttendanceAlerts(true);
      setReceiveAcademicAlerts(true);
      setReceiveGeneralNotifications(true);

      setMessage("Guardian registered successfully.");

      await loadGuardians();
    } catch {
      setError("Unable to save guardian.");
    }
  }

  async function toggleGuardian(
    guardian: Guardian,
  ) {
    try {
      const session = getAuthSession();

      if (
        !session?.schoolId ||
        guardian.schoolId !== session.schoolId
      ) {
        setError("You cannot modify this guardian record.");
        return;
      }

      await saveGuardian({
        ...guardian,
        status:
          guardian.status === "active"
            ? "inactive"
            : "active",
        updatedAt: new Date().toISOString(),
      });

      setMessage(
        guardian.status === "active"
          ? "Guardian deactivated."
          : "Guardian activated.",
      );

      await loadGuardians();
    } catch {
      setError("Unable to update guardian status.");
    }
  }

  return (
    <section
      style={{
        padding: "24px",
        maxWidth: "1100px",
        margin: "0 auto",
      }}
    >
      <h1>Parent & Guardian Management</h1>

      <p>
        Register and manage parent/guardian contacts for
        student notifications.
      </p>

      <form
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        style={{
          display: "grid",
          gap: "16px",
          marginTop: "24px",
          padding: "24px",
          border: "1px solid #ddd",
          borderRadius: "12px",
        }}
      >
        <h2>Register Guardian</h2>

        <label>
          Student ID
          <input
            value={studentId}
            onChange={(event) =>
              setStudentId(event.target.value)
            }
            placeholder="Enter student ID"
            required
          />
        </label>

        <label>
          Guardian Full Name
          <input
            value={fullName}
            onChange={(event) =>
              setFullName(event.target.value)
            }
            placeholder="Enter guardian name"
            required
          />
        </label>

        <label>
          Relationship
          <select
            value={relationship}
            onChange={(event) =>
              setRelationship(
                event.target.value as GuardianRelationship,
              )
            }
          >
            {RELATIONSHIPS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label>
          Phone Number
          <input
            type="tel"
            value={phone}
            onChange={(event) =>
              setPhone(event.target.value)
            }
            placeholder="080..."
          />
        </label>

        <label>
          Email Address
          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="guardian@example.com"
          />
        </label>

        <label>
          Address
          <textarea
            value={address}
            onChange={(event) =>
              setAddress(event.target.value)
            }
            placeholder="Guardian address"
            rows={3}
          />
        </label>

        <label>
          Preferred Contact Method
          <select
            value={preferredContactMethod}
            onChange={(event) =>
              setPreferredContactMethod(
                event.target.value as Guardian["preferredContactMethod"],
              )
            }
          >
            <option value="WHATSAPP">
              WhatsApp
            </option>
            <option value="SMS">SMS</option>
            <option value="EMAIL">Email</option>
          </select>
        </label>

        <label>
          <input
            type="checkbox"
            checked={receiveAttendanceAlerts}
            onChange={(event) =>
              setReceiveAttendanceAlerts(
                event.target.checked,
              )
            }
          />
          Receive attendance alerts
        </label>

        <label>
          <input
            type="checkbox"
            checked={receiveAcademicAlerts}
            onChange={(event) =>
              setReceiveAcademicAlerts(
                event.target.checked,
              )
            }
          />
          Receive academic alerts
        </label>

        <label>
          <input
            type="checkbox"
            checked={receiveGeneralNotifications}
            onChange={(event) =>
              setReceiveGeneralNotifications(
                event.target.checked,
              )
            }
          />
          Receive general notifications
        </label>

        {error && <p role="alert">{error}</p>}

        {message && <p role="status">{message}</p>}

        <button type="submit">
          Register Guardian
        </button>
      </form>

      <section style={{ marginTop: "32px" }}>
        <h2>Guardian Records</h2>

        {guardians.length === 0 ? (
          <p>
            No guardian records have been added yet.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "12px",
            }}
          >
            {guardians.map((guardian) => (
              <article
                key={guardian.guardianId}
                style={{
                  padding: "18px",
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                }}
              >
                <strong>{guardian.fullName}</strong>

                <p>
                  Student: {guardian.studentId}
                </p>

                <p>
                  Relationship: {guardian.relationship}
                </p>

                <p>
                  Contact:{" "}
                  {guardian.preferredContactMethod}
                </p>

                <p>
                  Status: {guardian.status}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    void toggleGuardian(guardian)
                  }
                >
                  {guardian.status === "active"
                    ? "Deactivate"
                    : "Activate"}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
