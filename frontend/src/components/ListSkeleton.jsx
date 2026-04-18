function ListSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="animate-pulse rounded-2xl border border-lime-100 bg-white p-4">
          <div className="h-4 w-1/3 rounded bg-lime-100" />
          <div className="mt-2 h-3 rounded bg-lime-100" />
          <div className="mt-2 h-3 w-2/3 rounded bg-lime-100" />
        </div>
      ))}
    </div>
  );
}

export default ListSkeleton;
