import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../utils/api.js";
import ServiceForm from "./forms/ServiceForm.jsx";
import ResourceForm from "./forms/ResourceForm.jsx";
import AppointmentCalendar from "./AppointmentCalendar.jsx";

export default function UserDashboard({ currentUser }) {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [editingResource, setEditingResource] = useState(null);

  const fetchDashboard = useCallback(() => {
    apiFetch(`/api/v1/users/${currentUser.id}/dashboard`)
      .then((data) => {
        setDashboard(data);
        setErrorMessage("");
      })
      .catch((error) => {
        setDashboard(null);
        setErrorMessage(error.message);
      });
  }, [currentUser.id]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

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

  if (!dashboard && errorMessage) return <p className="error">{errorMessage}</p>;
  if (!dashboard) return <p>Loading...</p>;

  return (
    <main>
      {errorMessage && <p className="error">{errorMessage}</p>}
      <h1>{dashboard.account?.business_name} Dashboard</h1>

      <h2>
        Welcome, {dashboard.user?.first_name} {dashboard.user?.last_name}
      </h2>

      <div>
        <button onClick={handleNewAppointment}>New Appointment</button>
        <button onClick={handleNewClient}>New Client</button>
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

      <h3>Services</h3>

      <button
        onClick={() => {
          setEditingService(null);
          setShowServiceForm(!showServiceForm);
        }}
      >
        {showServiceForm ? "Cancel" : "New Service"}
      </button>

      {showServiceForm && (
        <ServiceForm
          key={editingService ? editingService.id : "new"}
          currentUser={currentUser}
          existingService={editingService}
          onServiceCreated={(createdService) => {
            setDashboard({
              ...dashboard,
              services: [...(dashboard.services || []), createdService],
            });

            setShowServiceForm(false);
          }}
          onServiceUpdated={(updatedService) => {
            setDashboard({
              ...dashboard,
              services: dashboard.services.map((service) =>
                service.id === updatedService.id ? updatedService : service
              ),
            });

            setEditingService(null);
            setShowServiceForm(false);
          }}
          onServiceDeleted={(deletedServiceId) => {
            setDashboard({
              ...dashboard,
              services: dashboard.services.filter((service) => service.id !== deletedServiceId),
            });

            setEditingService(null);
            setShowServiceForm(false);
          }}
        />
      )}

      <div>
        {dashboard.services?.length > 0 ? (
          dashboard.services.map((service) => (
            <div key={service.id}>
              <strong>{service.title}</strong> — ${service.price} — {service.duration_minutes} minutes
              <button
                onClick={() => {
                  setEditingService(service);
                  setShowServiceForm(true);
                }}
              >
                Edit
              </button>
            </div>
          ))
        ) : (
          <p>No services yet.</p>
        )}
      </div>

      <h3>Resources</h3>

      <button
        onClick={() => {
          setEditingResource(null);
          setShowResourceForm(!showResourceForm);
        }}
      >
        {showResourceForm ? "Cancel" : "New Resource"}
      </button>

      {showResourceForm && (
        <ResourceForm
          key={editingResource ? editingResource.id : "new"}
          existingResource={editingResource}
          onResourceCreated={(createdResource) => {
            setDashboard({
              ...dashboard,
              resources: [...(dashboard.resources || []), createdResource],
            });

            setShowResourceForm(false);
          }}
          onResourceUpdated={(updatedResource) => {
            setDashboard({
              ...dashboard,
              resources: dashboard.resources.map((resource) =>
                resource.id === updatedResource.id ? updatedResource : resource
              ),
            });

            setEditingResource(null);
            setShowResourceForm(false);
          }}
          onResourceDeleted={(deletedResourceId) => {
            setDashboard({
              ...dashboard,
              resources: dashboard.resources.filter((resource) => resource.id !== deletedResourceId),
            });

            setEditingResource(null);
            setShowResourceForm(false);
          }}
        />
      )}

      <div>
        {dashboard.resources?.length > 0 ? (
          dashboard.resources.map((resource) => (
            <div key={resource.id}>
              <strong>{resource.name}</strong>
              <button
                onClick={() => {
                  setEditingResource(resource);
                  setShowResourceForm(true);
                }}
              >
                Edit
              </button>
            </div>
          ))
        ) : (
          <p>No resources yet.</p>
        )}
      </div>

      <AppointmentCalendar
        appointments={dashboard.appointments || []}
        currentUser={currentUser}
        onAppointmentUpdate={fetchDashboard}
      />
    </main>
  );
}
