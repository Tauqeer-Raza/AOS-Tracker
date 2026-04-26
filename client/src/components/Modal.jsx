export default function Modal({ title, subtitle, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-2xl rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(17,17,17,0.18)]">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-[#111111]">{title}</h3>
            {subtitle ? <p className="mt-2 text-sm text-[#555555]">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-[#555555]"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
