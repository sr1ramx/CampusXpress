import { useMemo } from "react";
import { useParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useShop } from "../context/ShopContext";

function CategoryPage() {
  const { categoryName } = useParams();
  const { catalog, addToCart } = useShop();

  const items = useMemo(() => catalog[categoryName] || [], [catalog, categoryName]);

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h1 className="font-display text-2xl font-semibold text-slate-900">{categoryName}</h1>
        <p className="text-sm text-slate-600">{items.length} products available</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {items.map((item) => (
          <ProductCard key={item.id} item={item} onAdd={addToCart} />
        ))}
      </div>
    </section>
  );
}

export default CategoryPage;
