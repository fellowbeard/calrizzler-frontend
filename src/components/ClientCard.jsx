import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppointmentForm from "./forms/AppointmentForm.jsx";
import { apiFetch } from "../utils/api.js";

export default function ClientCard({ currentUser }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [clientForm, setClientForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
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
            .sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at))
            .map((appointment) => (
              <button
                key={appointment.id}
                type="button"
                className="appointment-item"
                onClick={() => setEditingAppointment(appointment)}
              >
                <div className="appointment-meta">
                  <strong>
                    {new Date(appointment.scheduled_at).toLocaleString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </strong>
                </div>

                <div className="appointment-services">
                  {appointment.services?.length > 0 ? (
                    appointment.services.map((svc) => (
                      <div key={svc.id} className="service-entry">
                        <div className="service-title">{svc.title}</div>
                        <div className="service-desc">{svc.description}</div>
                        <div className="service-meta">
                          <span>${svc.price}</span>
                          <span> • {svc.duration_minutes} minutes</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="service-entry">No services recorded for this appointment.</div>
                  )}
                </div>
              </button>
            ))
        ) : (
          <p>No services yet.</p>
        )}
      </div>

      {editingAppointment && (
        <AppointmentForm
          currentUser={currentUser}
          existingAppointment={editingAppointment}
          onAppointmentUpdated={handleAppointmentUpdated}
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
