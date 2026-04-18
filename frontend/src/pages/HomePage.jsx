import { categories } from "../data/instamartDataset";
import { Link } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import BannerCarousel from "../components/BannerCarousel";
import CategoryStrip from "../components/CategoryStrip";
import LoadingGrid from "../components/LoadingGrid";
import ProductCard from "../components/ProductCard";

function HomePage() {
  const { allItems, addToCart, catalogLoading } = useShop();

  return (
    <section className="space-y-4">
      <BannerCarousel />
      <CategoryStrip categories={categories} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Link to="/recycle" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
          Recycle Pickup
        </Link>
        <Link to="/wallet" className="rounded-2xl border border-lime-200 bg-lime-50 p-3 text-sm font-semibold text-lime-700">
          Eco Wallet
        </Link>
        <Link to="/orders" className="rounded-2xl border border-yellow-200 bg-yellow-50 p-3 text-sm font-semibold text-yellow-700">
          My Orders
        </Link>
        <Link to="/cart" className="rounded-2xl border border-sky-200 bg-sky-50 p-3 text-sm font-semibold text-sky-700">
          Open Cart
        </Link>
      </div>

      <div>
        <h2 className="font-display text-xl font-semibold">Top picks for you</h2>
        <p className="text-sm text-slate-600">Instant delivery inspired shopping experience.</p>
      </div>

      {catalogLoading ? (
        <LoadingGrid />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {allItems.slice(0, 20).map((item) => (
            <ProductCard key={item.id} item={item} onAdd={addToCart} />
          ))}
        </div>
      )}
    </section>
  );
}

export default HomePage;
