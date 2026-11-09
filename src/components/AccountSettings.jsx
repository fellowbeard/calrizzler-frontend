import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api.js";
import { TIMEZONE_OPTIONS } from "../utils/timezone.js";
import InviteUser from "./InviteUser.jsx";
import BusinessHours from "./BusinessHours.jsx";

function formatStreetAddress(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

const emptyForm = {
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

export default function AccountSettings({ currentUser, setCurrentAccount }) {
  const [account, setAccount] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [isEditing, setIsEditing] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const isOwner = currentUser?.role === "owner";

  useEffect(() => {
    let active = true;

    apiFetch("/api/v1/account")
      .then((result) => {
        if (!active) return;

        setAccount(result);
        setForm(accountToForm(result));
        setError("");
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

  async function handleSubmit(event) {
    event.preventDefault();

    if (!isOwner || isSaving) return;

    setError("");
    setSuccessMessage("");
    setIsSaving(true);

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
        <p>Loading account settings...</p>
      </main>
    );
  }

  if (!account) {
    return (
      <main>
        <h1>Account Settings</h1>
        <p className="error">{error || "Unable to load account information."}</p>
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
      <h1>Account Settings</h1>

      <section>
        <h2>Business Information</h2>

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
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="business_name">Business Name</label>
              <input
                id="business_name"
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
                type="tel"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                disabled={isSaving}
                autoComplete="tel"
              />
            </div>

            <div>
              <label htmlFor="address_line1">Street Address</label>
              <input
                id="address_line1"
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
                type="text"
                value={form.city}
                onChange={(event) => updateField("city", event.target.value)}
                disabled={isSaving}
                autoComplete="address-level2"
              />
            </div>

            <div>
              <label htmlFor="state">State</label>
              <input
                id="state"
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

      <BusinessHours currentUser={currentUser} />

      {isOwner && <InviteUser />}
    </main>
  );
}
