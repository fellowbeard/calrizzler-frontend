import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { apiFetch } from "../utils/api.js";

export default function AppointmentShow({ currentAccount }) {
  const { id } = useParams();

  const [appointment, setAppointment] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/api/v1/appointments/${id}`)
      .then((data) => {
        setAppointment(data);
        setErrorMessage("");
      })
      .catch((error) => {
        setAppointment(null);
        setErrorMessage(error.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  function formatAppointmentDate(scheduledAt) {
    if (!scheduledAt) {
      return "";
    }

    return new Intl.DateTimeFormat("en-US", {
      timeZone: currentAccount?.timezone || "America/Chicago",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(scheduledAt));
  }

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (errorMessage) {
    return <p className="error">{errorMessage}</p>;
  }

  if (!appointment) {
    return <p>Appointment not found.</p>;
  }

  const clientName = appointment.client
    ? `${appointment.client.first_name} ${appointment.client.last_name}`
    : "No client";

  return (
    <main>
      <h1>Appointment</h1>

      <div className="appointment-details">
        <div>
          <strong>Client:</strong> {clientName}
        </div>

        <div>
          <strong>Date:</strong> {formatAppointmentDate(appointment.scheduled_at)}
        </div>

        <div>
          <strong>Resource:</strong> {appointment.resource?.name || "No resource"}
        </div>

        <div>
          <strong>Duration:</strong> {appointment.duration_minutes} minutes
        </div>

        <div>
          <strong>Status:</strong> {appointment.status}
        </div>

        {appointment.services?.length > 0 && (
          <div>
            <strong>Services:</strong> {appointment.services.map((service) => service.title).join(", ")}
          </div>
        )}
      </div>
    </main>
  );
}
