import React, { useEffect, useMemo, useState } from "react";
import Modal from "./Modal";
import { toLocalDateTimeInputValue, parseEventDate } from "../lib/dates";

// PUBLIC_INTERFACE
export default function EventDialog({
  open,
  mode, // "create" | "edit"
  initialEvent,
  defaultStartDate,
  onCancel,
  onSave,
  onDelete,
  busy,
  error,
}) {
  /** Modal dialog for creating/editing a calendar event. */
  const initial = useMemo(() => {
    const now = new Date();
    const start = defaultStartDate || now;
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const startDate = parseEventDate(initialEvent?.start) || start;
    const endDate = parseEventDate(initialEvent?.end) || end;

    return {
      id: initialEvent?.id ?? initialEvent?.eventId ?? null,
      title: initialEvent?.title ?? "",
      description: initialEvent?.description ?? "",
      location: initialEvent?.location ?? "",
      allDay: Boolean(initialEvent?.allDay ?? false),
      start: startDate,
      end: endDate,
    };
  }, [initialEvent, defaultStartDate]);

  const [form, setForm] = useState(initial);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initial);
      setTouched(false);
    }
  }, [open, initial]);

  const validation = useMemo(() => {
    const problems = [];
    if (!form.title.trim()) problems.push("Title is required.");
    if (!form.start || !form.end) problems.push("Start and end are required.");
    if (form.start && form.end && form.end <= form.start) problems.push("End must be after start.");
    return { ok: problems.length === 0, problems };
  }, [form]);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const title = mode === "edit" ? "Edit event" : "New event";

  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <div className="modal-body">
        {error ? (
          <div className="alert alert-error span-2">
            <strong>Couldn’t save:</strong> {error}
          </div>
        ) : null}

        <div className="field span-2">
          <div className="label">Title</div>
          <input
            className="input"
            value={form.title}
            onChange={(e) => {
              setTouched(true);
              update("title", e.target.value);
            }}
            placeholder="e.g., Team sync"
            autoFocus
          />
        </div>

        <div className="field">
          <div className="label">Start</div>
          <input
            className="input"
            type="datetime-local"
            value={toLocalDateTimeInputValue(form.start)}
            onChange={(e) => {
              setTouched(true);
              update("start", new Date(e.target.value));
            }}
          />
        </div>

        <div className="field">
          <div className="label">End</div>
          <input
            className="input"
            type="datetime-local"
            value={toLocalDateTimeInputValue(form.end)}
            onChange={(e) => {
              setTouched(true);
              update("end", new Date(e.target.value));
            }}
          />
        </div>

        <div className="field span-2">
          <div className="label">Location (optional)</div>
          <input
            className="input"
            value={form.location}
            onChange={(e) => {
              setTouched(true);
              update("location", e.target.value);
            }}
            placeholder="e.g., Zoom / Meeting room"
          />
        </div>

        <div className="field span-2">
          <div className="label">Description (optional)</div>
          <textarea
            className="textarea"
            value={form.description}
            onChange={(e) => {
              setTouched(true);
              update("description", e.target.value);
            }}
            placeholder="Notes, agenda, links…"
          />
        </div>

        {!validation.ok && touched ? (
          <div className="alert alert-error span-2">
            <strong>Fix:</strong>
            <ul style={{ margin: "6px 0 0 18px" }}>
              {validation.problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="modal-footer">
        <div className="btn-group">
          {mode === "edit" ? (
            <button className="btn btn-danger" onClick={() => onDelete?.(form)} disabled={busy}>
              Delete
            </button>
          ) : (
            <span className="kbd">Tip: click a day to add</span>
          )}
        </div>

        <div className="btn-group">
          <button className="btn" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onSave?.(form)}
            disabled={busy || !validation.ok}
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
