const GOOGLE_PAKISTAN_HOLIDAY_ICS_URL =
  "https://calendar.google.com/calendar/ical/en.pk.official%23holiday%40group.v.calendar.google.com/public/basic.ics";

const parseIcsDate = (value) => {
  if (!value) return null;
  const datePart = value.includes("T") ? value.split("T")[0] : value;
  if (!/^\d{8}$/.test(datePart)) return null;
  return `${datePart.slice(0, 4)}-${datePart.slice(4, 6)}-${datePart.slice(6, 8)}`;
};

const decodeIcsText = (value = "") =>
  value
    .replace(/\\n/g, " ")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();

const parseGoogleHolidayIcs = (icsText) => {
  const unfoldedLines = icsText
    .replace(/\r\n[ \t]/g, "")
    .replace(/\n[ \t]/g, "")
    .split(/\r?\n/);

  const events = [];
  let event = null;

  for (const line of unfoldedLines) {
    if (line === "BEGIN:VEVENT") {
      event = {};
      continue;
    }

    if (line === "END:VEVENT") {
      if (event?.date && event?.name) events.push(event);
      event = null;
      continue;
    }

    if (!event) continue;

    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).split(";")[0];
    const value = line.slice(separatorIndex + 1);

    if (key === "DTSTART") event.date = parseIcsDate(value);
    if (key === "SUMMARY") event.name = decodeIcsText(value);
  }

  return events;
};

const dedupeHolidaysByDate = (holidays) => {
  const holidaysByDate = new Map();

  for (const holiday of holidays) {
    const existing = holidaysByDate.get(holiday.date);
    if (!existing) {
      holidaysByDate.set(holiday.date, holiday);
      continue;
    }

    holidaysByDate.set(holiday.date, {
      ...existing,
      name: Array.from(new Set([...existing.name.split(" / "), holiday.name])).join(" / "),
    });
  }

  return Array.from(holidaysByDate.values()).sort((a, b) => a.date.localeCompare(b.date));
};

export const getPublicHolidaysForMonth = async (month) => {
  const response = await fetch(GOOGLE_PAKISTAN_HOLIDAY_ICS_URL);
  if (!response.ok) {
    throw new Error("Unable to fetch public holidays");
  }

  const icsText = await response.text();
  return dedupeHolidaysByDate(
    parseGoogleHolidayIcs(icsText)
      .filter((holiday) => holiday.date?.startsWith(month))
      .map((holiday) => ({
        date: holiday.date,
        name: holiday.name,
        source: "google-holiday-calendar",
      }))
  );
};
