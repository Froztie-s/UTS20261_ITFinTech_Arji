import Head from "next/head";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatRupiah } from "@/lib/format";
import { TAX_RATE, calcTax } from "@/lib/pricing";
import BackHeader from "@/components/BackHeader";
import Thumb from "@/components/Thumb";
import Stepper from "@/components/Stepper";
import { ArrowRightIcon } from "@/components/icons";

export default function Checkout() {
  const { list, loaded, totalQty, totalPrice, increaseItem, decreaseItem } = useCart();

  const subtotal = totalPrice;
  const tax = calcTax(subtotal);
  const total = subtotal + tax;

  return (
    <>
      <Head>
        <title>Checkout</title>
      </Head>
      <BackHeader href="/" title="Checkout" />

      <main className="mx-auto max-w-xl px-4 pb-10 lg:max-w-6xl lg:px-8 lg:pb-16">
        {!loaded && (
          <div aria-busy="true" aria-label="Loading cart">
            {[0, 1].map((i) => (
              <div key={i} className="flex gap-3 border-b border-line py-3">
                <div className="h-14 w-14 animate-pulse rounded-xl bg-line" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3.5 w-1/2 animate-pulse rounded bg-line" />
                  <div className="h-8 w-24 animate-pulse rounded bg-line" />
                </div>
              </div>
            ))}
          </div>
        )}

        {loaded && list.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-base font-semibold">Your cart is empty</p>
            <p className="mt-1 text-sm text-muted">Pick something from the menu to get started.</p>
            <Link
              href="/"
              className="mt-5 inline-flex h-11 items-center rounded-xl bg-brand px-5 text-[15px] font-bold text-white transition-colors hover:bg-brand-strong"
            >
              Browse the menu
            </Link>
          </div>
        )}

        {loaded && list.length > 0 && (
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:gap-12 lg:pt-8">
            <div>
              <h2 className="hidden border-b border-line pb-3 text-lg font-extrabold lg:block">
                Your order{" "}
                <span className="font-medium text-muted">
                  ({totalQty} {totalQty === 1 ? "item" : "items"})
                </span>
              </h2>
              <ul>
                {list.map((item) => (
                  <li
                    key={item.productId}
                    className="flex items-center gap-3 border-b border-line py-3 lg:gap-5 lg:py-5"
                  >
                    <Thumb src={item.image} alt={item.name} size={56} className="lg:h-20! lg:w-20!" />
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-[15px] font-semibold leading-snug lg:text-base">{item.name}</h2>
                      <p className="mb-1.5 text-xs text-muted lg:text-sm">{formatRupiah(item.price)} each</p>
                      <Stepper
                        qty={item.qty}
                        label={item.name}
                        onDecrease={() => decreaseItem(item.productId)}
                        onIncrease={() => increaseItem(item.productId)}
                      />
                    </div>
                    <p className="shrink-0 self-start pt-0.5 text-[15px] font-bold tabular-nums lg:pt-1 lg:text-base">
                      {formatRupiah(item.price * item.qty)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <aside className="lg:sticky lg:top-24 lg:rounded-2xl lg:border lg:border-line lg:bg-white lg:p-6">
              <h2 className="hidden text-base font-extrabold lg:block">Order summary</h2>
              <dl className="space-y-2 py-4 text-sm lg:pb-5">
                <div className="flex justify-between">
                  <dt className="text-muted">Subtotal</dt>
                  <dd className="font-medium tabular-nums">{formatRupiah(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Tax ({Math.round(TAX_RATE * 100)}%)</dt>
                  <dd className="font-medium tabular-nums">{formatRupiah(tax)}</dd>
                </div>
                <div className="flex justify-between border-t border-line pt-3 text-base">
                  <dt className="font-bold">Total</dt>
                  <dd className="font-extrabold tabular-nums">{formatRupiah(total)}</dd>
                </div>
              </dl>

              <Link
                href="/payment"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-base font-bold text-white transition-colors hover:bg-brand-strong active:bg-brand-strong"
              >
                Continue to Payment
                <ArrowRightIcon />
              </Link>
            </aside>
          </div>
        )}
      </main>
    </>
  );
}
