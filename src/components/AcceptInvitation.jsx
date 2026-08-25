import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { apiFetch } from "../utils/api.js";

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setIsSaving(true);

    try {
      await apiFetch("/api/v1/user_invitations/accept", {
        method: "POST",
        auth: false,
        body: JSON.stringify({
          token,
          user: {
            first_name: firstName,
            last_name: lastName,
            email,
            password,
            password_confirmation: passwordConfirmation,
          },
        }),
      });

      navigate("/");
    } catch (requestError) {
      setError(requestError.validationErrors?.[0]?.message || requestError.message);
    } finally {
      setIsSaving(false);
    }
  }

  if (!token) {
    return (
      <main>
        <h1>Invalid Invitation</h1>
        <p>This invitation link is missing its token.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Accept Invitation</h1>

      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="first_name">First Name</label>
          <input id="first_name" value={firstName} onChange={(event) => setFirstName(event.target.value)} />
        </div>

        <div>
          <label htmlFor="last_name">Last Name</label>
          <input id="last_name" value={lastName} onChange={(event) => setLastName(event.target.value)} />
        </div>

        <div>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </div>

        <div>
          <label htmlFor="password_confirmation">Confirm Password</label>
          <input
            id="password_confirmation"
            type="password"
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
          />
        </div>

        <button type="submit">{isSaving ? "Creating Account..." : "Create Account"}</button>
      </form>
    </main>
  );
}
