import "./App.css";
import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

import UserDashboard from "./components/UserDashboard.jsx";
import Login from "./components/Login.jsx";
import ClientCard from "./components/ClientCard.jsx";
import NewClient from "./components/forms/NewClient.jsx";
import NewAppointment from "./components/forms/NewAppointment.jsx";
import AccountSettings from "./components/AccountSettings.jsx";
import AcceptInvitation from "./components/AcceptInvitation.jsx";
import GooeyMenu from "./components/GooeyMenu.jsx";

import { apiFetch } from "./utils/api.js";
import { getToken, removeToken } from "./utils/auth.js";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(() =>
    Boolean(getToken())
  );

  const isOwner = currentUser?.role === "owner";
  const location = useLocation();

  const isPublicAuthPage =
    location.pathname === "/" ||
    location.pathname === "/accept-invitation";

  useEffect(() => {
    const token = getToken();

    if (!token) {
      setIsAuthLoading(false);
      return;
    }

    apiFetch("/api/v1/me")
      .then((user) => {
        setCurrentUser(user);
      })
      .catch(() => {
        removeToken();
        setCurrentUser(null);
        setCurrentAccount(null);
      })
      .finally(() => {
        setIsAuthLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setCurrentAccount(null);
      return;
    }

    apiFetch("/api/v1/account")
      .then((account) => {
        setCurrentAccount(account);
      })
      .catch(() => {
        setCurrentAccount(null);
      });
  }, [currentUser]);

  if (isAuthLoading) {
    return <p>Loading...</p>;
  }

  return (
    <>
      {currentUser && !isPublicAuthPage && (
        <GooeyMenu
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          setCurrentAccount={setCurrentAccount}
        />
      )}

      <Routes>
        <Route
          path="/"
          element={<Login setCurrentUser={setCurrentUser} />}
        />

        <Route
          path="/userdashboard"
          element={
            currentUser ? (
              <UserDashboard
                currentUser={currentUser}
                currentAccount={currentAccount}
              />
            ) : (
              <p>Please log in first.</p>
            )
          }
        />

        <Route
          path="/clients/:id"
          element={
            currentUser ? (
              <ClientCard
                currentUser={currentUser}
                currentAccount={currentAccount}
              />
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
              <NewAppointment
                currentUser={currentUser}
                currentAccount={currentAccount}
              />
            ) : (
              <p>Please log in first.</p>
            )
          }
        />

        <Route
          path="/account/settings"
          element={
            currentUser && isOwner ? (
              <AccountSettings
                currentUser={currentUser}
                currentAccount={currentAccount}
                setCurrentAccount={setCurrentAccount}
              />
            ) : (
              <p>
                You do not have permission to access account settings.
              </p>
            )
          }
        />

        <Route
          path="/accept-invitation"
          element={<AcceptInvitation />}
        />
      </Routes>
    </>
  );
}

export default App;