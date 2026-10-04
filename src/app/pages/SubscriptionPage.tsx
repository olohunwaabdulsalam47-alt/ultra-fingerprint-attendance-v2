import {
  useState,
} from "react";
import {
  getAuthSession,
} from "../auth/authSession";
import {
  clearTrialLock,
} from "../auth/trialLock";

const TRIALS_KEY =
  "ultra-school-trials";

const APPLICATIONS_KEY =
  "ultra-school-applications";

type PlanName =
  | "Starter"
  | "Professional"
  | "Enterprise";

interface TrialRecord {
  schoolId: string;
  userId: string;
  email: string;
  trialStartedAt: string;
  trialEndsAt: string;
  status: "ACTIVE" | "EXPIRED";
}

interface SchoolApplication {
  applicationId: string;
  schoolId: string;
  schoolName: string;
  requestedPlan: string;
  status: string;
  submittedAt: string;
  trialStartedAt: string;
  trialEndsAt: string;
  [key: string]: unknown;
}

const PLANS: Array<{
  name: PlanName;
  description: string;
  features: string[];
}> = [
  {
    name: "Starter",
    description:
      "Essential tools for smaller schools.",
    features: [
      "School management",
      "Student enrollment",
      "Class management",
      "Attendance recording",
      "Basic reports",
    ],
  },
  {
    name: "Professional",
    description:
      "Advanced tools for growing schools.",
    features: [
      "Everything in Starter",
      "Advanced attendance reports",
      "Teacher and staff management",
      "Biometric attendance",
      "Academic management",
      "Guardian management",
    ],
  },
  {
    name: "Enterprise",
    description:
      "Complete tools for larger school operations.",
    features: [
      "Everything in Professional",
      "Advanced administration",
      "Expanded reporting",
      "Platform support",
      "Larger operational capacity",
      "Enterprise-ready controls",
    ],
  },
];

function getTrial(
  schoolId: string,
): TrialRecord | null {
  try {
    const trials =
      JSON.parse(
        localStorage.getItem(
          TRIALS_KEY,
        ) ?? "[]",
      ) as TrialRecord[];

    return (
      trials.find(
        (trial) =>
          trial.schoolId === schoolId,
      ) ?? null
    );
  } catch {
    return null;
  }
}

function updateTrial(
  schoolId: string,
): void {
  try {
    const trials =
      JSON.parse(
        localStorage.getItem(
          TRIALS_KEY,
        ) ?? "[]",
      ) as TrialRecord[];

    const updated =
      trials.map((trial) =>
        trial.schoolId === schoolId
          ? {
              ...trial,
              status:
                "ACTIVE" as const,
            }
          : trial,
      );

    localStorage.setItem(
      TRIALS_KEY,
      JSON.stringify(updated),
    );
  } catch {
    // Development storage only.
  }
}

function updateApplication(
  schoolId: string,
  plan: PlanName,
): void {
  try {
    const applications =
      JSON.parse(
        localStorage.getItem(
          APPLICATIONS_KEY,
        ) ?? "[]",
      ) as SchoolApplication[];

    const updated =
      applications.map(
        (application) =>
          application.schoolId ===
          schoolId
            ? {
                ...application,
                requestedPlan: plan,
                status:
                  "ACTIVE_SUBSCRIPTION",
              }
            : application,
      );

    localStorage.setItem(
      APPLICATIONS_KEY,
      JSON.stringify(updated),
    );
  } catch {
    // Development storage only.
  }
}

