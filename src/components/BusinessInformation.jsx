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

const EMPTY_FORM = {
  business_name: "",
  timezone: "America/Denver",
  phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  postal_code: "",
};

function accountToForm(account) {
  return {
    business_name: account.business_name ?? "",
    timezone: account.timezone ?? "America/Denver",
    phone: account.phone ?? "",
    address_line1: account.address_line1 ?? "",
    address_line2: account.address_line2 ?? "",
    city: account.city ?? "",
    state: account.state ?? "",
    postal_code: account.postal_code ?? "",
  };
}

function formatStreetAddress(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function normalizeTime(value) {
  if (!value) return "";

  const match = String(value).match(/(\d{2}):(\d{2})/);

  return match ? `${match[1]}:${match[2]}` : "";
}

function formatTime(value) {
  const normalized = normalizeTime(value);

  if (!normalized) return value || "";

  const [hours, minutes] = normalized.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";

  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${period}`;
}

export default function BusinessInformation({ currentUser, setCurrentAccount }) {
  const isOwner = currentUser?.role === "owner";

  const [account, setAccount] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [businessHours, setBusinessHours] = useState([]);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([apiFetch("/api/v1/account"), apiFetch("/api/v1/working_hours")])
      .then(([accountData, hours]) => {
        if (!active) return;

        setAccount(accountData);
        setForm(accountToForm(accountData));
        setBusinessHours(hours);
        setError("");
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message);
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  function updateField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleStartEditing() {
    if (!isOwner || !account) return;

    setForm(accountToForm(account));
    setError("");
    setSuccessMessage("");
    setIsEditing(true);
  }

  function handleCancelEditing() {
    if (account) {
      setForm(accountToForm(account));
    }

    setError("");
    setIsEditing(false);
  }

  async function handleSave(event) {
    event.preventDefault();

    if (!isOwner || isSaving) return;

    setIsSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const updatedAccount = await apiFetch("/api/v1/account", {
        method: "PATCH",
        body: JSON.stringify({
          account: {
            ...form,
            address_line1: formatStreetAddress(form.address_line1),
            address_line2: form.address_line2.trim(),
            city: form.city.trim(),
            state: form.state.trim().toUpperCase(),
            postal_code: form.postal_code.trim(),
          },
        }),
      });

      setAccount(updatedAccount);
      setForm(accountToForm(updatedAccount));
      setCurrentAccount(updatedAccount);

      setIsEditing(false);
      setSuccessMessage("Business information updated.");
    } catch (requestError) {
      setError(
        requestError.validationErrors?.[0]?.message || requestError.message || "Unable to update business information."
      );
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

  if (!account) {
    return (
      <main>
        <h1>Business Information</h1>
        <p className="error" role="alert">
          {error || "Unable to load business information."}
        </p>
      </main>
    );
  }

  const hasContactInformation = Boolean(
    account.phone ||
    account.address_line1 ||
    account.address_line2 ||
    account.city ||
    account.state ||
    account.postal_code
  );

  const timezoneLabel =
    TIMEZONE_OPTIONS.find((option) => option.value === account.timezone)?.label ?? account.timezone ?? "Not provided";

  const cityState = [account.city, account.state].filter(Boolean).join(", ");

  const cityStateZip = [cityState, account.postal_code].filter(Boolean).join(" ");

  const addressLines = [account.address_line1, account.address_line2, cityStateZip].filter(Boolean);

  return (
    <main>
      <h1>Business Information</h1>

      {error && !isEditing && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <section>
        {!isEditing ? (
          <div>
            <div>
              <strong>Business Name</strong>
              <p>{account.business_name || "Not provided"}</p>
            </div>

            <div>
              <strong>Timezone</strong>
              <p>{timezoneLabel}</p>
            </div>

            <div>
              <strong>Business Phone</strong>
              <p>{account.phone || "Not provided"}</p>
            </div>

            <div>
              <strong>Business Address</strong>

              {addressLines.length > 0 ? (
                <div>
                  {addressLines.map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>
              ) : (
                <p>Not provided</p>
              )}
            </div>

            {successMessage && <p role="status">{successMessage}</p>}

            {isOwner && (
              <button type="button" onClick={handleStartEditing}>
                {hasContactInformation ? "Update Business Information" : "Add Business Information"}
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSave}>
            <div>
              <label htmlFor="business_name">Business Name</label>

              <input
                id="business_name"
                name="business_name"
                type="text"
                value={form.business_name}
                onChange={(event) => updateField("business_name", event.target.value)}
                disabled={isSaving}
                required
              />
            </div>

            <div>
              <label htmlFor="timezone">Timezone</label>

              <select
                id="timezone"
                name="timezone"
                value={form.timezone}
                onChange={(event) => updateField("timezone", event.target.value)}
                disabled={isSaving}
              >
                {TIMEZONE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="business_phone">Business Phone</label>

              <input
                id="business_phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                disabled={isSaving}
                autoComplete="tel"
                placeholder="Business phone number"
              />
            </div>

            <div>
              <label htmlFor="address_line1">Street Address</label>

              <input
                id="address_line1"
                name="address_line1"
                type="text"
                value={form.address_line1}
                onChange={(event) => updateField("address_line1", event.target.value)}
                disabled={isSaving}
                autoComplete="address-line1"
                placeholder="123 Main Street"
              />
            </div>

            <div>
              <label htmlFor="address_line2">Address Line 2</label>

              <input
                id="address_line2"
                name="address_line2"
                type="text"
                value={form.address_line2}
                onChange={(event) => updateField("address_line2", event.target.value)}
                disabled={isSaving}
                autoComplete="address-line2"
                placeholder="Suite, unit, etc. (optional)"
              />
            </div>

            <div>
              <label htmlFor="postal_code">ZIP Code</label>

              <input
                id="postal_code"
                name="postal_code"
                type="text"
                inputMode="numeric"
                maxLength={5}
                pattern="[0-9]{5}"
                value={form.postal_code}
                onChange={(event) => updateField("postal_code", event.target.value.replace(/\D/g, "").slice(0, 5))}
                disabled={isSaving}
                autoComplete="postal-code"
                placeholder="70130"
              />
            </div>

            <div>
              <label htmlFor="city">City</label>

              <input
                id="city"
                name="city"
                type="text"
                value={form.city}
                onChange={(event) => updateField("city", event.target.value)}
                disabled={isSaving}
                autoComplete="address-level2"
                placeholder="City"
              />
            </div>

            <div>
              <label htmlFor="state">State</label>

              <input
                id="state"
                name="state"
                type="text"
                value={form.state}
                onChange={(event) => updateField("state", event.target.value.toUpperCase().slice(0, 2))}
                disabled={isSaving}
                autoComplete="address-level1"
                maxLength={2}
                placeholder="LA"
              />
            </div>

            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </button>

            <button type="button" onClick={handleCancelEditing} disabled={isSaving}>
              Cancel
            </button>
          </form>
        )}
      </section>

      <section>
        <h2>Business Hours</h2>

        {DAYS.map((day) => {
          const ranges = businessHours
            .filter((record) => Number(record.day_of_week) === day.value)
            .sort((a, b) => normalizeTime(a.opens_at).localeCompare(normalizeTime(b.opens_at)));

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
            <Link to="/settings/business-hours">
              {businessHours.length > 0 ? "Update Business Hours" : "Add Business Hours"}
            </Link>
          </p>
        )}
      </section>
    </main>
  );
}
