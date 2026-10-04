import "./HomePage.css";

function goTo(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export default function HomePage() {
  return (
    <main className="home-page">
      <header className="home-header">
        <div className="home-logo">
          <span className="home-logo-mark">UFA</span>
          <div>
            <strong>ULTRA FINGERPRINT</strong>
            <span>ATTENDANCE</span>
          </div>
        </div>

        <nav className="home-nav">
          <button type="button" onClick={() => goTo("/register-school")}>
            Register Your School
          </button>

          <button type="button" onClick={() => goTo("/track-application")}>
            Track Application
          </button>

          <button
            type="button"
            className="home-login-button"
            onClick={() => goTo("/login")}
          >
            School Login
          </button>
        </nav>
      </header>

      <section className="home-hero">
        <div className="home-hero-content">
          <p className="home-eyebrow">SMART • SECURE • RELIABLE</p>

          <h1>
            Modern Attendance
            <br />
            <span>Built for Schools.</span>
          </h1>

          <p className="home-hero-text">
            ULTRA FINGERPRINT ATTENDANCE helps schools manage attendance,
            student records, biometric identity and reporting through one
            secure platform.
          </p>

          <div className="home-actions">
            <button
              type="button"
              className="home-primary-action"
              onClick={() => goTo("/register-school")}
            >
              Register Your School
            </button>

            <button
              type="button"
              className="home-secondary-action"
              onClick={() => goTo("/track-application")}
            >
              Track Application
            </button>

            <button
              type="button"
              className="home-outline-action"
              onClick={() => goTo("/login")}
            >
              School Login
            </button>
          </div>
        </div>

        <div className="home-hero-card">
          <div className="home-card-top">
            <span>UFA</span>
            <span className="home-status">SECURE</span>
          </div>

          <h2>School Attendance</h2>
          <p>One platform for accurate and secure school attendance.</p>

          <div className="home-feature-grid">
            <div>
              <strong>01</strong>
              <span>Attendance</span>
            </div>

            <div>
              <strong>02</strong>
              <span>Biometric</span>
            </div>

            <div>
              <strong>03</strong>
              <span>Reports</span>
            </div>

            <div>
              <strong>04</strong>
              <span>Security</span>
            </div>
          </div>
        </div>
      </section>

      <section className="home-features">
        <div className="home-section-heading">
          <p className="home-eyebrow">PLATFORM FEATURES</p>
          <h2>Everything your school needs.</h2>
        </div>

        <div className="home-feature-cards">
          <article>
            <span>01</span>
            <h3>Accurate Attendance</h3>
            <p>
              Record and manage student attendance with reliable attendance
              workflows.
            </p>
          </article>

          <article>
            <span>02</span>
            <h3>Biometric Security</h3>
            <p>
              Support secure biometric identity and controlled registration.
            </p>
          </article>

          <article>
            <span>03</span>
            <h3>Powerful Reporting</h3>
            <p>
              Keep school attendance and academic information organized and
              accessible.
            </p>
          </article>

          <article>
            <span>04</span>
            <h3>Role-Based Access</h3>
            <p>
              Give administrators and teachers access according to their
              responsibilities.
            </p>
          </article>
        </div>
      </section>

      <section className="home-cta">
        <div>
          <p className="home-eyebrow">GET STARTED</p>
          <h2>Ready to bring your school online?</h2>
          <p>
            Register your school and begin the application process.
          </p>
        </div>

        <div className="home-cta-actions">
          <button
            type="button"
            className="home-primary-action"
            onClick={() => goTo("/register-school")}
          >
            Register Your School
          </button>

          <button
            type="button"
            className="home-secondary-action"
            onClick={() => goTo("/track-application")}
          >
            Track Application
          </button>
        </div>
      </section>

      <footer className="home-footer">
        <strong>ULTRA FINGERPRINT ATTENDANCE</strong>
        <span>Secure School Attendance Platform</span>
      </footer>
    </main>
  );
}
