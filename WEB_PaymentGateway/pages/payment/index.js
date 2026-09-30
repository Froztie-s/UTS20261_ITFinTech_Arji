import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { formatRupiah } from "@/lib/format";
import { TAX_RATE, calcTax } from "@/lib/pricing";
import { postJSON } from "@/lib/api";
import BackHeader from "@/components/BackHeader";
import Field from "@/components/Field";
import { LockIcon } from "@/components/icons";

const METHODS = [
  { id: "qris", label: "QRIS", hint: "Scan with any banking or e-wallet app" },
  { id: "bca_va", label: "BCA Virtual Account", hint: "Transfer from m-BCA, KlikBCA or a BCA ATM" },
  { id: "indomaret", label: "Indomaret", hint: "Pay with a code at any Indomaret store" },
];

// Email is optional (receipt only); when filled it must look valid.
function validateEmail(email) {
  const v = email.trim();
  if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid email address.";
  return "";
}

export default function Payment() {
  const router = useRouter();
  const { list, loaded, totalQty, totalPrice, details, updateDetails } = useCart();
  const [emailError, setEmailError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const subtotal = totalPrice;
  const tax = calcTax(subtotal);
  const total = subtotal + tax;
  // A method saved earlier that no longer exists (for example "card") falls back to QRIS
  const method = METHODS.some((m) => m.id === details.method) ? details.method : "qris";

  const onEmailChange = (e) => {
    updateDetails({ email: e.target.value });
    if (emailError) setEmailError("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const error = validateEmail(details.email);
    setEmailError(error);
    if (error) {
      document.getElementById("f-email")?.focus();
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      const checkout = await postJSON("/api/checkout", {
        items: list.map((i) => ({ productId: i.productId, qty: i.qty })),
        email: details.email.trim(),
        method,
      });
      const payment = await postJSON("/api/payment/create", { checkoutId: checkout.checkoutId });
      // Each method has its own payment screen on /payment/[id]
      await router.push(`/payment/${payment.paymentId}`);
    } catch (err) {
      setSubmitError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Secure Checkout</title>
      </Head>
      <BackHeader href="/checkout" title="Secure Checkout" icon={<LockIcon width={16} height={16} />} />

      <main className="mx-auto max-w-xl px-4 pb-10 lg:max-w-6xl lg:px-8 lg:pb-16">
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
          <form
            onSubmit={onSubmit}
            noValidate
            className="lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:gap-12 lg:pt-8"
          >
            <div>
              <section className="pt-5 lg:pt-0" aria-labelledby="method-heading">
                <h2 id="method-heading" className="mb-3 text-sm font-bold lg:text-lg lg:font-extrabold">
                  Payment Method
                </h2>
                <div role="radiogroup" aria-labelledby="method-heading" className="space-y-2 lg:space-y-3">
                  {METHODS.map((m) => (
                    <label
                      key={m.id}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-white px-3.5 py-3 transition-colors has-checked:border-brand has-checked:bg-brand-soft has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand-strong lg:gap-4 lg:px-5 lg:py-4"
                    >
                      <input
                        type="radio"
                        name="method"
                        value={m.id}
                        checked={method === m.id}
                        onChange={() => updateDetails({ method: m.id })}
                        className="h-4 w-4 accent-brand-strong outline-none lg:h-5 lg:w-5"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold lg:text-base">{m.label}</span>
                        <span className="block text-xs text-muted lg:text-sm">{m.hint}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </section>

              <section className="pt-6 lg:max-w-md lg:pt-8">
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
            </div>

            <aside className="lg:sticky lg:top-24 lg:rounded-2xl lg:border lg:border-line lg:bg-white lg:p-6">
              <section className="pt-6 lg:pt-0" aria-labelledby="summary-heading">
                <h2 id="summary-heading" className="mb-3 text-sm font-bold lg:text-base lg:font-extrabold">
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
                disabled={submitting}
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-base font-bold text-white transition-colors hover:bg-brand-strong active:bg-brand-strong disabled:cursor-wait disabled:opacity-70"
              >
                {submitting ? "Processing..." : "Confirm & Pay"}
              </button>
              {submitError && (
                <p role="alert" className="mt-3 text-center text-sm font-medium text-danger">
                  {submitError}
                </p>
              )}
            </aside>
          </form>
        )}
      </main>
    </>
  );
}
