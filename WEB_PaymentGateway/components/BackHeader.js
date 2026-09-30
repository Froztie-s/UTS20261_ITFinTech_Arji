import Link from "next/link";
import { ChevronLeftIcon } from "@/components/icons";

export default function BackHeader({ href, title, icon }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white">
      <div className="mx-auto flex h-14 max-w-xl items-center gap-3 px-4">
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
