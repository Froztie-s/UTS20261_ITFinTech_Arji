import Link from "next/link";
import { useEffect, useState } from "react";
import { formatRupiah } from "@/lib/format";
import { ChevronDownIcon, ClockIcon } from "@/components/icons";

// Pieces shared by the custom payment screens (QRIS, BCA virtual account, Indomaret).

const pad = (n) => String(n).padStart(2, "0");

export function formatCountdown(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

const timeFmt = new Intl.DateTimeFormat("id-ID", { timeStyle: "short", timeZone: "Asia/Jakarta" });

// Seconds left until expiresAt, ticking once a second. remaining is null when there is no expiry.
export function useCountdown(expiresAt) {
  const [now, setNow] = useState(() => Date.now());
  const end = expiresAt ? new Date(expiresAt).getTime() : null;
  const remaining = end ? Math.max(0, Math.floor((end - now) / 1000)) : null;
  const expired = remaining === 0;

  useEffect(() => {
    if (!end || expired) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [end, expired]);

  return { end, remaining, expired, urgent: remaining !== null && remaining > 0 && remaining <= 60 };
}

export function AmountHeader({ total, countdown }) {
  const { remaining, expired, urgent, end } = countdown;
  return (
    <section className="mt-6 text-center" aria-labelledby="pay-total-label">
      <p id="pay-total-label" className="text-sm text-muted">
        Total to pay
      </p>
      <p className="text-4xl font-extrabold tabular-nums leading-tight">{formatRupiah(total)}</p>

      {remaining !== null && !expired && (
        <p
          className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold transition-colors ${
            urgent ? "bg-danger-soft text-danger" : "bg-brand-soft text-brand-strong"
          }`}
        >
          <ClockIcon width={16} height={16} />
          <span aria-hidden>Pay within {formatCountdown(remaining)}</span>
          <span className="sr-only">Valid until {timeFmt.format(new Date(end))}</span>
        </p>
      )}
    </section>
  );
}

export function StatusLine({ expired, expiredText }) {
  return (
    <div className="mt-4 text-center" role="status" aria-live="polite">
      {expired ? (
        <p className="text-sm font-medium text-danger">{expiredText}</p>
      ) : (
        <p className="inline-flex items-center gap-2 text-sm text-muted">
          <span className="h-2 w-2 animate-pulse rounded-full bg-brand" aria-hidden />
          Waiting for payment
        </p>
      )}
    </div>
  );
}

export function HowToPay({ steps }) {
  return (
    <section className="mt-7" aria-labelledby="how-heading">
      <h2 id="how-heading" className="mb-3 text-sm font-bold">
        How to pay
      </h2>
      <ol className="space-y-3">
        {steps.map((text, i) => (
          <li key={i} className="flex gap-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-extrabold text-brand-strong">
              {i + 1}
            </span>
            <span className="pt-0.5 text-sm leading-relaxed">{text}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function OrderDetails({ payment }) {
  return (
    <details className="group mt-7 rounded-2xl border border-line bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5 text-sm font-bold [&::-webkit-details-marker]:hidden">
        Order details
        <ChevronDownIcon width={18} height={18} className="text-muted transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-line px-4 pb-4 pt-2 text-sm">
        <ul className="divide-y divide-line">
          {payment.items.map((i) => (
            <li key={i.name} className="flex justify-between gap-4 py-2">
              <span>
                {i.name} <span className="text-muted">x{i.qty}</span>
              </span>
              <span className="font-medium tabular-nums">{formatRupiah(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-1 space-y-2 border-t border-line pt-3">
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
        <p className="mt-3 break-all font-mono text-xs leading-5 text-muted">{payment.orderId}</p>
      </div>
    </details>
  );
}

// A labelled value with a Copy button (VA number, payment code, amount)
export function CopyRow({ label, value, display, big = false }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = value;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } finally {
        document.body.removeChild(ta);
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const button = (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy ${label.toLowerCase()}`}
      className="h-10 shrink-0 rounded-lg border border-brand-line bg-white px-4 text-sm font-bold text-brand-strong transition-colors hover:bg-brand-soft active:bg-brand-line"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );

  if (big) {
    // Long numbers get their own full-width line and wrap only between groups of digits
    const groups = (display || value).split(" ");
    return (
      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted">{label}</p>
          {button}
        </div>
        <p
          className="mt-1 flex flex-wrap gap-x-3 text-[26px] font-extrabold leading-tight tabular-nums"
          aria-label={value}
        >
          {groups.map((g, i) => (
            <span key={i} aria-hidden>
              {g}
            </span>
          ))}
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm text-muted">{label}</p>
        <p className="break-all text-lg font-extrabold tabular-nums">{display || value}</p>
      </div>
      {button}
    </div>
  );
}

// Sandbox only: points testers to the Midtrans simulator for this payment method
export function SimulatorNote({ href, name, children }) {
  return (
    <section
      className="mt-7 rounded-2xl border border-dashed border-brand-line bg-brand-soft/60 p-4"
      aria-labelledby="sandbox-heading"
    >
      <h2 id="sandbox-heading" className="text-sm font-bold">
        Test this payment (sandbox)
      </h2>
      <p className="mt-1 text-sm leading-relaxed">
        {children} Open the{" "}
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-brand-strong underline underline-offset-2"
        >
          {name}
        </a>{" "}
        to pay it.
      </p>
    </section>
  );
}

export function ExpiredActions() {
  return (
    <Link
      href="/"
      className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-brand text-base font-bold text-white transition-colors hover:bg-brand-strong"
    >
      Order again
    </Link>
  );
}

export function BackToMenu() {
  return (
    <Link
      href="/"
      className="mt-4 flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold text-muted hover:text-ink"
    >
      Back to menu
    </Link>
  );
}
