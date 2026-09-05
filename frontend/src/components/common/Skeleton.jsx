export function MetricCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-3.5 bg-slate-200 rounded w-24"></div>
        <div className="h-8 w-8 bg-slate-100 rounded-lg"></div>
      </div>
      <div className="h-8 bg-slate-200 rounded w-36 mb-2"></div>
      <div className="h-3 bg-slate-100 rounded w-44"></div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="border-b border-slate-100 animate-pulse">
      <td className="py-3.5 px-4"><div className="h-3.5 bg-slate-200 rounded w-20"></div></td>
      <td className="py-3.5 px-4"><div className="h-3.5 bg-slate-200 rounded w-36"></div></td>
      <td className="py-3.5 px-4"><div className="h-5 bg-slate-100 rounded-full w-16"></div></td>
      <td className="py-3.5 px-4"><div className="h-5 bg-slate-100 rounded w-14"></div></td>
      <td className="py-3.5 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-20 ml-auto"></div></td>
      <td className="py-3.5 px-4 text-center"><div className="h-4 bg-slate-100 rounded w-10 mx-auto"></div></td>
      <td className="py-3.5 px-4 text-right"><div className="h-6 w-6 bg-slate-100 rounded ml-auto"></div></td>
    </tr>
  );
}
