import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api.js";
import { useZipLookup } from "../../hooks/useZipLookup.js";
import { formatStreetAddress } from "../../utils/addressFormatting.js";

export default function NewClient() {
  const navigate = useNavigate();

  const [client, setClient] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
  });

  const [error, setError] = useState("");

  const { lookupZip, cancelLookup, isLookingUpZip, zipError } = useZipLookup();

  function handleChange(event) {
    const { name, value } = event.target;

    if (name === "postal_code") {
      const zip = value.replace(/\D/g, "").slice(0, 5);

      setClient((previous) => ({
        ...previous,
        postal_code: zip,
      }));

      void lookupZip(zip, ({ city, state }) => {
        setClient((previous) => ({
          ...previous,
          city,
          state,
        }));
      });

      return;
    }

    if (name === "city" || name === "state") {
      cancelLookup();
    }

    setClient((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    cancelLookup();

    apiFetch("/api/v1/clients", {
      method: "POST",
      body: JSON.stringify({
        client: {
          ...client,
          address_line1: formatStreetAddress(client.address_line1),
        },
      }),
    })
      .then((createdClient) => {
        navigate(`/clients/${createdClient.id}`);
      })
      .catch((apiError) => {
        setError(apiError.message);
      });
  }

  return (
    <main>
      <h1>New Client</h1>

      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <label htmlFor="first_name">First Name</label>
        <input id="first_name" name="first_name" value={client.first_name} onChange={handleChange} />

        <label htmlFor="last_name">Last Name</label>
        <input id="last_name" name="last_name" value={client.last_name} onChange={handleChange} />

        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" value={client.email} onChange={handleChange} />

        <label htmlFor="phone">Phone</label>
        <input id="phone" name="phone" value={client.phone} onChange={handleChange} />

        <fieldset>
          <legend>Address (Optional)</legend>

          <label htmlFor="address_line1">Street Address</label>
          <input
            id="address_line1"
            name="address_line1"
            value={client.address_line1}
            onChange={handleChange}
            autoComplete="address-line1"
          />

          <label htmlFor="address_line2">Apartment / Suite</label>
          <input
            id="address_line2"
            name="address_line2"
            value={client.address_line2}
            onChange={handleChange}
            autoComplete="address-line2"
          />

          <label htmlFor="postal_code">ZIP Code</label>
          <input
            id="postal_code"
            name="postal_code"
            value={client.postal_code}
            onChange={handleChange}
            autoComplete="postal-code"
            inputMode="numeric"
            maxLength={5}
          />

          {isLookingUpZip && <p>Looking up ZIP code...</p>}

          {zipError && <p className="error">{zipError} You can enter the city and state manually.</p>}

          <label htmlFor="city">City</label>
          <input id="city" name="city" value={client.city} onChange={handleChange} autoComplete="address-level2" />

          <label htmlFor="state">State</label>
          <input
            id="state"
            name="state"
            value={client.state}
            onChange={handleChange}
            autoComplete="address-level1"
            maxLength={2}
          />
        </fieldset>

        <button type="submit">Create Client</button>
      </form>
    </main>
  );
}
