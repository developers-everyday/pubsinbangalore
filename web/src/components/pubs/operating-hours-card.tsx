"use client";

import { useMemo, useState, useEffect } from "react";

/**
 * OperatingHoursCard
 * A React component (Tailwind CSS) that shows:
 * - Dynamic OPEN/CLOSED badge based on current system time
 * - "Serving till ..." when open or "Back at ..." when closed
 * - Today's hours and a collapsible weekly schedule
 * - Visual 24-hour time bar showing open window(s)
 *
 * Props:
 * - hours: object mapping weekday keys (0 = Sun, 1 = Mon, ...) to an array of time ranges
 *   Example: { 0: [{ open: '12:00 PM', close: '1:00 AM', servingUntil: '12:00 AM' }], ... }
 */

// Helpers
const daysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parseTimeToMinutes(timeStr: string): number {
  // e.g. "12:00 PM" -> minutes since midnight
  const [time, meridiem] = timeStr.split(" ").map((s) => s.trim());
  const [hh, mm] = time.split(":").map(Number);
  let hours = hh % 12;
  if (meridiem && meridiem.toUpperCase() === "PM") hours += 12;
  return hours * 60 + (mm || 0);
}

function minutesToClock(minutes: number): string {
  const hh = Math.floor(minutes / 60) % 24;
  const mm = minutes % 60;
  const ampm = hh >= 12 ? "PM" : "AM";
  const h12 = ((hh + 11) % 12) + 1;
  return `${h12}:${mm.toString().padStart(2, "0")} ${ampm}`;
}

function isNowInRange(nowMinutes: number, openMin: number, closeMin: number): boolean {
  if (openMin <= closeMin) {
    return nowMinutes >= openMin && nowMinutes < closeMin;
  }
  // crosses midnight
  return nowMinutes >= openMin || nowMinutes < closeMin;
}

type TimeRange = {
  open: string;
  close: string;
  servingUntil?: string;
};

type ScheduleData = Record<number, TimeRange[]>;

type NextChange = {
  type: "open" | "close";
  minutes: number;
  range?: TimeRange;
  dayOffset?: number;
};

