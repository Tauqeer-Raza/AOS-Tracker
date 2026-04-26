export default function DataTable({
  columns,
  rows,
  emptyText = "No records found.",
  className = "",
}) {
  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-[#555555]">
        {emptyText}
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto rounded-2xl border border-slate-200 ${className}`}>
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-white">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#555555]"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((row, index) => (
            <tr key={row.id || index} className="align-top">
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-3.5 text-[#111111]">
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
