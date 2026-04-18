function LoadingGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="animate-pulse rounded-2xl border border-lime-100 bg-white p-3">
          <div className="shimmer h-24 rounded-xl" />
          <div className="shimmer mt-2 h-3 rounded" />
          <div className="shimmer mt-2 h-3 w-2/3 rounded" />
          <div className="shimmer mt-3 h-7 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default LoadingGrid;
