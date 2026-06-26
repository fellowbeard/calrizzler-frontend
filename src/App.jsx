import "./App.css";
import { Routes, Route, Link } from "react-router-dom";
import { useState } from "react";

import UserDashboard from "./components/UserDashboard.jsx";
import Login from "./components/Login.jsx";
import LogOut from "./components/LogOut.jsx";
import ClientCard from "./components/ClientCard.jsx";
import NewClient from "./components/forms/NewClient.jsx";
import NewAppointment from "./components/forms/NewAppointment.jsx";

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  return (
    <>
      <nav>
        {currentUser ? (
          <>
            <Link to="/userdashboard">Dashboard</Link> | <LogOut setCurrentUser={setCurrentUser} />
          </>
        ) : (
          <Link to="/">Login</Link>
        )}
      </nav>

      <Routes>
        <Route path="/" element={<Login setCurrentUser={setCurrentUser} />} />

        <Route
          path="/userdashboard"
          element={currentUser ? <UserDashboard currentUser={currentUser} /> : <p>LOGIN You dork</p>}
        />

        <Route
          path="/clients/:id"
          element={currentUser ? <ClientCard currentUser={currentUser} /> : <p>Please log in first.</p>}
        />

        <Route
          path="/clients/new"
          element={currentUser ? <NewClient currentUser={currentUser} /> : <p>Please log in first.</p>}
        />

        <Route
          path="/appointments/new"
          element={currentUser ? <NewAppointment currentUser={currentUser} /> : <p>LOGIN You dork</p>}
        />
      </Routes>
    </>
  );
}

export default App;
