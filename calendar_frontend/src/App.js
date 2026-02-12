import React, { useEffect, useMemo, useState } from "react";
import { Plus, CalendarDays, LayoutGrid, Rows3, RefreshCcw, ChevronLeft, ChevronRight } from "lucide-react";
import "./App.css";
import CalendarView from "./components/CalendarView";
import EventDialog from "./components/EventDialog";
import { createEvent, deleteEvent, listEventsInRange, updateEvent } from "./api/events";
import { format } from "date-fns";
import { formatRangeLabel, getDayBounds, getMonthBounds, getWeekBounds, shiftAnchorDate } from "./lib/dates";

function toIso(date) {
  return date.toISOString();
}

function guessId(ev) {
  return ev?.id ?? ev?.eventId ?? ev?.Id ?? ev?.EventId ?? null;
}

function mapFormToApiPayload(form) {
  // Backend contract is unknown (swagger incomplete). Provide common fields.
  return {
    id: form.id ?? undefined,
    title: form.title,
    description: form.description,
    location: form.location,
    allDay: Boolean(form.allDay),
    start: toIso(form.start),
    end: toIso(form.end),
  };
}

// PUBLIC_INTERFACE
function App() {
  /** Smart Calendar frontend: day/week/month views with event CRUD. */
  const [view, setView] = useState("month"); // "day" | "week" | "month"
  const [anchorDate, setAnchorDate] = useState(() => new Date());

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("create");
  const [dialogInitialEvent, setDialogInitialEvent] = useState(null);
  const [dialogDefaultStart, setDialogDefaultStart] = useState(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const bounds = useMemo(() => {
    if (view === "month") return getMonthBounds(anchorDate);
    if (view === "week") return getWeekBounds(anchorDate);
    return getDayBounds(anchorDate);
  }, [view, anchorDate]);

  const rangeLabel = useMemo(() => formatRangeLabel(view, anchorDate), [view, anchorDate]);

  async function load() {
    setLoading(true);
    setLoadError("");
    try {
      const data = await listEventsInRange({ start: toIso(bounds.start), end: toIso(bounds.end) });
      // Expect either array or { items: [] }
      const list = Array.isArray(data) ? data : data?.items || data?.events || [];
      setEvents(list);
    } catch (e) {
      setLoadError(e?.message || "Failed to load events.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, anchorDate]);

  function openCreate(date) {
    setDialogMode("create");
    setDialogInitialEvent(null);
    setDialogDefaultStart(date || new Date());
    setSaveError("");
    setDialogOpen(true);
  }

  function openEdit(event) {
    setDialogMode("edit");
    setDialogInitialEvent(event);
    setDialogDefaultStart(null);
    setSaveError("");
    setDialogOpen(true);
  }

  async function handleSave(form) {
    setSaving(true);
    setSaveError("");
    try {
      const payload = mapFormToApiPayload(form);

      if (dialogMode === "edit") {
        const id = guessId(dialogInitialEvent) ?? form.id;
        if (!id) throw new Error("Missing event id.");
        await updateEvent(id, payload);
      } else {
        await createEvent(payload);
      }

      setDialogOpen(false);
      await load();
    } catch (e) {
      setSaveError(e?.message || "Failed to save event.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(form) {
    setSaving(true);
    setSaveError("");
    try {
      const id = guessId(dialogInitialEvent) ?? form.id;
      if (!id) throw new Error("Missing event id.");
      await deleteEvent(id);
      setDialogOpen(false);
      await load();
    } catch (e) {
      setSaveError(e?.message || "Failed to delete event.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="App">
      <div className="shell">
        <div className="topbar">
          <div className="container">
            <div className="topbar-inner">
              <div className="brand" aria-label="Smart Calendar">
                <div className="brand-badge" aria-hidden="true" />
                Smart Calendar
              </div>

              <div className="top-actions">
                <span className="pill" title="Today">
                  <CalendarDays size={16} />
                  <strong>{format(new Date(), "MMM d")}</strong>
                </span>
                <button className="btn btn-primary" onClick={() => openCreate(new Date())}>
                  <Plus size={16} />
                  New event
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="container">
          <div className="content">
            <aside className="sidebar" aria-label="Sidebar">
              <div className="sidebar-header">
                <div className="sidebar-title">Views</div>
              </div>
              <div className="sidebar-body">
                <button
                  className={`btn ${view === "day" ? "btn-primary" : ""}`}
                  onClick={() => setView("day")}
                >
                  <Rows3 size={16} /> Day
                </button>
                <button
                  className={`btn ${view === "week" ? "btn-primary" : ""}`}
                  onClick={() => setView("week")}
                >
                  <LayoutGrid size={16} /> Week
                </button>
                <button
                  className={`btn ${view === "month" ? "btn-primary" : ""}`}
                  onClick={() => setView("month")}
                >
                  <CalendarDays size={16} /> Month
                </button>

                <div style={{ height: 1, background: "var(--border)", margin: "6px 0" }} />

                <div className="sidebar-title" style={{ marginTop: 2 }}>
                  Tips
                </div>
                <div className="alert" style={{ marginTop: 6 }}>
                  <div style={{ fontWeight: 800, marginBottom: 6 }}>Quick actions</div>
                  <div style={{ color: "var(--muted)" }}>
                    Click a day to create. Click an event to edit. Use arrows to navigate.
                  </div>
                </div>
              </div>
            </aside>

            <main className="main" aria-label="Calendar">
              <div className="main-header">
                <div className="main-title">
                  <h1>{rangeLabel}</h1>
                  <p>
                    Range: {format(bounds.start, "PP")} – {format(bounds.end, "PP")}
                  </p>
                </div>

                <div className="btn-group" aria-label="Calendar controls">
                  <button className="btn btn-icon" onClick={() => setAnchorDate(new Date())} title="Go to today">
                    <CalendarDays size={16} />
                  </button>
                  <button
                    className="btn btn-icon"
                    onClick={() => setAnchorDate((d) => shiftAnchorDate(view, d, -1))}
                    aria-label="Previous"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    className="btn btn-icon"
                    onClick={() => setAnchorDate((d) => shiftAnchorDate(view, d, +1))}
                    aria-label="Next"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button className="btn" onClick={load} disabled={loading} title="Reload events">
                    <RefreshCcw size={16} />
                    {loading ? "Loading…" : "Refresh"}
                  </button>
                </div>
              </div>

              <div className="main-body">
                {loadError ? (
                  <div className="alert alert-error" style={{ marginBottom: 12 }}>
                    <strong>Failed to load events:</strong> {loadError}
                  </div>
                ) : null}

                {loading ? (
                  <div className="alert" style={{ marginBottom: 12 }}>
                    Loading events…
                  </div>
                ) : null}

                <div className="calendar-toolbar">
                  <span className="pill">
                    <strong>View:</strong> {view}
                  </span>
                  <span className="pill">
                    <strong>Events:</strong> {events?.length ?? 0}
                  </span>
                </div>

                <CalendarView
                  view={view}
                  anchorDate={anchorDate}
                  events={events}
                  onDayClick={(date) => openCreate(date)}
                  onEventClick={(ev) => openEdit(ev)}
                />
              </div>
            </main>
          </div>
        </div>

        <EventDialog
          open={dialogOpen}
          mode={dialogMode}
          initialEvent={dialogInitialEvent}
          defaultStartDate={dialogDefaultStart}
          onCancel={() => setDialogOpen(false)}
          onSave={handleSave}
          onDelete={handleDelete}
          busy={saving}
          error={saveError}
        />
      </div>
    </div>
  );
}

export default App;
