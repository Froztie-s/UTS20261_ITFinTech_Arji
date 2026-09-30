import Link from "next/link";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { formatRupiah } from "@/lib/format";
import { ChevronDownIcon, ClockIcon, DownloadIcon } from "@/components/icons";

const timeFmt = new Intl.DateTimeFormat("id-ID", {
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

const pad = (n) => String(n).padStart(2, "0");

const SIMULATOR_URL = "https://simulator.sandbox.midtrans.com/v2/qris/index";

// Sandbox only (the API sends no URL in production): the Midtrans simulator asks for
// the QR image URL instead of scanning, so testers can pay without a phone.
function SandboxHelper({ url }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      document.getElementById("qr-image-url")?.select();
    }
  };

  return (
    <section className="mt-7 rounded-2xl border border-dashed border-brand-line bg-brand-soft/60 p-4" aria-labelledby="sandbox-heading">
      <h2 id="sandbox-heading" className="text-sm font-bold">
        Test this payment (sandbox)
      </h2>
      <p className="mt-1 text-sm leading-relaxed">
        Copy the QR image URL and paste it into the{" "}
        <a
          href={SIMULATOR_URL}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-brand-strong underline underline-offset-2"
        >
          Midtrans QRIS simulator
        </a>
        , then press Simulate.
      </p>
      <div className="mt-3 flex gap-2">
        <input
          id="qr-image-url"
          readOnly
          value={url}
          aria-label="QR image URL"
          onFocus={(e) => e.target.select()}
          className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-white px-3 font-mono text-xs"
        />
        <button
          type="button"
          onClick={copy}
          className="h-10 shrink-0 rounded-lg bg-brand px-4 text-sm font-bold text-white transition-colors hover:bg-brand-strong"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </section>
  );
}

// The QR page shown after Confirm & Pay with QRIS. The parent keeps polling the
// payment status and swaps this out for the LUNAS screen when the webhook lands.
export default function QrisPayment({ payment }) {
  const [qrUrl, setQrUrl] = useState("");
  const [now, setNow] = useState(() => Date.now());

  const expiresAt = payment.expiresAt ? new Date(payment.expiresAt).getTime() : null;
  const remaining = expiresAt ? Math.max(0, Math.floor((expiresAt - now) / 1000)) : null;
  const expired = remaining === 0;
  const urgent = remaining !== null && remaining > 0 && remaining <= 60;

  // Black on white with a quiet zone, so any scanner reads it
  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(payment.qrString, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 560,
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then((url) => !cancelled && setQrUrl(url))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [payment.qrString]);

  useEffect(() => {
    if (!expiresAt || expired) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [expiresAt, expired]);

  const steps = [
    "Open your banking or e-wallet app and choose Scan.",
    `Scan the code and check that the amount is ${formatRupiah(payment.total)}.`,
    "Confirm the payment. This page updates on its own, so keep it open.",
  ];

  return (
    <>
      <section className="mt-6 text-center" aria-labelledby="qris-total-label">
        <p id="qris-total-label" className="text-sm text-muted">
          Total to pay
        </p>
        <p className="text-4xl font-extrabold tabular-nums leading-tight">{formatRupiah(payment.total)}</p>

        {remaining !== null && !expired && (
          <p
            className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold transition-colors ${
              urgent ? "bg-danger-soft text-danger" : "bg-brand-soft text-brand-strong"
            }`}
          >
            <ClockIcon width={16} height={16} />
            <span aria-hidden>
              Pay within {pad(Math.floor(remaining / 60))}:{pad(remaining % 60)}
            </span>
            <span className="sr-only">Valid until {timeFmt.format(new Date(expiresAt))}</span>
          </p>
        )}
      </section>

      <section
        className="mx-auto mt-5 w-full max-w-72 rounded-3xl border border-line bg-white p-4 shadow-sm"
        aria-label="QRIS code"
      >
        <p className="mb-3 text-center text-sm font-extrabold tracking-wide">QRIS</p>
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-white">
          {qrUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrUrl}
              alt={`QRIS code for ${formatRupiah(payment.total)}. Scan it with any banking or e-wallet app.`}
              width={280}
              height={280}
              className={`h-full w-full transition-opacity ${expired ? "opacity-15" : ""}`}
            />
          ) : (
            <div className="h-full w-full animate-pulse bg-line" aria-busy="true" />
          )}
          {expired && (
            <div className="absolute inset-0 grid place-items-center">
              <p className="rounded-xl bg-white px-4 py-2 text-sm font-bold shadow-sm">QR code expired</p>
            </div>
          )}
        </div>
      </section>

      <div className="mt-4 text-center" role="status" aria-live="polite">
        {expired ? (
          <p className="text-sm font-medium text-danger">This code is no longer valid. Place the order again.</p>
        ) : (
          <p className="inline-flex items-center gap-2 text-sm text-muted">
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand" aria-hidden />
            Waiting for payment
          </p>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {expired ? (
          <Link
            href="/"
            className="flex h-12 w-full items-center justify-center rounded-xl bg-brand text-base font-bold text-white transition-colors hover:bg-brand-strong"
          >
            Order again
          </Link>
        ) : (
          qrUrl && (
            <a
              href={qrUrl}
              download={`qris-${payment.orderId}.png`}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-brand-line bg-white text-sm font-bold text-brand-strong transition-colors hover:bg-brand-soft active:bg-brand-line"
            >
              <DownloadIcon width={18} height={18} />
              Save QR image
            </a>
          )
        )}
      </div>

      {!expired && (
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
      )}

      {payment.qrImageUrl && !expired && <SandboxHelper url={payment.qrImageUrl} />}

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

      {!expired && (
        <Link
          href="/"
          className="mt-4 flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold text-muted hover:text-ink"
        >
          Back to menu
        </Link>
      )}
    </>
  );
}
