import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api.js";
import { DAYS, formatTime, sortRanges } from "../utils/hours.js";


function getDayHours(day, providerHours, businessHours) {
  const overrides = providerHours.filter((hour) => Number(hour.day_of_week) === day);

  if (overrides.some((hour) => hour.is_closed)) {
    return [];
  }

  if (overrides.length > 0) {
    return overrides;
  }

  return businessHours.filter((hour) => Number(hour.day_of_week) === day);
}

export default function TeamHours({ users = [] }) {
  const [businessHours, setBusinessHours] = useState([]);
  const [providerHours, setProviderHours] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadHours() {
      try {
        const [business, ...providerSchedules] = await Promise.all([
          apiFetch("/api/v1/working_hours"),
          ...users.map((user) => apiFetch(`/api/v1/users/${user.id}/user_working_hours`)),
        ]);

        if (!active) return;

        const schedules = {};

        users.forEach((user, index) => {
          schedules[user.id] = providerSchedules[index];
        });

        setBusinessHours(business);
        setProviderHours(schedules);
        setError("");
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadHours();

    return () => {
      active = false;
    };
  }, [users]);

  if (isLoading) {
    return (
      <section>
        <h2>Team Hours</h2>
        <p>Loading team hours...</p>
      </section>
    );
  }

  return (
    <section className="team-hours">
      <h2>Team Hours</h2>
      <p>Weekly working hours for your team.</p>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {!error && users.length === 0 && <p>No team members found.</p>}

      {!error && (
        <div className="team-hours-grid">
          {users.map((user) => (
            <div key={user.id} className="team-hours-card">
              <h3>
                {user.first_name} {user.last_name}
              </h3>

              {DAYS.map((day) => {
                const hours = getDayHours(day.value, providerHours[user.id] || [], businessHours);

                return (
                  <div key={day.value} className="team-hours-day">
                    <strong>{day.label}</strong>

                    <div>
                      {hours.length === 0 ? (
                        <span className="team-hours-closed">Closed</span>
                      ) : (
                        sortRanges(hours).map((range, index) => (
                            <span key={range.id ?? index} className="team-hours-time">
                              {formatTime(range.opens_at)} – {formatTime(range.closes_at)}
                            </span>
                          ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
