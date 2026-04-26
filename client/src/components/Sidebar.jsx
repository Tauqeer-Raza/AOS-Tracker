import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Dashboard", to: "/" },
  { label: "Reports", to: "/reports" },
  { label: "Admin Panel", to: "/admin" },
];

export default function Sidebar() {
  return (
    <aside className="w-full rounded-[28px] border border-slate-200 bg-white px-6 py-8 shadow-[0_10px_30px_rgba(0,44,206,0.05)] lg:w-72">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.35em] text-primary">AOS</p>
        <h1 className="mt-3 text-2xl font-semibold leading-tight text-[#111111]">
          Employee Proportion Tracker
        </h1>
        <p className="mt-3 text-sm text-[#555555]">
          Track work logs, contribution ratios, and exportable reports.
        </p>
      </div>

      <nav className="space-y-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "border-primary bg-primary text-white"
                  : "border-slate-200 bg-white text-[#111111] hover:border-primary hover:text-primary"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
