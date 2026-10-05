import {
  FormEvent,
  useState,
} from "react";
import "./SchoolRegistrationPage.css";
import type { School } from "../../../domain/entities/school";
import type { User } from "../../../domain/entities/user";
import {
  getUsers,
  saveUser,
} from "../../../data/repositories/userRepository";
import {
  createPasswordCredential,
  savePasswordCredential,
} from "../../../data/repositories/passwordCredentialRepository";
import {
  saveSchool,
} from "../../../data/repositories/schoolRepository";

type ApplicationStatus = "ACTIVE_TRIAL";

interface SchoolApplication {
  applicationId: string;
  schoolId: string;
  schoolName: string;
  schoolType: string;
  address: string;
  state: string;
  lga: string;
  administratorName: string;
  administratorPosition: string;
  staffId: string;
  phone: string;
  email: string;
  studentCount: string;
  staffCount: string;
  requestedPlan: string;
  status: ApplicationStatus;
  submittedAt: string;
  trialStartedAt: string;
  trialEndsAt: string;
}

const TRIAL_DURATION_DAYS = 7;
const APPLICATIONS_KEY =
  "ultra-school-applications";
const TRIALS_KEY =
  "ultra-school-trials";

function createApplicationId(): string {
  const timestamp =
    Date.now()
      .toString(36)
      .toUpperCase();

  const random =
    crypto
      .randomUUID()
      .replace(/-/g, "")
      .slice(0, 8)
      .toUpperCase();

  return `UFA-${timestamp}-${random}`;
}

function createSchoolId(): string {
  return `school-${crypto.randomUUID()}`;
}

function createUserId(): string {
  return `user-${crypto.randomUUID()}`;
}

function createTrialEndDate(
  startedAt: string,
): string {
  const end =
    new Date(startedAt);

  end.setDate(
    end.getDate() +
      TRIAL_DURATION_DAYS,
  );

  return end.toISOString();
}

function normalize(
  value: string,
): string {
  return value
    .trim()
    .toLowerCase();
}

