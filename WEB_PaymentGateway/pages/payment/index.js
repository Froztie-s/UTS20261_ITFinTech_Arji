import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { formatRupiah } from "@/lib/format";
import { TAX_RATE, calcTax } from "@/lib/pricing";
import BackHeader from "@/components/BackHeader";
import Field from "@/components/Field";
import { LockIcon } from "@/components/icons";

const METHODS = [
  { id: "card", label: "Credit / Debit Card", hint: "Visa, Mastercard, JCB" },
  { id: "qris", label: "QRIS", hint: "Scan with any banking or e-wallet app" },
  { id: "other", label: "Other", hint: "E-wallet (GoPay, ShopeePay) or bank transfer" },
];

// Email is optional (receipt only); when filled it must look valid.
function validateEmail(email) {
  const v = email.trim();
  if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid email address.";
  return "";
}

export default function Payment() {
  const { list, loaded, totalQty, totalPrice, details, updateDetails } = useCart();
  const [emailError, setEmailError] = useState("");

  const subtotal = totalPrice;
  const tax = calcTax(subtotal);
  const total = subtotal + tax;

  const onEmailChange = (e) => {
    updateDetails({ email: e.target.value });
    if (emailError) setEmailError("");
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const error = validateEmail(details.email);
    setEmailError(error);
    if (error) {
      document.getElementById("f-email")?.focus();
      return;
    }
    // Next steps: POST /api/checkout, then /api/payment/create, then open the Midtrans payment.
  };

  return (
    <>
      <Head>
        <title>Secure Checkout</title>
      </Head>
      <BackHeader href="/checkout" title="Secure Checkout" icon={<LockIcon width={16} height={16} />} />

      <main className="mx-auto max-w-xl px-4 pb-10">
        {!loaded && <div className="mt-6 h-40 animate-pulse rounded-xl bg-line" aria-busy="true" />}

        {loaded && list.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-base font-semibold">Your cart is empty</p>
            <p className="mt-1 text-sm text-muted">Add something before paying.</p>
            <Link
              href="/"
              className="mt-5 inline-flex h-11 items-center rounded-xl bg-brand px-5 text-[15px] font-bold text-white transition-colors hover:bg-brand-strong"
            >
              Browse the menu
            </Link>
          </div>
        )}

        {loaded && list.length > 0 && (
          <form onSubmit={onSubmit} noValidate>
            <section className="pt-5" aria-labelledby="method-heading">
              <h2 id="method-heading" className="mb-3 text-sm font-bold">
                Payment Method
              </h2>
              <div role="radiogroup" aria-labelledby="method-heading" className="space-y-2">
                {METHODS.map((m) => (
                  <label
                    key={m.id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-white px-3.5 py-3 transition-colors has-checked:border-brand has-checked:bg-brand-soft has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand-strong"
                  >
                    <input
                      type="radio"
                      name="method"
                      value={m.id}
                      checked={details.method === m.id}
                      onChange={() => updateDetails({ method: m.id })}
                      className="h-4 w-4 accent-brand-strong outline-none"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{m.label}</span>
                      <span className="block text-xs text-muted">{m.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </section>

            <section className="pt-6">
              <Field
                id="f-email"
                label="Email for receipt (optional)"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={details.email}
                onChange={onEmailChange}
                error={emailError}
              />
            </section>

            <section className="pt-6" aria-labelledby="summary-heading">
              <h2 id="summary-heading" className="mb-3 text-sm font-bold">
                Order Summary
              </h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Item(s) ({totalQty})</dt>
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
            </section>

            <button
              type="submit"
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-base font-bold text-white transition-colors hover:bg-brand-strong active:bg-brand-strong"
            >
              Confirm &amp; Pay
            </button>
          </form>
        )}
      </main>
    </>
  );
}
