import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api.js";
import { toDateTimeLocalValue } from "../../utils/timezone.js";

export default function AppointmentForm({
  currentUser,
  currentAccount,
  initialClientId = "",
  existingAppointment = null,
  onAppointmentUpdated,
  onCancel,
}) {
  const navigate = useNavigate();
  const isEditing = Boolean(existingAppointment);

  const [services, setServices] = useState([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState(
    existingAppointment?.services?.map((service) => service.id) ?? []
  );

  const [resources, setResources] = useState([]);
  const [resourceId, setResourceId] = useState(existingAppointment?.resource_id ?? "");

  const [durationMinutes, setDurationMinutes] = useState(existingAppointment?.duration_minutes ?? "");

  const [isDurationOverridden, setIsDurationOverridden] = useState(existingAppointment?.duration_overridden ?? false);

  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState(existingAppointment?.client_id ?? initialClientId);

  const [scheduledAt, setScheduledAt] = useState(() => {
    if (!existingAppointment?.scheduled_at || !currentAccount?.timezone) {
      return "";
    }

    return toDateTimeLocalValue(existingAppointment.scheduled_at, currentAccount.timezone);
  });

  const [status, setStatus] = useState(existingAppointment?.status ?? "scheduled");

  const [error, setError] = useState("");

  const [newClient, setNewClient] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });

  const isNewClient = clientId === "new";

  const selectedServices = services.filter((service) => selectedServiceIds.includes(service.id));

  const selectedServiceDurationTotal = selectedServices.reduce(
    (total, service) => total + Number(service.duration_minutes ?? 0),
    0
  );

  useEffect(() => {
    apiFetch("/api/v1/dashboard")
      .then((data) => {
        setClients(data.clients ?? []);
      })
      .catch((requestError) => {
        setClients([]);
        setError(requestError.message);
      });

    apiFetch("/api/v1/services")
      .then((data) => {
        setServices(data ?? []);
      })
      .catch((requestError) => {
        setServices([]);
        setError(requestError.message);
      });

    apiFetch("/api/v1/resources")
      .then((data) => {
        setResources(data ?? []);
      })
      .catch((requestError) => {
        setResources([]);
        setError(requestError.message);
      });
  }, [currentUser.id]);

  function handleNewClientChange(event) {
    const { name, value } = event.target;

    setNewClient((currentClient) => ({
      ...currentClient,
      [name]: value,
    }));
  }

  function calculateDuration(serviceIds) {
    return services
      .filter((service) => serviceIds.includes(service.id))
      .reduce((total, service) => total + Number(service.duration_minutes ?? 0), 0);
  }

  function handleServiceToggle(serviceId) {
    const updatedServiceIds = selectedServiceIds.includes(serviceId)
      ? selectedServiceIds.filter((id) => id !== serviceId)
      : [...selectedServiceIds, serviceId];

    setSelectedServiceIds(updatedServiceIds);

    if (!isDurationOverridden) {
      setDurationMinutes(calculateDuration(updatedServiceIds));
    }
  }

  function handleDurationChange(event) {
    setDurationMinutes(event.target.value);
    setIsDurationOverridden(true);
  }

  function useCalculatedDuration() {
    setDurationMinutes(selectedServiceDurationTotal);
    setIsDurationOverridden(false);
  }

  function saveAppointment(selectedClientId) {
    const url = isEditing ? `/api/v1/appointments/${existingAppointment.id}` : "/api/v1/appointments";

    const method = isEditing ? "PATCH" : "POST";

    return apiFetch(url, {
      method,
      body: JSON.stringify({
        appointment: {
          client_id: Number(selectedClientId),
          resource_id: Number(resourceId),
          scheduled_at: scheduledAt,
          status,
          duration_minutes: Number(durationMinutes),
          duration_overridden: isDurationOverridden,
          service_ids: selectedServiceIds.map(Number),
        },
      }),
    });
  }

  function handleCancel() {
    if (onCancel) {
      onCancel();
      return;
    }

    navigate(-1);
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!clientId) {
      setError("Select a client.");
      return;
    }

    if (isNewClient && !newClient.first_name.trim()) {
      setError("Enter the new client's first name.");
      return;
    }

    if (isNewClient && !newClient.last_name.trim()) {
      setError("Enter the new client's last name.");
      return;
    }

    if (selectedServiceIds.length === 0) {
      setError("Select at least one service.");
      return;
    }

    if (!scheduledAt) {
      setError("Select an appointment date and time.");
      return;
    }

    if (!resourceId) {
      setError("Select a resource.");
      return;
    }

    if (durationMinutes === "") {
      setError("Unable to calculate the appointment duration.");
      return;
    }

    const parsedDuration = Number(durationMinutes);

    if (!Number.isInteger(parsedDuration) || parsedDuration < 0) {
      setError("Duration must be a whole number of 0 minutes or more.");
      return;
    }

    if (isNewClient) {
      apiFetch("/api/v1/clients", {
        method: "POST",
        body: JSON.stringify({
          client: {
            ...newClient,
          },
        }),
      })
        .then((createdClient) => saveAppointment(createdClient.id).then(() => createdClient))
        .then((createdClient) => {
          navigate(`/clients/${createdClient.id}`);
        })
        .catch((requestError) => {
          setError(requestError.message);
        });

      return;
    }

    saveAppointment(clientId)
      .then(() => {
        if (isEditing && onAppointmentUpdated) {
          onAppointmentUpdated();
          return;
        }

        navigate(`/clients/${clientId}`);
      })
      .catch((requestError) => {
        setError(
          requestError.validationErrors?.[0]?.message ||
            requestError.validationErrors?.[0]?.message ||
            requestError.message
        );
      });
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>{isEditing ? "Edit Appointment" : "New Appointment"}</h2>

      {error && <p className="error">{error}</p>}

      <label htmlFor="client">Client</label>

      <select id="client" value={clientId} onChange={(event) => setClientId(event.target.value)}>
        <option value="">Select a client</option>

        {!isEditing && <option value="new">+ New Client</option>}

        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.first_name} {client.last_name}
          </option>
        ))}
      </select>

      {isNewClient && (
        <div>
          <label htmlFor="first_name">First Name</label>

          <input id="first_name" name="first_name" value={newClient.first_name} onChange={handleNewClientChange} />

          <label htmlFor="last_name">Last Name</label>

          <input id="last_name" name="last_name" value={newClient.last_name} onChange={handleNewClientChange} />

          <label htmlFor="email">Email</label>

          <input id="email" name="email" type="email" value={newClient.email} onChange={handleNewClientChange} />

          <label htmlFor="phone">Phone</label>

          <input id="phone" name="phone" value={newClient.phone} onChange={handleNewClientChange} />
        </div>
      )}

      <h3>Services</h3>

      {services.map((service) => (
        <label key={service.id}>
          <input
            type="checkbox"
            checked={selectedServiceIds.includes(service.id)}
            onChange={() => handleServiceToggle(service.id)}
          />
          {service.title} - ${service.price} - {service.duration_minutes ?? 0} min
        </label>
      ))}

      {selectedServiceIds.length > 0 && <p>Service total: {selectedServiceDurationTotal} minutes</p>}

      <label htmlFor="scheduled_at">Scheduled At</label>

      <input
        id="scheduled_at"
        type="datetime-local"
        value={scheduledAt}
        onChange={(event) => setScheduledAt(event.target.value)}
      />

      <label htmlFor="resource">Resource</label>

      <select id="resource" value={resourceId} onChange={(event) => setResourceId(event.target.value)}>
        <option value="">Select a resource</option>

        {resources.map((resource) => (
          <option key={resource.id} value={resource.id}>
            {resource.name}
          </option>
        ))}
      </select>

      <label htmlFor="duration_minutes">Total Appointment Duration</label>

      <input
        id="duration_minutes"
        type="number"
        min="0"
        step="1"
        value={durationMinutes}
        onChange={handleDurationChange}
        placeholder="Total time in minutes"
      />

      {isDurationOverridden && (
        <div>
          <p>Duration has been manually changed from the service total of {selectedServiceDurationTotal} minutes.</p>

          <button type="button" onClick={useCalculatedDuration}>
            Use Service Total ({selectedServiceDurationTotal} minutes)
          </button>
        </div>
      )}

      {isEditing && (
        <>
          <label htmlFor="status">Status</label>

          <select id="status" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="canceled">Canceled</option>
          </select>
        </>
      )}

      <button type="submit">{isEditing ? "Update Appointment" : "Create Appointment"}</button>

      <button type="button" onClick={handleCancel}>
        Cancel
      </button>
    </form>
  );
}
