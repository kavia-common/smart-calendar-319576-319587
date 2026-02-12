import React, { useMemo } from "react";
import { format, isSameDay } from "date-fns";
import { getMonthGrid, getWeekDays } from "../lib/dates";

function normalizeEvent(raw) {
  const id = raw?.id ?? raw?.eventId ?? raw?.Id ?? raw?.EventId ?? null;
  return {
    id,
    title: raw?.title ?? raw?.Title ?? "(Untitled)",
    description: raw?.description ?? raw?.Description ?? "",
    location: raw?.location ?? raw?.Location ?? "",
    allDay: Boolean(raw?.allDay ?? raw?.AllDay ?? false),
    start: raw?.start ?? raw?.Start,
    end: raw?.end ?? raw?.End,
    raw,
  };
}

function groupEventsByDay(events) {
  const map = new Map();
  for (const ev of events) {
    const start = new Date(ev.start);
    const key = start.toISOString().slice(0, 10); // YYYY-MM-DD
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(ev);
  }
  for (const [, arr] of map) {
    arr.sort((a, b) => new Date(a.start) - new Date(b.start));
  }
  return map;
}

// PUBLIC_INTERFACE
export default function CalendarView({ view, anchorDate, events, onDayClick, onEventClick }) {
  /** Renders month/week/day calendar views. */
  const normalized = useMemo(() => (events || []).map(normalizeEvent), [events]);
  const byDay = useMemo(() => groupEventsByDay(normalized), [normalized]);

  if (view === "month") {
    const days = getMonthGrid(anchorDate);
    const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    return (
      <div className="calendar-grid" role="grid" aria-label="Month view">
        <div className="month-grid">
          {weekdayLabels.map((d) => (
            <div className="weekday" key={d}>
              {d}
            </div>
          ))}
          {days.map((cell) => {
            const key = cell.date.toISOString().slice(0, 10);
            const eventsForDay = byDay.get(key) || [];
            return (
              <div
                key={key}
                className="day-cell"
                role="gridcell"
                aria-label={format(cell.date, "EEEE, MMM d")}
                onClick={() => onDayClick?.(cell.date)}
                style={{
                  opacity: cell.inMonth ? 1 : 0.45,
                  background: cell.today ? "rgba(6, 182, 212, 0.06)" : undefined,
                }}
              >
                <div className="day-meta">
                  <div className="day-num">{cell.date.getDate()}</div>
                  {cell.today ? <div className="badge-today">Today</div> : <div className="day-muted" />}
                </div>
                <div className="list" style={{ gap: 6 }}>
                  {eventsForDay.slice(0, 3).map((ev) => (
                    <div
                      key={ev.id || `${ev.title}-${ev.start}`}
                      className="event-chip"
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(ev.raw);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onEventClick?.(ev.raw);
                        }
                      }}
                      title={ev.title}
                    >
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {ev.title}
                      </span>
                      <span className="event-chip-time">{format(new Date(ev.start), "HH:mm")}</span>
                    </div>
                  ))}
                  {eventsForDay.length > 3 ? (
                    <div className="day-muted">+{eventsForDay.length - 3} more</div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (view === "week") {
    const days = getWeekDays(anchorDate);

    return (
      <div className="calendar-grid" role="region" aria-label="Week view">
        <div className="list">
          {days.map((d) => {
            const key = d.toISOString().slice(0, 10);
            const eventsForDay = byDay.get(key) || [];
            return (
              <div
                key={key}
                className="list-item"
                role="button"
                tabIndex={0}
                onClick={() => onDayClick?.(d)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onDayClick?.(d);
                  }
                }}
                style={{
                  borderColor: isSameDay(d, new Date()) ? "rgba(6, 182, 212, 0.40)" : undefined,
                  background: isSameDay(d, new Date()) ? "rgba(6, 182, 212, 0.06)" : undefined,
                }}
              >
                <div style={{ minWidth: 170 }}>
                  <h3 style={{ marginBottom: 0 }}>{format(d, "EEE, MMM d")}</h3>
                  <p>{eventsForDay.length ? `${eventsForDay.length} event(s)` : "No events"}</p>
                </div>
                <div className="list" style={{ flex: 1 }}>
                  {eventsForDay.slice(0, 6).map((ev) => (
                    <div
                      key={ev.id || `${ev.title}-${ev.start}`}
                      className="event-chip"
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(ev.raw);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onEventClick?.(ev.raw);
                        }
                      }}
                    >
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {ev.title}
                      </span>
                      <span className="event-chip-time">{format(new Date(ev.start), "HH:mm")}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // day
  const dayKey = anchorDate.toISOString().slice(0, 10);
  const eventsForDay = byDay.get(dayKey) || [];

  return (
    <div className="calendar-grid" role="region" aria-label="Day view">
      <div className="list">
        <div className="list-item" style={{ alignItems: "center" }}>
          <div>
            <h3>{format(anchorDate, "EEEE, MMM d")}</h3>
            <p>{eventsForDay.length ? `${eventsForDay.length} event(s)` : "No events scheduled"}</p>
          </div>
          <button className="btn btn-primary" onClick={() => onDayClick?.(anchorDate)}>
            Add event
          </button>
        </div>

        {eventsForDay.map((ev) => (
          <div key={ev.id || `${ev.title}-${ev.start}`} className="list-item">
            <div>
              <h3 style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {ev.title} <span className="kbd">{format(new Date(ev.start), "HH:mm")}</span>
              </h3>
              <p>
                {format(new Date(ev.start), "PPpp")} – {format(new Date(ev.end), "PPpp")}
                {ev.location ? ` • ${ev.location}` : ""}
              </p>
              {ev.description ? <p style={{ marginTop: 8 }}>{ev.description}</p> : null}
            </div>
            <div className="btn-group">
              <button className="btn" onClick={() => onEventClick?.(ev.raw)}>
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
