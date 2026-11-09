import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../utils/api.js";
import { TIMEZONE_OPTIONS } from "../utils/timezone.js";

const DAYS = [
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
  { label: "Sunday", value: 0 },
];

function formatTime(value) {
  if (!value) return "";

  const [hours, minutes] = value.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";

  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${period}`;
}

export default function BusinessInformation({ currentUser, setCurrentAccount }) {
  const isOwner = currentUser?.role === "owner";

  const [businessName, setBusinessName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [businessHours, setBusinessHours] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([apiFetch("/api/v1/account"), apiFetch("/api/v1/working_hours")])
      .then(([account, hours]) => {
        if (!active) return;

        setBusinessName(account.business_name ?? "");
        setTimezone(account.timezone ?? "America/Denver");
        setBusinessHours(hours);
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

  async function handleSave(event) {
    event.preventDefault();

    setIsSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const account = await apiFetch("/api/v1/account", {
        method: "PATCH",
        body: JSON.stringify({
          account: {
            business_name: businessName,
            timezone,
          },
        }),
      });

      setBusinessName(account.business_name);
      setTimezone(account.timezone);
      setCurrentAccount(account);
      setSuccessMessage("Business information updated.");
    } catch (requestError) {
      setError(requestError.validationErrors?.[0]?.message || requestError.message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <main>
        <p>Loading business information...</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Business Information</h1>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {successMessage && <p role="status">{successMessage}</p>}

      <form onSubmit={handleSave}>
        <div>
          <label htmlFor="business_name">Business Name</label>
          <input
            id="business_name"
            type="text"
            value={businessName}
            disabled={!isOwner || isSaving}
            onChange={(event) => setBusinessName(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="timezone">Timezone</label>
          <select
            id="timezone"
            value={timezone}
            disabled={!isOwner || isSaving}
            onChange={(event) => setTimezone(event.target.value)}
          >
            {TIMEZONE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {isOwner && (
          <button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Business Information"}
          </button>
        )}
      </form>

      <section>
        <h2>Business Hours</h2>

        {DAYS.map((day) => {
          const ranges = businessHours
            .filter((record) => Number(record.day_of_week) === day.value)
            .sort((a, b) => a.opens_at.localeCompare(b.opens_at));

          return (
            <div key={day.value}>
              <strong>{day.label}: </strong>
              {ranges.length === 0
                ? "Closed"
                : ranges.map((range) => `${formatTime(range.opens_at)} – ${formatTime(range.closes_at)}`).join(", ")}
            </div>
          );
        })}

        {isOwner && (
          <p>
            <Link to="/settings/business-hours">Edit Business Hours</Link>
          </p>
        )}
      </section>
    </main>
  );
}
