import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api.js";

export default function NewClient() {
  const navigate = useNavigate();

  const [client, setClient] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });

  const [error, setError] = useState("");

  function handleChange(event) {
    setClient({
      ...client,
      [event.target.name]: event.target.value,
    });
  }

  function handleSubmit(event) {
    event.preventDefault();

    apiFetch("/api/v1/clients", {
      method: "POST",
      body: JSON.stringify({
        client: {
          ...client,
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

        <button type="submit">Create Client</button>
      </form>
    </main>
  );
}
