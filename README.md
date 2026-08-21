# Calrizzler Web

Web frontend for **Calrizzler**, a scheduling and client-management application for service-based businesses.

The application communicates with the Calrizzler Rails API and provides browser-based tools for managing clients, services, resources, appointments, users, and account settings.

## Tech Stack

- React
- JavaScript
- React Router
- REST API
- JWT authentication

## Features

### Authentication

Users authenticate against the Calrizzler API.

After login, the application stores the returned authentication token and uses it for protected API requests.

The frontend uses a shared `apiFetch` utility to handle:

- API URLs
- authentication headers
- JSON parsing
- structured API errors
- validation errors

Example:

```js
apiFetch("/api/v1/dashboard");
```

Authenticated requests automatically include the user's bearer token.

Public requests such as login can disable authentication:

```js
apiFetch("/api/v1/login", {
  method: "POST",
  auth: false,
});
```

### Dashboard

The dashboard provides the main authenticated view of the user's business and scheduling information.

### Clients

Users can:

- view clients
- create clients
- edit clients
- use clients when creating appointments

New clients can also be created during the appointment workflow.

### Services

Services define the work offered by the business.

Each service can include a duration that contributes to the calculated duration of an appointment.

### Resources

Appointments can be assigned to a resource.

Resources represent whatever must be reserved for an appointment, such as a person, room, station, or piece of equipment.

### Appointments

The appointment form supports:

- client selection
- resource selection
- date and time
- multiple services
- calculated duration
- manual duration override
- appointment status

When services are selected, their durations are combined to calculate the expected appointment length.

Users can manually override that duration when necessary and revert to the calculated duration.

### Account Settings

Account owners can manage business-level settings.

Account-level changes are protected by backend authorization and are only available to users with the appropriate role.

### Permissions

The UI recognizes the permissions associated with the current user.

Users may have:

```text
owner
staff
read_only
```

Write actions can be hidden or restricted for users without write access, while the Rails API remains the authoritative authorization layer.

## API Errors

The frontend normalizes errors returned by the Rails API.

For example, a backend validation error can be transformed into a structure the UI can use to display field-specific feedback.

```js
{
  status: 422,
  code: "validation_failed",
  validationErrors: [
    {
      field: "first_name",
      type: "invalid",
      message: "First name can't be blank"
    }
  ]
}
```

This keeps API error handling consistent across forms.

## Testing

Frontend tests verify shared application behavior such as the API client.

Tests cover scenarios including:

- adding authentication headers
- making public requests
- parsing successful JSON responses
- normalizing validation errors
- handling non-JSON server failures

## Development

Install dependencies:

```bash
npm install
```

Start the development server using the development script configured in `package.json`.

The Rails API should also be running for normal local development.

## Application Structure

The frontend is organized around reusable pages, forms, and API utilities.

Typical application areas include:

```text
src/
├── components/
├── pages/
├── utils/
└── App.jsx
```

## Backend

This application requires the Calrizzler Rails API.

The API provides authentication and all persistent application data, including:

- accounts
- users
- clients
- services
- resources
- appointments
- notes

Authorization and account isolation are enforced by the backend rather than relying solely on frontend restrictions.

## Current Development

Current work is focused on improving:

- appointment scheduling
- timezone handling
- calendar behavior
- validation feedback
- testing
- account settings
- scheduling workflows
