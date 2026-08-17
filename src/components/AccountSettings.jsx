import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api.js";

const FALLBACK_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Phoenix",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
];

function getTimezones() {
  if (typeof Intl.supportedValuesOf === "function") {
    return Intl.supportedValuesOf("timeZone").filter(
      (timezone) =>
        timezone.startsWith("America/") ||
        timezone.startsWith("Pacific/")
    );
  }

  return FALLBACK_TIMEZONES;
}

export default function AccountSettings({ currentUser, setCurentAccount }) {
  const [businessName, setBusinessName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const timezones = getTimezones();

  useEffect(() => {
    apiFetch("/api/v1/account")
      .then((account) => {
        setBusinessName(account.business_name ?? "");
        setTimezone(account.timezone ?? "America/Denver");
        setError("");
      })
      .catch((requestError) => {
        setError(requestError.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccessMessage("");
    setIsSaving(true);

    apiFetch("/api/v1/account", {
      method: "PATCH",
      body: JSON.stringify({
        account: {
          business_name: businessName,
          timezone,
        },
      }),
    })
      .then((account) => {
        setBusinessName(account.business_name);
        setTimezone(account.timezone);
        setCurrentAccount(account);
        setSuccessMessage("Account settings updated.");
      })
      .catch((requestError) => {
        setError(
          requestError.validationErrors?.[0]?.message ||
            requestError.message
        );
      })
      .finally(() => {
        setIsSaving(false);
      });
  }

  if (currentUser.role !== "owner") {
    return (
      <main>
        <h1>Account Settings</h1>
        <p>Only account owners can change account settings.</p>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main>
        <p>Loading account settings...</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Account Settings</h1>

      {error && <p className="error">{error}</p>}
      {successMessage && <p>{successMessage}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="business_name">Business Name</label>

          <input
            id="business_name"
            name="business_name"
            type="text"
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="timezone">Timezone</label>

          <select
            id="timezone"
            name="timezone"
            value={timezone}
            onChange={(event) => setTimezone(event.target.value)}
          >
            {timezones.map((timezoneOption) => (
              <option key={timezoneOption} value={timezoneOption}>
                {timezoneOption}
              </option>
            ))}
          </select>
        </div>

        <button type="submit">
          {isSaving ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </main>
  );
}