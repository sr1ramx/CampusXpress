import { resolveProductImage } from "../utils/productImages";

function ProductCard({ item, onAdd }) {
  const imageSrc = item.image || resolveProductImage(item.name, item.category);

  return (
    <article className="rounded-2xl border border-lime-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <img
        src={imageSrc}
        alt={item.name}
        onError={(event) => {
          event.currentTarget.onerror = null;
          event.currentTarget.src = resolveProductImage(item.name, item.category);
        }}
        className="h-24 w-full rounded-xl object-cover"
        loading="lazy"
      />
      <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-lime-600">{item.category}</p>
      <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900">{item.name}</h3>
      <p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.description}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="font-bold text-slate-900">INR {item.price}</span>
        <button
          type="button"
          onClick={() => onAdd(item)}
          className="rounded-full border border-lime-300 bg-lime-50 px-3 py-1 text-xs font-bold text-lime-700 hover:bg-lime-100"
        >
          ADD
        </button>
      </div>
    </article>
  );
}

export default ProductCard;
