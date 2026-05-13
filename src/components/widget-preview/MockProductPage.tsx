export default function MockProductPage() {
  return (
    <div className="grid grid-cols-2 gap-8">
      <div className="aspect-square rounded-xl bg-slate-100" />
      <div className="space-y-4">
        <div className="h-8 w-4/5 rounded bg-slate-200" />
        <div className="h-4 w-1/2 rounded bg-slate-100" />
        <div className="h-16 rounded bg-slate-50" />
        <div className="h-10 w-full rounded bg-slate-900" />
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-3/4 rounded bg-slate-100" />
      </div>
    </div>
  );
}

