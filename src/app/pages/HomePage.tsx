import "./HomePage.css";

export default function HomePage() {
  function goTo(path: string) {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  return (
    <main className="home-page">
      <header className="home-header">
        <div className="home-brand">
          <div className="home-logo" aria-hidden="true">
            FP
          </div>

          <div>
            <strong>ULTRA FINGERPRINT</strong>
            <span>ATTENDANCE</span>
          </div>
        </div>

        <nav className="home-nav" aria-label="Main navigation">
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#security">Security</a>

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
          <p className="home-kicker">
            SMART SCHOOL ATTENDANCE MANAGEMENT
          </p>

          <h1>
            Modern attendance management
            <span>built for schools.</span>
          </h1>

          <p className="home-description">
            Manage school attendance, students, classes,
            reports and biometric attendance from one secure
            platform.
          </p>

          <div className="home-actions">
            <button
              type="button"
              className="home-primary-button"
              onClick={() => goTo("/register-school")}
            >
              Register Your School
            </button>

            <button
              type="button"
              className="home-secondary-button"
              onClick={() => goTo("/login")}
            >
              School Login
            </button>
          </div>
        </div>

        <div className="home-hero-card">
          <div className="hero-card-top">
            <span>Attendance Overview</span>
            <span className="hero-status">Secure</span>
          </div>

          <div className="hero-stat">
            <strong>School Dashboard</strong>
            <span>Attendance management in one place</span>
          </div>

          <div className="hero-progress">
            <span />
          </div>

          <div className="hero-mini-grid">
            <div>
              <strong>Students</strong>
              <span>Managed securely</span>
            </div>

            <div>
              <strong>Reports</strong>
              <span>Ready when needed</span>
            </div>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="home-section"
      >
        <div className="section-heading">
          <p>PLATFORM FEATURES</p>
          <h2>Everything schools need for attendance.</h2>
        </div>

        <div className="feature-grid">
          <article className="feature-card">
            <span>01</span>
            <h3>Attendance Management</h3>
            <p>
              Record and manage daily attendance across
              school classes.
            </p>
          </article>

          <article className="feature-card">
            <span>02</span>
            <h3>Biometric Support</h3>
            <p>
              Support secure biometric attendance workflows
              for schools.
            </p>
          </article>

          <article className="feature-card">
            <span>03</span>
            <h3>Reports</h3>
            <p>
              Access attendance information and reports
              through the school platform.
            </p>
          </article>

          <article className="feature-card">
            <span>04</span>
            <h3>School Management</h3>
            <p>
              Organize students, classes and authorized
              school users in one system.
            </p>
          </article>
        </div>
      </section>

      <section
        id="how-it-works"
        className="home-section home-section-alt"
      >
        <div className="section-heading">
          <p>HOW IT WORKS</p>
          <h2>From registration to attendance management.</h2>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <strong>1</strong>
            <h3>Register</h3>
            <p>
              Submit your school's registration application.
            </p>
          </div>

          <div className="step-card">
            <strong>2</strong>
            <h3>Review</h3>
            <p>
              Your application is reviewed by the platform
              administration.
            </p>
          </div>

          <div className="step-card">
            <strong>3</strong>
            <h3>Activate</h3>
            <p>
              Approved schools complete their account setup.
            </p>
          </div>

          <div className="step-card">
            <strong>4</strong>
            <h3>Manage</h3>
            <p>
              Start managing attendance through your school
              environment.
            </p>
          </div>
        </div>
      </section>

      <section
        id="security"
        className="home-security"
      >
        <div>
          <p className="home-kicker">SECURITY</p>
          <h2>
            Built with privacy and data integrity in mind.
          </h2>
        </div>

        <p>
          ULTRA FINGERPRINT ATTENDANCE is designed around
          controlled access, school data separation,
          authentication and auditability.
        </p>
      </section>

      <section className="home-register">
        <p className="home-kicker">FOR SCHOOLS</p>
        <h2>Ready to bring your school online?</h2>
        <p>
          Start your school registration application today.
        </p>

        <button
          type="button"
          className="home-primary-button"
          onClick={() => goTo("/register-school")}
        >
          Register Your School
        </button>
      </section>

      <footer className="home-footer">
        <strong>ULTRA FINGERPRINT ATTENDANCE</strong>
        <span>Secure school attendance management.</span>
      </footer>
    </main>
  );
}
