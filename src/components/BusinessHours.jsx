import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../utils/api.js";
import { DAYS, DEFAULT_RANGE, TIME_OPTIONS, formatRanges, normalizeTime, validateRanges } from "../utils/hours.js";

function copyRanges(ranges) {
  return ranges.map((range) => ({ ...range }));
}

function initialSchedule() {
  return DAYS.map((day, index) => ({
    ...day,
    isOpen: index < 5,
    customized: false,
    ranges: copyRanges([DEFAULT_RANGE]),
  }));
}

function buildSchedule(records) {
  return DAYS.map((day) => {
    const ranges = records
      .filter((record) => Number(record.day_of_week) === day.value)
      .map((record) => ({
        opens_at: normalizeTime(record.opens_at),
        closes_at: normalizeTime(record.closes_at),
      }))
      .sort((a, b) => a.opens_at.localeCompare(b.opens_at));

    return {
      ...day,
      isOpen: ranges.length > 0,
      customized: true,
      ranges: ranges.length > 0 ? ranges : copyRanges([DEFAULT_RANGE]),
    };
  });
}

function validateSchedule(schedule) {
  for (const day of schedule) {
    if (!day.isOpen) continue;

    const message = validateRanges(day.ranges);

    if (message) return { day: day.value, message };
  }

  return null;
}

