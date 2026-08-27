export function EmptyPanel({
  action,
  columns,
  empty,
}: {
  action: string;
  columns: string[];
  empty: string;
}) {
  return (
    <section className="overflow-hidden rounded-[28px] bg-white shadow-[0_1px_1px_rgba(28,36,30,0.04),0_16px_40px_rgba(28,36,30,0.05)]">
      <div className="flex flex-col gap-3 border-b border-[#ebe6de] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          placeholder="Search"
          className="h-11 w-full rounded-full bg-[#f6f3ee] px-4 text-sm outline-none placeholder:text-[#9aa59a] focus:bg-white focus:ring-2 focus:ring-[#c5d4b8] sm:max-w-xs"
        />
        <button
          type="button"
          className="h-11 rounded-full bg-[#7d9570] px-5 text-sm font-medium text-white hover:bg-[#5f7356]"
        >
          {action}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="text-[#6a756c]">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-6 py-3.5 font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={columns.length} className="px-6 py-20 text-center">
                <p className="font-medium text-[#1c241e]">{empty}</p>
                <p className="mt-1 text-[#6a756c]">
                  Use {action.toLowerCase()} when you are ready to create the
                  first record.
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
