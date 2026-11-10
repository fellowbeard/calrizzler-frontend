import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppointmentForm from "./forms/AppointmentForm.jsx";
import { apiFetch } from "../utils/api.js";
import { formatDuration } from "../utils/duration.js";
import { calculateEndTime, formatDateTimeInTimezone } from "../utils/timezone.js";

export default function ClientCard({ currentUser, currentAccount }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [clientForm, setClientForm] = useState({
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
  const [noteBody, setNoteBody] = useState("");
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteBody, setEditingNoteBody] = useState("");
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchClient = useCallback(() => {
    apiFetch(`/api/v1/clients/${id}`)
      .then((data) => {
        setClient(data);
        setClientForm({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
          phone: data.phone || "",
          address_line1: data.address_line1 || "",
          address_line2: data.address_line2 || "",
          city: data.city || "",
          state: data.state || "",
          postal_code: data.postal_code || "",
        });
      })
      .catch((error) => {
        setErrorMessage(error.message);
      });
  }, [id]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  if (!client) return <p>Loading client...</p>;

  function handleClientChange(event) {
    setClientForm({
      ...clientForm,
      [event.target.name]: event.target.value,
    });
  }

  function handleUpdateClient(event) {
    event.preventDefault();

    apiFetch(`/api/v1/clients/${client.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        client: clientForm,
      }),
    })
      .then((updatedClient) => {
        setClient(updatedClient);
        setIsEditingClient(false);
        setErrorMessage("");
      })
      .catch((error) => {
        setErrorMessage(error.message);
      });
  }

  function handleCreateAppointment() {
    navigate(`/appointments/new?client_id=${client.id}`);
  }

  function handleAddNote(event) {
    event.preventDefault();

    apiFetch("/api/v1/notes", {
      method: "POST",
      body: JSON.stringify({
        note: {
          client_id: client.id,
          body: noteBody,
        },
      }),
    })
      .then((newNote) => {
        setClient({
          ...client,
          notes: [...(client.notes || []), newNote],
        });

        setNoteBody("");
        setErrorMessage("");
      })
      .catch((error) => {
        setErrorMessage(error.message);
      });
  }

  function startEditingNote(note) {
    setEditingNoteId(note.id);
    setEditingNoteBody(note.body);
  }

  function handleUpdateNote(event) {
    event.preventDefault();

    apiFetch(`/api/v1/notes/${editingNoteId}`, {
      method: "PATCH",
      body: JSON.stringify({
        note: {
          body: editingNoteBody,
        },
      }),
    })
      .then((updatedNote) => {
        setClient({
          ...client,
          notes: client.notes.map((note) => (note.id === updatedNote.id ? updatedNote : note)),
        });

        setEditingNoteId(null);
        setEditingNoteBody("");
        setErrorMessage("");
      })
      .catch((error) => {
        setErrorMessage(error.message);
      });
  }

  function handleAppointmentUpdated() {
    setEditingAppointment(null);
    fetchClient();
  }

  function handleCancelAppointmentEdit() {
    setEditingAppointment(null);
  }

  return (
    <section className="client-card">
      {errorMessage && <p className="error">{errorMessage}</p>}

      {isEditingClient ? (
        <form onSubmit={handleUpdateClient}>
          <label htmlFor="edit_first_name">First Name</label>
          <input id="edit_first_name" name="first_name" value={clientForm.first_name} onChange={handleClientChange} />

          <label htmlFor="edit_last_name">Last Name</label>
          <input id="edit_last_name" name="last_name" value={clientForm.last_name} onChange={handleClientChange} />

          <label htmlFor="edit_email">Email</label>
          <input id="edit_email" name="email" type="email" value={clientForm.email} onChange={handleClientChange} />

          <label htmlFor="edit_phone">Phone</label>
          <input id="edit_phone" name="phone" value={clientForm.phone} onChange={handleClientChange} />

          <fieldset>
            <legend>Address (Optional)</legend>

            <label htmlFor="edit_address_line1">Street Address</label>
            <input
              id="edit_address_line1"
              name="address_line1"
              value={clientForm.address_line1}
              onChange={handleClientChange}
              autoComplete="address-line1"
            />

            <label htmlFor="edit_address_line2">Apartment / Suite</label>
            <input
              id="edit_address_line2"
              name="address_line2"
              value={clientForm.address_line2}
              onChange={handleClientChange}
              autoComplete="address-line2"
            />

            <label htmlFor="edit_city">City</label>
            <input
              id="edit_city"
              name="city"
              value={clientForm.city}
              onChange={handleClientChange}
              autoComplete="address-level2"
            />

            <label htmlFor="edit_state">State</label>
            <input
              id="edit_state"
              name="state"
              value={clientForm.state}
              onChange={handleClientChange}
              autoComplete="address-level1"
            />

            <label htmlFor="edit_postal_code">ZIP / Postal Code</label>
            <input
              id="edit_postal_code"
              name="postal_code"
              value={clientForm.postal_code}
              onChange={handleClientChange}
              autoComplete="postal-code"
            />
          </fieldset>

          <button type="submit">Save Client</button>

          <button type="button" onClick={() => setIsEditingClient(false)}>
            Cancel
          </button>
        </form>
      ) : (
        <>
          <h2>
            {client.first_name} {client.last_name}
          </h2>

          <p>{client.email}</p>
          <p>{client.phone}</p>

          {[client.address_line1, client.address_line2, client.city, client.state, client.postal_code].some(
            Boolean
          ) && (
            <div className="client-address">
              <h3>Address</h3>

              <address>
                {client.address_line1 && <div>{client.address_line1}</div>}
                {client.address_line2 && <div>{client.address_line2}</div>}

                {(client.city || client.state || client.postal_code) && (
                  <div>
                    {[client.city, client.state].filter(Boolean).join(", ")}
                    {client.postal_code ? ` ${client.postal_code}` : ""}
                  </div>
                )}
              </address>
            </div>
          )}

          <button type="button" onClick={() => setIsEditingClient(true)}>
            Edit Client
          </button>
        </>
      )}

      <button type="button" onClick={handleCreateAppointment}>
        New Appointment
      </button>

      <h3>Service History</h3>

      <div>
        {client.appointments?.length > 0 ? (
          [...client.appointments]
            .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
            .map((appointment) => {
              const serviceDurationTotal =
                appointment.services?.reduce((total, service) => total + Number(service.duration_minutes ?? 0), 0) ?? 0;

              const endTime = calculateEndTime(appointment.scheduled_at, appointment.duration_minutes);

              const isPastAppointment = endTime < new Date();

              const appointmentContent = (
                <>
                  <div className="appointment-meta">
                    <strong>{formatDateTimeInTimezone(appointment.scheduled_at, currentAccount?.timezone)}</strong>

                    <div>Total appointment duration: {formatDuration(appointment.duration_minutes)}</div>

                    {appointment.duration_overridden && (
                      <div className="duration-override">
                        Manually overridden from the current service total of {formatDuration(serviceDurationTotal)}
                      </div>
                    )}
                  </div>

                  <div className="appointment-services">
                    {appointment.services?.length > 0 ? (
                      appointment.services.map((service) => (
                        <div key={service.id} className="service-entry">
                          <div className="service-title">{service.title}</div>

                          <div className="service-desc">{service.description}</div>

                          <div className="service-meta">
                            <span>${service.price}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="service-entry">No services recorded for this appointment.</div>
                    )}
                  </div>

                  {appointment.notes?.trim() && (
                    <div className="appointment-notes">
                      <strong>Appointment Notes:</strong>
                      <div style={{ whiteSpace: "pre-wrap" }}>{appointment.notes}</div>
                    </div>
                  )}
                </>
              );

              if (isPastAppointment) {
                return (
                  <div key={appointment.id} className="appointment-item past-appointment">
                    {appointmentContent}
                  </div>
                );
              }

              return (
                <button
                  key={appointment.id}
                  type="button"
                  className="appointment-item"
                  onClick={() => setEditingAppointment(appointment)}
                >
                  {appointmentContent}
                </button>
              );
            })
        ) : (
          <p>No services yet.</p>
        )}
      </div>

      {editingAppointment && (
        <AppointmentForm
          key={editingAppointment.id}
          currentUser={currentUser}
          currentAccount={currentAccount}
          existingAppointment={editingAppointment}
          onAppointmentUpdated={handleAppointmentUpdated}
          onCancel={handleCancelAppointmentEdit}
        />
      )}

      <h3>Notes</h3>

      <div>
        {client.notes?.length > 0 ? (
          client.notes.map((note) => (
            <div key={note.id}>
              {editingNoteId === note.id ? (
                <form onSubmit={handleUpdateNote}>
                  <textarea value={editingNoteBody} onChange={(event) => setEditingNoteBody(event.target.value)} />

                  <button type="submit">Save Note</button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingNoteId(null);
                      setEditingNoteBody("");
                    }}
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <>
                  <p>{note.body}</p>

                  <small>
                    {new Date(note.created_at).toLocaleString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </small>

                  <div>
                    <button type="button" onClick={() => startEditingNote(note)}>
                      Edit Note
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        ) : (
          <p>No notes yet.</p>
        )}
      </div>

      <h4>Add Note</h4>

      <form onSubmit={handleAddNote}>
        <label htmlFor={`note-${client.id}`}>Add note</label>

        <textarea id={`note-${client.id}`} value={noteBody} onChange={(event) => setNoteBody(event.target.value)} />

        <button type="submit">Save Note</button>
      </form>
    </section>
  );
}
