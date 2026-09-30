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

const INDOMARET_SIMULATOR = "https://simulator.sandbox.midtrans.com/indomaret/phoenix/index";

// Shown after Confirm & Pay with Indomaret. The parent keeps polling the payment
// status and swaps this out for the LUNAS screen when the webhook lands.
export default function IndomaretPayment({ payment }) {
  const countdown = useCountdown(payment.expiresAt);
  const { expired } = countdown;

  const steps = [
    "Go to any Indomaret store before the time runs out.",
    "Tell the cashier you want to pay a bill and give them the payment code above.",
    `Pay ${formatRupiah(payment.total)} at the cashier. This page updates on its own, so keep it open.`,
  ];

  return (
    <>
      <AmountHeader total={payment.total} countdown={countdown} />

      {!expired && (
        <section className="mt-5 rounded-3xl border border-line bg-white p-4 shadow-sm" aria-label="Indomaret payment code">
          <p className="mb-4 text-sm font-extrabold tracking-wide">Indomaret</p>
          <CopyRow label="Payment code" value={payment.paymentCode} big />
          <div className="my-4 border-t border-line" />
          <CopyRow label="Amount to pay" value={String(payment.total)} display={formatRupiah(payment.total)} />
        </section>
      )}

      <StatusLine expired={expired} expiredText="This payment code has expired. Place the order again." />
      {expired && <ExpiredActions />}

      {!expired && (
        <>
          <HowToPay steps={steps} />
          {payment.sandbox && (
            <SimulatorNote href={INDOMARET_SIMULATOR} name="Midtrans Indomaret simulator">
              Enter the payment code, then inquire and pay.
            </SimulatorNote>
          )}
        </>
      )}

      <OrderDetails payment={payment} />
      {!expired && <BackToMenu />}
    </>
  );
}
