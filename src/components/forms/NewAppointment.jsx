import { useSearchParams } from "react-router-dom";
import AppointmentForm from "./AppointmentForm.jsx";

export default function NewAppointment({ currentUser }) {
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get("client_id") || "";

  return <AppointmentForm currentUser={currentUser} initialClientId={clientId} />;
}
