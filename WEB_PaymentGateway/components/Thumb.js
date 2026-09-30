import { useState } from "react";

// Resize an Unsplash photo through its image CDN (returns null for any other host)
function unsplash(src, w, h) {
  try {
    const u = new URL(src);
    if (u.hostname !== "images.unsplash.com") return null;
    u.searchParams.set("w", w);
    u.searchParams.set("h", h);
    u.searchParams.set("fit", "crop");
    u.searchParams.set("q", "75");
    return u.toString();
  } catch {
    return null;
  }
}

// Product image. Fixed square by default. With `fluid` it is a 64px square on phones and
// fills its card at 4:3 from the lg breakpoint up (the parent decides the rest via className).
// Falls back to the first letter if the image is missing or fails.
export default function Thumb({ src, alt, size = 64, fluid = false, className = "" }) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;
  // Local pictures (like the bottled water) are cut-outs on white, so show them whole
  const contain = !!src && src.startsWith("/");

  const small = fluid ? unsplash(src, 160, 160) : null;
  const large = fluid ? unsplash(src, 560, 420) : null;
  const srcSet = small && large ? `${small} 160w, ${large} 560w` : undefined;

  const box = fluid
    ? "h-16 w-16 lg:aspect-[4/3] lg:h-auto lg:w-full lg:rounded-none"
    : "";

  return (
    <div
      className={`grid shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-soft text-lg font-bold text-brand-strong ${box} ${className}`}
      style={fluid ? undefined : { width: size, height: size }}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          srcSet={srcSet}
          sizes={srcSet ? "(min-width: 1024px) 300px, 64px" : undefined}
          alt={alt}
          width={fluid ? 560 : size}
          height={fluid ? 420 : size}
          loading="lazy"
          onError={() => setFailed(true)}
          className={`h-full w-full ${contain ? "bg-white object-contain" : "object-cover"}`}
        />
      ) : (
        <span aria-hidden>{alt?.charAt(0)}</span>
      )}
    </div>
  );
}
