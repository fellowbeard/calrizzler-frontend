import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setToken } from "../utils/auth.js";
import { apiFetch } from "../utils/api.js";

export default function Login({ setCurrentUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function handleSubmit(event) {
    event.preventDefault();

    apiFetch("/api/v1/login", {
      method: "POST",
      auth: false,
      body: JSON.stringify({
        email,
        password,
      }),
    })
      .then((data) => {
        setToken(data.token);
        setCurrentUser(data.user);
        navigate("/userdashboard");
      })
      .catch((error) => {
        setError(error.message);
      });
  }

  return (
    <main>
      <h2>Log In</h2>

      {error && <p>{error}</p>}

      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>

        <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />

        <label htmlFor="password">Password</label>

        <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />

        <button type="submit">Log in</button>
      </form>
    </main>
  );
}
