import { useEffect, useRef, useState } from "react";

import { apiFetch } from "../utils/api.js";
import ServiceForm from "./forms/ServiceForm.jsx";

export default function ServicesList({ currentUser }) {
  const servicesRef = useRef(null);

  const [services, setServices] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [selectedService, setSelectedService] = useState(null);

  const isOwner = currentUser?.role === "owner";

  useEffect(() => {
    apiFetch("/api/v1/services")
      .then((data) => {
        setServices(data);
        setErrorMessage("");
      })
      .catch((error) => {
        setServices([]);
        setErrorMessage(error.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (servicesRef.current && !servicesRef.current.contains(event.target)) {
        setSelectedService(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleNewService() {
    setEditingService(null);
    setSelectedService(null);
    setShowServiceForm((current) => !current);
  }

  function handleEditService(service) {
    setEditingService(service);
    setSelectedService(null);
    setShowServiceForm(true);
  }

  function handleServiceCreated(createdService) {
    setServices((currentServices) => [...currentServices, createdService]);

    setEditingService(null);
    setShowServiceForm(false);
  }

  function handleServiceUpdated(updatedService) {
    setServices((currentServices) =>
      currentServices.map((service) => (service.id === updatedService.id ? updatedService : service))
    );

    setEditingService(null);
    setSelectedService(null);
    setShowServiceForm(false);
  }

  function handleServiceDeleted(deletedServiceId) {
    setServices((currentServices) => currentServices.filter((service) => service.id !== deletedServiceId));

    setEditingService(null);
    setSelectedService(null);
    setShowServiceForm(false);
  }

  function handleServiceSelect(service) {
    setSelectedService((currentService) => (currentService?.id === service.id ? null : service));
  }

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <main ref={servicesRef}>
      <h1>Services</h1>

      {errorMessage && <p className="error">{errorMessage}</p>}

      {isOwner && (
        <button type="button" onClick={handleNewService}>
          {showServiceForm && !editingService ? "Cancel" : "New Service"}
        </button>
      )}

      {isOwner && showServiceForm && (
        <ServiceForm
          key={editingService?.id || "new"}
          currentUser={currentUser}
          existingService={editingService}
          onServiceCreated={handleServiceCreated}
          onServiceUpdated={handleServiceUpdated}
          onServiceDeleted={handleServiceDeleted}
        />
      )}

      <div className="services-list">
        {services.length > 0 ? (
          services.map((service) => (
            <div key={service.id} className="service-list-row">
              <div className="service-list-main">
                <button type="button" className="service-list-title" onClick={() => handleServiceSelect(service)}>
                  {service.title}
                </button>

                <span className="service-list-meta">
                  — ${service.price}
                  {" — "}
                  {service.duration_minutes} minutes
                </span>

                {isOwner && (
                  <button type="button" className="service-edit-button" onClick={() => handleEditService(service)}>
                    Edit
                  </button>
                )}
              </div>

              {selectedService?.id === service.id && (
                <div className="service-description">{service.description || "No description available."}</div>
              )}
            </div>
          ))
        ) : (
          <p>No services yet.</p>
        )}
      </div>
    </main>
  );
}
