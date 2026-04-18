const steps = ["Order placed", "Preparing", "Out for delivery", "Delivered"];

function TrackingSteps({ status }) {
  const activeIndex =
    status === "Delivered"
      ? 3
      : status === "Out for delivery"
        ? 2
        : status === "Preparing"
          ? 1
          : 0;

  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center gap-3">
          <span className={`h-3 w-3 rounded-full ${index <= activeIndex ? "bg-lime-500" : "bg-slate-300"}`} />
          <p className={`text-sm ${index <= activeIndex ? "text-slate-900" : "text-slate-500"}`}>{step}</p>
        </div>
      ))}
    </div>
  );
}

export default TrackingSteps;
