import "./App.css";
import { Routes, Route, Link } from "react-router-dom";
import { useState } from "react";

import UserDashboard from "./components/UserDashboard.jsx";
import Login from "./components/Login.jsx";
import LogOut from "./components/LogOut.jsx";
import ClientCard from "./components/ClientCard.jsx";
import NewClient from "./components/forms/NewClient.jsx";
import NewAppointment from "./components/forms/NewAppointment.jsx";
import AccountSettings from "./components/AccountSettings.jsx";

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  const isOwner = currentUser?.role === "owner";

  return (
    <>
      <nav>
        {currentUser ? (
          <>
            <Link to="/userdashboard">Dashboard</Link>

            {isOwner && (
              <>
                {" | "}
                <Link to="/account/settings">Account Settings</Link>
              </>
            )}

            {" | "}
            <LogOut setCurrentUser={setCurrentUser} />
          </>
        ) : (
          <Link to="/">Login</Link>
        )}
      </nav>

      <Routes>
        <Route
          path="/"
          element={<Login setCurrentUser={setCurrentUser} />}
        />

        <Route
          path="/userdashboard"
          element={
            currentUser ? (
              <UserDashboard currentUser={currentUser} />
            ) : (
              <p>LOGIN You dork</p>
            )
          }
        />

        <Route
          path="/clients/:id"
          element={
            currentUser ? (
              <ClientCard currentUser={currentUser} />
            ) : (
              <p>Please log in first.</p>
            )
          }
        />

        <Route
          path="/clients/new"
          element={
            currentUser ? (
              <NewClient currentUser={currentUser} />
            ) : (
              <p>Please log in first.</p>
            )
          }
        />

        <Route
          path="/appointments/new"
          element={
            currentUser ? (
              <NewAppointment currentUser={currentUser} />
            ) : (
              <p>LOGIN You dork</p>
            )
          }
        />

        <Route
          path="/account/settings"
          element={
            currentUser ? (
              <AccountSettings currentUser={currentUser} />
            ) : (
              <p>Please log in first.</p>
            )
          }
        />
      </Routes>
    </>
  );
}

export default App;