import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { apiFetch } from "../utils/api.js";

export default function ClientsList() {
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/v1/clients")
      .then((data) => {
        setClients(data);
        setErrorMessage("");
      })
      .catch((error) => {
        setClients([]);
        setErrorMessage(error.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  function handleNewClient() {
    navigate("/clients/new");
  }

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <main>
      <h1>Clients</h1>

      {errorMessage && <p className="error">{errorMessage}</p>}

      <button type="button" onClick={handleNewClient}>
        New Client
      </button>

      <div className="clients-list">
        {clients.length > 0 ? (
          clients.map((client) => (
            <div key={client.id} className="client-list-row">
              <Link to={`/clients/${client.id}`} className="client-list-link">
                {client.first_name} {client.last_name}
              </Link>
            </div>
          ))
        ) : (
          <p>No clients yet.</p>
        )}
      </div>
    </main>
  );
}
