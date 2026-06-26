import { removeToken } from "../utils/auth.js";
import { useNavigate } from "react-router-dom";

export default function LogOut({ setCurrentUser }) {
  const navigate = useNavigate();

  function handleLogout() {
    removeToken();
    setCurrentUser(null);
    navigate("/");
  }

  return <button onClick={handleLogout}>Log Out</button>;
}
