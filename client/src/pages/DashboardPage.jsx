import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api.js";
import Card from "../components/Card.jsx";
import DataTable from "../components/DataTable.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Loader from "../components/Loader.jsx";
import Modal from "../components/Modal.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import SectionSkeleton from "../components/SectionSkeleton.jsx";
import StatCard from "../components/StatCard.jsx";

const today = new Date().toISOString().split("T")[0];
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});
const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});
const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const createInitialForm = () => ({
  selectedDates: [],
  projectId: "",
  employeeId: "",
  hours: "",
});

const fieldClassName =
  "mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[#111111] outline-none transition focus:border-primary";

const formatDateLabel = (value) => dateFormatter.format(new Date(`${value}T00:00:00`));
const buildDateKey = (year, month, day) =>
  `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const sortDateKeys = (dates) => [...new Set(dates)].sort((left, right) => left.localeCompare(right));

const getSelectedDateSummary = (dates) => {
  const sortedDates = sortDateKeys(dates);

  if (!sortedDates.length) {
    return {
      dates: [],
      dayCount: 0,
      label: "Click calendar dates to build your work log selection.",
      isValid: false,
    };
  }

  if (sortedDates.length === 1) {
    return {
      dates: sortedDates,
      dayCount: 1,
      label: `1 entry will be created for ${formatDateLabel(sortedDates[0])}.`,
      isValid: true,
    };
  }

  return {
    dates: sortedDates,
    dayCount: sortedDates.length,
    label: `${sortedDates.length} entries will be created for the selected dates.`,
    isValid: true,
  };
};

const getCalendarDays = (visibleMonth) => {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const firstWeekday = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPreviousMonth = new Date(year, month, 0).getDate();
  const days = [];

  for (let index = 0; index < 42; index += 1) {
    const dayOffset = index - firstWeekday + 1;

    if (dayOffset <= 0) {
      days.push({
        label: daysInPreviousMonth + dayOffset,
        dateKey: null,
        inCurrentMonth: false,
      });
      continue;
    }

    if (dayOffset > daysInMonth) {
      days.push({
        label: dayOffset - daysInMonth,
        dateKey: null,
        inCurrentMonth: false,
      });
      continue;
    }

    days.push({
      label: dayOffset,
      dateKey: buildDateKey(year, month, dayOffset),
      inCurrentMonth: true,
    });
  }

  return days;
};

const buildFailedDatesMessage = (failedDates = [], invalidDates = []) => {
  const parts = [];

  if (invalidDates.length) {
    parts.push(`Invalid dates: ${invalidDates.join(", ")}`);
  }

  if (failedDates.length) {
    parts.push(
      `Skipped dates: ${failedDates
        .map(
          (item) =>
            `${formatDateLabel(item.date)} (existing ${Number(item.existingHours).toFixed(
              2
            )}h, requested ${Number(item.requestedHours).toFixed(2)}h)`
        )
        .join("; ")}`
    );
  }

  return parts.join(" ");
};

const extractRequestError = (requestError, fallbackMessage) => {
  const payload = requestError.response?.data;
  const failedDatesMessage = buildFailedDatesMessage(payload?.failedDates, payload?.invalidDates);

  return [payload?.message, failedDatesMessage, fallbackMessage].filter(Boolean).join(" ");
};

function MultiDateCalendar({
  selectedDates,
  visibleMonth,
  onToggleDate,
  onClearDates,
  onMonthChange,
}) {
  const calendarDays = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth]);
  const selectedDateSet = useMemo(() => new Set(selectedDates), [selectedDates]);
  const selectedSummary = getSelectedDateSummary(selectedDates);
  const previewDates = selectedSummary.dates.slice(0, 6);
  const remainingCount = Math.max(0, selectedSummary.dayCount - previewDates.length);

  return (
    <label className="text-sm font-medium text-[#111111]">
      Date / Dates
      <div className="mt-2 rounded-[22px] border border-slate-200 bg-[#F8FAFF] p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#555555]">
              Select Dates
            </p>
            <p className="mt-1 text-sm font-semibold text-[#111111]">
              {monthFormatter.format(visibleMonth)}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onMonthChange(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg text-[#111111]"
              aria-label="Previous month"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => onMonthChange(1)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg text-[#111111]"
              aria-label="Next month"
            >
              ›
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-7 gap-2.5">
          {weekdayLabels.map((label) => (
            <div
              key={label}
              className="text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-[#555555] sm:text-xs"
            >
              {label}
            </div>
          ))}

          {calendarDays.map((day, index) => {
            const isSelected = day.dateKey ? selectedDateSet.has(day.dateKey) : false;

            return (
              <button
                key={`${day.label}-${index}`}
                type="button"
                disabled={!day.inCurrentMonth}
                onClick={() => day.dateKey && onToggleDate(day.dateKey)}
                className={[
                  "flex aspect-square min-h-[46px] items-center justify-center rounded-2xl border text-sm font-semibold transition sm:min-h-[52px]",
                  day.inCurrentMonth
                    ? "border-slate-200 bg-white text-[#111111] hover:border-primary hover:text-primary"
                    : "cursor-default border-transparent bg-transparent text-slate-300",
                  isSelected ? "border-primary bg-primary text-white hover:text-white" : "",
                ].join(" ")}
              >
                {day.label}
              </button>
            );
          })}
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#111111]">
                {selectedSummary.isValid ? selectedSummary.label : "No dates selected yet."}
              </p>
              <p className="mt-1 text-sm text-[#555555]">
                Click any date to toggle it on or off, just like seat selection.
              </p>
            </div>

            <button
              type="button"
              onClick={onClearDates}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-[#555555]"
            >
              Clear
            </button>
          </div>

          {previewDates.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {previewDates.map((date) => (
                <span
                  key={date}
                  className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary"
                >
                  {formatDateLabel(date)}
                </span>
              ))}
              {remainingCount ? (
                <span className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-[#555555]">
                  +{remainingCount} more
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </label>
  );
}

function CreateLogFormFields({
  formValues,
  employees,
  projects,
  visibleMonth,
  onMonthChange,
  onToggleDate,
  onClearDates,
  onChange,
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="md:col-span-2">
        <MultiDateCalendar
          selectedDates={formValues.selectedDates}
          visibleMonth={visibleMonth}
          onToggleDate={onToggleDate}
          onClearDates={onClearDates}
          onMonthChange={onMonthChange}
        />
      </div>

      <label className="text-sm font-medium text-[#111111] md:col-span-2">
        Project Name
        <select
          required
          className={fieldClassName}
          value={formValues.projectId}
          onChange={(event) => onChange("projectId", event.target.value)}
        >
          <option value="">Select project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm font-medium text-[#111111]">
        Employee Name
        <select
          required
          className={fieldClassName}
          value={formValues.employeeId}
          onChange={(event) => onChange("employeeId", event.target.value)}
        >
          <option value="">Select employee</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm font-medium text-[#111111]">
        Hours
        <input
          type="number"
          min="0.25"
          max="8"
          step="0.25"
          required
          className={fieldClassName}
          value={formValues.hours}
          onChange={(event) => onChange("hours", event.target.value)}
          placeholder="e.g. 8"
        />
      </label>
    </div>
  );
}

function EditLogFormFields({ formValues, onChange, employees, projects }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <label className="text-sm font-medium text-[#111111]">
        Date
        <input
          type="date"
          className={fieldClassName}
          value={formValues.date}
          onChange={(event) => onChange("date", event.target.value)}
        />
      </label>

      <label className="text-sm font-medium text-[#111111]">
        Project Name
        <select
          required
          className={fieldClassName}
          value={formValues.projectId}
          onChange={(event) => onChange("projectId", event.target.value)}
        >
          <option value="">Select project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm font-medium text-[#111111]">
        Employee Name
        <select
          required
          className={fieldClassName}
          value={formValues.employeeId}
          onChange={(event) => onChange("employeeId", event.target.value)}
        >
          <option value="">Select employee</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm font-medium text-[#111111]">
        Hours
        <input
          type="number"
          min="0.25"
          max="8"
          step="0.25"
          required
          className={fieldClassName}
          value={formValues.hours}
          onChange={(event) => onChange("hours", event.target.value)}
          placeholder="e.g. 8"
        />
      </label>
    </div>
  );
}

export default function DashboardPage() {
  const [entryForm, setEntryForm] = useState(createInitialForm);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const currentDate = new Date();
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(today);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState([]);
  const [lookupsLoading, setLookupsLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchLookups = useCallback(async () => {
    setLookupsLoading(true);

    try {
      const [employeesResponse, projectsResponse] = await Promise.all([
        api.get("/employees"),
        api.get("/projects"),
      ]);
      setEmployees(employeesResponse.data);
      setProjects(projectsResponse.data);
    } finally {
      setLookupsLoading(false);
    }
  }, []);

  const fetchDailyLogs = useCallback(async (dateToFetch) => {
    setLogsLoading(true);

    try {
      const response = await api.get("/logs", { params: { date: dateToFetch } });
      setEntries(response.data.logs);
      setSummary(response.data.summary);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLookups().catch((requestError) => {
      setError(requestError.response?.data?.message || "Unable to load dashboard data.");
    });
  }, [fetchLookups]);

  useEffect(() => {
    fetchDailyLogs(selectedDate).catch((requestError) => {
      setError(requestError.response?.data?.message || "Unable to load selected date logs.");
    });
  }, [fetchDailyLogs, selectedDate]);

  const totalHoursForSelectedDate = useMemo(
    () => summary.reduce((total, item) => total + Number(item.totalHours), 0).toFixed(2),
    [summary]
  );

  const selectedDateSummary = useMemo(
    () => getSelectedDateSummary(entryForm.selectedDates),
    [entryForm.selectedDates]
  );

  const handleFormChange = (key, value) => {
    setEntryForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleToggleDate = (dateKey) => {
    setEntryForm((current) => {
      const currentSelection = new Set(current.selectedDates);

      if (currentSelection.has(dateKey)) {
        currentSelection.delete(dateKey);
      } else {
        currentSelection.add(dateKey);
      }

      return {
        ...current,
        selectedDates: sortDateKeys(Array.from(currentSelection)),
      };
    });
    setError("");
  };

  const handleClearDates = () => {
    setEntryForm((current) => ({
      ...current,
      selectedDates: [],
    }));
  };

  const handleMonthChange = (offset) => {
    setVisibleMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + offset, 1)
    );
  };

  const handleEditFieldChange = (key, value) => {
    setEditingLog((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const refreshSelectedDate = useCallback(async () => {
    await fetchDailyLogs(selectedDate);
  }, [fetchDailyLogs, selectedDate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    if (!selectedDateSummary.isValid) {
      setSubmitting(false);
      setError("Select one or more dates from the calendar before submitting the work log.");
      return;
    }

    const payload = {
      employeeId: Number(entryForm.employeeId),
      projectId: Number(entryForm.projectId),
      hours: Number(entryForm.hours),
    };

    if (selectedDateSummary.dayCount === 1) {
      payload.date = selectedDateSummary.dates[0];
    } else {
      payload.dates = selectedDateSummary.dates;
    }

    try {
      const response = await api.post("/logs", payload);
      const createdCount = response.data?.createdCount || 1;
      const failedDatesMessage = buildFailedDatesMessage(
        response.data?.failedDates,
        response.data?.invalidDates
      );

      setMessage(
        response.data?.message ||
          `Entry saved successfully for ${selectedDateSummary.dates
            .map((date) => formatDateLabel(date))
            .join(", ")}.`
      );
      setError(failedDatesMessage);
      setEntryForm(createInitialForm());

      if (selectedDateSummary.dates.includes(selectedDate)) {
        await refreshSelectedDate();
      }
    } catch (requestError) {
      setError(extractRequestError(requestError, "Failed to submit entry."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (log) => {
    setEditingLog({
      id: log.id,
      date: log.date,
      employeeId: String(log.employeeId),
      projectId: String(log.projectId),
      hours: String(Number(log.hours)),
    });
    setError("");
    setMessage("");
  };

  const handleEditSave = async (event) => {
    event.preventDefault();
    setSavingEdit(true);
    setError("");

    try {
      await api.put(`/logs/${editingLog.id}`, {
        date: editingLog.date,
        employeeId: Number(editingLog.employeeId),
        projectId: Number(editingLog.projectId),
        hours: Number(editingLog.hours),
      });

      setMessage("Entry updated successfully.");
      setEditingLog(null);
      await refreshSelectedDate();
    } catch (requestError) {
      setError(extractRequestError(requestError, "Failed to update entry."));
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (log) => {
    const confirmed = window.confirm(
      `Delete the log for ${log.Employee?.name || "this employee"} on ${log.date}?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(log.id);
    setError("");
    setMessage("");

    try {
      await api.delete(`/logs/${log.id}`);
      setMessage("Entry deleted successfully.");
      await refreshSelectedDate();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to delete entry.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Dashboard"
        title="AOS - Employee Proportion Tracker"
        subtitle="Click the dates you want, submit once, and the app will create one separate row per selected day."
      />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Selected Date Hours"
          value={totalHoursForSelectedDate}
          note={`For ${selectedDate}`}
        />
        <StatCard label="Employees Logged" value={summary.length} />
        <StatCard label="Entries Logged" value={entries.length} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.22fr)_minmax(320px,0.78fr)]">
        <Card className="min-h-[560px] overflow-hidden">
          <SectionHeader
            eyebrow="Daily Logger"
            title="Add Work Entry"
            subtitle="Pick any combination of dates from the calendar, then set the project and hours below."
          />

          {lookupsLoading ? (
            <Loader label="Loading form options..." />
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <CreateLogFormFields
                formValues={entryForm}
                onChange={handleFormChange}
                employees={employees}
                projects={projects}
                visibleMonth={visibleMonth}
                onMonthChange={handleMonthChange}
                onToggleDate={handleToggleDate}
                onClearDates={handleClearDates}
              />

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Saving..." : "Submit Entry"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEntryForm(createInitialForm());
                    setVisibleMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
                    setError("");
                  }}
                  className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-[#555555]"
                >
                  Reset
                </button>
              </div>
            </form>
          )}
        </Card>

        <Card className="min-h-[560px] overflow-hidden">
          <SectionHeader
            eyebrow="Daily Summary"
            title="Hours by Employee"
            subtitle="Employee-wise total hours for the selected date."
            action={
              <label className="w-full text-sm font-medium text-[#111111] sm:w-auto">
                <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-[#555555]">
                  Summary Date
                </span>
                <input
                  type="date"
                  className="h-12 w-full rounded-2xl border border-slate-200 px-4 py-3 text-[#111111] outline-none transition focus:border-primary sm:w-auto"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                />
              </label>
            }
          />

          {logsLoading ? (
            <SectionSkeleton rows={4} />
          ) : summary.length ? (
            <div className="space-y-3">
              {summary.map((item) => (
                <div
                  key={item.employeeId}
                  className="rounded-2xl border border-slate-200 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[#111111]">{item.employeeName}</p>
                      <p className="text-sm text-[#555555]">Total hours for {selectedDate}</p>
                    </div>
                    <p className="shrink-0 text-xl font-semibold text-primary">{item.totalHours}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No logs for this date"
              description="Choose another date or add a work entry to build the employee summary."
            />
          )}
        </Card>
      </div>

      <Card className="overflow-hidden">
        <SectionHeader
          eyebrow="Entries"
          title="Selected Date Logs"
          subtitle={`Detailed work logs for ${selectedDate}. Every row remains editable and deletable on its own.`}
        />

        {logsLoading ? (
          <Loader label="Loading selected date logs..." />
        ) : (
          <DataTable
            rows={entries}
            columns={[
              { key: "date", label: "Date" },
              { key: "project", label: "Project", render: (row) => row.Project?.name || "-" },
              { key: "employee", label: "Employee", render: (row) => row.Employee?.name || "-" },
              { key: "hours", label: "Hours", render: (row) => Number(row.hours).toFixed(2) },
              {
                key: "actions",
                label: "Actions",
                render: (row) => (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditClick(row)}
                      className="rounded-xl border border-primary px-3 py-2 text-xs font-semibold text-primary"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(row)}
                      disabled={deletingId === row.id}
                      className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 disabled:opacity-60"
                    >
                      {deletingId === row.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                ),
              },
            ]}
            emptyText="No entries logged yet for the selected date."
          />
        )}
      </Card>

      {editingLog ? (
        <Modal
          title="Edit Work Entry"
          subtitle="Update only this selected work log row."
          onClose={() => setEditingLog(null)}
        >
          <form className="space-y-5" onSubmit={handleEditSave}>
            <EditLogFormFields
              formValues={editingLog}
              onChange={handleEditFieldChange}
              employees={employees}
              projects={projects}
            />

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={savingEdit}
                className="rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white"
              >
                {savingEdit ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => setEditingLog(null)}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-[#555555]"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
