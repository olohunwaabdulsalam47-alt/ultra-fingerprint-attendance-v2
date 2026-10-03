import { useMemo, useState } from "react";
import "./SuperAdminSubscriptionsPage.css";

type BillingCycle = "MONTHLY" | "YEARLY";
type SubscriptionStatus =
  | "TRIAL"
  | "ACTIVE"
  | "PAST_DUE"
  | "EXPIRED"
  | "CANCELLED";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxStudents: number | null;
  maxStaff: number | null;
  status: "ACTIVE" | "INACTIVE";
}

interface SchoolApplication {
  applicationId: string;
  schoolName: string;
  status: string;
  plan?: string;
  schoolStatus?: string;
  submittedAt: string;
}

interface SchoolSubscription {
  applicationId: string;
  schoolName: string;
  planId: string;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  startDate: string;
  renewalDate: string;
  paymentStatus: "PAID" | "PENDING" | "OVERDUE";
}

const PLANS_KEY = "ultra-subscription-plans";
const SUBSCRIPTIONS_KEY =
  "ultra-school-subscriptions";
const APPLICATIONS_KEY =
  "ultra-school-applications";

const DEFAULT_PLANS: SubscriptionPlan[] = [
  {
    id: "BASIC",
    name: "Basic",
    description: "Essential attendance management.",
    monthlyPrice: 15000,
    yearlyPrice: 150000,
    maxStudents: 300,
    maxStaff: 30,
    status: "ACTIVE",
  },
  {
    id: "STANDARD",
    name: "Standard",
    description:
      "Attendance, reporting and school management.",
    monthlyPrice: 30000,
    yearlyPrice: 300000,
    maxStudents: 1000,
    maxStaff: 100,
    status: "ACTIVE",
  },
  {
    id: "PREMIUM",
    name: "Premium",
    description:
      "Advanced attendance and biometric capabilities.",
    monthlyPrice: 60000,
    yearlyPrice: 600000,
    maxStudents: 3000,
    maxStaff: 300,
    status: "ACTIVE",
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    description:
      "Large-school and multi-campus platform access.",
    monthlyPrice: 100000,
    yearlyPrice: 1000000,
    maxStudents: null,
    maxStaff: null,
    status: "ACTIVE",
  },
];

function readPlans(): SubscriptionPlan[] {
  try {
    const stored = localStorage.getItem(PLANS_KEY);

    if (stored) {
      return JSON.parse(stored);
    }

    localStorage.setItem(
      PLANS_KEY,
      JSON.stringify(DEFAULT_PLANS),
    );

    return DEFAULT_PLANS;
  } catch {
    return DEFAULT_PLANS;
  }
}

function readSubscriptions(): SchoolSubscription[] {
  try {
    return JSON.parse(
      localStorage.getItem(SUBSCRIPTIONS_KEY) ??
        "[]",
    );
  } catch {
    return [];
  }
}

function readApprovedSchools(): SchoolApplication[] {
  try {
    const applications: SchoolApplication[] =
      JSON.parse(
        localStorage.getItem(APPLICATIONS_KEY) ??
          "[]",
      );

    return applications.filter(
      (application) =>
        application.status === "APPROVED",
    );
  } catch {
    return [];
  }
}

function saveSubscriptions(
  subscriptions: SchoolSubscription[],
) {
  localStorage.setItem(
    SUBSCRIPTIONS_KEY,
    JSON.stringify(subscriptions),
  );
}

