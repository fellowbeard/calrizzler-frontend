import { useState } from "react";
import AppointmentForm from "./forms/AppointmentForm.jsx";

export default function AppointmentCalendar({ appointments = [], currentUser = null, onAppointmentUpdate = null }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingAppointment, setEditingAppointment] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

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
    if (!dayDate) return [];

    return appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.scheduled_at);

      return (
        appointmentDate.getFullYear() === dayDate.getFullYear() &&
        appointmentDate.getMonth() === dayDate.getMonth() &&
        appointmentDate.getDate() === dayDate.getDate()
      );
    });
  }

  return (
    <section className="appointment-calendar">
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
            <div key={index} className="calendar-day">
              {dayDate && (
                <>
                  <strong>{dayDate.getDate()}</strong>

                  {dayAppointments.map((appointment) => (
                    <button
                      key={appointment.id}
                      type="button"
                      className="calendar-appointment"
                      onClick={() => setEditingAppointment(appointment)}
                    >
                      <span>
                        {new Date(appointment.scheduled_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <div>
                        {appointment.client.first_name} {appointment.client.last_name}
                      </div>
                      <div>
                        {appointment.services?.length > 0
                          ? appointment.services.map((service) => service.title).join(", ")
                          : "Appointment"}
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          );
        })}
      </div>

      {editingAppointment && currentUser && (
        <div className="calendar-edit-overlay">
          <div className="calendar-edit-modal">
            <button className="close-button" onClick={() => setEditingAppointment(null)}>
              ✕
            </button>
            <AppointmentForm
              currentUser={currentUser}
              existingAppointment={editingAppointment}
              onAppointmentUpdated={() => {
                setEditingAppointment(null);
                onAppointmentUpdate?.();
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
