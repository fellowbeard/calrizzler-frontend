// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AppointmentForm from "./AppointmentForm.jsx";
import { apiFetch } from "../../utils/api.js";

const navigate = vi.fn();

vi.mock("../../utils/api.js", () => ({
  apiFetch: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
}));

describe("AppointmentForm", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    apiFetch.mockImplementation((url) => {
      if (url === "/api/v1/dashboard") {
        return Promise.resolve({
          clients: [{ id: 1, first_name: "Jane", last_name: "Doe" }],
        });
      }

      if (url === "/api/v1/services") {
        return Promise.resolve([{ id: 2, title: "Consultation", price: 100, duration_minutes: 45 }]);
      }

      if (url === "/api/v1/resources") {
        return Promise.resolve([{ id: 3, name: "Room A" }]);
      }

      return Promise.resolve({});
    });
  });

  it("shows a validation message when submitted without a client", async () => {
    const user = userEvent.setup();

    render(<AppointmentForm currentUser={{ id: 10 }} currentAccount={{ timezone: "America/New_York" }} />);

    await screen.findByRole("option", { name: "Jane Doe" });
    await user.click(screen.getByRole("button", { name: "Create Appointment" }));

    expect(screen.getByText("Select a client.")).toBeTruthy();
    expect(apiFetch).toHaveBeenCalledTimes(3);
  });

  it("submits a valid appointment and navigates to the client", async () => {
    const user = userEvent.setup();
    apiFetch.mockImplementation((url, options) => {
      if (url === "/api/v1/dashboard") {
        return Promise.resolve({ clients: [{ id: 1, first_name: "Jane", last_name: "Doe" }] });
      }

      if (url === "/api/v1/services") {
        return Promise.resolve([{ id: 2, title: "Consultation", price: 100, duration_minutes: 45 }]);
      }

      if (url === "/api/v1/resources") {
        return Promise.resolve([{ id: 3, name: "Room A" }]);
      }

      expect(url).toBe("/api/v1/appointments");
      expect(options.method).toBe("POST");
      return Promise.resolve({ id: 20 });
    });

    render(<AppointmentForm currentUser={{ id: 10 }} currentAccount={{ timezone: "America/New_York" }} />);

    await user.selectOptions(await screen.findByLabelText("Client"), "1");
    await user.click(await screen.findByLabelText(/Consultation/));
    await user.selectOptions(screen.getByLabelText("Resource"), "3");
    fireEvent.change(screen.getByLabelText("Scheduled At"), { target: { value: "2027-01-15T22:30" } });
    await user.click(screen.getByRole("button", { name: "Create Appointment" }));

    expect(apiFetch).toHaveBeenCalledWith(
      "/api/v1/appointments",
      expect.objectContaining({ method: "POST" })
    );
    expect(navigate).toHaveBeenCalledWith("/clients/1");
  });
});
