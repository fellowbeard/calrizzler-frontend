import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiFetch } from "../utils/api.js";
import AppointmentCalendar from "./AppointmentCalendar.jsx";

export default function UserDashboard({ currentUser, currentAccount }) {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    apiFetch("/api/v1/dashboard")
      .then((data) => {
        setDashboard(data);
        setErrorMessage("");
      })
      .catch((error) => {
        setDashboard(null);
        setErrorMessage(error.message);
      });
  }, []);

  if (!dashboard) {
    return errorMessage ? <p className="error">{errorMessage}</p> : <p>Loading...</p>;
  }

  return (
    <main>
      <h1>{dashboard.account.business_name}</h1>

      {errorMessage && <p className="error">{errorMessage}</p>}

      <button type="button" onClick={() => navigate("/appointments/new")}>
        New Appointment
      </button>

      <section>
        <AppointmentCalendar
          appointments={dashboard.appointments || []}
          currentUser={currentUser}
          currentAccount={currentAccount}
          timezone={currentAccount?.timezone || dashboard.account?.timezone}
        />
      </section>

      <section>
        <h2>Recent Clients</h2>

        {dashboard.recent_clients?.length > 0 ? (
          <div className="clients-list">
            {dashboard.recent_clients.map((client) => (
              <div key={client.id} className="client-list-row">
                <button
                  type="button"
                  className="dashboard-client-link"
                  onClick={() => navigate(`/clients/${client.id}`)}
                >
                  {client.first_name} {client.last_name}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p>No recent clients.</p>
        )}
      </section>
    </main>
  );
}