export default function SchoolRegistrationPage() {
  const [
    submittedApplication,
    setSubmittedApplication,
  ] =
    useState<SchoolApplication | null>(
      null,
    );

  const [error, setError] =
    useState("");

  /*
   * Credential fields are controlled
   * directly by React.
   *
   * This prevents browser autofill from
   * accidentally mixing the Staff ID and
   * password values.
   */
  const [staffId, setStaffId] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    const form =
      new FormData(
        event.currentTarget,
      );

    const schoolName =
      String(
        form.get("schoolName") ??
          "",
      ).trim();

    const schoolType =
      String(
        form.get("schoolType") ??
          "",
      );

    const address =
      String(
        form.get("address") ??
          "",
      ).trim();

    const state =
      String(
        form.get("state") ??
          "",
      ).trim();

    const lga =
      String(
        form.get("lga") ??
          "",
      ).trim();

    const administratorName =
      String(
        form.get(
          "administratorName",
        ) ?? "",
      ).trim();

    const administratorPosition =
      String(
        form.get(
          "administratorPosition",
        ) ?? "",
      );

    const selectedStaffId =
      staffId.trim();

    const phone =
      String(
        form.get("phone") ??
          "",
      ).trim();

    const email =
      String(
        form.get("email") ??
          "",
      ).trim();

    const selectedPassword =
      password;

    const selectedConfirmPassword =
      confirmPassword;

    const studentCount =
      String(
        form.get(
          "studentCount",
        ) ?? "",
      ).trim();

    const staffCount =
      String(
        form.get(
          "staffCount",
        ) ?? "",
      ).trim();

    const requestedPlan =
      String(
        form.get(
          "requestedPlan",
        ) ?? "",
      );

    if (!schoolName) {
      setError(
        "Please enter the school name.",
      );
      return;
    }

    if (!administratorName) {
      setError(
        "Please enter the Principal/Admin name.",
      );
      return;
    }

    if (!selectedStaffId) {
      setError(
        "Please enter a Principal/Admin ID.",
      );
      return;
    }

    if (!email) {
      setError(
        "Please enter a valid email address.",
      );
      return;
    }

    if (!phone) {
      setError(
        "Please enter the contact phone number.",
      );
      return;
    }

    if (
      selectedPassword.length <
      8
    ) {
      setError(
        "Password must contain at least 8 characters.",
      );
      return;
    }

    if (
      selectedPassword !==
      selectedConfirmPassword
    ) {
      setError(
        "Passwords do not match.",
      );
      return;
    }

    if (!requestedPlan) {
      setError(
        "Please select a subscription plan.",
      );
      return;
    }

    try {
      const users =
        await getUsers();

      const duplicateStaffId =
        users.some(
          (user) =>
            user.staffId &&
            normalize(
              user.staffId,
            ) ===
              normalize(
                selectedStaffId,
              ),
        );

      if (duplicateStaffId) {
        setError(
          "This Principal/Admin ID is already registered.",
        );
        return;
      }

      const existingApplications =
        JSON.parse(
          localStorage.getItem(
            APPLICATIONS_KEY,
          ) ?? "[]",
        ) as SchoolApplication[];

      const duplicateEmail =
        existingApplications.some(
          (application) =>
            normalize(
              application.email,
            ) ===
              normalize(
                email,
              ),
        );

      if (duplicateEmail) {
        setError(
          "This email address is already registered.",
        );
        return;
      }

      const now =
        new Date().toISOString();

      const schoolId =
        createSchoolId();

      const userId =
        createUserId();

      const trialEndsAt =
        createTrialEndDate(
          now,
        );

      const school: School =
        {
          schoolId,
          name: schoolName,
          status: "active",
          createdAt: now,
          updatedAt: now,
        };

      const user: User =
        {
          userId,
          schoolId,
          role: "Principal",
          name:
            administratorName,
          staffId:
            selectedStaffId,
          status: "active",
          createdAt: now,
          updatedAt: now,
        };

      /*
       * Save the school first.
       */
      await saveSchool(
        school,
      );

      /*
       * Save the Principal/Admin
       * with the explicitly controlled
       * Staff ID.
       */
      await saveUser(
        user,
      );

      /*
       * Hash the explicitly controlled
       * password and associate it with
       * the same userId.
       */
      const credential =
        await createPasswordCredential(
          userId,
          selectedPassword,
        );

      await savePasswordCredential(
        credential,
      );

      const application:
        SchoolApplication = {
        applicationId:
          createApplicationId(),
        schoolId,
        schoolName,
        schoolType,
        address,
        state,
        lga,
        administratorName,
        administratorPosition,
        staffId:
          selectedStaffId,
        phone,
        email,
        studentCount,
        staffCount,
        requestedPlan,
        status:
          "ACTIVE_TRIAL",
        submittedAt: now,
        trialStartedAt:
          now,
        trialEndsAt,
      };

      localStorage.setItem(
        APPLICATIONS_KEY,
        JSON.stringify([
          ...existingApplications,
          application,
        ]),
      );

      const existingTrials =
        JSON.parse(
          localStorage.getItem(
            TRIALS_KEY,
          ) ?? "[]",
        ) as Array<{
          schoolId: string;
          userId: string;
          email: string;
          trialStartedAt: string;
          trialEndsAt: string;
          status:
            | "ACTIVE"
            | "EXPIRED";
        }>;

      localStorage.setItem(
        TRIALS_KEY,
        JSON.stringify([
          ...existingTrials,
          {
            schoolId,
            userId,
            email,
            trialStartedAt:
              now,
            trialEndsAt,
            status:
              "ACTIVE" as const,
          },
        ]),
      );

      setSubmittedApplication(
        application,
      );

      /*
       * Clear credential state after
       * successful registration.
       */
      setStaffId("");
      setPassword("");
      setConfirmPassword("");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch {
      setError(
        "Unable to complete school registration. Please try again.",
      );
    }
  }

  function goHome() {
    window.history.pushState(
      {},
      "",
      "/",
    );

    window.dispatchEvent(
      new PopStateEvent(
        "popstate",
      ),
    );
  }

  function goLogin() {
    window.history.pushState(
      {},
      "",
      "/login",
    );

    window.dispatchEvent(
      new PopStateEvent(
        "popstate",
      ),
    );
  }

  if (submittedApplication) {
    return (
      <main className="registration-page">
        <section className="registration-success">
          <div className="registration-success-icon">
            ✓
          </div>

          <p className="registration-kicker">
            SCHOOL ACTIVATED
          </p>

          <h1>
            Your school is now active.
          </h1>

          <p className="registration-success-text">
            Your Principal/Admin account
            has been created successfully.
            Your 7-day free trial has
            started.
          </p>

          <div className="application-reference">
            <span>
              Application Reference
            </span>

            <strong>
              {
                submittedApplication.applicationId
              }
            </strong>
          </div>

          <div className="application-status">
            <span>
              School Status
            </span>

            <strong>
              Active — Free Trial
            </strong>
          </div>

          <div className="application-status">
            <span>
              Trial Ends
            </span>

            <strong>
              {new Date(
                submittedApplication.trialEndsAt,
              ).toLocaleString()}
            </strong>
          </div>

          <div className="application-status">
            <span>
              Principal/Admin ID
            </span>

            <strong>
              {
                submittedApplication.staffId
              }
            </strong>
          </div>

          <div className="registration-actions">
            <button
              type="button"
              className="registration-primary"
              onClick={
                goLogin
              }
            >
              Go to School Login
            </button>

            <button
              type="button"
              className="registration-secondary"
              onClick={
                goHome
              }
            >
              Back to Website
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="registration-page">
      <header className="registration-header">
        <button
          type="button"
          className="registration-brand"
          onClick={
            goHome
          }
        >
          <span className="registration-logo">
            FP
          </span>

          <span>
            <strong>
              ULTRA FINGERPRINT
            </strong>

            <small>
              ATTENDANCE
            </small>
          </span>
        </button>

        <button
          type="button"
          className="registration-home-link"
          onClick={
            goHome
          }
        >
          Back to Website
        </button>
      </header>

      <section className="registration-container">
        <div className="registration-heading">
          <p className="registration-kicker">
            SCHOOL REGISTRATION
          </p>

          <h1>
            Register your school
          </h1>

          <p>
            Create your school and
            Principal/Admin account and
            start your 7-day free trial.
          </p>
        </div>

        <form
          className="registration-form"
          onSubmit={
            handleSubmit
          }
        >
          <section className="registration-section">
            <div className="section-title">
              <span>01</span>

              <div>
                <h2>
                  School Information
                </h2>

                <p>
                  Tell us about your
                  school.
                </p>
              </div>
            </div>

            <div className="form-grid">
              <div className="registration-field full">
                <label htmlFor="schoolName">
                  School Name
                </label>

                <input
                  id="schoolName"
                  name="schoolName"
                  type="text"
                  placeholder="Enter official school name"
                  autoComplete="organization"
                  required
                />
              </div>

              <div className="registration-field">
                <label htmlFor="schoolType">
                  School Type
                </label>

                <select
                  id="schoolType"
                  name="schoolType"
                  required
                  defaultValue=""
                >
                  <option
                    value=""
                    disabled
                  >
                    Select school type
                  </option>

                  <option value="Nursery">
                    Nursery
                  </option>

                  <option value="Primary">
                    Primary
                  </option>

                  <option value="Secondary">
                    Secondary
                  </option>

                  <option value="Nursery-Primary">
                    Nursery & Primary
                  </option>

                  <option value="Primary-Secondary">
                    Primary & Secondary
                  </option>

                  <option value="Nursery-Primary-Secondary">
                    Nursery, Primary &
                    Secondary
                  </option>
                </select>
              </div>

              <div className="registration-field">
                <label htmlFor="studentCount">
                  Estimated Students
                </label>

                <input
                  id="studentCount"
                  name="studentCount"
                  type="number"
                  min="1"
                  placeholder="e.g. 500"
                  required
                />
              </div>

              <div className="registration-field">
                <label htmlFor="staffCount">
                  Estimated Staff
                </label>

                <input
                  id="staffCount"
                  name="staffCount"
                  type="number"
                  min="1"
                  placeholder="e.g. 40"
                  required
                />
              </div>
            </div>
          </section>

          <section className="registration-section">
            <div className="section-title">
              <span>02</span>

              <div>
                <h2>
                  School Location
                </h2>

                <p>
                  Provide the school's
                  location.
                </p>
              </div>
            </div>

            <div className="form-grid">
              <div className="registration-field full">
                <label htmlFor="address">
                  School Address
                </label>

                <textarea
                  id="address"
                  name="address"
                  rows={3}
                  placeholder="Enter complete school address"
                  required
                />
              </div>

              <div className="registration-field">
                <label htmlFor="state">
                  State
                </label>

                <input
                  id="state"
                  name="state"
                  type="text"
                  placeholder="e.g. Ogun"
                  required
                />
              </div>

              <div className="registration-field">
                <label htmlFor="lga">
                  Local Government Area
                </label>

                <input
                  id="lga"
                  name="lga"
                  type="text"
                  placeholder="Enter LGA"
                  required
                />
              </div>
            </div>
          </section>

          <section className="registration-section">
            <div className="section-title">
              <span>03</span>

              <div>
                <h2>
                  Principal / Admin
                  Account
                </h2>

                <p>
                  This account will manage
                  the school.
                </p>
              </div>
            </div>

            <div className="form-grid">
              <div className="registration-field">
                <label htmlFor="administratorName">
                  Full Name
                </label>

                <input
                  id="administratorName"
                  name="administratorName"
                  type="text"
                  placeholder="Principal / Administrator"
                  autoComplete="name"
                  required
                />
              </div>

              <div className="registration-field">
                <label htmlFor="administratorPosition">
                  Position
                </label>

                <select
                  id="administratorPosition"
                  name="administratorPosition"
                  defaultValue=""
                  required
                >
                  <option
                    value=""
                    disabled
                  >
                    Select position
                  </option>

                  <option value="Principal">
                    Principal
                  </option>

                  <option value="Proprietor">
                    Proprietor
                  </option>

                  <option value="School Administrator">
                    School Administrator
                  </option>

                  <option value="Head Teacher">
                    Head Teacher
                  </option>

                  <option value="Director">
                    Director
                  </option>
                </select>
              </div>

              <div className="registration-field">
                <label htmlFor="staffId">
                  Principal/Admin ID
                </label>

                <input
                  id="staffId"
                  name="staffId"
                  type="text"
                  value={staffId}
                  onChange={(
                    event,
                  ) =>
                    setStaffId(
                      event.target.value,
                    )
                  }
                  placeholder="Create your login ID"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  required
                />
              </div>

              <div className="registration-field">
                <label htmlFor="phone">
                  Phone Number
                </label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="Enter phone number"
                  autoComplete="tel"
                  required
                />
              </div>

              <div className="registration-field">
                <label htmlFor="email">
                  Email Address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@school.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="registration-field">
                <label htmlFor="password">
                  Password
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(
                    event,
                  ) =>
                    setPassword(
                      event.target.value,
                    )
                  }
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>

              <div className="registration-field">
                <label htmlFor="confirmPassword">
                  Confirm Password
                </label>

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={
                    confirmPassword
                  }
                  onChange={(
                    event,
                  ) =>
                    setConfirmPassword(
                      event.target.value,
                    )
                  }
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>
            </div>
          </section>

          <section className="registration-section">
            <div className="section-title">
              <span>04</span>

              <div>
                <h2>
                  Subscription
                </h2>

                <p>
                  Choose your plan. Your
                  7-day free trial starts
                  immediately.
                </p>
              </div>
            </div>

            <div className="plan-grid">
              <label className="plan-card">
                <input
                  type="radio"
                  name="requestedPlan"
                  value="Starter"
                  required
                />

                <strong>
                  Starter
                </strong>

                <span>
                  Designed for smaller
                  schools.
                </span>
              </label>

              <label className="plan-card">
                <input
                  type="radio"
                  name="requestedPlan"
                  value="Professional"
                />

                <strong>
                  Professional
                </strong>

                <span>
                  More capacity for
                  growing schools.
                </span>
              </label>

              <label className="plan-card">
                <input
                  type="radio"
                  name="requestedPlan"
                  value="Enterprise"
                />

                <strong>
                  Enterprise
                </strong>

                <span>
                  Designed for larger
                  school operations.
                </span>
              </label>
            </div>
          </section>

          <section className="registration-section">
            <div className="section-title">
              <span>05</span>

              <div>
                <h2>
                  Confirmation
                </h2>

                <p>
                  Review the information
                  before creating your
                  school.
                </p>
              </div>
            </div>

            <label className="consent-row">
              <input
                type="checkbox"
                required
              />

              <span>
                I confirm that the
                information provided is
                accurate and I agree to
                the platform's
                registration and privacy
                requirements.
              </span>
            </label>

            {error && (
              <p
                className="registration-error"
                role="alert"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              className="registration-submit"
            >
              Create School & Start
              Free Trial
            </button>
          </section>
        </form>
      </section>
    </main>
  );
}
