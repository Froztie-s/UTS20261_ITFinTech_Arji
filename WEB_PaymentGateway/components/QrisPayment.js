import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { formatRupiah } from "@/lib/format";
import { DownloadIcon } from "@/components/icons";
import {
  AmountHeader,
  BackToMenu,
  ExpiredActions,
  HowToPay,
  OrderDetails,
  StatusLine,
  useCountdown,
} from "@/components/PaymentShell";

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
    <section
      className="mt-7 rounded-2xl border border-dashed border-brand-line bg-brand-soft/60 p-4"
      aria-labelledby="sandbox-heading"
    >
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

// Shown after Confirm & Pay with QRIS. The parent keeps polling the payment status
// and swaps this out for the LUNAS screen when the webhook lands.
export default function QrisPayment({ payment }) {
  const [qrUrl, setQrUrl] = useState("");
  const countdown = useCountdown(payment.expiresAt);
  const { expired } = countdown;

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

  const steps = [
    "Open your banking or e-wallet app and choose Scan.",
    `Scan the code and check that the amount is ${formatRupiah(payment.total)}.`,
    "Confirm the payment. This page updates on its own, so keep it open.",
  ];

  return (
    <>
      <AmountHeader total={payment.total} countdown={countdown} />

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

      <StatusLine expired={expired} expiredText="This code is no longer valid. Place the order again." />

      <div className="mt-4 space-y-2">
        {expired ? (
          <ExpiredActions />
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

      {!expired && <HowToPay steps={steps} />}
      {payment.qrImageUrl && !expired && <SandboxHelper url={payment.qrImageUrl} />}

      <OrderDetails payment={payment} />
      {!expired && <BackToMenu />}
    </>
  );
}
