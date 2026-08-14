import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import PulseMark from "../components/PulseMark";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-brand-panel">
        <div className="auth-brand-content">
          <PulseMark width={64} height={26} stroke="#E96A4C" animated />
          <h1 className="auth-brand-name" style={{ marginTop: 20 }}>Vela</h1>
          <p className="auth-brand-quote" style={{ marginTop: 12 }}>
            One steady record for every patient, appointment, and prescription
            &mdash; built for front desks and care teams who don&apos;t have
            time to double-check three different systems.
          </p>
        </div>
        <p style={{ color: "#9FC3BB", fontSize: "0.8125rem", position: "relative", zIndex: 1 }}>
          &copy; {new Date().getFullYear()} Vela Clinic OS
        </p>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-card">
          <h2>Welcome back</h2>
          <p className="text-muted" style={{ marginTop: 8, marginBottom: 28 }}>
            Sign in to continue to your clinic workspace.
          </p>

          {error && <div className="form-error-banner">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-muted" style={{ marginTop: 24, fontSize: "0.8125rem" }}>
            New to Vela? <Link to="/register">Create a staff account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
