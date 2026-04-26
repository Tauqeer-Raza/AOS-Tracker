import Sidebar from "./Sidebar.jsx";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row">
        <Sidebar />
        <main className="flex-1 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(0,44,206,0.06)] md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
