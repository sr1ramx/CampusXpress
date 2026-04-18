function MetricCard({ title, value, accent, subtitle }) {
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-lime-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{title}</p>
      <h3 className="mt-3 font-display text-3xl text-slate-900">{value}</h3>
      <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
    </article>
  );
}

export default MetricCard;
