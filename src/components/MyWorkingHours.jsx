import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiFetch } from "../utils/api.js";

const DAYS = [
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
  { label: "Sunday", value: 0 },
];

const DEFAULT_RANGE = {
  opens_at: "09:00",
  closes_at: "17:00",
};

const TIME_OPTIONS = Array.from({ length: 96 }, (_, index) => {
  const hour = Math.floor(index / 4);
  const minute = (index % 4) * 15;

  return {
    value: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    label: `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`,
  };
});

function normalizeTime(value) {
  const match = String(value ?? "").match(/(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : "";
}

function formatTime(value) {
  const normalized = normalizeTime(value);
  return TIME_OPTIONS.find((option) => option.value === normalized)?.label ?? normalized;
}

function emptySchedule() {
  return DAYS.map((day) => ({
    ...day,
    mode: "inherit",
    ranges: [],
  }));
}

function buildSchedule(records) {
  return DAYS.map((day) => {
    const dayRecords = records.filter((record) => Number(record.day_of_week) === day.value);

    if (dayRecords.some((record) => record.is_closed)) {
      return { ...day, mode: "closed", ranges: [] };
    }

    if (dayRecords.length === 0) {
      return { ...day, mode: "inherit", ranges: [] };
    }

    return {
      ...day,
      mode: "custom",
      ranges: dayRecords
        .map((record) => ({
          opens_at: normalizeTime(record.opens_at),
          closes_at: normalizeTime(record.closes_at),
        }))
        .sort((a, b) => a.opens_at.localeCompare(b.opens_at)),
    };
  });
}

function validateSchedule(schedule) {
  for (const day of schedule) {
    if (day.mode !== "custom") continue;

    if (day.ranges.length === 0) {
      return `${day.label}: Add at least one time range.`;
    }

    const ranges = [...day.ranges].sort((a, b) => a.opens_at.localeCompare(b.opens_at));

    for (let index = 0; index < ranges.length; index++) {
      const range = ranges[index];

      if (!range.opens_at || !range.closes_at) {
        return `${day.label}: Select opening and closing times.`;
      }

      if (range.opens_at >= range.closes_at) {
        return `${day.label}: Closing time must be after opening time.`;
      }

      if (index > 0 && ranges[index - 1].closes_at > range.opens_at) {
        return `${day.label}: Working hours cannot overlap.`;
      }
    }
  }

  return null;
}

function sameDay(day, records) {
  const saved = buildSchedule(records).find((item) => item.value === day.value);

  if (!saved || saved.mode !== day.mode) return false;
  if (day.mode !== "custom") return true;

  const desiredRanges = [...day.ranges].sort((a, b) => a.opens_at.localeCompare(b.opens_at));

  return (
    saved.ranges.length === desiredRanges.length &&
    saved.ranges.every(
      (range, index) =>
        range.opens_at === desiredRanges[index].opens_at && range.closes_at === desiredRanges[index].closes_at
    )
  );
}

function describeDay(day, businessHours) {
  if (day.mode === "closed") return "Not Working";

  if (day.mode === "custom") {
    return day.ranges.map((range) => `${formatTime(range.opens_at)} – ${formatTime(range.closes_at)}`).join(", ");
  }

  const inherited = businessHours
    .filter((record) => Number(record.day_of_week) === day.value)
    .filter((record) => !record.is_closed)
    .sort((a, b) => String(a.opens_at).localeCompare(String(b.opens_at)));

  if (inherited.length === 0) return "Closed";

  return inherited.map((range) => `${formatTime(range.opens_at)} – ${formatTime(range.closes_at)}`).join(", ");
}

export default function MyWorkingHours({ currentUser }) {
  const navigate = useNavigate();
  const canEdit = currentUser?.role === "owner" || currentUser?.role === "staff";

  const [schedule, setSchedule] = useState(emptySchedule);
  const [savedRecords, setSavedRecords] = useState([]);
  const [businessHours, setBusinessHours] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!currentUser?.id || !canEdit) return;

    let active = true;

    async function loadHours() {
      try {
        const [personal, business] = await Promise.all([
          apiFetch(`/api/v1/users/${currentUser.id}/user_working_hours`),
          apiFetch("/api/v1/working_hours"),
        ]);

        if (!active) return;

        setSavedRecords(personal);
        setBusinessHours(business);
        setSchedule(buildSchedule(personal));
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
  }, [currentUser?.id, canEdit]);

  function updateDay(dayIndex, updater) {
    setError("");
    setSuccessMessage("");

    setSchedule((previous) => previous.map((day, index) => (index === dayIndex ? updater(day) : day)));
  }

  function changeMode(dayIndex, mode) {
    updateDay(dayIndex, (day) => {
      if (mode === "custom") {
        const businessRanges = businessHours
          .filter((record) => Number(record.day_of_week) === day.value)
          .map((record) => ({
            opens_at: normalizeTime(record.opens_at),
            closes_at: normalizeTime(record.closes_at),
          }));

        return {
          ...day,
          mode,
          ranges:
            day.ranges.length > 0 ? day.ranges : businessRanges.length > 0 ? businessRanges : [{ ...DEFAULT_RANGE }],
        };
      }

      return { ...day, mode };
    });
  }

  function updateRange(dayIndex, rangeIndex, field, value) {
    updateDay(dayIndex, (day) => ({
      ...day,
      ranges: day.ranges.map((range, index) => (index === rangeIndex ? { ...range, [field]: value } : range)),
    }));
  }

  function addRange(dayIndex) {
    updateDay(dayIndex, (day) => ({
      ...day,
      ranges: [...day.ranges, { opens_at: "13:00", closes_at: "17:00" }],
    }));
  }

  function removeRange(dayIndex, rangeIndex) {
    updateDay(dayIndex, (day) => ({
      ...day,
      ranges: day.ranges.filter((_, index) => index !== rangeIndex),
    }));
  }

  async function handleSave(event) {
    event.preventDefault();

    if (!currentUser?.id || !canEdit || isSaving) return;

    const validationError = validateSchedule(schedule);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const changedDays = schedule.filter((day) => !sameDay(day, savedRecords));

      for (const day of changedDays) {
        const existing = savedRecords.filter((record) => Number(record.day_of_week) === day.value);

        for (const record of existing) {
          await apiFetch(`/api/v1/user_working_hours/${record.id}`, {
            method: "DELETE",
          });
        }

        if (day.mode === "closed") {
          await apiFetch(`/api/v1/users/${currentUser.id}/user_working_hours`, {
            method: "POST",
            body: JSON.stringify({
              user_working_hour: {
                day_of_week: day.value,
                is_closed: true,
              },
            }),
          });
        }

        if (day.mode === "custom") {
          for (const range of day.ranges) {
            await apiFetch(`/api/v1/users/${currentUser.id}/user_working_hours`, {
              method: "POST",
              body: JSON.stringify({
                user_working_hour: {
                  day_of_week: day.value,
                  opens_at: range.opens_at,
                  closes_at: range.closes_at,
                  is_closed: false,
                },
              }),
            });
          }
        }
      }

      navigate("/settings");
    } catch (requestError) {
      setError(requestError.validationErrors?.[0]?.message || requestError.message);

      // Saving isn't atomic; reload the actual server state.
      try {
        const refreshed = await apiFetch(`/api/v1/users/${currentUser.id}/user_working_hours`);

        setSavedRecords(refreshed);
        setSchedule(buildSchedule(refreshed));
      } catch {
        // Preserve the original error.
      }
    } finally {
      setIsSaving(false);
    }
  }

  if (!canEdit) {
    return <p>You do not have permission to manage working hours.</p>;
  }

  if (isLoading) {
    return <p>Loading working hours...</p>;
  }

  return (
    <main>
      <h1>My Working Hours</h1>

      <p>
        Set your personal availability. You can use business hours, choose custom hours, or mark a day as not working.
      </p>

      <section className="business-hours">
        <h2>Current Weekly Schedule</h2>

        {buildSchedule(savedRecords).map((day) => (
          <div key={day.value} className="business-hours-day">
            <strong>{day.label}: </strong>
            {describeDay(day, businessHours)}
          </div>
        ))}
      </section>

      <form onSubmit={handleSave}>
        <h2>Edit Working Hours</h2>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        {successMessage && <p role="status">{successMessage}</p>}

        {schedule.map((day, dayIndex) => (
          <fieldset key={day.value} disabled={isSaving} style={{ marginBottom: 16, padding: 16 }}>
            <legend>
              <strong>{day.label}</strong>
            </legend>

            <label htmlFor={`mode-${day.value}`}>Availability</label>

            <select
              id={`mode-${day.value}`}
              value={day.mode}
              onChange={(event) => changeMode(dayIndex, event.target.value)}
            >
              <option value="inherit">Use Business Hours</option>
              <option value="custom">Custom Hours</option>
              <option value="closed">Not Working</option>
            </select>

            {day.mode === "inherit" && (
              <div style={{ marginTop: 12 }}>
                <p style={{ fontWeight: 600, marginBottom: 4 }}>Using business hours</p>

                <p>
                  <strong>{day.label}:</strong> {describeDay(day, businessHours)}
                </p>
              </div>
            )}

            {day.mode === "closed" && <p>You are not available on this day.</p>}

            {day.mode === "custom" && (
              <div>
                {day.ranges.map((range, rangeIndex) => (
                  <div key={rangeIndex} style={{ marginTop: 12 }}>
                    <label htmlFor={`opens-${day.value}-${rangeIndex}`}>Opens</label>

                    <select
                      id={`opens-${day.value}-${rangeIndex}`}
                      value={range.opens_at}
                      onChange={(event) => updateRange(dayIndex, rangeIndex, "opens_at", event.target.value)}
                    >
                      {TIME_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <label htmlFor={`closes-${day.value}-${rangeIndex}`}>Closes</label>

                    <select
                      id={`closes-${day.value}-${rangeIndex}`}
                      value={range.closes_at}
                      onChange={(event) => updateRange(dayIndex, rangeIndex, "closes_at", event.target.value)}
                    >
                      {TIME_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <button type="button" onClick={() => removeRange(dayIndex, rangeIndex)}>
                      Remove Range
                    </button>
                  </div>
                ))}

                <button type="button" onClick={() => addRange(dayIndex)}>
                  + Add Hours
                </button>
              </div>
            )}
          </fieldset>
        ))}

        <button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save My Working Hours"}
        </button>
      </form>
    </main>
  );
}
