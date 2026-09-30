import { formatRupiah } from "@/lib/format";
import {
  AmountHeader,
  BackToMenu,
  CopyRow,
  ExpiredActions,
  HowToPay,
  OrderDetails,
  SimulatorNote,
  StatusLine,
  useCountdown,
} from "@/components/PaymentShell";

const BCA_SIMULATOR = "https://simulator.sandbox.midtrans.com/bca/va/index";

// 4 digits at a time so a long number is easy to read and check
const groupDigits = (v) => v.replace(/(\d{4})(?=\d)/g, "$1 ");

// Shown after Confirm & Pay with BCA Virtual Account. The parent keeps polling the
// payment status and swaps this out for the LUNAS screen when the webhook lands.
export default function BcaVaPayment({ payment }) {
  const countdown = useCountdown(payment.expiresAt);
  const { expired } = countdown;

  const steps = [
    "Open m-BCA, KlikBCA or a BCA ATM and choose Transfer, then BCA Virtual Account.",
    `Enter the virtual account number above and check that the amount is ${formatRupiah(payment.total)}.`,
    "Confirm with your PIN. This page updates on its own, so keep it open.",
  ];

  return (
    <>
      <AmountHeader total={payment.total} countdown={countdown} />

      {!expired && (
        <section
          className="mt-5 rounded-3xl border border-line bg-white p-4 shadow-sm"
          aria-label="BCA virtual account"
        >
          <p className="mb-4 text-sm font-extrabold tracking-wide">BCA Virtual Account</p>
          <CopyRow
            label="Virtual account number"
            value={payment.vaNumber}
            display={groupDigits(payment.vaNumber)}
            big
          />
          <div className="my-4 border-t border-line" />
          <CopyRow label="Amount to transfer" value={String(payment.total)} display={formatRupiah(payment.total)} />
        </section>
      )}

      <StatusLine expired={expired} expiredText="This virtual account has expired. Place the order again." />
      {expired && <ExpiredActions />}

      {!expired && (
        <>
          <HowToPay steps={steps} />
          {payment.sandbox && (
            <SimulatorNote href={BCA_SIMULATOR} name="Midtrans BCA VA simulator">
              Paste the virtual account number, then inquire and pay.
            </SimulatorNote>
          )}
        </>
      )}

      <OrderDetails payment={payment} />
      {!expired && <BackToMenu />}
    </>
  );
}
