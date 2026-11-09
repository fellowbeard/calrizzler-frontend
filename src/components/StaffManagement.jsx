import { useEffect, useState } from "react";
import InviteUser from "./InviteUser.jsx";
import { apiFetch } from "../utils/api.js";

export default function StaffManagement({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let active = true;

    apiFetch("/api/v1/users")
      .then((data) => {
        if (active) setUsers(data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleRoleChange(user, newRole) {
    if (user.id === currentUser.id || !user.active) return;

    setSavingUserId(user.id);
    setError("");
    setSuccessMessage("");

    try {
      const updatedUser = await apiFetch(`/api/v1/users/${user.id}/update_role`, {
        method: "PATCH",
        body: JSON.stringify({
          user: { role: newRole },
        }),
      });

      setUsers((previous) => previous.map((item) => (item.id === updatedUser.id ? updatedUser : item)));

      setSuccessMessage("User role updated.");
    } catch (requestError) {
      setError(requestError.validationErrors?.[0]?.message || requestError.message);
    } finally {
      setSavingUserId(null);
    }
  }

  async function handleDeactivate(user) {
    if (user.id === currentUser.id || !user.active) return;

    const confirmed = window.confirm(
      `Deactivate ${user.first_name || user.email}? They will no longer be able to access the account.`
    );

    if (!confirmed) return;

    setSavingUserId(user.id);
    setError("");
    setSuccessMessage("");

    try {
      await apiFetch(`/api/v1/users/${user.id}`, {
        method: "DELETE",
      });

      setUsers((previous) => previous.map((item) => (item.id === user.id ? { ...item, active: false } : item)));

      setSuccessMessage("User deactivated.");
    } catch (requestError) {
      setError(requestError.validationErrors?.[0]?.message || requestError.message);
    } finally {
      setSavingUserId(null);
    }
  }

  return (
    <main>
      <h1>Staff Management</h1>

      <InviteUser />

      <section>
        <h2>Current Staff</h2>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        {successMessage && <p role="status">{successMessage}</p>}

        {isLoading && <p>Loading staff...</p>}

        {!isLoading && !error && users.length === 0 && <p>No staff members found.</p>}

        {!isLoading && users.length > 0 && (
          <table>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Role</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => {
                const isSelf = user.id === currentUser.id;
                const canManage = !isSelf && user.active;

                const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || "—";

                return (
                  <tr key={user.id}>
                    <td>{name}</td>
                    <td>{user.email}</td>

                    <td>
                      {canManage ? (
                        <select
                          aria-label={`Role for ${name}`}
                          value={user.role}
                          disabled={savingUserId !== null}
                          onChange={(event) => handleRoleChange(user, event.target.value)}
                        >
                          <option value="owner">Owner</option>
                          <option value="staff">Staff</option>
                          {user.role === "read_only" && (
                            <option value="read_only" disabled>
                              Read Only (Development)
                            </option>
                          )}
                        </select>
                      ) : user.role === "read_only" ? (
                        "Read Only"
                      ) : user.role === "owner" ? (
                        "Owner"
                      ) : (
                        "Staff"
                      )}
                    </td>

                    <td>{user.active ? "Active" : "Inactive"}</td>

                    <td>
                      {canManage && (
                        <button type="button" disabled={savingUserId !== null} onClick={() => handleDeactivate(user)}>
                          {savingUserId === user.id ? "Saving..." : "Deactivate"}
                        </button>
                      )}

                      {isSelf && <span>Your account</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
