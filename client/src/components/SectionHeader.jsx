export default function SectionHeader({ eyebrow, title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/70">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-2 text-2xl font-semibold text-[#111111]">{title}</h2>
        {subtitle ? <p className="mt-2 text-sm text-[#555555]">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
