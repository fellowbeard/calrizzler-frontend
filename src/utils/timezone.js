export const TIMEZONE_OPTIONS = [
  { value: "America/New_York", label: "Eastern Time (EST)" },
  { value: "America/Chicago", label: "Central Time (CST)" },
  { value: "America/Denver", label: "Mountain Time (MST)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PST)" },
  { value: "America/Phoenix", label: "Arizona Time (MST)" },
  { value: "America/Anchorage", label: "Alaska Time (AKST)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HST)" },
];

const TIMEZONE_ABBREVIATIONS = {
  "America/New_York": "EST",
  "America/Chicago": "CST",
  "America/Denver": "MST",
  "America/Los_Angeles": "PST",
  "America/Phoenix": "MST",
  "Pacific/Honolulu": "HST",
  "America/Anchorage": "AKST",
};

export function timezoneAbbreviation(timezone) {
  return TIMEZONE_ABBREVIATIONS[timezone] ?? timezone;
}

export function formatDateTimeInTimezone(dateTime, timezone) {
  if (!dateTime || !timezone) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateTime));
}

export function formatTimeInTimezone(dateTime, timezone) {
  if (!dateTime || !timezone) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateTime));
}

export function datePartsInTimezone(dateTime, timezone) {
  if (!dateTime || !timezone) {
    return null;
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date(dateTime));

  const values = {};

  parts.forEach((part) => {
    if (part.type !== "literal") {
      values[part.type] = Number(part.value);
    }
  });

  return {
    year: values.year,
    month: values.month,
    day: values.day,
  };
}

export function toDateTimeLocalValue(dateTime, timezone) {
  if (!dateTime || !timezone) {
    return "";
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(dateTime));

  const values = {};

  parts.forEach((part) => {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  });

  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

export function calculateEndTime(dateTime, durationMinutes) {
  if (!dateTime) {
    return null;
  }

  const start = new Date(dateTime);

  return new Date(start.getTime() + Number(durationMinutes ?? 0) * 60 * 1000);
}
