import {
  FormEvent,
  useState,
} from "react";
import "./SchoolRegistrationPage.css";

type ApplicationStatus = "PENDING_REVIEW";

interface SchoolApplication {
  applicationId: string;
  schoolName: string;
  schoolType: string;
  address: string;
  state: string;
  lga: string;
  administratorName: string;
  administratorPosition: string;
  phone: string;
  email: string;
  studentCount: string;
  staffCount: string;
  requestedPlan: string;
  status: ApplicationStatus;
  submittedAt: string;
}

function createApplicationId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random()
    .toString(36)
    .slice(2, 7)
    .toUpperCase();

  return `UFA-${timestamp}-${random}`;
}

export default function SchoolRegistrationPage() {
  const [submittedApplication, setSubmittedApplication] =
    useState<SchoolApplication | null>(null);

  const [error, setError] = useState("");

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");

    const form = new FormData(event.currentTarget);

    const application: SchoolApplication = {
      applicationId: createApplicationId(),
      schoolName: String(form.get("schoolName") ?? "").trim(),
      schoolType: String(form.get("schoolType") ?? ""),
      address: String(form.get("address") ?? "").trim(),
      state: String(form.get("state") ?? "").trim(),
      lga: String(form.get("lga") ?? "").trim(),
      administratorName: String(
        form.get("administratorName") ?? "",
      ).trim(),
      administratorPosition: String(
        form.get("administratorPosition") ?? "",
      ).trim(),
      phone: String(form.get("phone") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      studentCount: String(
        form.get("studentCount") ?? "",
      ).trim(),
      staffCount: String(
        form.get("staffCount") ?? "",
      ).trim(),
      requestedPlan: String(
        form.get("requestedPlan") ?? "",
      ),
      status: "PENDING_REVIEW",
      submittedAt: new Date().toISOString(),
    };

    if (!application.schoolName) {
      setError("Please enter the school name.");
      return;
    }

    if (!application.email) {
      setError("Please enter a valid school email.");
      return;
    }

    if (!application.phone) {
      setError("Please enter the school contact phone.");
      return;
    }

    const existingApplications =
      JSON.parse(
        localStorage.getItem(
          "ultra-school-applications",
        ) ?? "[]",
      ) as SchoolApplication[];

    localStorage.setItem(
      "ultra-school-applications",
      JSON.stringify([
        ...existingApplications,
        application,
      ]),
    );

    setSubmittedApplication(application);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function goHome() {
    window.history.pushState({}, "", "/");
    window.dispatchEvent(
      new PopStateEvent("popstate"),
    );
  }

  function goLogin() {
    window.history.pushState({}, "", "/login");
    window.dispatchEvent(
      new PopStateEvent("popstate"),
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
            APPLICATION SUBMITTED
          </p>

          <h1>
            Your school registration is now under review.
          </h1>

          <p className="registration-success-text">
            Keep your application reference number. You
            will need it to track the progress of your
            application.
          </p>

          <div className="application-reference">
            <span>Application Reference</span>
            <strong>
              {submittedApplication.applicationId}
            </strong>
          </div>

          <div className="application-status">
            <span>Status</span>
            <strong>Pending Review</strong>
          </div>

          <div className="registration-actions">
            <button
              type="button"
              className="registration-primary"
              onClick={goHome}
            >
              Back to Website
            </button>

            <button
              type="button"
              className="registration-secondary"
              onClick={goLogin}
            >
              School Login
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
          onClick={goHome}
        >
          <span className="registration-logo">
            FP
          </span>

          <span>
            <strong>ULTRA FINGERPRINT</strong>
            <small>ATTENDANCE</small>
          </span>
        </button>

        <button
          type="button"
          className="registration-home-link"
          onClick={goHome}
        >
          Back to Website
        </button>
      </header>

      <section className="registration-container">
        <div className="registration-heading">
          <p className="registration-kicker">
            SCHOOL REGISTRATION
          </p>

          <h1>Register your school</h1>

          <p>
            Submit your school's application to join ULTRA
            FINGERPRINT ATTENDANCE.
          </p>
        </div>

        <form
          className="registration-form"
          onSubmit={handleSubmit}
        >
          <section className="registration-section">
            <div className="section-title">
              <span>01</span>
              <div>
                <h2>School Information</h2>
                <p>Tell us about your school.</p>
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
                  <option value="" disabled>
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
                    Nursery, Primary & Secondary
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
                <h2>School Location</h2>
                <p>Provide the school's location.</p>
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
                <h2>Administrator</h2>
                <p>
                  Provide the primary school contact.
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
                  <option value="" disabled>
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
                  placeholder="school@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>
          </section>

          <section className="registration-section">
            <div className="section-title">
              <span>04</span>
              <div>
                <h2>Subscription</h2>
                <p>
                  Select the plan you want to request.
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
                <strong>Starter</strong>
                <span>
                  Designed for smaller schools.
                </span>
              </label>

              <label className="plan-card">
                <input
                  type="radio"
                  name="requestedPlan"
                  value="Professional"
                />
                <strong>Professional</strong>
                <span>
                  More capacity for growing schools.
                </span>
              </label>

              <label className="plan-card">
                <input
                  type="radio"
                  name="requestedPlan"
                  value="Enterprise"
                />
                <strong>Enterprise</strong>
                <span>
                  Designed for larger school operations.
                </span>
              </label>
            </div>
          </section>

          <section className="registration-section">
            <div className="section-title">
              <span>05</span>
              <div>
                <h2>Confirmation</h2>
                <p>
                  Review the information before submitting.
                </p>
              </div>
            </div>

            <label className="consent-row">
              <input
                type="checkbox"
                required
              />
              <span>
                I confirm that the information provided is
                accurate and I agree to the platform's
                registration and privacy requirements.
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
              Submit School Application
            </button>
          </section>
        </form>
      </section>
    </main>
  );
}
