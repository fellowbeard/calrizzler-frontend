import { useEffect, useState } from "react";

import { apiFetch } from "../utils/api.js";
import ResourceForm from "./forms/ResourceForm.jsx";

export default function ResourcesList({ currentUser }) {
  const [resources, setResources] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [showResourceForm, setShowResourceForm] = useState(false);
  const [editingResource, setEditingResource] = useState(null);

  const isOwner = currentUser?.role === "owner";

  useEffect(() => {
    apiFetch("/api/v1/resources")
      .then((data) => {
        setResources(data);
        setErrorMessage("");
      })
      .catch((error) => {
        setResources([]);
        setErrorMessage(error.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  function handleNewResource() {
    setEditingResource(null);
    setShowResourceForm((current) => !current);
  }

  function handleEditResource(resource) {
    setEditingResource(resource);
    setShowResourceForm(true);
  }

  function handleResourceCreated(createdResource) {
    setResources((currentResources) => [...currentResources, createdResource]);

    setEditingResource(null);
    setShowResourceForm(false);
  }

  function handleResourceUpdated(updatedResource) {
    setResources((currentResources) =>
      currentResources.map((resource) => (resource.id === updatedResource.id ? updatedResource : resource))
    );

    setEditingResource(null);
    setShowResourceForm(false);
  }

  function handleResourceDeleted(deletedResourceId) {
    setResources((currentResources) => currentResources.filter((resource) => resource.id !== deletedResourceId));

    setEditingResource(null);
    setShowResourceForm(false);
  }

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <main>
      <h1>Resources</h1>

      {errorMessage && <p className="error">{errorMessage}</p>}

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

      <div className="resources-list">
        {resources.length > 0 ? (
          resources.map((resource) => (
            <div key={resource.id} className="resource-list-row">
              <strong className="resource-list-title">{resource.name}</strong>

              {isOwner && (
                <button type="button" className="resource-edit-button" onClick={() => handleEditResource(resource)}>
                  Edit
                </button>
              )}
            </div>
          ))
        ) : (
          <p>No resources yet.</p>
        )}
      </div>
    </main>
  );
}
