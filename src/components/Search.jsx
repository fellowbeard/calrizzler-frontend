import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { apiFetch } from "../utils/api.js";

const EMPTY_RESULTS = {
  clients: [],
  appointments: [],
  services: [],
};

export default function Search() {
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("");
  const [results, setResults] = useState(EMPTY_RESULTS);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => clearTimeout(timeout);
  }, [search]);

  const hasSearch = Boolean(search.trim() || date || status);

  useEffect(() => {
    // Wait until the text search has finished debouncing.
    if (search.trim() !== debouncedSearch) return;

    if (!debouncedSearch && !date && !status) return;

    const params = new URLSearchParams();

    if (debouncedSearch) params.set("q", debouncedSearch);
    if (date) params.set("date", date);
    if (status) params.set("status", status);

    let active = true;

    apiFetch(`/api/v1/search?${params.toString()}`)
      .then((data) => {
        if (!active) return;

        setResults(data);
        setError("");
        setIsLoading(false);
      })
      .catch((err) => {
        if (!active) return;

        setError(err instanceof Error ? err.message : "Unable to search.");
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [search, debouncedSearch, date, status]);

  const hasResults = results.clients.length > 0 || results.appointments.length > 0 || results.services.length > 0;

  function handleSearchChange(event) {
    setSearch(event.target.value);
    setIsLoading(true);
    setError("");
  }

  function handleDateChange(event) {
    setDate(event.target.value);
    setIsLoading(true);
    setError("");
  }

  function handleStatusChange(event) {
    setStatus(event.target.value);
    setIsLoading(true);
    setError("");
  }

  function clearFilters() {
    setSearch("");
    setDate("");
    setStatus("");
    setDebouncedSearch("");
    setResults(EMPTY_RESULTS);
    setIsLoading(false);
    setError("");
  }

  return (
    <main style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <h1>Search</h1>

      <input
        type="search"
        value={search}
        onChange={handleSearchChange}
        placeholder="Search clients, appointments, services"
        aria-label="Universal search"
        autoComplete="off"
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 8,
          border: "1px solid #0D0D5B",
          marginBottom: 24,
          font: "inherit",
        }}
      />

      <section style={{ marginBottom: 24 }}>
        <h2>Appointment Filters</h2>

        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            alignItems: "end",
          }}
        >
          <div style={{ flex: "1 1 200px" }}>
            <label htmlFor="search-date">Date</label>

            <input
              id="search-date"
              type="date"
              value={date}
              onChange={handleDateChange}
              style={{
                display: "block",
                width: "100%",
                padding: 10,
                marginTop: 8,
                borderRadius: 8,
                border: "1px solid #0D0D5B",
                font: "inherit",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ flex: "1 1 200px" }}>
            <label htmlFor="search-status">Status</label>

            <select
              id="search-status"
              value={status}
              onChange={handleStatusChange}
              style={{
                display: "block",
                width: "100%",
                padding: 10,
                marginTop: 8,
                borderRadius: 8,
                border: "1px solid #0D0D5B",
                font: "inherit",
                boxSizing: "border-box",
              }}
            >
              <option value="">All statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>

          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasSearch}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: "1px solid #0D0D5B",
              cursor: hasSearch ? "pointer" : "default",
              font: "inherit",
            }}
          >
            Clear
          </button>
        </div>
      </section>

      {!hasSearch ? (
        <p>Start typing or use the filters above to find what you need.</p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : isLoading || search.trim() !== debouncedSearch ? (
        <p>Searching...</p>
      ) : !hasResults ? (
        <p>{date || status ? "No appointments found." : "No results found."}</p>
      ) : (
        <>
          {results.clients.length > 0 && (
            <section style={{ marginBottom: 24 }}>
              <h2>Clients</h2>

              {results.clients.map((client) => (
                <div
                  key={client.id}
                  style={{
                    padding: 12,
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  <Link to={`/clients/${client.id}`}>
                    {client.first_name} {client.last_name}
                  </Link>
                </div>
              ))}
            </section>
          )}

          {results.appointments.length > 0 && (
            <section style={{ marginBottom: 24 }}>
              <h2>Appointments</h2>

              {results.appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  style={{
                    padding: 12,
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  <strong>
                    {appointment.client
                      ? `${appointment.client.first_name} ${appointment.client.last_name}`
                      : "Appointment"}
                  </strong>

                  <p>Status: {appointment.status}</p>

                  <p>Services: {appointment.services?.map((service) => service.title).join(", ") || "None"}</p>
                </div>
              ))}
            </section>
          )}

          {results.services.length > 0 && (
            <section style={{ marginBottom: 24 }}>
              <h2>Services</h2>

              {results.services.map((service) => (
                <div
                  key={service.id}
                  style={{
                    padding: 12,
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  <strong>{service.title}</strong>

                  {service.description && <p>{service.description}</p>}
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </main>
  );
}
