import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { apiFetch } from "../utils/api.js";

export default function ClientsList() {
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let active = true;

    const query = debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : "";

    apiFetch(`/api/v1/clients${query}`)
      .then((data) => {
        if (!active) return;

        setClients(data);
        setErrorMessage("");
      })
      .catch((error) => {
        if (!active) return;

        setClients([]);
        setErrorMessage(error.message);
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [debouncedSearch]);

  function handleNewClient() {
    navigate("/clients/new");
  }

  return (
    <main>
      <h1>Clients</h1>

      <button type="button" onClick={handleNewClient}>
        New Client
      </button>

      <div className="client-search">
        <label htmlFor="client-search">Search Clients</label>

        <input
          id="client-search"
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setIsLoading(true);
          }}
          placeholder="Search by name, email, or phone"
          autoComplete="off"
        />
      </div>

      {errorMessage && (
        <p className="error" role="alert">
          {errorMessage}
        </p>
      )}

      {isLoading ? (
        <p>Loading clients...</p>
      ) : (
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
            <p>{debouncedSearch ? "No clients match your search." : "No clients yet."}</p>
          )}
        </div>
      )}
    </main>
  );
}
