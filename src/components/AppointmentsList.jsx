import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiFetch } from "../utils/api.js";
import AppointmentForm from "./forms/AppointmentForm.jsx";
import { calculateEndTime, formatDateTimeInTimezone } from "../utils/timezone.js";

export default function AppointmentsList({ currentUser, currentAccount }) {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [editingAppointment, setEditingAppointment] = useState(null);

  const fetchAppointments = useCallback(() => {
    apiFetch("/api/v1/appointments")
      .then((data) => {
        setAppointments(data);
        setErrorMessage("");
      })
      .catch((error) => {
        setAppointments([]);
        setErrorMessage(error.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  function handleAppointmentClick(appointment) {
    setEditingAppointment((currentAppointment) => (currentAppointment?.id === appointment.id ? null : appointment));
  }

  function handleAppointmentUpdated() {
    setEditingAppointment(null);
    fetchAppointments();
  }

  function handleCancelAppointmentEdit() {
    setEditingAppointment(null);
  }

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <main>
      <h1>Appointments</h1>

      {errorMessage && <p className="error">{errorMessage}</p>}

      <button type="button" onClick={() => navigate("/appointments/new")}>
        New Appointment
      </button>

      <div className="appointments-list">
        {appointments.length > 0 ? (
          [...appointments]
            .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
            .map((appointment) => {
              const endTime = calculateEndTime(appointment.scheduled_at, appointment.duration_minutes);

              const isPastAppointment = endTime < new Date();

              const clientName = appointment.client
                ? `${appointment.client.first_name} ${appointment.client.last_name}`
                : "No client";

              const resourceName = appointment.resource?.name || appointment.resource_name || "No resource";

              const isEditing = editingAppointment?.id === appointment.id;

              const appointmentContent = (
                <>
                  <strong className="appointment-list-date">
                    {formatDateTimeInTimezone(appointment.scheduled_at, currentAccount?.timezone)}
                  </strong>

                  <span className="appointment-list-meta">
                    {" — "}
                    {clientName}
                    {" — "}
                    {resourceName}
                    {" — "}
                    {appointment.duration_minutes} minutes
                  </span>
                </>
              );

              return (
                <div key={appointment.id} className="appointment-list-item">
                  {isPastAppointment ? (
                    <div className="appointment-list-row past-appointment">{appointmentContent}</div>
                  ) : (
                    <button
                      type="button"
                      className="appointment-list-row"
                      onClick={() => handleAppointmentClick(appointment)}
                    >
                      {appointmentContent}
                    </button>
                  )}

                  {isEditing && (
                    <div className="appointment-edit-dropdown">
                      <AppointmentForm
                        key={appointment.id}
                        currentUser={currentUser}
                        currentAccount={currentAccount}
                        existingAppointment={appointment}
                        onAppointmentUpdated={handleAppointmentUpdated}
                        onCancel={handleCancelAppointmentEdit}
                      />
                    </div>
                  )}
                </div>
              );
            })
        ) : (
          <p>No appointments yet.</p>
        )}
      </div>
    </main>
  );
}
