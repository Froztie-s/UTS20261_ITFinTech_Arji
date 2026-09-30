import Link from "next/link";
import { ChevronLeftIcon } from "@/components/icons";

// From lg up the bar matches the width of the page under it:
// wide = checkout and payment, narrow = order status, compact = one-column payment screens
const WIDTHS = {
  wide: "lg:max-w-6xl",
  narrow: "lg:max-w-4xl",
  compact: "lg:max-w-xl",
};

export default function BackHeader({ href, title, icon, width = "wide" }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white">
      <div className={`mx-auto flex h-14 max-w-xl items-center gap-3 px-4 lg:h-16 lg:px-8 ${WIDTHS[width]}`}>
        <Link
          href={href}
          className="-ml-2 inline-flex h-10 items-center gap-0.5 rounded-lg px-2 text-sm font-medium text-muted hover:text-ink"
        >
          <ChevronLeftIcon width={18} height={18} />
          Back
        </Link>
        <h1 className="flex items-center gap-1.5 text-base font-bold">
          {icon}
          {title}
        </h1>
      </div>
    </header>
  );
}
