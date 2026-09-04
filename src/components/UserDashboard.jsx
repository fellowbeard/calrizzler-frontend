import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { apiFetch } from "../utils/api.js";
import AppointmentCalendar from "./AppointmentCalendar.jsx";
import ResourceForm from "./forms/ResourceForm.jsx";
import ServiceForm from "./forms/ServiceForm.jsx";

export default function UserDashboard({ currentUser, currentAccount }) {
  const navigate = useNavigate();
  const servicesRef = useRef(null);

  const [dashboard, setDashboard] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [selectedService, setSelectedService] = useState(null);

  const [showResourceForm, setShowResourceForm] = useState(false);
  const [editingResource, setEditingResource] = useState(null);

  const isOwner = currentUser?.role === "owner";

  const fetchDashboard = useCallback(() => {
    apiFetch("/api/v1/dashboard")
      .then((data) => {
        setDashboard(data);
        setErrorMessage("");
      })
      .catch((error) => {
        setDashboard(null);
        setErrorMessage(error.message);
      });
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

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

  function handleClientSelect(event) {
    const clientId = event.target.value;

    if (clientId) {
      navigate(`/clients/${clientId}`);
    }
  }

  function handleNewAppointment() {
    navigate("/appointments/new");
  }

  function handleNewClient() {
    navigate("/clients/new");
  }

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
    setDashboard((currentDashboard) => ({
      ...currentDashboard,
      services: [...(currentDashboard.services || []), createdService],
    }));

    setEditingService(null);
    setShowServiceForm(false);
  }

  function handleServiceUpdated(updatedService) {
    setDashboard((currentDashboard) => ({
      ...currentDashboard,
      services: currentDashboard.services.map((service) =>
        service.id === updatedService.id ? updatedService : service
      ),
    }));

    setEditingService(null);
    setSelectedService(null);
    setShowServiceForm(false);
  }

  function handleServiceDeleted(deletedServiceId) {
    setDashboard((currentDashboard) => ({
      ...currentDashboard,
      services: currentDashboard.services.filter((service) => service.id !== deletedServiceId),
    }));

    setEditingService(null);
    setSelectedService(null);
    setShowServiceForm(false);
  }

  function handleServiceSelect(service) {
    setSelectedService((currentService) => (currentService?.id === service.id ? null : service));
  }

  function handleNewResource() {
    setEditingResource(null);
    setShowResourceForm((current) => !current);
  }

  function handleEditResource(resource) {
    setEditingResource(resource);
    setShowResourceForm(true);
  }

  function handleResourceCreated(createdResource) {
    setDashboard((currentDashboard) => ({
      ...currentDashboard,
      resources: [...(currentDashboard.resources || []), createdResource],
    }));

    setEditingResource(null);
    setShowResourceForm(false);
  }

  function handleResourceUpdated(updatedResource) {
    setDashboard((currentDashboard) => ({
      ...currentDashboard,
      resources: currentDashboard.resources.map((resource) =>
        resource.id === updatedResource.id ? updatedResource : resource
      ),
    }));

    setEditingResource(null);
    setShowResourceForm(false);
  }

  function handleResourceDeleted(deletedResourceId) {
    setDashboard((currentDashboard) => ({
      ...currentDashboard,
      resources: currentDashboard.resources.filter((resource) => resource.id !== deletedResourceId),
    }));

    setEditingResource(null);
    setShowResourceForm(false);
  }

  if (!dashboard && errorMessage) {
    return <p className="error">{errorMessage}</p>;
  }

  if (!dashboard) {
    return <p>Loading...</p>;
  }

  return (
    <main>
      {errorMessage && <p className="error">{errorMessage}</p>}

      <h1>{dashboard.account?.business_name}</h1>

      <h2>
        Welcome, {dashboard.user?.first_name} {dashboard.user?.last_name}
      </h2>

      <div>
        <button type="button" onClick={handleNewAppointment}>
          New Appointment
        </button>

        <button type="button" onClick={handleNewClient}>
          New Client
        </button>
      </div>

      <h3>Recent Clients</h3>

      <div>
        {dashboard.recent_clients?.map((client) => (
          <div key={client.id}>
            <Link to={`/clients/${client.id}`}>
              {client.first_name} {client.last_name}
            </Link>
          </div>
        ))}
      </div>

      <h3>Find Client</h3>

      <select defaultValue="" onChange={handleClientSelect}>
        <option value="" disabled>
          Select a client
        </option>

        {dashboard.clients?.map((client) => (
          <option key={client.id} value={client.id}>
            {client.first_name} {client.last_name}
          </option>
        ))}
      </select>

      <section ref={servicesRef}>
        <h3>Services</h3>

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

        <div>
          {dashboard.services?.length > 0 ? (
            dashboard.services.map((service) => (
              <div key={service.id}>
                <button type="button" className="service-title-button" onClick={() => handleServiceSelect(service)}>
                  <strong>{service.title}</strong>
                </button>
                {" — "}${service.price}
                {" — "}
                {service.duration_minutes} minutes
                {isOwner && (
                  <button type="button" onClick={() => handleEditService(service)}>
                    Edit
                  </button>
                )}
                {selectedService?.id === service.id && (
                  <div className="service-description">{service.description || "No description available."}</div>
                )}
              </div>
            ))
          ) : (
            <p>No services yet.</p>
          )}
        </div>
      </section>

      <section>
        <h3>Resources</h3>

        {isOwner && (
          <button type="button" onClick={handleNewResource}>
            {showResourceForm && !editingResource ? "Cancel" : "New Resource"}
          </button>
        )}

        {isOwner && showResourceForm && (
          <ResourceForm
            key={editingResource?.id || "new"}
            existingResource={editingResource}
            onResourceCreated={handleResourceCreated}
            onResourceUpdated={handleResourceUpdated}
            onResourceDeleted={handleResourceDeleted}
          />
        )}

        <div>
          {dashboard.resources?.length > 0 ? (
            dashboard.resources.map((resource) => (
              <div key={resource.id}>
                <strong>{resource.name}</strong>

                {isOwner && (
                  <button type="button" onClick={() => handleEditResource(resource)}>
                    Edit
                  </button>
                )}
              </div>
            ))
          ) : (
            <p>No resources yet.</p>
          )}
        </div>
      </section>

      <AppointmentCalendar
        appointments={dashboard.appointments || []}
        currentUser={currentUser}
        currentAccount={currentAccount}
        onAppointmentUpdate={fetchDashboard}
      />
    </main>
  );
}
