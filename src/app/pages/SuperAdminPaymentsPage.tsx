import { useMemo, useState } from "react";
import "./SuperAdminPaymentsPage.css";

type PaymentStatus =
  | "PAID"
  | "PENDING"
  | "FAILED"
  | "REFUNDED";

type PaymentMethod =
  | "OPAY"
  | "BANK_TRANSFER"
  | "CARD"
  | "OTHER";

interface PaymentRecord {
  paymentId: string;
  applicationId: string;
  schoolName: string;
  subscriptionPlan: string;
  amount: number;
  currency: "NGN";
  method: PaymentMethod;
  status: PaymentStatus;
  reference: string;
  paymentDate: string;
  description: string;
}

const PAYMENTS_KEY =
  "ultra-platform-payments";

const DEMO_PAYMENTS: PaymentRecord[] = [];

function readPayments(): PaymentRecord[] {
  try {
    return JSON.parse(
      localStorage.getItem(PAYMENTS_KEY) ?? "[]",
    );
  } catch {
    return DEMO_PAYMENTS;
  }
}

function savePayments(payments: PaymentRecord[]) {
  localStorage.setItem(
    PAYMENTS_KEY,
    JSON.stringify(payments),
  );
}

function formatMoney(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
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

export default function SuperAdminPaymentsPage() {
  const [payments, setPayments] =
    useState<PaymentRecord[]>(readPayments);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("ALL");
  const [methodFilter, setMethodFilter] =
    useState("ALL");

  const [selectedPayment, setSelectedPayment] =
    useState<PaymentRecord | null>(null);

  function goTo(path: string) {
    window.history.pushState({}, "", path);

    window.dispatchEvent(
      new PopStateEvent("popstate"),
    );
  }

  function updatePayment(
    paymentId: string,
    updates: Partial<PaymentRecord>,
  ) {
    const next = payments.map((payment) =>
      payment.paymentId === paymentId
        ? { ...payment, ...updates }
        : payment,
    );

    setPayments(next);
    savePayments(next);

    const updated = next.find(
      (payment) =>
        payment.paymentId === paymentId,
    );

    if (updated) {
      setSelectedPayment(updated);
    }
  }

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const matchesSearch =
        !query ||
        payment.schoolName
          .toLowerCase()
          .includes(query) ||
        payment.paymentId
          .toLowerCase()
          .includes(query) ||
        payment.applicationId
          .toLowerCase()
          .includes(query) ||
        payment.reference
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        payment.status === statusFilter;

      const matchesMethod =
        methodFilter === "ALL" ||
        payment.method === methodFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesMethod
      );
    });
  }, [
    payments,
    search,
    statusFilter,
    methodFilter,
  ]);

  const paidRevenue = payments
    .filter((payment) => payment.status === "PAID")
    .reduce(
      (total, payment) =>
        total + payment.amount,
      0,
    );

  const pendingAmount = payments
    .filter(
      (payment) => payment.status === "PENDING",
    )
    .reduce(
      (total, payment) =>
        total + payment.amount,
      0,
    );

  const failedAmount = payments
    .filter(
      (payment) => payment.status === "FAILED",
    )
    .reduce(
      (total, payment) =>
        total + payment.amount,
      0,
    );

  const refundedAmount = payments
    .filter(
      (payment) => payment.status === "REFUNDED",
    )
    .reduce(
      (total, payment) =>
        total + payment.amount,
      0,
    );

  const paidCount = payments.filter(
    (payment) => payment.status === "PAID",
  ).length;

  const pendingCount = payments.filter(
    (payment) => payment.status === "PENDING",
  ).length;

  const failedCount = payments.filter(
    (payment) => payment.status === "FAILED",
  ).length;

  const refundedCount = payments.filter(
    (payment) => payment.status === "REFUNDED",
  ).length;

  return (
    <main className="superadmin-payments-page">
      <section className="payments-header">
        <div>
          <p className="payments-kicker">
            SUPERADMIN · FINANCE
          </p>

          <h1>Payments & Revenue</h1>

          <p>
            Monitor platform payments, revenue and
            payment lifecycle status.
          </p>
        </div>

        <div className="payments-header-actions">
          <button
            type="button"
            onClick={() =>
              goTo("/superadmin-subscriptions")
            }
          >
            Subscriptions
          </button>

          <button
            type="button"
            className="payments-secondary-button"
            onClick={() =>
              goTo("/superadmin-schools")
            }
          >
            Schools
          </button>
        </div>
      </section>

      <section className="payments-stats">
        <article>
          <span>Collected Revenue</span>
          <strong>{formatMoney(paidRevenue)}</strong>
          <small>{paidCount} paid payments</small>
        </article>

        <article>
          <span>Pending</span>
          <strong>{formatMoney(pendingAmount)}</strong>
          <small>{pendingCount} pending payments</small>
        </article>

        <article>
          <span>Failed</span>
          <strong>{formatMoney(failedAmount)}</strong>
          <small>{failedCount} failed payments</small>
        </article>

        <article>
          <span>Refunded</span>
          <strong>
            {formatMoney(refundedAmount)}
          </strong>
          <small>
            {refundedCount} refunded payments
          </small>
        </article>
      </section>

      <section className="payments-toolbar">
        <div>
          <label htmlFor="payment-search">
            Search Payments
          </label>

          <input
            id="payment-search"
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="School, payment ID, reference..."
          />
        </div>

        <div>
          <label htmlFor="payment-status">
            Status
          </label>

          <select
            id="payment-status"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            <option value="ALL">All statuses</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">
              Refunded
            </option>
          </select>
        </div>

        <div>
          <label htmlFor="payment-method">
            Payment Method
          </label>

          <select
            id="payment-method"
            value={methodFilter}
            onChange={(event) =>
              setMethodFilter(event.target.value)
            }
          >
            <option value="ALL">All methods</option>
            <option value="OPAY">OPay</option>
            <option value="BANK_TRANSFER">
              Bank Transfer
            </option>
            <option value="CARD">Card</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </section>

      <section className="payments-table-card">
        {filteredPayments.length === 0 ? (
          <div className="payments-empty">
            <div className="payments-empty-icon">
              ₦
            </div>

            <h2>No payment records</h2>

            <p>
              Platform payment transactions will
              appear here.
            </p>
          </div>
        ) : (
          <div className="payments-table-wrap">
            <table className="payments-table">
              <thead>
                <tr>
                  <th>School</th>
                  <th>Payment ID</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredPayments.map(
                  (payment) => (
                    <tr key={payment.paymentId}>
                      <td>
                        <strong>
                          {payment.schoolName}
                        </strong>

                        <span>
                          {payment.subscriptionPlan}
                        </span>
                      </td>

                      <td>
                        {payment.paymentId}
                      </td>

                      <td>
                        <strong>
                          {formatMoney(
                            payment.amount,
                          )}
                        </strong>
                      </td>

                      <td>
                        {payment.method.replaceAll(
                          "_",
                          " ",
                        )}
                      </td>

                      <td>
                        <span
                          className={`payment-status payment-status-${payment.status.toLowerCase()}`}
                        >
                          {payment.status}
                        </span>
                      </td>

                      <td>
                        {formatDate(
                          payment.paymentDate,
                        )}
                      </td>

                      <td>
                        {payment.reference}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="payment-view-button"
                          onClick={() =>
                            setSelectedPayment(
                              payment,
                            )
                          }
                        >
                          View
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

      {selectedPayment && (
        <div
          className="payment-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              setSelectedPayment(null);
            }
          }}
        >
          <section className="payment-modal">
            <header>
              <div>
                <p className="payments-kicker">
                  PAYMENT DETAILS
                </p>

                <h2>
                  {selectedPayment.schoolName}
                </h2>

                <span>
                  {selectedPayment.paymentId}
                </span>
              </div>

              <button
                type="button"
                className="payment-modal-close"
                onClick={() =>
                  setSelectedPayment(null)
                }
              >
                ×
              </button>
            </header>

            <div className="payment-details">
              <div>
                <span>Amount</span>
                <strong>
                  {formatMoney(
                    selectedPayment.amount,
                  )}
                </strong>
              </div>

              <div>
                <span>Currency</span>
                <strong>
                  {selectedPayment.currency}
                </strong>
              </div>

              <div>
                <span>Payment Method</span>
                <strong>
                  {selectedPayment.method.replaceAll(
                    "_",
                    " ",
                  )}
                </strong>
              </div>

              <div>
                <span>Status</span>

                <select
                  value={selectedPayment.status}
                  onChange={(event) =>
                    updatePayment(
                      selectedPayment.paymentId,
                      {
                        status:
                          event.target
                            .value as PaymentStatus,
                      },
                    )
                  }
                >
                  <option value="PAID">Paid</option>
                  <option value="PENDING">
                    Pending
                  </option>
                  <option value="FAILED">
                    Failed
                  </option>
                  <option value="REFUNDED">
                    Refunded
                  </option>
                </select>
              </div>

              <div>
                <span>Reference</span>
                <strong>
                  {selectedPayment.reference}
                </strong>
              </div>

              <div>
                <span>Payment Date</span>
                <strong>
                  {formatDate(
                    selectedPayment.paymentDate,
                  )}
                </strong>
              </div>

              <div>
                <span>Subscription Plan</span>
                <strong>
                  {selectedPayment.subscriptionPlan}
                </strong>
              </div>

              <div>
                <span>Application ID</span>
                <strong>
                  {selectedPayment.applicationId}
                </strong>
              </div>
            </div>

            <div className="payment-description">
              <span>Description</span>
              <p>
                {selectedPayment.description ||
                  "No description provided."}
              </p>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
