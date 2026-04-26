import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../services/api.js";
import Card from "../components/Card.jsx";
import DataTable from "../components/DataTable.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Loader from "../components/Loader.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import StatCard from "../components/StatCard.jsx";

const palette = ["#002CCE", "#2D6BFF", "#5E85FF", "#8AA8FF", "#B9CBFF"];
const today = new Date().toISOString().split("T")[0];

const inputClassName =
  "mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-[#111111] outline-none transition focus:border-primary";

const sortRows = (rows, sortBy) => {
  const sorted = [...rows];

  sorted.sort((left, right) => {
    switch (sortBy) {
      case "projectName":
        return left.projectName.localeCompare(right.projectName);
      case "employeeName":
        return left.employeeName.localeCompare(right.employeeName);
      case "percentage":
        return right.percentage - left.percentage;
      case "totalHours":
      default:
        return right.employeeHours - left.employeeHours;
    }
  });

  return sorted;
};

export default function ReportsPage() {
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filters, setFilters] = useState({
    fromDate: today,
    toDate: today,
    projectId: "",
    employeeId: "",
  });
  const [reportData, setReportData] = useState({
    projects: [],
    employeeContributions: [],
    summary: {
      totalProjects: 0,
      totalEmployees: 0,
      totalLogs: 0,
      totalHours: 0,
    },
  });
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [sortBy, setSortBy] = useState("totalHours");
  const [lookupsLoading, setLookupsLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
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

  const generateReport = useCallback(async (activeFilters) => {
    setReportLoading(true);
    setError("");

    try {
      const response = await api.get("/report", { params: activeFilters });
      setReportData({
        projects: response.data.projects,
        employeeContributions: response.data.employeeContributions,
        summary: response.data.summary,
      });
      setSelectedProjectId((current) => current || String(response.data.projects[0]?.projectId || ""));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to generate report.");
    } finally {
      setReportLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadPage = async () => {
      await Promise.all([fetchLookups(), generateReport(filters)]);
    };

    loadPage().catch(() => {
      setError("Unable to load report page.");
      setLookupsLoading(false);
      setReportLoading(false);
    });
  }, [fetchLookups, generateReport]);

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleGenerate = async (event) => {
    event.preventDefault();
    await generateReport(filters);
  };

  const handleExport = async (fullData = false) => {
    setExporting(true);
    setError("");

    try {
      const params = fullData
        ? { allData: true }
        : {
            fromDate: filters.fromDate,
            toDate: filters.toDate,
            projectId: filters.projectId,
            employeeId: filters.employeeId,
          };

      const response = await api.get("/export", {
        params,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = fullData ? "aos-total-data.xlsx" : "aos-filtered-report.xlsx";
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to export Excel report.");
    } finally {
      setExporting(false);
    }
  };

  const sortedContributionRows = useMemo(
    () => sortRows(reportData.employeeContributions, sortBy),
    [reportData.employeeContributions, sortBy]
  );

  const sortedProjects = useMemo(() => {
    const grouped = reportData.projects.map((project) => {
      const employeeRows = project.employees.map((employee) => ({
        projectId: project.projectId,
        projectName: project.projectName,
        employeeId: employee.employeeId,
        employeeName: employee.employeeName,
        employeeHours: employee.totalHours,
        percentage: employee.percentage,
        totalProjectHours: project.totalProjectHours,
      }));

      return {
        ...project,
        employees: sortRows(employeeRows, sortBy),
      };
    });

    if (sortBy === "projectName") {
      return [...grouped].sort((left, right) =>
        left.projectName.localeCompare(right.projectName)
      );
    }

    return [...grouped].sort((left, right) => right.totalProjectHours - left.totalProjectHours);
  }, [reportData.projects, sortBy]);

  const selectedProject = useMemo(() => {
    return (
      sortedProjects.find((project) => String(project.projectId) === String(selectedProjectId)) ||
      sortedProjects[0]
    );
  }, [selectedProjectId, sortedProjects]);

  useEffect(() => {
    if (sortedProjects.length && !sortedProjects.some((item) => String(item.projectId) === String(selectedProjectId))) {
      setSelectedProjectId(String(sortedProjects[0].projectId));
    }
  }, [selectedProjectId, sortedProjects]);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Reports"
        title="Project Contribution Reports"
        subtitle="Generate project-wise contribution reports with aligned table, chart, and Excel calculations."
        action={
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleExport(false)}
              disabled={exporting}
              className="rounded-2xl border border-primary px-4 py-3 text-sm font-semibold text-primary"
            >
              {exporting ? "Preparing..." : "Download Filtered Report"}
            </button>
            <button
              type="button"
              onClick={() => handleExport(true)}
              disabled={exporting}
              className="rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white"
            >
              Download Total Data
            </button>
          </div>
        }
      />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Card>
        <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-6" onSubmit={handleGenerate}>
          <label className="text-sm font-medium text-[#111111]">
            From Date
            <input
              type="date"
              value={filters.fromDate}
              onChange={(event) => handleFilterChange("fromDate", event.target.value)}
              className={inputClassName}
            />
          </label>

          <label className="text-sm font-medium text-[#111111]">
            To Date
            <input
              type="date"
              value={filters.toDate}
              onChange={(event) => handleFilterChange("toDate", event.target.value)}
              className={inputClassName}
            />
          </label>

          <label className="text-sm font-medium text-[#111111]">
            Project
            <select
              value={filters.projectId}
              onChange={(event) => handleFilterChange("projectId", event.target.value)}
              className={inputClassName}
            >
              <option value="">All projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-[#111111]">
            Employee
            <select
              value={filters.employeeId}
              onChange={(event) => handleFilterChange("employeeId", event.target.value)}
              className={inputClassName}
            >
              <option value="">All employees</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-[#111111]">
            Sort By
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className={inputClassName}
            >
              <option value="projectName">Project Name</option>
              <option value="employeeName">Employee Name</option>
              <option value="totalHours">Total Hours</option>
              <option value="percentage">Percentage</option>
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white"
            >
              Generate Report
            </button>
          </div>
        </form>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Projects" value={reportData.summary.totalProjects} />
        <StatCard label="Employees" value={reportData.summary.totalEmployees} />
        <StatCard label="Report Rows" value={reportData.summary.totalLogs} />
        <StatCard label="Total Hours" value={reportData.summary.totalHours.toFixed(2)} />
      </div>

      {reportLoading ? (
        <Card>
          <Loader label="Generating report..." />
        </Card>
      ) : !sortedProjects.length ? (
        <EmptyState
          title="No data found"
          description="Adjust the filters or add dashboard logs to generate contribution reports."
        />
      ) : (
        <>
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <Card>
              <SectionHeader
                eyebrow="Charts"
                title="Contribution Pie Chart"
                subtitle="Contribution percentage by employee for the selected project."
                action={
                  <select
                    value={selectedProject?.projectId || ""}
                    onChange={(event) => setSelectedProjectId(event.target.value)}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-[#111111] outline-none transition focus:border-primary"
                  >
                    {sortedProjects.map((project) => (
                      <option key={project.projectId} value={project.projectId}>
                        {project.projectName}
                      </option>
                    ))}
                  </select>
                }
              />

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={selectedProject?.employees || []}
                      dataKey="percentage"
                      nameKey="employeeName"
                      innerRadius={60}
                      outerRadius={110}
                      label={({ employeeName, percentage }) =>
                        `${employeeName} ${percentage.toFixed(2)}%`
                      }
                    >
                      {(selectedProject?.employees || []).map((entry, index) => (
                        <Cell key={entry.employeeId} fill={palette[index % palette.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <SectionHeader
                eyebrow="Charts"
                title="Hours Distribution"
                subtitle={`Total project hours: ${selectedProject?.totalProjectHours?.toFixed?.(2) || "0.00"}`}
              />

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={selectedProject?.employees || []}>
                    <XAxis dataKey="employeeName" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip formatter={(value) => Number(value).toFixed(2)} />
                    <Bar dataKey="employeeHours" fill="#002CCE" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card>
            <SectionHeader
              eyebrow="Contribution Rows"
              title="Employee Contribution by Project"
              subtitle="Globally sorted contribution rows using the current report filters."
            />

            <DataTable
              rows={sortedContributionRows}
              columns={[
                { key: "projectName", label: "Project" },
                { key: "employeeName", label: "Employee" },
                {
                  key: "employeeHours",
                  label: "Total Hours",
                  render: (row) => row.employeeHours.toFixed(2),
                },
                {
                  key: "percentage",
                  label: "Percentage",
                  render: (row) => `${row.percentage.toFixed(2)}%`,
                },
              ]}
            />
          </Card>

          <div className="space-y-6">
            {sortedProjects.map((project) => (
              <Card key={project.projectId}>
                <SectionHeader
                  eyebrow="Project"
                  title={project.projectName}
                  subtitle={`Total project hours: ${project.totalProjectHours.toFixed(2)}`}
                />

                <DataTable
                  rows={project.employees}
                  columns={[
                    { key: "employeeName", label: "Employee" },
                    {
                      key: "employeeHours",
                      label: "Employee Hours",
                      render: (row) => row.employeeHours.toFixed(2),
                    },
                    {
                      key: "percentage",
                      label: "Contribution %",
                      render: (row) => `${row.percentage.toFixed(2)}%`,
                    },
                  ]}
                />
              </Card>
            ))}
          </div>
        </>
      )}

      {lookupsLoading ? (
        <Card>
          <Loader label="Loading report filters..." />
        </Card>
      ) : null}
    </div>
  );
}
