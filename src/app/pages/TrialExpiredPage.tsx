import { getTrialLock } from "../auth/trialLock";
import { clearAuthSession } from "../auth/authSession";

export default function TrialExpiredPage() {
  const lock = getTrialLock();

  function goToSubscription() {
    window.history.pushState(
      {},
      "",
      "/subscription",
    );

    window.dispatchEvent(
      new PopStateEvent("popstate"),
    );
  }

  function signOut() {
    clearAuthSession();

    window.history.replaceState(
      {},
      "",
      "/login",
    );

    window.dispatchEvent(
      new PopStateEvent("popstate"),
    );
  }

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
          maxWidth: "680px",
          background: "#ffffff",
          borderRadius: "24px",
          padding: "48px 32px",
          boxShadow:
            "0 20px 60px rgba(0,0,0,0.10)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "76px",
            height: "76px",
            margin: "0 auto 24px",
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            background: "#fff3cd",
            color: "#856404",
            fontSize: "34px",
            fontWeight: 700,
          }}
          aria-hidden="true"
        >
          🔒
        </div>

        <p
          style={{
            margin: "0 0 10px",
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "2px",
            color: "#0b6b3a",
          }}
        >
          SUBSCRIPTION REQUIRED
        </p>

        <h1
          style={{
            margin: "0 0 16px",
            fontSize: "34px",
            lineHeight: 1.2,
            color: "#17231d",
          }}
        >
          Your free trial has expired
        </h1>

        <p
          style={{
            margin: "0 auto 28px",
            maxWidth: "540px",
            color: "#5d6963",
            fontSize: "16px",
            lineHeight: 1.7,
          }}
        >
          Your school's 7-day free trial
          has ended. School operations are
          temporarily locked until a
          subscription is activated.
        </p>

        {lock?.trialEndsAt && (
          <div
            style={{
              padding: "18px",
              marginBottom: "28px",
              borderRadius: "14px",
              background: "#f6f8f7",
              border:
                "1px solid #e1e8e4",
            }}
          >
            <span
              style={{
                display: "block",
                marginBottom: "6px",
                color: "#69756f",
                fontSize: "13px",
              }}
            >
              Trial ended
            </span>

            <strong
              style={{
                color: "#17231d",
                fontSize: "16px",
              }}
            >
              {new Date(
                lock.trialEndsAt,
              ).toLocaleString()}
            </strong>
          </div>
        )}

        <div
          style={{
            display: "grid",
            gap: "12px",
          }}
        >
          <button
            type="button"
            onClick={goToSubscription}
            style={{
              width: "100%",
              border: 0,
              borderRadius: "12px",
              padding: "15px 20px",
              background: "#0b6b3a",
              color: "#ffffff",
              fontSize: "16px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Activate Subscription
          </button>

          <button
            type="button"
            onClick={signOut}
            style={{
              width: "100%",
              border:
                "1px solid #d5ddd8",
              borderRadius: "12px",
              padding: "14px 20px",
              background: "#ffffff",
              color: "#26342d",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Sign Out
          </button>
        </div>

        <p
          style={{
            margin:
              "28px 0 0",
            color: "#7a857f",
            fontSize: "13px",
            lineHeight: 1.6,
          }}
        >
          Need help activating your
          subscription? Contact the
          platform support team.
        </p>
      </section>
    </main>
  );
}
