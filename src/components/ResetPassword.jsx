import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiFetch } from "../utils/api.js";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (password !== passwordConfirmation) {
      setError("Passwords do not match.");
      return;
    }

    if (!token) {
      setError("This password reset link is invalid.");
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await apiFetch("/api/v1/password_resets/confirm", {
        method: "POST",
        auth: false,
        body: JSON.stringify({
          token,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });

      setMessage(data.message);
      setPassword("");
      setPasswordConfirmation("");
    } catch (error) {
      setError(error.message || "Unable to reset password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main>
      <h2>Reset Password</h2>

      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}

      {!token ? (
        <p>This password reset link is missing a token. Please request a new link.</p>
      ) : message ? null : (
        <form onSubmit={handleSubmit}>
          <label htmlFor="password">New Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            required
          />

          <label htmlFor="passwordConfirmation">Confirm New Password</label>
          <input
            id="passwordConfirmation"
            type="password"
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            autoComplete="new-password"
            required
          />

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      )}

      <p>
        <Link to="/">Back to Log In</Link>
      </p>
    </main>
  );
}
