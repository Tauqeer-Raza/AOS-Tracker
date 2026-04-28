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

const createInitialForm = () => ({
  startDate: today,
  endDate: today,
  projectId: "",
  employeeId: "",
  hours: "",
});

const fieldClassName =
  "mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[#111111] outline-none transition focus:border-primary";

const formatDateLabel = (value) => dateFormatter.format(new Date(`${value}T00:00:00`));

const enumerateDates = (startDate, endDate) => {
  const dates = [];
  const cursor = new Date(`${startDate}T00:00:00`);
  const limit = new Date(`${endDate}T00:00:00`);

  while (cursor <= limit) {
    dates.push(cursor.toISOString().split("T")[0]);
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
};

const getRangeDetails = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return {
      dates: [],
      dayCount: 0,
      label: "Select a start and end date.",
      isValid: false,
    };
  }

  if (endDate < startDate) {
    return {
      dates: [],
      dayCount: 0,
      label: "End date must be the same as or after the start date.",
      isValid: false,
    };
  }

  const dates = enumerateDates(startDate, endDate);
  const dayCount = dates.length;

  if (dayCount === 1) {
    return {
      dates,
      dayCount,
      label: `1 entry will be created for ${formatDateLabel(startDate)}.`,
      isValid: true,
    };
  }

  return {
    dates,
    dayCount,
    label: `${dayCount} entries will be created from ${formatDateLabel(
      startDate
    )} to ${formatDateLabel(endDate)}.`,
    isValid: true,
  };
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

function DateRangeField({ formValues, onChange }) {
  const rangeDetails = getRangeDetails(formValues.startDate, formValues.endDate);

  return (
    <label className="text-sm font-medium text-[#111111]">
      Date / Dates
      <div className="mt-2 rounded-[22px] border border-slate-200 bg-[#F8FAFF] p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#555555]">
            Start Date
            <input
              type="date"
              className={fieldClassName}
              value={formValues.startDate}
              onChange={(event) => onChange("startDate", event.target.value)}
            />
          </label>

          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#555555]">
            End Date
            <input
              type="date"
              className={fieldClassName}
              value={formValues.endDate}
              onChange={(event) => onChange("endDate", event.target.value)}
            />
          </label>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-sm font-semibold text-[#111111]">
            {rangeDetails.isValid ? rangeDetails.label : "Range preview"}
          </p>
          <p className="mt-1 text-sm text-[#555555]">
            {rangeDetails.isValid
              ? "Use the same start and end date for a single-day entry."
              : rangeDetails.label}
          </p>
        </div>
      </div>
    </label>
  );
}

function CreateLogFormFields({ formValues, onChange, employees, projects }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <DateRangeField formValues={formValues} onChange={onChange} />

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

  const selectedRange = useMemo(
    () => getRangeDetails(entryForm.startDate, entryForm.endDate),
    [entryForm.startDate, entryForm.endDate]
  );

  const handleFormChange = (key, value) => {
    setEntryForm((current) => ({
      ...current,
      [key]: value,
    }));
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

    if (!selectedRange.isValid) {
      setSubmitting(false);
      setError("Choose a valid date range before submitting the work log.");
      return;
    }

    const payload = {
      employeeId: Number(entryForm.employeeId),
      projectId: Number(entryForm.projectId),
      hours: Number(entryForm.hours),
    };

    if (selectedRange.dayCount === 1) {
      payload.date = selectedRange.dates[0];
    } else {
      payload.dates = selectedRange.dates;
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
          `Entry saved successfully for ${selectedRange.dates
            .map((date) => formatDateLabel(date))
            .join(", ")}.`
      );
      setError(failedDatesMessage);
      setEntryForm(createInitialForm());

      if (selectedRange.dates.includes(selectedDate)) {
        await refreshSelectedDate();
      }

      if (selectedRange.dayCount > 1 && !response.data?.message) {
        setMessage(`Created ${createdCount} individual work log entries.`);
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
        subtitle="Add work logs across one day or a full date range, review selected-date totals, and keep contribution reporting accurate."
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
        <Card className="min-h-[430px] overflow-hidden">
          <SectionHeader
            eyebrow="Daily Logger"
            title="Add Work Entry"
            subtitle="Set a start and end date once. The app will create one row per day in that range."
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

        <Card className="min-h-[430px] overflow-hidden">
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