export function OperatingHoursCard({ hours }: { hours?: ScheduleData }) {
  const defaultHours = useMemo<ScheduleData>(
    () => ({
      0: [{ open: "12:00 PM", close: "1:00 AM", servingUntil: "12:00 AM" }],
      1: [{ open: "12:00 PM", close: "1:00 AM", servingUntil: "12:00 AM" }],
      2: [{ open: "12:00 PM", close: "1:00 AM", servingUntil: "12:00 AM" }],
      3: [{ open: "12:00 PM", close: "1:00 AM", servingUntil: "12:00 AM" }],
      4: [{ open: "12:00 PM", close: "1:00 AM", servingUntil: "12:00 AM" }],
      5: [{ open: "12:00 PM", close: "1:00 AM", servingUntil: "12:00 AM" }],
      6: [{ open: "12:00 PM", close: "1:00 AM", servingUntil: "12:00 AM" }],
    }),
    []
  );

  const schedule = hours || defaultHours;

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000); // update every 30s
    return () => clearInterval(t);
  }, []);

  const todayIndex = now.getDay(); // 0..6 (Sun..Sat)
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  // Flatten today's ranges
  const todaysRanges = useMemo(
    () => {
      const source = hours ?? defaultHours;
      const ranges = source[todayIndex] ?? [];
      return ranges.map((range) => ({ ...range }));
    },
    [defaultHours, hours, todayIndex]
  );

  // Determine if open and when next change is
  let isOpen = false;
  let nextChange: NextChange | null = null;

  for (const r of todaysRanges) {
    const openMin = parseTimeToMinutes(r.open);
    const closeMin = parseTimeToMinutes(r.close);
    if (isNowInRange(nowMinutes, openMin, closeMin)) {
      isOpen = true;
      nextChange = { type: "close", minutes: closeMin, range: r };
      break;
    }
  }

  if (!isOpen) {
    // look for upcoming open today
    for (const r of todaysRanges) {
      const openMin = parseTimeToMinutes(r.open);
      const closeMin = parseTimeToMinutes(r.close);
      if (!isNowInRange(nowMinutes, openMin, closeMin)) {
        if (openMin > nowMinutes && openMin <= 24 * 60) {
          nextChange = { type: "open", minutes: openMin, range: r };
          break;
        }
      }
    }
  }

  // fallback: if still no nextChange, scan next 7 days to find next open or close
  if (!nextChange) {
    for (let offset = 1; offset < 7; offset++) {
      const day = (todayIndex + offset) % 7;
      const ranges = schedule[day] || [];
      for (const r of ranges) {
        const openMin = parseTimeToMinutes(r.open);
        nextChange = { type: "open", minutes: openMin + offset * 1440, range: r, dayOffset: offset };
        break;
      }
      if (nextChange) break;
    }
  }

  // Helper for display
  function minutesToDisplay(next: NextChange | null): string | null {
    if (!next) return null;
    const m = next.minutes % 1440;
    return minutesToClock(m);
  }

  // Time bar: build a boolean array of 24*4 (15-min) buckets showing open/closed for today
  const buckets = useMemo(() => {
    const b = new Array(96).fill(false);
    for (const r of todaysRanges) {
      const openMin = parseTimeToMinutes(r.open);
      const closeMin = parseTimeToMinutes(r.close);
      for (let m = 0; m < 1440; m += 15) {
        if (isNowInRange(m, openMin, closeMin)) {
          b[Math.floor(m / 15)] = true;
        }
      }
    }
    return b;
  }, [todaysRanges]);

  // Status badge
  const statusBadge = isOpen ? (
    <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 font-semibold text-green-800">
      <span className="block h-2 w-2 rounded-full bg-green-600" />
      OPEN
    </div>
  ) : (
    <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 font-semibold text-rose-800">
      <span className="block h-2 w-2 rounded-full bg-rose-600" />
      CLOSED
    </div>
  );

  return (
    <div className="w-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Operating hours</h3>
          <p className="mt-1 text-sm text-slate-500">
            {daysShort[todayIndex]} • Today
          </p>
        </div>
        <div className="text-right">
          {statusBadge}
          <div className="mt-2 text-sm text-slate-600">
            {isOpen ? (
              <>
                <div className="text-xs text-slate-500">Serving until</div>
                <div className="font-medium">
                  {nextChange && nextChange.range && nextChange.range.servingUntil
                    ? nextChange.range.servingUntil
                    : nextChange
                    ? minutesToDisplay(nextChange)
                    : "—"}
                </div>
              </>
            ) : (
              <>
                <div className="text-xs text-slate-500">Will be back</div>
                <div className="font-medium">{minutesToDisplay(nextChange) || "—"}</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Time bar */}
      <div className="mt-4">
        <div className="mb-2 text-xs text-slate-500">Today — visual timeline</div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="flex h-full">
            {buckets.map((b, i) => (
              <div
                key={i}
                className={`h-full flex-1 ${b ? "bg-green-500/70" : "bg-transparent"}`}
              />
            ))}
          </div>
        </div>
        <div className="mt-2 flex justify-between text-xs text-slate-400">
          <span>12 AM</span>
          <span>6 AM</span>
          <span>12 PM</span>
          <span>6 PM</span>
          <span>11:59 PM</span>
        </div>
      </div>

      {/* Today&apos;s hours summary */}
      <div className="mt-4 flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-500">Today&apos;s hours</div>
          <div className="font-medium">
            {todaysRanges.length ? (
              todaysRanges.map((r, idx) => (
                <div key={idx}>
                  {r.open} – {r.close}
                </div>
              ))
            ) : (
              <div className="text-slate-400">Closed today</div>
            )}
          </div>
        </div>

        {/* Expand weekly */}
        <WeeklyHours schedule={schedule} todayIndex={todayIndex} />
      </div>
    </div>
  );
}

function WeeklyHours({ schedule, todayIndex }: { schedule: ScheduleData; todayIndex: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="w-48">
      <button onClick={() => setOpen((s) => !s)} className="text-sm font-medium text-emerald-600">
        {open ? "Hide hours" : "View hours"}
      </button>

      {open && (
        <div className="mt-3 rounded-lg bg-slate-50 p-3 shadow-inner transition-all duration-200">
          <div className="space-y-2">
            {Array.from({ length: 7 }).map((_, idx) => {
              const dayIdx = (idx + 0) % 7; // Sun..Sat
              const ranges = schedule[dayIdx] || [];
              return (
                <div
                  key={dayIdx}
                  className={`flex justify-between ${
                    dayIdx === todayIndex ? "rounded bg-emerald-50 px-2 py-1" : ""
                  }`}
                >
                  <div className="text-sm font-medium text-slate-700">{daysShort[dayIdx]}</div>
                  <div className="text-sm text-slate-600">
                    {ranges.length ? (
                      ranges.map((r, i) => (
                        <div key={i}>
                          {r.open} – {r.close}
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-400">Closed</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

