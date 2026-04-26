export default function StatCard({ label, value, note }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-5 shadow-[0_10px_30px_rgba(0,44,206,0.05)]">
      <div className="mb-4 h-1.5 w-12 rounded-full bg-primary" />
      <p className="text-sm text-[#555555]">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-[#111111]">{value}</p>
      {note ? <p className="mt-2 text-xs text-[#555555]">{note}</p> : null}
    </div>
  );
}
