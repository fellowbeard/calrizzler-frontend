import { useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../utils/api.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const data = await apiFetch("/api/v1/password_resets", {
        method: "POST",
        auth: false,
        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      setMessage(data.message);
    } catch (error) {
      setError(error.message || "Unable to request password reset.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main>
      <h2>Forgot Password</h2>

      <p>Enter your email address and we'll send you instructions to reset your password.</p>

      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}

      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>

        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      <p>
        <Link to="/">Back to Log In</Link>
      </p>
    </main>
  );
}
