import type { SettlementFrequencyValue } from "../ports/settlements-repository";

const TIME_ZONE = "America/Argentina/Buenos_Aires";

function buenosAiresParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);
  return { year: value("year"), month: value("month"), day: value("day") };
}

function localMidnight(year: number, monthIndex: number, day: number) {
  return new Date(Date.UTC(year, monthIndex, day, 3));
}

function periodLabel(
  start: Date,
  end: Date,
  frequency: SettlementFrequencyValue,
) {
  if (frequency === "MONTHLY") {
    return new Intl.DateTimeFormat("es-AR", {
      timeZone: TIME_ZONE,
      month: "long",
      year: "numeric",
    }).format(start);
  }
  const startDay = new Intl.DateTimeFormat("es-AR", {
    timeZone: TIME_ZONE,
    day: "numeric",
  }).format(start);
  const endLabel = new Intl.DateTimeFormat("es-AR", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(end);
  return `${startDay}–${endLabel}`;
}

export function resolveCompletedSettlementPeriod(
  frequency: SettlementFrequencyValue,
  now: Date,
) {
  const { year, month, day } = buenosAiresParts(now);
  const monthIndex = month - 1;
  let start: Date;
  let cutoffExclusive: Date;

  if (frequency === "MONTHLY") {
    start = localMidnight(year, monthIndex - 1, 1);
    cutoffExclusive = localMidnight(year, monthIndex, 1);
  } else if (day >= 16) {
    start = localMidnight(year, monthIndex, 1);
    cutoffExclusive = localMidnight(year, monthIndex, 16);
  } else {
    start = localMidnight(year, monthIndex - 1, 16);
    cutoffExclusive = localMidnight(year, monthIndex, 1);
  }

  const end = new Date(cutoffExclusive.getTime() - 1);
  return {
    periodStart: start,
    periodEnd: end,
    cutoffExclusive,
    periodLabel: periodLabel(start, end, frequency),
  };
}
