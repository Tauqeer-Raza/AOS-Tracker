import { useEffect, useState } from "react";
import api from "../services/api.js";
import Card from "../components/Card.jsx";
import DataTable from "../components/DataTable.jsx";
import Loader from "../components/Loader.jsx";
import SectionHeader from "../components/SectionHeader.jsx";

const ResourceManager = ({
  title,
  subtitle,
  items,
  value,
  onChange,
  onAdd,
  onDelete,
  addLabel,
  emptyText,
}) => (
  <Card>
    <SectionHeader eyebrow="Admin" title={title} subtitle={subtitle} />
    <form
      className="mb-5 flex flex-col gap-3 md:flex-row"
      onSubmit={(event) => {
        event.preventDefault();
        onAdd();
      }}
    >
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={`Enter ${addLabel.toLowerCase()} name`}
        className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
      />
      <button
        type="submit"
        className="rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white"
      >
        {addLabel}
      </button>
    </form>

    <DataTable
      rows={items}
      emptyText={emptyText}
      columns={[
        { key: "name", label: "Name" },
        {
          key: "actions",
          label: "Actions",
          render: (row) => (
            <button
              type="button"
              onClick={() => onDelete(row.id)}
              className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600"
            >
              Remove
            </button>
          ),
        },
      ]}
    />
  </Card>
);

export default function AdminPage() {
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employeeName, setEmployeeName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [employeesResponse, projectsResponse] = await Promise.all([
        api.get("/employees"),
        api.get("/projects"),
      ]);
      setEmployees(employeesResponse.data);
      setProjects(projectsResponse.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addEmployee = async () => {
    if (!employeeName.trim()) {
      return;
    }

    await api.post("/employees", { name: employeeName });
    setEmployeeName("");
    await loadData();
  };

  const addProject = async () => {
    if (!projectName.trim()) {
      return;
    }

    await api.post("/projects", { name: projectName });
    setProjectName("");
    await loadData();
  };

  const removeEmployee = async (id) => {
    await api.delete(`/employees/${id}`);
    await loadData();
  };

  const removeProject = async (id) => {
    await api.delete(`/projects/${id}`);
    await loadData();
  };

  return (
    <div>
      <SectionHeader
        eyebrow="Administration"
        title="Manage Employees and Projects"
        subtitle="Control the master data used by the dashboard and reporting filters."
      />

      {loading ? <Loader label="Loading admin panel..." /> : null}
      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <ResourceManager
          title="Employees"
          subtitle="Add or remove employees available for work logging."
          items={employees}
          value={employeeName}
          onChange={setEmployeeName}
          onAdd={() => addEmployee().catch((requestError) => setError(requestError.response?.data?.message || "Failed to add employee."))}
          onDelete={(id) => removeEmployee(id).catch((requestError) => setError(requestError.response?.data?.message || "Failed to remove employee."))}
          addLabel="Add Employee"
          emptyText="No employees available yet."
        />

        <ResourceManager
          title="Projects"
          subtitle="Add or remove projects available for time tracking."
          items={projects}
          value={projectName}
          onChange={setProjectName}
          onAdd={() => addProject().catch((requestError) => setError(requestError.response?.data?.message || "Failed to add project."))}
          onDelete={(id) => removeProject(id).catch((requestError) => setError(requestError.response?.data?.message || "Failed to remove project."))}
          addLabel="Add Project"
          emptyText="No projects available yet."
        />
      </div>
    </div>
  );
}
