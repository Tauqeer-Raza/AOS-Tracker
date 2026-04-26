export default function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(0,44,206,0.06)] ${className}`}
    >
      {children}
    </div>
  );
}
