import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { formatRupiah } from "@/lib/format";
import Thumb from "@/components/Thumb";
import Stepper from "@/components/Stepper";
import { CartIcon, MenuIcon, PlusIcon, SearchIcon } from "@/components/icons";

const CATEGORIES = ["All", "Food", "Drink", "Snack"];

// Search box, used twice: in the header on desktop, under it on phones
function SearchBox({ value, onChange, className = "" }) {
  return (
    <label className={`relative block ${className}`}>
      <span className="sr-only">Search the menu</span>
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder="Search"
        className="h-11 w-full rounded-xl border border-line bg-white pl-4 pr-11 text-sm placeholder:text-muted"
      />
      <SearchIcon className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted" />
    </label>
  );
}

export default function SelectItems() {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const { items, totalQty, totalPrice, addItem, increaseItem, decreaseItem } = useCart();

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/products?category=${category}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Could not load the menu."))))
      .then((data) => !cancelled && setProducts(data))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [category, reloadKey]);

  const load = (nextCategory) => {
    setLoading(true);
    setError("");
    if (nextCategory !== undefined) setCategory(nextCategory);
    else setReloadKey((k) => k + 1);
  };

  const q = query.trim().toLowerCase();
  const visible = q ? products.filter((p) => p.name.toLowerCase().includes(q)) : products;

  return (
    <>
      <Head>
        <title>Select Items</title>
      </Head>

      <header className="sticky top-0 z-20 border-b border-line bg-white">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-3 px-4 lg:h-16 lg:max-w-7xl lg:gap-6 lg:px-8">
          <div className="relative lg:hidden" onKeyDown={(e) => e.key === "Escape" && setMenuOpen(false)}>
            <button
              type="button"
              aria-label="Menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
              className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand-strong"
            >
              <MenuIcon />
            </button>
            {menuOpen && (
              <>
                <button
                  type="button"
                  tabIndex={-1}
                  aria-hidden
                  className="fixed inset-0 z-20 cursor-default"
                  onClick={() => setMenuOpen(false)}
                />
                <nav className="absolute left-0 top-12 z-30 w-44 rounded-xl border border-line bg-white p-1 shadow-lg">
                  <Link href="/" className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-brand-soft">
                    Menu
                  </Link>
                  <Link
                    href="/checkout"
                    className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-brand-soft"
                  >
                    My cart
                  </Link>
                </nav>
              </>
            )}
          </div>

          <Link href="/" className="text-lg font-extrabold tracking-tight lg:text-xl">
            Warung <span className="text-brand-strong">Kita</span>
          </Link>

          {/* Desktop: search lives in the header, centred */}
          <SearchBox value={query} onChange={(e) => setQuery(e.target.value)} className="mx-auto hidden w-full max-w-md lg:block" />

          <Link
            href="/checkout"
            aria-label={`Cart, ${totalQty} ${totalQty === 1 ? "item" : "items"}`}
            className="relative ml-auto grid h-10 w-10 place-items-center rounded-xl hover:bg-brand-soft lg:ml-0 lg:flex lg:h-11 lg:w-auto lg:gap-2.5 lg:border lg:border-line lg:px-4"
          >
            <CartIcon />
            <span className="hidden text-sm font-bold tabular-nums lg:inline">
              {totalQty > 0 ? formatRupiah(totalPrice) : "Cart"}
            </span>
            {totalQty > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand-strong px-1 text-[11px] font-bold text-white lg:-right-1.5 lg:-top-1.5">
                {totalQty}
              </span>
            )}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl lg:max-w-7xl">
        <div className="flex items-end justify-between lg:px-8 lg:pt-8">
          <h1 className="sr-only lg:not-sr-only lg:text-3xl lg:font-extrabold lg:tracking-tight">Menu</h1>
          {!loading && !error && (
            <p className="hidden text-sm text-muted lg:block" aria-live="polite">
              {visible.length} {visible.length === 1 ? "item" : "items"}
            </p>
          )}
        </div>

        {/* Phones: search sits under the header */}
        <div className="px-4 pt-3 lg:hidden">
          <SearchBox value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>

        <div
          role="tablist"
          aria-label="Categories"
          className="mt-3 flex gap-6 overflow-x-auto border-b border-line px-4 [scrollbar-width:none] lg:mx-8 lg:mt-5 lg:gap-8 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {CATEGORIES.map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={category === c}
              onClick={() => load(c)}
              className={`-mb-px whitespace-nowrap border-b-2 py-2.5 text-sm font-semibold transition-colors lg:py-3 lg:text-[15px] ${
                category === c
                  ? "border-brand text-brand-strong"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {loading && (
          <ul
            className="grid gap-x-8 px-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5 lg:px-8 lg:pt-6 xl:grid-cols-4"
            aria-busy="true"
            aria-label="Loading menu"
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <li
                key={i}
                className={`flex gap-3 border-b border-line py-3 lg:flex-col lg:gap-0 lg:overflow-hidden lg:rounded-2xl lg:border lg:bg-white lg:py-0 ${
                  i >= 6 ? "hidden lg:flex" : ""
                }`}
              >
                <div className="h-16 w-16 shrink-0 animate-pulse rounded-xl bg-line lg:aspect-[4/3] lg:h-auto lg:w-full lg:rounded-none" />
                <div className="flex-1 space-y-2 pt-1 lg:p-4">
                  <div className="h-3.5 w-2/3 animate-pulse rounded bg-line" />
                  <div className="h-3.5 w-1/4 animate-pulse rounded bg-line" />
                  <div className="h-3 w-full animate-pulse rounded bg-line" />
                </div>
              </li>
            ))}
          </ul>
        )}

        {!loading && error && (
          <div className="px-4 py-10 text-center lg:py-20">
            <p className="font-medium text-danger">{error}</p>
            <button
              onClick={() => load()}
              className="mt-3 h-10 rounded-lg border border-brand-line px-4 text-sm font-semibold text-brand-strong hover:bg-brand-soft"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && visible.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-muted lg:py-20">
            <p>{q ? `Nothing matches "${query.trim()}".` : "No items in this category yet."}</p>
            {q && (
              <button
                onClick={() => setQuery("")}
                className="mt-3 h-10 rounded-lg border border-brand-line px-4 font-semibold text-brand-strong hover:bg-brand-soft"
              >
                Clear search
              </button>
            )}
          </div>
        )}

        {!loading && !error && visible.length > 0 && (
          <ul className="grid gap-x-8 px-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5 lg:px-8 lg:pb-12 lg:pt-6 xl:grid-cols-4">
            {visible.map((p) => {
              const qty = items[p._id]?.qty || 0;
              return (
                <li
                  key={p._id}
                  className="flex gap-3 border-b border-line py-3 lg:grid lg:grid-cols-[1fr_auto] lg:grid-rows-[auto_1fr_auto] lg:gap-0 lg:overflow-hidden lg:rounded-2xl lg:border lg:bg-white lg:py-0 lg:transition-shadow lg:duration-150 lg:hover:shadow-md"
                >
                  <Thumb src={p.image} alt={p.name} fluid className="lg:col-span-2" />

                  <div className="flex min-w-0 flex-1 flex-col lg:col-span-2 lg:px-4 lg:pt-4">
                    <h2 className="truncate text-[15px] font-semibold leading-snug lg:text-base lg:font-bold">{p.name}</h2>
                    <p className="text-sm font-bold text-brand-strong lg:hidden">{formatRupiah(p.price)}</p>
                    <p className="truncate text-xs text-muted lg:mt-1 lg:line-clamp-2 lg:whitespace-normal lg:text-sm">
                      {p.description}
                    </p>
                  </div>

                  <p className="hidden text-lg font-extrabold tabular-nums text-brand-strong lg:block lg:self-center lg:pb-4 lg:pl-4 lg:pt-3">
                    {formatRupiah(p.price)}
                  </p>

                  <div className="flex shrink-0 items-end lg:items-center lg:pb-4 lg:pr-4 lg:pt-3">
                    {qty === 0 ? (
                      <button
                        onClick={() => addItem(p)}
                        aria-label={`Add ${p.name}`}
                        className="inline-flex h-9 items-center gap-1 rounded-lg border border-brand-line px-3 text-sm font-semibold text-brand-strong transition-colors hover:bg-brand-soft active:bg-brand-line lg:h-10 lg:px-4"
                      >
                        Add
                        <PlusIcon width={14} height={14} />
                      </button>
                    ) : (
                      <Stepper
                        qty={qty}
                        label={p.name}
                        onDecrease={() => decreaseItem(p._id)}
                        onIncrease={() => increaseItem(p._id)}
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
