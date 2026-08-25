import { useState } from "react";

import { apiFetch } from "../utils/api.js";

export default function InviteUser() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("staff");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccessMessage("");
    setIsSending(true);

    try {
      await apiFetch("/api/v1/user_invitations", {
        method: "POST",
        body: JSON.stringify({
          invitation: {
            email,
            role,
          },
        }),
      });

      setEmail("");
      setRole("staff");
      setSuccessMessage("Invitation sent.");
    } catch (requestError) {
      setError(requestError.validationErrors?.[0]?.message || requestError.message);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section>
      <h2>Invite User</h2>

      {error && <p className="error">{error}</p>}
      {successMessage && <p>{successMessage}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="invite_email">Email</label>
          <input id="invite_email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>

        <div>
          <label htmlFor="invite_role">Role</label>
          <select id="invite_role" value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="staff">Staff</option>
            <option value="read_only">Read Only</option>
          </select>
        </div>

        <button type="submit">{isSending ? "Sending..." : "Send Invitation"}</button>
      </form>
    </section>
  );
}
