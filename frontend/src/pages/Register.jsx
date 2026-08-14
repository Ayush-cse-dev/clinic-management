import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import PulseMark from "../components/PulseMark";

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("receptionist");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const result = await register(fullName, email, password, role);
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
            Set up a login for front-desk, clinical, or admin work. Doctor and
            patient profiles with their own portal access are created from
            the Doctors and Patients pages once you&apos;re signed in.
          </p>
        </div>
        <p style={{ color: "#9FC3BB", fontSize: "0.8125rem", position: "relative", zIndex: 1 }}>
          &copy; {new Date().getFullYear()} Vela Clinic OS
        </p>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-card">
          <h2>Create your account</h2>
          <p className="text-muted" style={{ marginTop: 8, marginBottom: 28 }}>
            Get your clinic workspace set up in a minute.
          </p>

          {error && <div className="form-error-banner">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="fullName">Full name</label>
              <input
                id="fullName"
                type="text"
                className="input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
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
                autoComplete="new-password"
                minLength={6}
                required
              />
              <span className="field-hint">At least 6 characters.</span>
            </div>
            <div className="field">
              <label htmlFor="role">Account type</label>
              <select
                id="role"
                className="select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="receptionist">Receptionist / Front desk</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-muted" style={{ marginTop: 24, fontSize: "0.8125rem" }}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