function money(value: number) {
  return `₦${value.toLocaleString("en-NG")}`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function SuperAdminSubscriptionsPage() {
  const [plans, setPlans] =
    useState<SubscriptionPlan[]>(readPlans);

  const [subscriptions, setSubscriptions] =
    useState<SchoolSubscription[]>(
      readSubscriptions,
    );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("ALL");
  const [cycleFilter, setCycleFilter] =
    useState("ALL");

  const [showPlans, setShowPlans] = useState(false);
  const [selectedSubscription, setSelectedSubscription] =
    useState<SchoolSubscription | null>(null);

  const approvedSchools = readApprovedSchools();

  function ensureSubscription(
    school: SchoolApplication,
  ): SchoolSubscription {
    const existing = subscriptions.find(
      (item) =>
        item.applicationId === school.applicationId,
    );

    if (existing) {
      return existing;
    }

    const now = new Date();
    const renewal = new Date(now);

    renewal.setMonth(renewal.getMonth() + 1);

    const subscription: SchoolSubscription = {
      applicationId: school.applicationId,
      schoolName: school.schoolName,
      planId: school.plan
        ? school.plan.toUpperCase()
        : "BASIC",
      billingCycle: "MONTHLY",
      status: "TRIAL",
      startDate: now.toISOString(),
      renewalDate: renewal.toISOString(),
      paymentStatus: "PENDING",
    };

    const next = [...subscriptions, subscription];

    setSubscriptions(next);
    saveSubscriptions(next);

    return subscription;
  }

  function openSubscription(
    school: SchoolApplication,
  ) {
    const subscription = ensureSubscription(school);
    setSelectedSubscription(subscription);
  }

  function updateSubscription(
    updates: Partial<SchoolSubscription>,
  ) {
    if (!selectedSubscription) {
      return;
    }

    const updated = {
      ...selectedSubscription,
      ...updates,
    };

    const next = subscriptions.map((item) =>
      item.applicationId ===
      selectedSubscription.applicationId
        ? updated
        : item,
    );

    setSubscriptions(next);
    saveSubscriptions(next);
    setSelectedSubscription(updated);
  }

  function updatePlanStatus(
    planId: string,
    status: "ACTIVE" | "INACTIVE",
  ) {
    const next = plans.map((plan) =>
      plan.id === planId
        ? { ...plan, status }
        : plan,
    );

    setPlans(next);
    localStorage.setItem(
      PLANS_KEY,
      JSON.stringify(next),
    );
  }

  function goTo(path: string) {
    window.history.pushState({}, "", path);
    window.dispatchEvent(
      new PopStateEvent("popstate"),
    );
  }

  const rows = useMemo(() => {
    const allSchools = approvedSchools.map(
      (school) => {
        const subscription =
          subscriptions.find(
            (item) =>
              item.applicationId ===
              school.applicationId,
          );

        return {
          school,
          subscription,
        };
      },
    );

    const query = search.trim().toLowerCase();

    return allSchools.filter(
      ({ school, subscription }) => {
        const matchesSearch =
          !query ||
          school.schoolName
            .toLowerCase()
            .includes(query) ||
          school.applicationId
            .toLowerCase()
            .includes(query);

        const matchesStatus =
          statusFilter === "ALL" ||
          subscription?.status === statusFilter;

        const matchesCycle =
          cycleFilter === "ALL" ||
          subscription?.billingCycle === cycleFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesCycle
        );
      },
    );
  }, [
    approvedSchools,
    subscriptions,
    search,
    statusFilter,
    cycleFilter,
  ]);

  const activeSubscriptions =
    subscriptions.filter(
      (item) => item.status === "ACTIVE",
    ).length;

  const trialSubscriptions =
    subscriptions.filter(
      (item) => item.status === "TRIAL",
    ).length;

  const pastDueSubscriptions =
    subscriptions.filter(
      (item) =>
        item.status === "PAST_DUE" ||
        item.paymentStatus === "OVERDUE",
    ).length;

  const expiredSubscriptions =
    subscriptions.filter(
      (item) => item.status === "EXPIRED",
    ).length;

  return (
    <main className="superadmin-subscriptions-page">
      <section className="subscription-header">
        <div>
          <p className="subscription-kicker">
            SUPERADMIN · BILLING
          </p>

          <h1>Subscriptions & Plans</h1>

          <p>
            Manage platform plans and school
            subscription lifecycles.
          </p>
        </div>

        <div className="subscription-header-actions">
          <button
            type="button"
            onClick={() => setShowPlans(true)}
          >
            Manage Plans
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={() => goTo("/superadmin-schools")}
          >
            Schools
          </button>
        </div>
      </section>

      <section className="subscription-stats">
        <article>
          <span>Active</span>
          <strong>{activeSubscriptions}</strong>
        </article>

        <article>
          <span>Trial</span>
          <strong>{trialSubscriptions}</strong>
        </article>

        <article>
          <span>Past Due</span>
          <strong>{pastDueSubscriptions}</strong>
        </article>

        <article>
          <span>Expired</span>
          <strong>{expiredSubscriptions}</strong>
        </article>

        <article>
          <span>Plans</span>
          <strong>{plans.length}</strong>
        </article>
      </section>

      <section className="subscription-toolbar">
        <div>
          <label htmlFor="subscription-search">
            Search
          </label>

          <input
            id="subscription-search"
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search school or application..."
          />
        </div>

        <div>
          <label htmlFor="subscription-status">
            Status
          </label>

          <select
            id="subscription-status"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            <option value="ALL">All statuses</option>
            <option value="TRIAL">Trial</option>
            <option value="ACTIVE">Active</option>
            <option value="PAST_DUE">Past Due</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">
              Cancelled
            </option>
          </select>
        </div>

        <div>
          <label htmlFor="subscription-cycle">
            Billing Cycle
          </label>

          <select
            id="subscription-cycle"
            value={cycleFilter}
            onChange={(event) =>
              setCycleFilter(event.target.value)
            }
          >
            <option value="ALL">All cycles</option>
            <option value="MONTHLY">Monthly</option>
            <option value="YEARLY">Yearly</option>
          </select>
        </div>
      </section>

      <section className="subscription-table-card">
        {rows.length === 0 ? (
          <div className="subscription-empty">
            <div>💳</div>
            <h2>No subscription records</h2>
            <p>
              Approved schools will appear here when
              their subscription is opened.
            </p>
          </div>
        ) : (
          <div className="subscription-table-wrap">
            <table className="subscription-table">
              <thead>
                <tr>
                  <th>School</th>
                  <th>Plan</th>
                  <th>Cycle</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Renewal</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {rows.map(
                  ({ school, subscription }) => (
                    <tr key={school.applicationId}>
                      <td>
                        <strong>
                          {school.schoolName}
                        </strong>
                        <span>
                          {school.applicationId}
                        </span>
                      </td>

                      <td>
                        {subscription
                          ? plans.find(
                              (plan) =>
                                plan.id ===
                                subscription.planId,
                            )?.name ??
                            subscription.planId
                          : "Not configured"}
                      </td>

                      <td>
                        {subscription?.billingCycle ??
                          "—"}
                      </td>

                      <td>
                        {subscription ? (
                          <span
                            className={`subscription-badge subscription-${subscription.status.toLowerCase()}`}
                          >
                            {subscription.status.replaceAll(
                              "_",
                              " ",
                            )}
                          </span>
                        ) : (
                          <span className="subscription-badge subscription-unconfigured">
                            NOT CONFIGURED
                          </span>
                        )}
                      </td>

                      <td>
                        {subscription?.paymentStatus ??
                          "—"}
                      </td>

                      <td>
                        {subscription
                          ? formatDate(
                              subscription.renewalDate,
                            )
                          : "—"}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="subscription-manage-button"
                          onClick={() =>
                            openSubscription(school)
                          }
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showPlans && (
        <div
          className="subscription-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              setShowPlans(false);
            }
          }}
        >
          <section className="subscription-modal">
            <header>
              <div>
                <p className="subscription-kicker">
                  PLATFORM CONFIGURATION
                </p>
                <h2>Subscription Plans</h2>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() => setShowPlans(false)}
              >
                ×
              </button>
            </header>

            <div className="plan-list">
              {plans.map((plan) => (
                <article
                  className="plan-card"
                  key={plan.id}
                >
                  <div>
                    <span className="plan-id">
                      {plan.id}
                    </span>

                    <h3>{plan.name}</h3>

                    <p>{plan.description}</p>
                  </div>

                  <div className="plan-prices">
                    <strong>
                      {money(plan.monthlyPrice)}
                    </strong>

                    <span>/ month</span>

                    <strong>
                      {money(plan.yearlyPrice)}
                    </strong>

                    <span>/ year</span>
                  </div>

                  <div className="plan-limits">
                    <span>
                      Students:{" "}
                      {plan.maxStudents ??
                        "Unlimited"}
                    </span>

                    <span>
                      Staff:{" "}
                      {plan.maxStaff ??
                        "Unlimited"}
                    </span>
                  </div>

                  <button
                    type="button"
                    className={
                      plan.status === "ACTIVE"
                        ? "plan-deactivate"
                        : "plan-activate"
                    }
                    onClick={() =>
                      updatePlanStatus(
                        plan.id,
                        plan.status === "ACTIVE"
                          ? "INACTIVE"
                          : "ACTIVE",
                      )
                    }
                  >
                    {plan.status === "ACTIVE"
                      ? "Deactivate Plan"
                      : "Activate Plan"}
                  </button>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}

      {selectedSubscription && (
        <div
          className="subscription-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              setSelectedSubscription(null);
            }
          }}
        >
          <section className="subscription-modal">
            <header>
              <div>
                <p className="subscription-kicker">
                  SUBSCRIPTION MANAGEMENT
                </p>

                <h2>
                  {selectedSubscription.schoolName}
                </h2>

                <span>
                  {selectedSubscription.applicationId}
                </span>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setSelectedSubscription(null)
                }
              >
                ×
              </button>
            </header>

            <div className="subscription-form">
              <div>
                <label htmlFor="subscription-plan">
                  Plan
                </label>

                <select
                  id="subscription-plan"
                  value={selectedSubscription.planId}
                  onChange={(event) =>
                    updateSubscription({
                      planId: event.target.value,
                    })
                  }
                >
                  {plans
                    .filter(
                      (plan) =>
                        plan.status === "ACTIVE",
                    )
                    .map((plan) => (
                      <option
                        key={plan.id}
                        value={plan.id}
                      >
                        {plan.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label htmlFor="subscription-billing">
                  Billing Cycle
                </label>

                <select
                  id="subscription-billing"
                  value={
                    selectedSubscription.billingCycle
                  }
                  onChange={(event) =>
                    updateSubscription({
                      billingCycle:
                        event.target
                          .value as BillingCycle,
                    })
                  }
                >
                  <option value="MONTHLY">
                    Monthly
                  </option>
                  <option value="YEARLY">
                    Yearly
                  </option>
                </select>
              </div>

              <div>
                <label htmlFor="subscription-state">
                  Subscription Status
                </label>

                <select
                  id="subscription-state"
                  value={selectedSubscription.status}
                  onChange={(event) =>
                    updateSubscription({
                      status:
                        event.target
                          .value as SubscriptionStatus,
                    })
                  }
                >
                  <option value="TRIAL">
                    Trial
                  </option>
                  <option value="ACTIVE">
                    Active
                  </option>
                  <option value="PAST_DUE">
                    Past Due
                  </option>
                  <option value="EXPIRED">
                    Expired
                  </option>
                  <option value="CANCELLED">
                    Cancelled
                  </option>
                </select>
              </div>

              <div>
                <label htmlFor="subscription-payment">
                  Payment Status
                </label>

                <select
                  id="subscription-payment"
                  value={
                    selectedSubscription.paymentStatus
                  }
                  onChange={(event) =>
                    updateSubscription({
                      paymentStatus:
                        event.target
                          .value as SchoolSubscription["paymentStatus"],
                    })
                  }
                >
                  <option value="PAID">Paid</option>
                  <option value="PENDING">
                    Pending
                  </option>
                  <option value="OVERDUE">
                    Overdue
                  </option>
                </select>
              </div>

              <div>
                <label htmlFor="subscription-start">
                  Start Date
                </label>

                <input
                  id="subscription-start"
                  type="date"
                  value={
                    selectedSubscription.startDate.slice(
                      0,
                      10,
                    )
                  }
                  onChange={(event) =>
                    updateSubscription({
                      startDate: new Date(
                        `${event.target.value}T00:00:00`,
                      ).toISOString(),
                    })
                  }
                />
              </div>

              <div>
                <label htmlFor="subscription-renewal">
                  Renewal Date
                </label>

                <input
                  id="subscription-renewal"
                  type="date"
                  value={
                    selectedSubscription.renewalDate.slice(
                      0,
                      10,
                    )
                  }
                  onChange={(event) =>
                    updateSubscription({
                      renewalDate: new Date(
                        `${event.target.value}T00:00:00`,
                      ).toISOString(),
                    })
                  }
                />
              </div>
            </div>

            <div className="subscription-summary">
              <span>Current Plan</span>

              <strong>
                {plans.find(
                  (plan) =>
                    plan.id ===
                    selectedSubscription.planId,
                )?.name ??
                  selectedSubscription.planId}
              </strong>

              <span>Renewal</span>

              <strong>
                {formatDate(
                  selectedSubscription.renewalDate,
                )}
              </strong>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
