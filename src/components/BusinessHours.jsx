import { useEffect, useRef, useState } from "react";
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

  const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  const label = `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`;

  return { value, label };
});

function copyRanges(ranges) {
  return ranges.map((range) => ({ ...range }));
}

function inheritRanges(sourceRanges, existingRanges = []) {
  return sourceRanges.map((range, index) => ({
    id: existingRanges[index]?.id,
    opens_at: range.opens_at,
    closes_at: range.closes_at,
  }));
}

function initialSchedule() {
  return DAYS.map((day, index) => ({
    ...day,
    isOpen: index < 5,
    customized: false,
    ranges: copyRanges([DEFAULT_RANGE]),
  }));
}

function normalizeTime(value) {
  if (!value) return "";

  const match = String(value).match(/(\d{2}):(\d{2})/);

  return match ? `${match[1]}:${match[2]}` : "";
}

function buildSchedule(records) {
  return DAYS.map((day) => {
    const ranges = records
      .filter((record) => Number(record.day_of_week) === day.value)
      .map((record) => ({
        id: record.id,
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

    if (day.ranges.length === 0) {
      return {
        day: day.value,
        message: "Add at least one time range.",
      };
    }

    const sorted = [...day.ranges].sort((a, b) => a.opens_at.localeCompare(b.opens_at));

    for (let index = 0; index < sorted.length; index += 1) {
      const range = sorted[index];

      if (!range.opens_at || !range.closes_at) {
        return {
          day: day.value,
          message: "Select both opening and closing times.",
        };
      }

      if (range.opens_at >= range.closes_at) {
        return {
          day: day.value,
          message: "Closing time must be after opening time.",
        };
      }

      if (index > 0 && sorted[index - 1].closes_at > range.opens_at) {
        return {
          day: day.value,
          message: "Working hours cannot overlap.",
        };
      }
    }
  }

  return null;
}

function sameRange(record, range) {
  return (
    Number(record.day_of_week) === Number(range.day_of_week) &&
    normalizeTime(record.opens_at) === range.opens_at &&
    normalizeTime(record.closes_at) === range.closes_at
  );
}

export default function BusinessHours() {
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
            ranges: inheritRanges(monday.ranges, day.ranges),
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
              ranges: inheritRanges(previous[0].ranges, day.ranges),
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
      const desiredRanges = schedule.flatMap((day) =>
        day.isOpen
          ? day.ranges.map((range) => ({
              ...range,
              day_of_week: day.value,
            }))
          : []
      );

      const savedById = new Map(savedRecords.map((record) => [record.id, record]));

      const desiredIds = new Set(
        desiredRanges.filter((range) => range.id !== null && range.id !== undefined).map((range) => range.id)
      );

      const recordsToDelete = savedRecords.filter((record) => !desiredIds.has(record.id));

      const rangesToUpdate = desiredRanges.filter((range) => {
        if (range.id === null || range.id === undefined) {
          return false;
        }

        const saved = savedById.get(range.id);

        return saved && !sameRange(saved, range);
      });

      const rangesToCreate = desiredRanges.filter((range) => range.id === null || range.id === undefined);

      // Delete removed intervals first.
      for (const record of recordsToDelete) {
        await apiFetch(`/api/v1/working_hours/${record.id}`, { method: "DELETE" });
      }

      // Replace changed intervals to avoid temporary
      // overlap conflicts with other changed intervals.
      for (const range of rangesToUpdate) {
        await apiFetch(`/api/v1/working_hours/${range.id}`, { method: "DELETE" });
      }

      const rangesToCreateOrReplace = [...rangesToUpdate, ...rangesToCreate].sort((a, b) => {
        if (a.day_of_week !== b.day_of_week) {
          return a.day_of_week - b.day_of_week;
        }

        return a.opens_at.localeCompare(b.opens_at);
      });

      for (const range of rangesToCreateOrReplace) {
        await apiFetch("/api/v1/working_hours", {
          method: "POST",
          body: JSON.stringify({
            working_hour: {
              day_of_week: range.day_of_week,
              opens_at: range.opens_at,
              closes_at: range.closes_at,
            },
          }),
        });
      }

      const refreshedRecords = await apiFetch("/api/v1/working_hours");

      setSavedRecords(refreshedRecords);
      setSchedule(buildSchedule(refreshedRecords));
      setSuccessMessage("Business hours updated.");
    } catch (requestError) {
      setError(requestError.validationErrors?.[0]?.message || requestError.message);

      // Refresh because individual requests are not atomic.
      try {
        const refreshedRecords = await apiFetch("/api/v1/working_hours");

        setSavedRecords(refreshedRecords);
        setSchedule(buildSchedule(refreshedRecords));
      } catch {
        // Preserve the original error.
      }
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
                  <div key={range.id ?? `new-${rangeIndex}`} className="business-hours-range">
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
