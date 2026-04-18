import { Link } from "react-router-dom";

function CategoryStrip({ categories }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {categories.map((category) => (
        <Link
          key={category}
          to={`/category/${category}`}
          className="whitespace-nowrap rounded-full border border-lime-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
        >
          {category}
        </Link>
      ))}
    </div>
  );
}

export default CategoryStrip;
