import { MinusIcon, PlusIcon } from "@/components/icons";

const btn =
  "grid h-9 w-9 place-items-center text-ink transition-colors hover:bg-brand-soft hover:text-brand-strong active:bg-brand-line";

export default function Stepper({ qty, label, onDecrease, onIncrease }) {
  return (
    <div
      role="group"
      aria-label={`Quantity of ${label}`}
      className="inline-flex items-center overflow-hidden rounded-lg border border-line bg-white"
    >
      <button type="button" onClick={onDecrease} aria-label={`Decrease ${label}`} className={btn}>
        <MinusIcon width={16} height={16} />
      </button>
      <span className="min-w-7 text-center text-sm font-bold tabular-nums" aria-live="polite">
        {qty}
      </span>
      <button type="button" onClick={onIncrease} aria-label={`Increase ${label}`} className={btn}>
        <PlusIcon width={16} height={16} />
      </button>
    </div>
  );
}
