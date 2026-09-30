import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/context/CartContext";
import { formatRupiah } from "@/lib/format";
import BackHeader from "@/components/BackHeader";
import QrisPayment from "@/components/QrisPayment";
import { CheckCircleIcon, ClockIcon, XCircleIcon } from "@/components/icons";

const POLL_MS = 4000;

const STATUS = {
  PENDING: {
    label: "Waiting for payment",
    badge: "Pending",
    hint: "This page updates by itself once your payment is received.",
    Icon: ClockIcon,
    tone: "bg-brand-soft text-brand-strong",
  },
  LUNAS: {
    label: "Payment received",
    badge: "LUNAS",
    hint: "Thank you! Your order is paid.",
    Icon: CheckCircleIcon,
    tone: "bg-success-soft text-success",
  },
  EXPIRED: {
    label: "Payment expired",
    badge: "Expired",
    hint: "The payment window has closed. Please place the order again.",
    Icon: XCircleIcon,
    tone: "bg-danger-soft text-danger",
  },
  FAILED: {
    label: "Payment failed",
    badge: "Failed",
    hint: "The payment did not go through. Please place the order again.",
    Icon: XCircleIcon,
    tone: "bg-danger-soft text-danger",
  },
};

const METHOD_LABEL = { card: "Credit / Debit Card", qris: "QRIS", other: "E-wallet / Bank transfer" };

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

export default function PaymentStatus() {
  const { id } = useRouter().query;
  const { clearCart } = useCart();
  const [payment, setPayment] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const clearedRef = useRef(false);
  const status = payment?.status;

  // Fetch once, then keep polling while the payment is still pending
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    let timer;

    const load = async () => {
      try {
        const res = await fetch(`/api/payment/${id}`);
        if (cancelled) return;
        if (res.status === 404) return setNotFound(true);
        if (!res.ok) throw new Error("bad response");
        const data = await res.json();
        setPayment(data);
        setLoadError(false);
        if (data.status === "PENDING") timer = setTimeout(load, POLL_MS);
      } catch {
        if (cancelled) return;
        setLoadError(true);
        timer = setTimeout(load, POLL_MS * 2);
      }
    };
    load();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [id]);

  // The order exists now, so the cart can be emptied (once)
  useEffect(() => {
    if (!clearedRef.current && (status === "PENDING" || status === "LUNAS")) {
      clearedRef.current = true;
      clearCart();
    }
  }, [status, clearCart]);

  const s = status ? STATUS[status] : null;
  // While a QRIS payment is open the whole page is the QR screen
  const showQris = status === "PENDING" && !!payment?.qrString;
  const pageTitle = showQris ? "Pay with QRIS" : "Order status";

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <BackHeader href="/" title={pageTitle} />

      <main className="mx-auto max-w-xl px-4 pb-10">
        {notFound && (
          <div className="py-16 text-center">
            <p className="text-base font-semibold">We could not find this order</p>
            <p className="mt-1 text-sm text-muted">Check the link, or start a new order.</p>
            <Link
              href="/"
              className="mt-5 inline-flex h-11 items-center rounded-xl bg-brand px-5 text-[15px] font-bold text-white transition-colors hover:bg-brand-strong"
            >
              Browse the menu
            </Link>
          </div>
        )}

        {!notFound && !payment && (
          <div className="mt-6 space-y-3" aria-busy="true" aria-label="Loading order">
            <div className="h-28 animate-pulse rounded-2xl bg-line" />
            <div className="h-40 animate-pulse rounded-2xl bg-line" />
          </div>
        )}

        {showQris && (
          <>
            {loadError && (
              <p role="alert" className="mt-3 text-center text-sm font-medium text-danger">
                Having trouble refreshing. Retrying...
              </p>
            )}
            <QrisPayment payment={payment} />
          </>
        )}

        {payment && s && !showQris && (
          <>
            <section
              role="status"
              aria-live="polite"
              className={`mt-5 flex items-center gap-4 rounded-2xl px-4 py-5 ${s.tone}`}
            >
              <s.Icon width={40} height={40} strokeWidth={1.8} className="shrink-0" />
              <div className="min-w-0">
                <p className="text-lg font-extrabold leading-tight">{s.label}</p>
                <p className="mt-0.5 text-sm">{s.hint}</p>
              </div>
              <span className="ml-auto shrink-0 rounded-full border border-current px-3 py-1 text-sm font-extrabold tracking-wide">
                {s.badge}
              </span>
            </section>

            {loadError && (
              <p role="alert" className="mt-3 text-center text-sm font-medium text-danger">
                Having trouble refreshing. Retrying...
              </p>
            )}

            <section className="mt-6" aria-labelledby="bill-heading">
              <h2 id="bill-heading" className="mb-3 text-sm font-bold">
                Bill
              </h2>
              <div className="rounded-2xl border border-line bg-white px-4 py-4">
                <p className="text-sm text-muted">{status === "LUNAS" ? "Total paid" : "Amount due"}</p>
                <p className="text-3xl font-extrabold tabular-nums">{formatRupiah(payment.total)}</p>

                <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
                  <div>
                    <dt className="text-muted">Order ID</dt>
                    <dd className="break-all font-mono text-xs leading-5">{payment.orderId}</dd>
                  </div>
                  {payment.paymentMethod && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted">Method</dt>
                      <dd className="font-medium">{METHOD_LABEL[payment.paymentMethod]}</dd>
                    </div>
                  )}
                  {payment.paidAt && (
                    <div className="flex justify-between gap-4">
                      <dt className="whitespace-nowrap text-muted">Paid on</dt>
                      <dd className="font-medium">{dateFmt.format(new Date(payment.paidAt))}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </section>

            {payment.items.length > 0 && (
              <section className="mt-6" aria-labelledby="items-heading">
                <h2 id="items-heading" className="mb-3 text-sm font-bold">
                  Order summary
                </h2>
                <ul className="divide-y divide-line text-sm">
                  {payment.items.map((i) => (
                    <li key={i.name} className="flex justify-between gap-4 py-2">
                      <span>
                        {i.name} <span className="text-muted">x{i.qty}</span>
                      </span>
                      <span className="font-medium tabular-nums">{formatRupiah(i.price * i.qty)}</span>
                    </li>
                  ))}
                </ul>
                <dl className="mt-1 space-y-2 border-t border-line pt-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted">Subtotal</dt>
                    <dd className="font-medium tabular-nums">{formatRupiah(payment.subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Tax</dt>
                    <dd className="font-medium tabular-nums">{formatRupiah(payment.tax)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-line pt-3 text-base">
                    <dt className="font-bold">Total</dt>
                    <dd className="font-extrabold tabular-nums">{formatRupiah(payment.total)}</dd>
                  </div>
                </dl>
              </section>
            )}

            <div className="mt-6 space-y-2">
              {status === "PENDING" && payment.redirectUrl && (
                <a
                  href={payment.redirectUrl}
                  className="flex h-12 w-full items-center justify-center rounded-xl bg-brand text-base font-bold text-white transition-colors hover:bg-brand-strong"
                >
                  Pay now
                </a>
              )}
              <Link
                href="/"
                className={
                  status === "PENDING"
                    ? "flex h-11 w-full items-center justify-center rounded-xl border border-line bg-white text-sm font-semibold hover:bg-brand-soft"
                    : "flex h-12 w-full items-center justify-center rounded-xl bg-brand text-base font-bold text-white transition-colors hover:bg-brand-strong"
                }
              >
                {status === "LUNAS" ? "Order more" : status === "PENDING" ? "Back to menu" : "Order again"}
              </Link>
            </div>
          </>
        )}
      </main>
    </>
  );
}
