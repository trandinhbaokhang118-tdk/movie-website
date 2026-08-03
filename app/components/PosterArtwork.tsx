"use client";

import Image from "next/image";
import { useState } from "react";

const landscapePosterSources = new Set([
  "/media/artwork/big-buck-bunny-poster.jpg",
  "/media/artwork/elephants-dream-poster.jpg",
  "/media/artwork/cosmos-laundromat-poster.jpg",
  "/media/artwork/spring-poster.jpg",
  "/media/artwork/wing-it-poster.jpg",
  "/media/artwork/hero-poster.jpg",
  "/media/artwork/caminandes-gran-dillama-poster.jpg",
  "/media/artwork/caminandes-llamigos-poster.jpg",
]);

export function PosterArtwork({
  src,
  title,
  alt = "",
  priority = false,
  sizes,
}: {
  src: string;
  title: string;
  alt?: string;
  priority?: boolean;
  sizes: string;
}) {
  const [failed, setFailed] = useState(false);
  const isLocal = src.startsWith("/");
  const preserveFullFrame = landscapePosterSources.has(src);

  if (failed) {
    return (
      <span className="poster-artwork-fallback" role="img" aria-label={alt || `Poster ${title}`}>
        <span aria-hidden="true">CW</span>
        <strong>{title}</strong>
      </span>
    );
  }

  return (
    <>
      <Image
        className="poster-artwork-backdrop"
        src={src}
        alt=""
        fill
        sizes={sizes}
        unoptimized={isLocal}
        aria-hidden="true"
      />
      <Image
        className={`poster-artwork-image ${preserveFullFrame ? "is-contain" : "is-cover"}`}
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={isLocal}
        style={{ objectFit: preserveFullFrame ? "contain" : "cover" }}
        onError={() => setFailed(true)}
      />
    </>
  );
}