export default function BusinessHours({ currentUser }) {
  const isOwner = currentUser?.role === "owner";
  const [schedule, setSchedule] = useState(initialSchedule);
  const dayRefs = useRef({});
  const [savedRecords, setSavedRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [dayError, setDayError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let active = true;

    apiFetch("/api/v1/working_hours")
      .then((records) => {
        if (!active) return;

        setSavedRecords(records);
        setSchedule(records.length > 0 ? buildSchedule(records) : initialSchedule());
        setError("");
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function updateDay(dayIndex, updater) {
    setError("");
    setDayError(null);
    setSuccessMessage("");

    setSchedule((previous) => {
      const updated = previous.map((day) => ({
        ...day,
        ranges: copyRanges(day.ranges),
      }));

      updated[dayIndex] = updater(updated[dayIndex]);

      if (dayIndex === 0) {
        const monday = updated[0];

        return updated.map((day, index) => {
          if (index === 0 || day.customized) {
            return day;
          }

          return {
            ...day,
            ranges: copyRanges(monday.ranges),
          };
        });
      }

      updated[dayIndex] = {
        ...updated[dayIndex],
        customized: true,
      };

      return updated;
    });
  }

  function updateRange(dayIndex, rangeIndex, field, value) {
    updateDay(dayIndex, (day) => ({
      ...day,
      ranges: day.ranges.map((range, index) => (index === rangeIndex ? { ...range, [field]: value } : range)),
    }));
  }

  function toggleDay(dayIndex, isOpen) {
    updateDay(dayIndex, (day) => ({
      ...day,
      isOpen,
      ranges: isOpen && day.ranges.length === 0 ? copyRanges([DEFAULT_RANGE]) : day.ranges,
    }));
  }

  function addRange(dayIndex) {
    updateDay(dayIndex, (day) => ({
      ...day,
      ranges: [
        ...day.ranges,
        {
          opens_at: "13:00",
          closes_at: "17:00",
        },
      ],
    }));
  }

  function removeRange(dayIndex, rangeIndex) {
    updateDay(dayIndex, (day) => {
      const ranges = day.ranges.filter((_, index) => index !== rangeIndex);

      return {
        ...day,
        isOpen: ranges.length > 0,
        ranges,
      };
    });
  }

  function resetToMonday(dayIndex) {
    setError("");
    setDayError(null);
    setSuccessMessage("");

    setSchedule((previous) =>
      previous.map((day, index) =>
        index === dayIndex
          ? {
              ...day,
              customized: false,
              ranges: copyRanges(previous[0].ranges),
            }
          : day
      )
    );
  }

  async function handleSave(event) {
    event.preventDefault();

    const validationError = validateSchedule(schedule);

    if (validationError) {
      setDayError(validationError);
      setError("");
      setSuccessMessage("");

      requestAnimationFrame(() => {
        dayRefs.current[validationError.day]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });

      return;
    }

    setDayError(null);
    setIsSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const workingHours = schedule.flatMap((day) =>
        day.isOpen
          ? day.ranges.map(({ opens_at, closes_at }) => ({ day_of_week: day.value, opens_at, closes_at }))
          : []
      );

      // One request; the server swaps the whole week in a transaction.
      const records = await apiFetch("/api/v1/working_hours/replace", {
        method: "PUT",
        body: JSON.stringify({ working_hours: workingHours }),
      });

      setSavedRecords(records);
      setSchedule(buildSchedule(records));
      setSuccessMessage("Business hours updated.");
    } catch (requestError) {
      setError(requestError.validationErrors?.[0]?.message || requestError.message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section>
        <h2>Business Hours</h2>
        <p>Loading business hours...</p>
      </section>
    );
  }

  if (!isOwner) {
    return (
      <section className="business-hours">
        <h2>Business Hours</h2>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        {!error &&
          DAYS.map((day) => {
            const ranges = savedRecords.filter((record) => Number(record.day_of_week) === day.value);

            return (
              <div key={day.value} className="business-hours-day">
                <strong>{day.label}: </strong>

                {ranges.length === 0 ? "Closed" : formatRanges(ranges)}
              </div>
            );
          })}
      </section>
    );
  }

  return (
    <section className="business-hours">
      <h2>Business Hours</h2>

      <p>Set Monday's hours first. Other days inherit changes until you customize them.</p>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {successMessage && <p role="status">{successMessage}</p>}

      <form onSubmit={handleSave}>
        {schedule.map((day, dayIndex) => (
          <div
            key={day.value}
            ref={(element) => {
              dayRefs.current[day.value] = element;
            }}
            className="business-hours-day"
          >
            <div className="business-hours-day-header">
              <label>
                <input
                  type="checkbox"
                  checked={day.isOpen}
                  disabled={isSaving}
                  onChange={(event) => toggleDay(dayIndex, event.target.checked)}
                />

                <strong>{day.label}</strong>
              </label>

              {!day.isOpen && <span>Closed</span>}

              {day.isOpen && dayIndex > 0 && <span>{day.customized ? "Custom hours" : "Using Monday's hours"}</span>}
            </div>

            {day.isOpen && (
              <div className="business-hours-ranges">
                {day.ranges.map((range, rangeIndex) => (
                  <div key={rangeIndex} className="business-hours-range">
                    <select
                      aria-label={`${day.label} opening time ${rangeIndex + 1}`}
                      value={range.opens_at}
                      disabled={isSaving}
                      onChange={(event) => updateRange(dayIndex, rangeIndex, "opens_at", event.target.value)}
                    >
                      {TIME_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <span>to</span>

                    <select
                      aria-label={`${day.label} closing time ${rangeIndex + 1}`}
                      value={range.closes_at}
                      disabled={isSaving}
                      onChange={(event) => updateRange(dayIndex, rangeIndex, "closes_at", event.target.value)}
                    >
                      {TIME_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => removeRange(dayIndex, rangeIndex)}
                      aria-label={`Remove ${day.label} time range ${rangeIndex + 1}`}
                    >
                      Remove
                    </button>
                  </div>
                ))}

                <div className="business-hours-actions">
                  <button type="button" disabled={isSaving} onClick={() => addRange(dayIndex)}>
                    + Add hours
                  </button>

                  {dayIndex > 0 && day.customized && (
                    <button type="button" disabled={isSaving} onClick={() => resetToMonday(dayIndex)}>
                      Use Monday's hours
                    </button>
                  )}
                </div>
              </div>
            )}

            {dayError?.day === day.value && (
              <p className="business-hours-error" role="alert">
                {dayError.message}
              </p>
            )}
          </div>
        ))}

        <button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Business Hours"}
        </button>
      </form>
    </section>
  );
}
