import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiFetch } from "../../utils/api.js";
import { toDateTimeLocalValue } from "../../utils/timezone.js";
import { formatDuration } from "../../utils/duration.js";

function formatSlotTime(value) {
  const time = value.split("T")[1]?.slice(0, 5) || value.slice(0, 5);
  const [hours, minutes] = time.split(":").map(Number);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return value;
  }

  const period = hours >= 12 ? "PM" : "AM";

  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${period}`;
}

function normalizeSlot(slot, date, timezone) {
  const raw = typeof slot === "string" ? slot : (slot?.starts_at ?? slot?.start ?? slot?.start_time ?? slot?.time);

  if (typeof raw !== "string") return null;

  if (/^\d{2}:\d{2}/.test(raw)) {
    return `${date}T${raw.slice(0, 5)}`;
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) {
    return raw;
  }

  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
    return toDateTimeLocalValue(raw, timezone);
  }

  return null;
}

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

  const [appointmentDate, setAppointmentDate] = useState(scheduledAt.slice(0, 10));

  const [availabilityResult, setAvailabilityResult] = useState(null);

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

  const parsedDuration = Number(durationMinutes);

  const hasValidAvailabilityInputs =
    !isEditing &&
    Boolean(appointmentDate) &&
    Boolean(resourceId) &&
    durationMinutes !== "" &&
    Number.isInteger(parsedDuration) &&
    parsedDuration > 0;

  const availabilityKey = hasValidAvailabilityInputs ? `${appointmentDate}|${resourceId}|${parsedDuration}` : "";

  const availabilityIsCurrent = hasValidAvailabilityInputs && availabilityResult?.key === availabilityKey;

  const isLoadingSlots = hasValidAvailabilityInputs && !availabilityIsCurrent;

  const availableSlots = availabilityIsCurrent ? availabilityResult.slots : [];

  const availabilityError = availabilityIsCurrent ? availabilityResult.error : "";

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

  useEffect(() => {
    if (!availabilityKey) return;

    let active = true;

    const params = new URLSearchParams({
      date: appointmentDate,
      duration_minutes: String(parsedDuration),
      resource_id: String(resourceId),
    });

    apiFetch(`/api/v1/availability?${params.toString()}`)
      .then((data) => {
        if (!active) return;

        const slots = (data.slots ?? [])
          .map((slot) => normalizeSlot(slot, appointmentDate, data.timezone || currentAccount?.timezone))
          .filter(Boolean);

        setAvailabilityResult({
          key: availabilityKey,
          slots,
          error: "",
        });
      })
      .catch((requestError) => {
        if (!active) return;

        setAvailabilityResult({
          key: availabilityKey,
          slots: [],
          error: requestError.message || "Unable to load available times.",
        });
      });

    return () => {
      active = false;
    };
  }, [availabilityKey, appointmentDate, parsedDuration, resourceId, currentAccount?.timezone]);

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

    if (!isEditing) {
      setScheduledAt("");
      setAvailabilityResult(null);
    }
  }

  function handleDurationChange(event) {
    setDurationMinutes(event.target.value);
    setIsDurationOverridden(true);

    if (!isEditing) {
      setScheduledAt("");
      setAvailabilityResult(null);
    }
  }

  function useCalculatedDuration() {
    setDurationMinutes(selectedServiceDurationTotal);
    setIsDurationOverridden(false);

    if (!isEditing) {
      setScheduledAt("");
      setAvailabilityResult(null);
    }
  }

  function handleDateChange(event) {
    setAppointmentDate(event.target.value);
    setScheduledAt("");
    setAvailabilityResult(null);
  }

  function handleResourceChange(event) {
    setResourceId(event.target.value);

    if (!isEditing) {
      setScheduledAt("");
      setAvailabilityResult(null);
    }
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
      setError("Select an available appointment time.");
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

    if (!Number.isInteger(parsedDuration) || parsedDuration < 0) {
      setError("Duration must be a whole number of 0 minutes or more.");
      return;
    }

    if (!isEditing && (isLoadingSlots || !availableSlots.includes(scheduledAt))) {
      setError("Select a currently available appointment time.");
      return;
    }

    if (isNewClient) {
      apiFetch("/api/v1/clients", {
        method: "POST",
        body: JSON.stringify({
          client: { ...newClient },
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
        const pastAppointmentError = requestError.validationErrors?.some(
          (validationError) =>
            validationError.field === "scheduled_at" && validationError.message === "cannot be scheduled in the past"
        );

        if (pastAppointmentError) {
          setError("You cannot schedule an appointment in the past. Please select a future date and time.");
          return;
        }

        setError(
          requestError.validationErrors?.[0]?.message || requestError.message || "Appointment could not be saved."
        );
      });
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>{isEditing ? "Edit Appointment" : "New Appointment"}</h2>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

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
          {service.title} - ${service.price} - {formatDuration(service.duration_minutes ?? 0)}
        </label>
      ))}

      {selectedServiceIds.length > 0 && <p>Service total: {formatDuration(selectedServiceDurationTotal)}</p>}

      <label htmlFor="resource">Resource</label>

      <select id="resource" value={resourceId} onChange={handleResourceChange}>
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

      {durationMinutes !== "" && <p>Appointment duration: {formatDuration(durationMinutes)}</p>}

      {isDurationOverridden && (
        <div>
          <p>
            Duration has been manually changed from the service total of {formatDuration(selectedServiceDurationTotal)}.
          </p>

          <button type="button" onClick={useCalculatedDuration}>
            Use Service Total ({formatDuration(selectedServiceDurationTotal)})
          </button>
        </div>
      )}

      {isEditing ? (
        <>
          <label htmlFor="scheduled_at">Scheduled At</label>

          <input
            id="scheduled_at"
            type="datetime-local"
            value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
          />
        </>
      ) : (
        <>
          <label htmlFor="appointment_date">Appointment Date</label>

          <input id="appointment_date" type="date" value={appointmentDate} onChange={handleDateChange} />

          <label htmlFor="available_time">Available Time</label>

          <select
            id="available_time"
            value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
            disabled={!hasValidAvailabilityInputs || isLoadingSlots || Boolean(availabilityError)}
          >
            <option value="">{isLoadingSlots ? "Loading available times..." : "Select a time"}</option>

            {availableSlots.map((slot) => (
              <option key={slot} value={slot}>
                {formatSlotTime(slot)}
              </option>
            ))}
          </select>

          {availabilityError && (
            <p className="error" role="alert">
              {availabilityError}
            </p>
          )}

          {hasValidAvailabilityInputs && !isLoadingSlots && !availabilityError && availableSlots.length === 0 && (
            <p>No available times for this date and duration.</p>
          )}
        </>
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
