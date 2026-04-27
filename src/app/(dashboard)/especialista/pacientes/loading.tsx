export default function Loading() {
  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-8 w-40 rounded-lg bg-slate-200 animate-pulse mb-2" />
          <div className="h-4 w-28 rounded bg-slate-100 animate-pulse" />
        </div>
      </div>
      <div className="relative mb-6 max-w-sm">
        <div className="h-10 w-full rounded-xl bg-slate-100 animate-pulse" />
      </div>
      <PatientsSkeleton />
    </div>
  )
}

export function PatientsSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="hidden md:grid grid-cols-5 gap-4 px-6 py-3 border-b border-slate-100 bg-slate-50/50">
        {['col-span-2 w-20', 'w-16', 'w-24', 'w-16'].map((cls, i) => (
          <div key={i} className={`h-3 rounded ${cls} bg-slate-200 animate-pulse`} />
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-4 px-6 py-4 border-b border-slate-100 items-center animate-pulse"
        >
          {/* Patient column (col-span-2) */}
          <div className="col-span-2 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-slate-200 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-28 rounded bg-slate-200" />
              <div className="h-3 w-40 rounded bg-slate-100" />
            </div>
          </div>
          {/* Status badge */}
          <div className="h-6 w-20 rounded-full bg-slate-200" />
          {/* Last exam */}
          <div className="space-y-1.5">
            <div className="h-3.5 w-24 rounded bg-slate-200" />
            <div className="h-3 w-16 rounded bg-slate-100" />
          </div>
          {/* Actions */}
          <div className="flex gap-2">
            <div className="h-7 w-20 rounded-lg bg-slate-200" />
            <div className="h-7 w-28 rounded-lg bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  )
}
