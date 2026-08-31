import { useCallback, useEffect, useState } from "react";

import { apiFetch } from "../utils/api.js";
import AppointmentForm from "./forms/AppointmentForm.jsx";
import {
  calculateEndTime,
  datePartsInTimezone,
  formatTimeInTimezone,
  timezoneAbbreviation,
} from "../utils/timezone.js";

export default function AppointmentCalendar({
  currentUser = null,
  currentAccount = null,
  onAppointmentUpdate = null,
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [error, setError] = useState("");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchCalendar = useCallback(() => {
    apiFetch("/api/v1/calendar")
      .then((data) => {
        setAppointments(data);
        setError("");
      })
      .catch((requestError) => {
        setError(requestError.message);
      });
  }, []);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startingDayIndex = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const calendarDays = [];

  for (let i = 0; i < startingDayIndex; i++) {
    calendarDays.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day));
  }

  function previousMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function appointmentsForDay(dayDate) {
    if (!dayDate || !currentAccount?.timezone) {
      return [];
    }

    return appointments.filter((appointment) => {
      const appointmentDate = datePartsInTimezone(
        appointment.scheduled_at,
        currentAccount.timezone
      );

      return (
        appointmentDate.year === dayDate.getFullYear() &&
        appointmentDate.month === dayDate.getMonth() + 1 &&
        appointmentDate.day === dayDate.getDate()
      );
    });
  }

  function isToday(dayDate) {
    if (!dayDate || !currentAccount?.timezone) {
      return false;
    }

    const today = datePartsInTimezone(
      new Date().toISOString(),
      currentAccount.timezone
    );

    return (
      today.year === dayDate.getFullYear() &&
      today.month === dayDate.getMonth() + 1 &&
      today.day === dayDate.getDate()
    );
  }

  function isOwnAppointment(appointment) {
    return appointment.user_id === currentUser?.id;
  }

  function handleAppointmentClick(appointment) {
    if (!isOwnAppointment(appointment)) {
      return;
    }

    setEditingAppointment(appointment);
    setError("");
  }

  function renderAppointment(appointment) {
    const ownAppointment = isOwnAppointment(appointment);

    const endTime = calculateEndTime(
      appointment.scheduled_at,
      appointment.duration_minutes
    );

    const isPastAppointment = endTime < new Date();

    const timezoneLabel = timezoneAbbreviation(currentAccount.timezone);

    const appointmentContent = (
      <>
        <span>
          {formatTimeInTimezone(
            appointment.scheduled_at,
            currentAccount.timezone
          )}
          {" - "}
          {formatTimeInTimezone(
            endTime.toISOString(),
            currentAccount.timezone
          )}{" "}
          {timezoneLabel}
        </span>

        {ownAppointment && <div>{appointment.client_name}</div>}

        <div>{appointment.resource_name}</div>

        {!ownAppointment && <div>Busy</div>}
      </>
    );

    const appointmentClassName = `calendar-appointment${
      isPastAppointment ? " past-appointment" : ""
    }`;

    if (ownAppointment) {
      return (
        <button
          key={appointment.id}
          type="button"
          className={appointmentClassName}
          onClick={() => handleAppointmentClick(appointment)}
        >
          {appointmentContent}
        </button>
      );
    }

    return (
      <div key={appointment.id} className={appointmentClassName}>
        {appointmentContent}
      </div>
    );
  }

  return (
    <section className="appointment-calendar">
      {error && <p className="error">{error}</p>}

      <div className="calendar-header">
        <button onClick={previousMonth}>Previous</button>

        <h3>
          {currentDate.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </h3>

        <button onClick={nextMonth}>Next</button>
      </div>

      <div className="calendar-grid calendar-weekdays">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      <div className="calendar-grid">
        {calendarDays.map((dayDate, index) => {
          const dayAppointments = appointmentsForDay(dayDate);

          return (
            <div
              key={index}
              className={`calendar-day${isToday(dayDate) ? " today" : ""}`}
            >
              {dayDate && (
                <>
                  <strong>{dayDate.getDate()}</strong>

                  {dayAppointments.map(renderAppointment)}
                </>
              )}
            </div>
          );
        })}
      </div>

      {editingAppointment && currentUser && (
        <div className="calendar-edit-overlay">
          <div className="calendar-edit-modal">
            <button
              className="close-button"
              onClick={() => setEditingAppointment(null)}
            >
              ✕
            </button>

            <AppointmentForm
              currentUser={currentUser}
              currentAccount={currentAccount}
              existingAppointment={editingAppointment}
              onAppointmentUpdated={() => {
                setEditingAppointment(null);
                fetchCalendar();
                onAppointmentUpdate?.();
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
}