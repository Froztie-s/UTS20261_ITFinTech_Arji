import { useState } from "react";

// Square product thumbnail. Falls back to the first letter if the image is missing or fails.
export default function Thumb({ src, alt, size = 64 }) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  return (
    <div
      className="grid shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-soft text-lg font-bold text-brand-strong"
      style={{ width: size, height: size }}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          width={size}
          height={size}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden>{alt?.charAt(0)}</span>
      )}
    </div>
  );
}
