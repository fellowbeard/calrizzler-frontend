import { Link } from "react-router-dom";

export default function Settings({ currentUser }) {
  const isOwner = currentUser?.role === "owner";
  const canEditWorkingHours = isOwner || currentUser?.role === "staff";

  return (
    <main>
      <h1>Settings</h1>

      <nav aria-label="Settings sections">
        <ul className="settings-list">
          <li>
            <Link to="/settings/business">Business Information</Link>
          </li>

          {isOwner && (
            <li>
              <Link to="/settings/business-hours">Business Hours</Link>
            </li>
          )}

          {canEditWorkingHours && (
            <li>
              <Link to="/settings/my-working-hours">My Working Hours</Link>
            </li>
          )}

          {isOwner && (
            <li>
              <Link to="/settings/staff">Staff Management</Link>
            </li>
          )}
        </ul>
      </nav>
    </main>
  );
}
