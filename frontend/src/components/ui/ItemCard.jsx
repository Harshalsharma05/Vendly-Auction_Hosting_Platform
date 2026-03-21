// File: src/components/ui/ItemCard.jsx
// Renamed from ArtCard.jsx
// Changes: "Make Offer" → "Place Bid" | price label "medium" → "Category"
//          price header label → "Current Bid" | sold CTA → "Sold"
// Zero Tailwind class changes.

import { useState } from "react";
import { Heart } from "lucide-react";
import Button from "./Button";

export default function ItemCard({ artwork, variant = "sale" }) {
  const [liked,     setLiked]     = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  /* ── SALE variant (horizontal scroll row) ── */
  if (variant === "sale") {
    return (
      <article className="group relative shrink-0 w-[185px] sm:w-[200px] md:w-[215px] flex flex-col">
        {/* Image container */}
        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-brand-light">
          {!imgLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-brand-border to-brand-light animate-pulse" />
          )}
          <img
            src={artwork.src}
            alt={artwork.title}
            onLoad={() => setImgLoaded(true)}
            className={[
              "w-full h-full object-cover transition-all duration-500",
              "group-hover:scale-105",
              imgLoaded ? "opacity-100" : "opacity-0",
            ].join(" ")}
            draggable={false}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 rounded-xl" />

          {/* Heart */}
          <button
            onClick={() => setLiked((v) => !v)}
            aria-label="Watchlist"
            className={[
              "absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center",
              "backdrop-blur-sm transition-all duration-200 shadow-sm",
              liked
                ? "bg-red-500 border-red-500"
                : "bg-white/80 border border-brand-border hover:bg-white",
            ].join(" ")}
          >
            <Heart
              size={13}
              className={liked ? "fill-white text-white" : "text-brand-muted"}
              strokeWidth={liked ? 0 : 1.8}
            />
          </button>

          {/* Sold badge */}
          {artwork.sold && (
            <div className="absolute top-2.5 left-2.5 bg-brand-charcoal text-white text-[10px] font-sans font-medium px-2 py-0.5 rounded-full">
              Sold
            </div>
          )}
        </div>

        {/* Card body */}
        <div className="pt-2.5 pb-1 flex flex-col gap-1">
          <p className="font-display text-[14px] font-semibold text-brand-charcoal leading-snug truncate">
            {artwork.title}
          </p>
          <p className="text-[11px] font-sans text-brand-muted truncate">
            {artwork.artist}
          </p>

          {/* Bid row — ✦ CHANGED labels */}
          <div className="flex items-center justify-between mt-1.5 gap-2">
            <div>
              {/* ✦ CHANGED: was artwork.medium (category label) */}
              <span className="text-[11px] font-sans text-brand-muted block leading-none mb-0.5">
                {artwork.medium}
              </span>
              {/* ✦ CHANGED: prefix label "Current Bid" */}
              <span className="text-[13px] font-sans font-semibold text-brand-charcoal">
                {artwork.sold ? `${artwork.price} (Sold)` : `${artwork.price}`}
              </span>
            </div>
            <Button
              variant={artwork.sold ? "ghost" : "primary"}
              size="sm"
              className="!px-3 !py-1 !text-[11px] shrink-0"
              disabled={artwork.sold}
            >
              {/* ✦ CHANGED: "Get Now" → "Bid Now" */}
              {artwork.sold ? "Sold" : "Bid Now"}
            </Button>
          </div>
        </div>

        {/* ✦ CHANGED: "Make Offer" → "Place Bid" */}
        {!artwork.sold && (
          
            <a href="#"
            className="mt-0.5 text-[11px] font-sans text-brand-muted hover:text-brand-rust underline underline-offset-2 transition-colors w-fit"
          >
            Place Bid
          </a>
        )}
      </article>
    );
  }

  /* ── FEATURED variant (3-col grid, taller) ── */
  return (
    <article className="group relative flex flex-col cursor-pointer">
      <div className="relative w-full rounded-xl overflow-hidden bg-brand-light" style={{ aspectRatio: "3/4" }}>
        {!imgLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-border to-brand-light animate-pulse" />
        )}
        <img
          src={artwork.src}
          alt={artwork.title}
          onLoad={() => setImgLoaded(true)}
          className={[
            "w-full h-full object-cover transition-all duration-500",
            "group-hover:scale-105",
            imgLoaded ? "opacity-100" : "opacity-0",
          ].join(" ")}
          draggable={false}
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent rounded-b-xl pointer-events-none" />
        <button
          onClick={() => setLiked((v) => !v)}
          aria-label="Watchlist"
          className={[
            "absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center",
            "backdrop-blur-sm transition-all duration-200 shadow",
            "opacity-0 group-hover:opacity-100",
            liked
              ? "bg-red-500"
              : "bg-white/80 border border-brand-border hover:bg-white",
          ].join(" ")}
        >
          <Heart
            size={14}
            className={liked ? "fill-white text-white" : "text-brand-muted"}
            strokeWidth={liked ? 0 : 1.8}
          />
        </button>
      </div>

      {/* Labels */}
      <div className="pt-3 pb-1">
        <p className="font-display text-[15px] font-semibold text-brand-charcoal leading-snug">
          {artwork.title}
        </p>
        <p className="text-[12px] font-sans text-brand-muted mt-0.5">
          {artwork.artist}
        </p>
      </div>
    </article>
  );
}