export default function SubscriptionPage() {
  const session =
    getAuthSession();

  const [selectedPlan, setSelectedPlan] =
    useState<PlanName>(
      "Professional",
    );

  const [activating, setActivating] =
    useState(false);

  const [activated, setActivated] =
    useState(false);

  const [error, setError] =
    useState("");

  const trial =
    session?.schoolId
      ? getTrial(
          session.schoolId,
        )
      : null;

  function activateSubscription() {
    if (!session?.schoolId) {
      setError(
        "A school account is required to activate a subscription.",
      );
      return;
    }

    setError("");
    setActivating(true);

    /*
     * DEVELOPMENT ACTIVATION
     *
     * This currently simulates successful
     * activation locally.
     *
     * A real payment provider and
     * server-side subscription verification
     * will replace this later.
     */
    window.setTimeout(() => {
      updateTrial(
        session.schoolId!,
      );

      updateApplication(
        session.schoolId!,
        selectedPlan,
      );

      clearTrialLock();

      setActivating(false);
      setActivated(true);
    }, 700);
  }

  function returnToDashboard() {
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

  function signOut() {
    sessionStorage.removeItem(
      "ultra-fingerprint-auth-session",
    );

    window.history.replaceState(
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

  if (!session) {
    return null;
  }

  if (activated) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
          background:
            "linear-gradient(135deg, #f7faf8 0%, #eef5f1 100%)",
          fontFamily:
            "Arial, Helvetica, sans-serif",
        }}
      >
        <section
          style={{
            width: "100%",
            maxWidth: "620px",
            padding: "48px 32px",
            background: "#ffffff",
            borderRadius: "24px",
            textAlign: "center",
            boxShadow:
              "0 20px 60px rgba(0,0,0,0.10)",
          }}
        >
          <div
            style={{
              width: "76px",
              height: "76px",
              margin:
                "0 auto 24px",
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              background: "#e8f6ee",
              color: "#0b6b3a",
              fontSize: "34px",
              fontWeight: 700,
            }}
          >
            ✓
          </div>

          <p
            style={{
              margin: "0 0 10px",
              color: "#0b6b3a",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "2px",
            }}
          >
            SUBSCRIPTION ACTIVATED
          </p>

          <h1
            style={{
              margin:
                "0 0 16px",
              color: "#17231d",
              fontSize: "32px",
            }}
          >
            Your school is active again
          </h1>

          <p
            style={{
              margin:
                "0 auto 28px",
              maxWidth: "500px",
              color: "#5d6963",
              lineHeight: 1.7,
            }}
          >
            The development subscription
            for the{" "}
            <strong>
              {selectedPlan}
            </strong>{" "}
            plan has been activated.
            Your school account is ready
            to continue.
          </p>

          <button
            type="button"
            onClick={
              returnToDashboard
            }
            style={{
              width: "100%",
              border: 0,
              borderRadius: "12px",
              padding: "15px",
              background: "#0b6b3a",
              color: "#ffffff",
              fontSize: "16px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Return to Dashboard
          </button>
        </section>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 20px 60px",
        background:
          "linear-gradient(135deg, #f7faf8 0%, #eef5f1 100%)",
        fontFamily:
          "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            marginBottom: "36px",
          }}
        >
          <button
            type="button"
            onClick={returnToDashboard}
            style={{
              border: 0,
              background: "transparent",
              padding: 0,
              marginBottom: "24px",
              color: "#0b6b3a",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ← Back
          </button>

          <p
            style={{
              margin: "0 0 8px",
              color: "#0b6b3a",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "2px",
            }}
          >
            SCHOOL SUBSCRIPTION
          </p>

          <h1
            style={{
              margin: "0 0 12px",
              color: "#17231d",
              fontSize: "38px",
            }}
          >
            Choose your plan
          </h1>

          <p
            style={{
              margin: 0,
              color: "#5d6963",
              lineHeight: 1.7,
            }}
          >
            Continue using ULTRA
            FINGERPRINT ATTENDANCE by
            activating a school
            subscription.
          </p>
        </header>

        {trial && (
          <section
            style={{
              marginBottom: "28px",
              padding: "18px 20px",
              borderRadius: "14px",
              background: "#fff8e6",
              border:
                "1px solid #f1dfaa",
            }}
          >
            <strong
              style={{
                color: "#765900",
              }}
            >
              Free trial ended
            </strong>

            <p
              style={{
                margin:
                  "6px 0 0",
                color: "#786b45",
              }}
            >
              Trial end:{" "}
              {new Date(
                trial.trialEndsAt,
              ).toLocaleString()}
            </p>
          </section>
        )}

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "18px",
          }}
        >
          {PLANS.map((plan) => {
            const selected =
              selectedPlan ===
              plan.name;

            return (
              <button
                key={plan.name}
                type="button"
                onClick={() =>
                  setSelectedPlan(
                    plan.name,
                  )
                }
                style={{
                  textAlign: "left",
                  padding: "26px",
                  borderRadius: "20px",
                  border: selected
                    ? "2px solid #0b6b3a"
                    : "1px solid #dbe3de",
                  background:
                    "#ffffff",
                  boxShadow: selected
                    ? "0 12px 32px rgba(11,107,58,0.12)"
                    : "0 6px 20px rgba(0,0,0,0.04)",
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    display:
                      "inline-block",
                    marginBottom: "16px",
                    padding:
                      "6px 10px",
                    borderRadius: "999px",
                    background:
                      selected
                        ? "#e8f6ee"
                        : "#f2f5f3",
                    color:
                      selected
                        ? "#0b6b3a"
                        : "#65716b",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  {selected
                    ? "SELECTED"
                    : "PLAN"}
                </span>

                <h2
                  style={{
                    margin:
                      "0 0 10px",
                    color: "#17231d",
                  }}
                >
                  {plan.name}
                </h2>

                <p
                  style={{
                    minHeight:
                      "48px",
                    margin:
                      "0 0 20px",
                    color: "#69756f",
                    lineHeight: 1.5,
                  }}
                >
                  {plan.description}
                </p>

                <ul
                  style={{
                    margin: 0,
                    paddingLeft:
                      "20px",
                    color: "#46534c",
                    lineHeight: 1.9,
                  }}
                >
                  {plan.features.map(
                    (feature) => (
                      <li
                        key={
                          feature
                        }
                      >
                        {feature}
                      </li>
                    ),
                  )}
                </ul>
              </button>
            );
          })}
        </section>

        {error && (
          <p
            role="alert"
            style={{
              margin:
                "24px 0 0",
              padding: "14px",
              borderRadius: "10px",
              background: "#fff0f0",
              color: "#a32929",
            }}
          >
            {error}
          </p>
        )}

        <section
          style={{
            marginTop: "28px",
            padding: "24px",
            background: "#ffffff",
            borderRadius: "18px",
            border:
              "1px solid #dbe3de",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              gap: "20px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <strong
                style={{
                  display:
                    "block",
                  color: "#17231d",
                  fontSize: "18px",
                  marginBottom:
                    "6px",
                }}
              >
                Selected plan:{" "}
                {selectedPlan}
              </strong>

              <span
                style={{
                  color: "#69756f",
                }}
              >
                Development activation
                only — payment integration
                will be connected later.
              </span>
            </div>

            <button
              type="button"
              onClick={
                activateSubscription
              }
              disabled={activating}
              style={{
                border: 0,
                borderRadius: "12px",
                padding:
                  "15px 24px",
                background:
                  activating
                    ? "#8aa99a"
                    : "#0b6b3a",
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: 700,
                cursor:
                  activating
                    ? "default"
                    : "pointer",
              }}
            >
              {activating
                ? "Activating..."
                : `Activate ${selectedPlan}`}
            </button>
          </div>
        </section>

        <button
          type="button"
          onClick={signOut}
          style={{
            display: "block",
            margin:
              "24px auto 0",
            border: 0,
            background:
              "transparent",
            color: "#69756f",
            cursor: "pointer",
          }}
        >
          Sign out
        </button>
      </div>
    </main>
  );
}
