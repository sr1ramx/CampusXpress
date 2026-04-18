import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import ProductCard from "../components/ProductCard";
import LoadingGrid from "../components/LoadingGrid";
import useDebouncedValue from "../hooks/useDebouncedValue";
import { useShop } from "../context/ShopContext";

function SearchPage() {
  const { allItems, addToCart } = useShop();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const debouncedQuery = useDebouncedValue(query, 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery]);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) {
      return [];
    }

    return allItems.filter((item) =>
      `${item.name} ${item.category} ${item.description}`.toLowerCase().includes(q)
    );
  }, [allItems, debouncedQuery]);

  const PAGE_SIZE = 16;
  const paginatedResults = useMemo(
    () => filtered.slice(0, page * PAGE_SIZE),
    [filtered, page]
  );
  const hasMore = paginatedResults.length < filtered.length;

  const suggestions = useMemo(() => filtered.slice(0, 6), [filtered]);

  const isDebouncing = query !== debouncedQuery;

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-lime-200 bg-white p-4 shadow-sm">
        <label className="flex items-center gap-2 rounded-xl border border-lime-200 bg-lime-50 px-3 py-2">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            autoFocus
            placeholder="Search for products, category, keywords"
            className="w-full bg-transparent text-sm outline-none"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        {query && (
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setQuery(item.name)}
                className="rounded-full bg-lime-100 px-3 py-1 text-xs text-lime-700"
              >
                {item.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {isDebouncing ? (
        <LoadingGrid />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {paginatedResults.map((item) => (
            <ProductCard key={item.id} item={item} onAdd={addToCart} />
          ))}
        </div>
      )}

      {!isDebouncing && hasMore && (
        <button
          type="button"
          onClick={() => setPage((prev) => prev + 1)}
          className="w-full rounded-full border border-lime-300 bg-white px-4 py-2 text-sm font-semibold text-lime-700"
        >
          Load more
        </button>
      )}

      {!isDebouncing && !filtered.length && debouncedQuery && (
        <p className="rounded-xl bg-white p-4 text-sm text-slate-600">No products found for this query.</p>
      )}

      {!isDebouncing && !debouncedQuery && (
        <p className="rounded-xl bg-white p-4 text-sm text-slate-600">Start typing to search 200+ products quickly.</p>
      )}

      {!isDebouncing && filtered.length > 0 && debouncedQuery && (
        <p className="text-xs text-slate-500">Showing {paginatedResults.length} of {filtered.length} results</p>
      )}
    </section>
  );
}

export default SearchPage;
