import { useState } from "react";
import { apiFetch } from "../../utils/api.js";

export default function ServiceForm({ existingService = null, onServiceCreated, onServiceUpdated, onServiceDeleted }) {
  const isEditing = Boolean(existingService);

  const blankService = {
    title: "",
    description: "",
    duration_minutes: "",
    price: "",
  };

  const [service, setService] = useState({
    title: existingService?.title || "",
    description: existingService?.description || "",
    duration_minutes: existingService?.duration_minutes || "",
    price: existingService?.price || "",
  });

  const [error, setError] = useState("");

  function handleChange(event) {
    setService({
      ...service,
      [event.target.name]: event.target.value,
    });

    setError("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const url = isEditing ? `/api/v1/services/${existingService.id}` : "/api/v1/services";

    const method = isEditing ? "PATCH" : "POST";

    apiFetch(url, {
      method,
      body: JSON.stringify({
        service,
      }),
    })
      .then((savedService) => {
        if (isEditing) {
          onServiceUpdated?.(savedService);
        } else {
          onServiceCreated?.(savedService);
          setService(blankService);
        }
      })
      .catch((error) => {
        setError(error.message || "Service could not be saved.");
      });
  }

  function handleDelete() {
    if (!existingService) return;

    apiFetch(`/api/v1/services/${existingService.id}`, {
      method: "DELETE",
    })
      .then(() => {
        onServiceDeleted?.(existingService.id);
        setService(blankService);
      })
      .catch((error) => {
        setError(error.message || "Service could not be deleted.");
      });
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>{isEditing ? "Edit Service" : "New Service"}</h3>

      {error && <p className="error">{error}</p>}

      <label htmlFor="service-title">Service Name</label>
      <input id="service-title" name="title" value={service.title} onChange={handleChange} />

      <label htmlFor="service-description">Description</label>
      <textarea id="service-description" name="description" value={service.description} onChange={handleChange} />

      <label htmlFor="service-duration">Duration in Minutes</label>
      <input
        id="service-duration"
        name="duration_minutes"
        type="number"
        value={service.duration_minutes}
        onChange={handleChange}
      />

      <label htmlFor="service-price">Price</label>
      <input id="service-price" name="price" type="number" step="0.01" value={service.price} onChange={handleChange} />

      <button type="submit">{isEditing ? "Update Service" : "Save Service"}</button>

      {isEditing && (
        <button type="button" onClick={handleDelete}>
          Delete Service
        </button>
      )}
    </form>
  );
}
